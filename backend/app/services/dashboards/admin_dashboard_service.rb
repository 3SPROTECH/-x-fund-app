module Dashboards
  class AdminDashboardService
    def call
      {
        users: user_stats,
        properties: property_stats,
        projects: project_stats,
        investments: investment_stats,
        financial: financial_stats,
        recent_activity: recent_activity
      }
    end

    private

    def user_stats
      {
        total: User.count,
        investisseurs: User.investisseur.count,
        porteurs_de_projet: User.porteur_de_projet.count,
        administrateurs: User.administrateur.count,
        kyc_pending: User.where(kyc_status: :submitted).count,
        kyc_verified: User.where(kyc_status: :verified).count
      }
    end

    def property_stats
      {
        total: Property.count,
        brouillon: Property.brouillon.count,
        en_financement: Property.en_financement.count,
        finance: Property.finance.count
      }
    end

    def project_stats
      {
        total: InvestmentProject.count,
        brouillon: InvestmentProject.brouillon.count,
        ouvert: InvestmentProject.ouvert.count,
        finance: InvestmentProject.finance.count,
        cloture: InvestmentProject.cloture.count,
        pending_review: InvestmentProject.pending_review.count,
        approved: InvestmentProject.approved.count,
        rejected: InvestmentProject.rejected.count
      }
    end

    def investment_stats
      {
        total_count: Investment.count,
        total_amount_cents: Investment.active.sum(:amount_cents),
        active_count: Investment.active.count
      }
    end

    def financial_stats
      {
        total_wallets_balance_cents: Wallet.sum(:balance_cents),
        total_deposits_cents: Wallet.sum(:total_deposited_cents),
        total_dividends_distributed_cents: Dividend.distributed.sum(:total_amount_cents),
        total_transactions: Transaction.count
      }
    end

    def recent_activity
      AuditLog.includes(:user)
              .order(created_at: :desc)
              .limit(5)
              .map do |log|
        {
          id: log.id,
          action: log.action,
          resource_type: log.auditable_type,
          resource_id: log.auditable_id,
          user_name: log.user&.full_name,
          created_at: log.created_at
        }
      end
    end
  end
end
