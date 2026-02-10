module Payments
  class MockPaymentProvider < PaymentProviderInterface
    def initiate_deposit(user:, amount_cents:, metadata: {})
      {
        success: true,
        reference: "MOCK-DEP-#{SecureRandom.hex(8).upcase}",
        status: "completed"
      }
    end

    def confirm_deposit(reference:)
      { success: true, reference: reference, status: "completed" }
    end

    def initiate_withdrawal(user:, amount_cents:, bank_details:)
      {
        success: true,
        reference: "MOCK-WIT-#{SecureRandom.hex(8).upcase}",
        status: "completed"
      }
    end

    def check_status(reference:)
      { reference: reference, status: "completed" }
    end
  end
end
