module Dividends
  class DistributeDividendService
    Result = Struct.new(:success, :dividend, :errors, keyword_init: true) do
      def success? = success
    end

    def initialize(investment_project:, total_amount_cents:, period_start:, period_end:)
      @project = investment_project
      @total_amount_cents = total_amount_cents
      @period_start = period_start
      @period_end = period_end
    end

    def call
      errors = validate
      return Result.new(success: false, errors: errors) if errors.any?

      ActiveRecord::Base.transaction do
        amount_per_share = @total_amount_cents / @project.shares_sold

        dividend = Dividend.create!(
          investment_project: @project,
          total_amount_cents: @total_amount_cents,
          amount_per_share_cents: amount_per_share,
          distribution_date: Date.current,
          period_start: @period_start,
          period_end: @period_end,
          status: :distribue
        )

        confirmed_investments = @project.investments.active

        confirmed_investments.find_each do |investment|
          payment_amount = investment.shares_count * amount_per_share

          payment = DividendPayment.create!(
            dividend: dividend,
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
            reference: "DIV-#{dividend.id}-#{payment.id}-#{SecureRandom.hex(4).upcase}"
          )
        end

        Result.new(success: true, dividend: dividend, errors: [])
      end
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success: false, errors: [e.message])
    end

    private

    def validate
      errors = []
      errors << "Le projet n'a pas d'investissements confirmes" if @project.shares_sold.zero?
      errors << "Le montant doit etre positif" if @total_amount_cents <= 0
      errors << "La periode de debut doit preceder la fin" if @period_start >= @period_end
      errors
    end
  end
end
