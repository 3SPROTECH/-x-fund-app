module Dashboards
  class InvestorDashboardService
    def initialize(user)
      @user = user
    end

    def call
      investments = @user.investments.active.includes(:investment_project)

      {
        portfolio_value_cents: calculate_portfolio_value(investments),
        total_invested_cents: investments.sum(:amount_cents),
        total_dividends_received_cents: total_dividends_received,
        global_yield_percent: calculate_global_yield(investments),
        active_investments_count: investments.count,
        wallet_balance_cents: @user.wallet.balance_cents,
        investments: investments.map { |inv| format_investment(inv) }
      }
    end

    private

    def calculate_portfolio_value(investments)
      investments.sum { |inv| inv.shares_count * inv.investment_project.share_price_cents }
    end

    def total_dividends_received
      @user.dividend_payments.where(status: :verse).sum(:amount_cents)
    end

    def calculate_global_yield(investments)
      total_invested = investments.sum(:amount_cents)
      return 0.0 if total_invested.zero?
      (total_dividends_received.to_f / total_invested * 100).round(2)
    end

    def format_investment(investment)
      project = investment.investment_project
      {
        id: investment.id,
        project_title: project.title,
        project_status: project.status,
        amount_cents: investment.amount_cents,
        shares_count: investment.shares_count,
        current_value_cents: investment.shares_count * project.share_price_cents,
        status: investment.status,
        invested_at: investment.invested_at
      }
    end
  end
end
