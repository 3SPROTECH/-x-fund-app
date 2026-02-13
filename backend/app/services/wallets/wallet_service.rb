module Wallets
  class WalletService
    class InsufficientFundsError < StandardError; end
    class InvalidAmountError < StandardError; end

    def initialize(wallet)
      @wallet = wallet
    end

    def deposit(amount_cents:, reference:, metadata: {})
      raise InvalidAmountError, "Le montant doit etre positif" if amount_cents <= 0

      ActiveRecord::Base.transaction do
        @wallet.lock!
        new_balance = @wallet.balance_cents + amount_cents

        transaction = @wallet.transactions.create!(
          transaction_type: :depot,
          amount_cents: amount_cents,
          balance_after_cents: new_balance,
          status: :complete,
          reference: reference,
          description: "Depot de fonds",
          metadata: metadata,
          processed_at: Time.current
        )

        @wallet.update!(
          balance_cents: new_balance,
          total_deposited_cents: @wallet.total_deposited_cents + amount_cents
        )

        transaction
      end
    end

    def withdraw(amount_cents:, reference:, metadata: {})
      raise InvalidAmountError, "Le montant doit etre positif" if amount_cents <= 0

      ActiveRecord::Base.transaction do
        @wallet.lock!
        raise InsufficientFundsError, "Solde insuffisant" if @wallet.balance_cents < amount_cents

        new_balance = @wallet.balance_cents - amount_cents

        transaction = @wallet.transactions.create!(
          transaction_type: :retrait,
          amount_cents: -amount_cents,
          balance_after_cents: new_balance,
          status: :complete,
          reference: reference,
          description: "Retrait de fonds",
          metadata: metadata,
          processed_at: Time.current
        )

        @wallet.update!(
          balance_cents: new_balance,
          total_withdrawn_cents: @wallet.total_withdrawn_cents + amount_cents
        )

        transaction
      end
    end

    def invest(amount_cents:, investment:, reference:)
      raise InvalidAmountError, "Le montant doit etre positif" if amount_cents <= 0

      ActiveRecord::Base.transaction do
        @wallet.lock!
        raise InsufficientFundsError, "Solde insuffisant" if @wallet.balance_cents < amount_cents

        new_balance = @wallet.balance_cents - amount_cents

        transaction = @wallet.transactions.create!(
          transaction_type: :investissement,
          amount_cents: -amount_cents,
          balance_after_cents: new_balance,
          status: :complete,
          reference: reference,
          investment: investment,
          description: "Investissement - #{investment.investment_project.title}",
          processed_at: Time.current
        )

        @wallet.update!(balance_cents: new_balance)

        transaction
      end
    end

    def receive_dividend(amount_cents:, dividend_payment:, reference:)
      ActiveRecord::Base.transaction do
        @wallet.lock!
        new_balance = @wallet.balance_cents + amount_cents

        transaction = @wallet.transactions.create!(
          transaction_type: :dividende,
          amount_cents: amount_cents,
          balance_after_cents: new_balance,
          status: :complete,
          reference: reference,
          investment: dividend_payment.investment,
          description: "Dividende - #{dividend_payment.dividend.investment_project.title}",
          processed_at: Time.current
        )

        @wallet.update!(balance_cents: new_balance)

        transaction
      end
    end

    # Collect a platform fee into the platform wallet
    def self.collect_fee(amount_cents:, fee_type:, reference:, description:)
      return if amount_cents <= 0

      platform_wallet = Wallet.platform_wallet
      platform_wallet.lock!

      new_balance = platform_wallet.balance_cents + amount_cents

      platform_wallet.transactions.create!(
        transaction_type: :frais,
        amount_cents: amount_cents,
        balance_after_cents: new_balance,
        status: :complete,
        reference: reference,
        description: description,
        metadata: { fee_type: fee_type },
        processed_at: Time.current
      )

      platform_wallet.update!(
        balance_cents: new_balance,
        total_deposited_cents: platform_wallet.total_deposited_cents + amount_cents
      )
    end
  end
end
