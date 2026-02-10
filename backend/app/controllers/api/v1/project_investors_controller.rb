module Api
  module V1
    class ProjectInvestorsController < ApplicationController
      def index
        project = InvestmentProject.find(params[:investment_project_id])
        authorize project, :view_investors?

        investments = project.investments.includes(:user).order(created_at: :desc)
        investments = paginate(investments)

        render json: {
          data: investments.map { |inv| AdminInvestmentSerializer.new(inv).serializable_hash[:data] },
          meta: pagination_meta(investments).merge(
            total_amount_cents: project.investments.active.sum(:amount_cents),
            total_investors: project.investments.select(:user_id).distinct.count
          )
        }
      end
    end
  end
end
