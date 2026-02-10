class AdminTransactionSerializer
  include JSONAPI::Serializer

  attributes :id, :transaction_type, :amount_cents, :balance_after_cents,
             :status, :reference, :description, :processed_at, :created_at

  attribute :user_name do |transaction|
    transaction.wallet.user.full_name
  end

  attribute :user_email do |transaction|
    transaction.wallet.user.email
  end

  attribute :user_id do |transaction|
    transaction.wallet.user_id
  end

  attribute :wallet_id do |transaction|
    transaction.wallet_id
  end
end
