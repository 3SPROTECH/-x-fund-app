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
        dividend_commission_percent = Setting.get("platform_dividend_commission_percent") || 0.0
        total_fee_cents = 0

        confirmed_investments.find_each do |investment|
          payment_amount = investment.shares_count * @dividend.amount_per_share_cents

          # Deduct platform commission from dividend payment
          fee_cents = 0
          if dividend_commission_percent > 0
            fee_cents = (payment_amount * dividend_commission_percent / 100.0).round
          end
          investor_amount = payment_amount - fee_cents
          total_fee_cents += fee_cents

          payment = DividendPayment.create!(
            dividend: @dividend,
            investment: investment,
            user: investment.user,
            amount_cents: investor_amount,
            shares_count: investment.shares_count,
            status: :verse,
            paid_at: Time.current
          )

          wallet_service = Wallets::WalletService.new(investment.user.wallet)
          wallet_service.receive_dividend(
            amount_cents: investor_amount,
            dividend_payment: payment,
            reference: "DIV-#{@dividend.id}-#{payment.id}-#{SecureRandom.hex(4).upcase}"
          )
        end

        # Collect total platform commission for this dividend distribution
        if total_fee_cents > 0
          Wallets::WalletService.collect_fee(
            amount_cents: total_fee_cents,
            fee_type: "dividend_commission",
            reference: "FEE-DIV-#{@dividend.id}-#{SecureRandom.hex(4).upcase}",
            description: "Commission dividendes - #{@project.title}"
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
