module Financial
  class YieldCalculatorService
    def initialize(investment_project)
      @project = investment_project
    end

    def gross_yield_percent
      return 0.0 if total_invested_cents.zero?
      total_revenue = @project.dividends.distributed.sum(:total_amount_cents)
      (total_revenue.to_f / total_invested_cents * 100).round(2)
    end

    def net_yield_percent
      return 0.0 if total_invested_cents.zero?
      total_revenue = @project.dividends.distributed.sum(:total_amount_cents)
      management_fees = (total_revenue * @project.management_fee_percent / 100.0).round
      net_revenue = total_revenue - management_fees
      (net_revenue.to_f / total_invested_cents * 100).round(2)
    end

    def investor_yield(user)
      user_investments = @project.investments.active.where(user: user)
      return 0.0 if user_investments.empty?

      total_user_invested = user_investments.sum(:amount_cents)
      total_user_dividends = DividendPayment.where(
        investment: user_investments,
        status: :verse
      ).sum(:amount_cents)

      return 0.0 if total_user_invested.zero?
      (total_user_dividends.to_f / total_user_invested * 100).round(2)
    end

    private

    def total_invested_cents
      @total_invested_cents ||= @project.investments.active.sum(:amount_cents)
    end
  end
end
