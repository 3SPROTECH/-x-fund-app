module Investments
  class ShareCalculator
    def initialize(investment_project)
      @project = investment_project
    end

    def shares_for_amount(amount_cents)
      return 0 if @project.share_price_cents.zero?
      amount_cents / @project.share_price_cents
    end

    def cost_for_shares(shares_count)
      shares_count * @project.share_price_cents
    end

    def available_shares
      @project.total_shares - @project.shares_sold
    end

    def funding_progress_percent
      return 0.0 if @project.total_shares.zero?
      (@project.shares_sold.to_f / @project.total_shares * 100).round(2)
    end

    def validate_amount(amount_cents)
      errors = []

      shares = shares_for_amount(amount_cents)
      actual_cost = cost_for_shares(shares)

      errors << "Le montant doit etre un multiple exact du prix de la part (#{@project.share_price_cents} centimes)" if actual_cost != amount_cents
      errors << "Le montant minimum est de #{@project.min_investment_cents} centimes" if amount_cents < @project.min_investment_cents
      errors << "Le montant maximum est de #{@project.max_investment_cents} centimes" if @project.max_investment_cents.present? && amount_cents > @project.max_investment_cents
      errors << "Il ne reste que #{available_shares} parts disponibles" if shares > available_shares
      errors << "Aucune part disponible" if available_shares.zero?

      errors
    end
  end
end
