class WalletSerializer
  include JSONAPI::Serializer

  attributes :id, :balance_cents, :total_deposited_cents,
             :total_withdrawn_cents, :currency, :created_at
end
