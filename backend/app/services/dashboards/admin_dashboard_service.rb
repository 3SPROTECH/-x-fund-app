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

    # 2 queries instead of 6
    def user_stats
      role_counts = User.group(:role).count
      kyc_counts = User.where.not(role: :administrateur).group(:kyc_status).count
      {
        total: role_counts.values.sum,
        investisseurs: role_counts["investisseur"] || 0,
        porteurs_de_projet: role_counts["porteur_de_projet"] || 0,
        administrateurs: role_counts["administrateur"] || 0,
        kyc_pending: kyc_counts["submitted"] || 0,
        kyc_verified: kyc_counts["verified"] || 0
      }
    end

    # 1 query instead of 4
    def property_stats
      counts = Property.group(:status).count
      {
        total: counts.values.sum,
        brouillon: counts["brouillon"] || 0,
        en_financement: counts["en_financement"] || 0,
        finance: counts["finance"] || 0
      }
    end

    # 1 query instead of 12
    def project_stats
      counts = InvestmentProject.group(:status).count
      {
        total: counts.values.sum,
        draft: counts["draft"] || 0,
        pending_analysis: counts["pending_analysis"] || 0,
        info_requested: counts["info_requested"] || 0,
        approved: counts["approved"] || 0,
        rejected: counts["rejected"] || 0,
        legal_structuring: counts["legal_structuring"] || 0,
        funding_active: counts["funding_active"] || 0,
        funded: counts["funded"] || 0,
        under_construction: counts["under_construction"] || 0,
        operating: counts["operating"] || 0,
        repaid: counts["repaid"] || 0
      }
    end

    def investment_stats
      active = Investment.active
      {
        total_count: Investment.count,
        total_amount_cents: active.sum(:amount_cents),
        active_count: active.count
      }
    end

    # 1 query instead of 2 for wallets
    def financial_stats
      wallet_sums = Wallet.pick(Arel.sql("COALESCE(SUM(balance_cents),0), COALESCE(SUM(total_deposited_cents),0)"))
      {
        total_wallets_balance_cents: wallet_sums[0],
        total_deposits_cents: wallet_sums[1],
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
