module Investments
  class CreateInvestmentService
    Result = Struct.new(:success, :investment, :errors, keyword_init: true) do
      def success? = success
    end

    def initialize(user:, investment_project:, amount_cents:)
      @user = user
      @project = investment_project
      @amount_cents = amount_cents
      @calculator = ShareCalculator.new(@project)
    end

    def call
      errors = validate
      return Result.new(success: false, errors: errors) if errors.any?

      ActiveRecord::Base.transaction do
        shares_count = @calculator.shares_for_amount(@amount_cents)

        # Platform fee deducted from the invested amount
        commission_percent = Setting.get("platform_investment_commission_percent") || 0.0
        fee_cents = commission_percent > 0 ? (@amount_cents * commission_percent / 100.0).round : 0

        investment = Investment.create!(
          user: @user,
          investment_project: @project,
          amount_cents: @amount_cents,
          fee_cents: fee_cents,
          shares_count: shares_count,
          status: :en_cours,
          invested_at: Time.current
        )

        # Debit full amount from investor wallet
        Wallets::WalletService.new(@user.wallet).invest(
          amount_cents: @amount_cents,
          investment: investment,
          reference: "INV-#{investment.id}-#{SecureRandom.hex(4).upcase}"
        )

        # Collect fee to platform wallet
        if fee_cents > 0
          Wallets::WalletService.collect_fee(
            amount_cents: fee_cents,
            fee_type: "investment_commission",
            reference: "FEE-INV-#{investment.id}-#{SecureRandom.hex(4).upcase}",
            description: "Commission investissement - #{@project.title}"
          )
        end

        # Update project shares_sold (with lock)
        @project.lock!
        @project.increment!(:shares_sold, shares_count)

        # Check if project is fully funded
        if @project.shares_sold >= @project.total_shares
          @project.update!(status: :funded)
        end

        Result.new(success: true, investment: investment, errors: [])
      end
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success: false, errors: [e.message])
    end

    private

    def validate
      errors = []
      errors << "Le projet n'est pas ouvert aux investissements" unless @project.funding_active?
      errors << "La periode de financement n'a pas commence" if Date.current < @project.funding_start_date
      errors << "La periode de financement est terminee" if Date.current > @project.funding_end_date
      errors << "Votre KYC doit etre verifie pour investir" unless @user.kyc_verified?
      errors << "Solde insuffisant dans votre portefeuille" if @user.wallet.balance_cents < @amount_cents
      errors.concat(@calculator.validate_amount(@amount_cents))
      errors
    end
  end
end
