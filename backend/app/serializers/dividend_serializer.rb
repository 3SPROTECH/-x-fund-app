class DividendSerializer
  include JSONAPI::Serializer

  attributes :id, :total_amount_cents, :amount_per_share_cents,
             :distribution_date, :period_start, :period_end,
             :status, :created_at

  attribute :payments_count do |dividend|
    dividend.dividend_payments.count
  end
end
