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

        investment = Investment.create!(
          user: @user,
          investment_project: @project,
          amount_cents: @amount_cents,
          shares_count: shares_count,
          status: :en_cours,
          invested_at: Time.current
        )

        # Debit investor wallet
        Wallets::WalletService.new(@user.wallet).invest(
          amount_cents: @amount_cents,
          investment: investment,
          reference: "INV-#{investment.id}-#{SecureRandom.hex(4).upcase}"
        )

        # Update project shares_sold (with lock)
        @project.lock!
        @project.increment!(:shares_sold, shares_count)

        # Check if project is fully funded
        if @project.shares_sold >= @project.total_shares
          @project.update!(status: :finance)
        end

        Result.new(success: true, investment: investment, errors: [])
      end
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success: false, errors: [e.message])
    end

    private

    def validate
      errors = []
      errors << "Le projet n'est pas ouvert aux investissements" unless @project.ouvert?
      errors << "La periode de financement n'a pas commence" if Date.current < @project.funding_start_date
      errors << "La periode de financement est terminee" if Date.current > @project.funding_end_date
      errors << "Votre KYC doit etre verifie pour investir" unless @user.kyc_verified?
      errors << "Solde insuffisant dans votre portefeuille" if @user.wallet.balance_cents < @amount_cents
      errors.concat(@calculator.validate_amount(@amount_cents))
      errors
    end
  end
end
