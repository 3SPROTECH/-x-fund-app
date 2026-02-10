module Payments
  class PaymentProviderInterface
    def initiate_deposit(user:, amount_cents:, metadata: {})
      raise NotImplementedError
    end

    def confirm_deposit(reference:)
      raise NotImplementedError
    end

    def initiate_withdrawal(user:, amount_cents:, bank_details:)
      raise NotImplementedError
    end

    def check_status(reference:)
      raise NotImplementedError
    end
  end
end
