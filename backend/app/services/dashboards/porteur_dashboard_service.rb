module Dashboards
  class PorteurDashboardService
    def initialize(user)
      @user = user
    end

    def call
      {
        properties: property_stats,
        projects: project_stats,
        investments_received: investments_received_stats,
        recent_properties: recent_properties,
        recent_projects: recent_projects
      }
    end

    private

    def property_stats
      properties = @user.properties
      {
        total: properties.count,
        brouillon: properties.brouillon.count,
        en_financement: properties.en_financement.count,
        finance: properties.finance.count,
        en_gestion: properties.en_gestion.count
      }
    end

    def project_stats
      projects = InvestmentProject.joins(:property).where(properties: { owner_id: @user.id })
      {
        total: projects.count,
        draft: projects.draft.count,
        pending_analysis: projects.pending_analysis.count,
        approved: projects.approved.count,
        rejected: projects.rejected.count,
        funding_active: projects.funding_active.count,
        funded: projects.funded.count,
        total_funding_raised_cents: projects.sum("shares_sold * share_price_cents")
      }
    end

    def investments_received_stats
      project_ids = InvestmentProject.joins(:property).where(properties: { owner_id: @user.id }).pluck(:id)
      investments = Investment.where(investment_project_id: project_ids)
      {
        total_investors: investments.select(:user_id).distinct.count,
        total_investments: investments.count,
        total_amount_cents: investments.active.sum(:amount_cents)
      }
    end

    def recent_properties
      @user.properties.order(created_at: :desc).limit(5).map do |property|
        {
          id: property.id,
          title: property.title,
          status: property.status,
          city: property.city,
          created_at: property.created_at
        }
      end
    end

    def recent_projects
      InvestmentProject.joins(:property)
                       .where(properties: { owner_id: @user.id })
                       .includes(:property)
                       .order(created_at: :desc)
                       .limit(5)
                       .map do |project|
        {
          id: project.id,
          title: project.title,
          status: project.status,
          funding_progress_percent: project.funding_progress_percent,
          amount_raised_cents: project.amount_raised_cents,
          total_amount_cents: project.total_amount_cents,
          created_at: project.created_at
        }
      end
    end
  end
end
