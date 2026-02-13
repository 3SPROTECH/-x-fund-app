module Dividends
  class DistributeDividendService
    Result = Struct.new(:success, :dividend, :errors, keyword_init: true) do
      def success? = success
    end

    def initialize(dividend:)
      @dividend = dividend
      @project = dividend.investment_project
    end

    def call
      errors = validate
      return Result.new(success: false, errors: errors) if errors.any?

      ActiveRecord::Base.transaction do
        confirmed_investments = @project.investments.active

        confirmed_investments.find_each do |investment|
          payment_amount = investment.shares_count * @dividend.amount_per_share_cents

          payment = DividendPayment.create!(
            dividend: @dividend,
            investment: investment,
            user: investment.user,
            amount_cents: payment_amount,
            shares_count: investment.shares_count,
            status: :verse,
            paid_at: Time.current
          )

          wallet_service = Wallets::WalletService.new(investment.user.wallet)
          wallet_service.receive_dividend(
            amount_cents: payment_amount,
            dividend_payment: payment,
            reference: "DIV-#{@dividend.id}-#{payment.id}-#{SecureRandom.hex(4).upcase}"
          )
        end

        @dividend.update!(status: :distribue, distribution_date: Date.current)

        Result.new(success: true, dividend: @dividend, errors: [])
      end
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success: false, errors: [e.message])
    end

    private

    def validate
      errors = []
      errors << "Le dividende doit etre en statut planifie" unless @dividend.planifie?
      errors << "Le projet n'a pas d'investissements confirmes" if @project.shares_sold.zero?
      errors
    end
  end
end
