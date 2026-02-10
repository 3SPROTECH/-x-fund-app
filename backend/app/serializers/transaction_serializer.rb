class TransactionSerializer
  include JSONAPI::Serializer

  attributes :id, :transaction_type, :amount_cents, :balance_after_cents,
             :status, :reference, :description, :processed_at, :created_at
end
