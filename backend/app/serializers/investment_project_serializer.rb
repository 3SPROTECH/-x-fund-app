class InvestmentProjectSerializer
  include JSONAPI::Serializer

  attributes :id, :title, :description, :total_amount_cents, :share_price_cents,
             :total_shares, :shares_sold, :min_investment_cents, :max_investment_cents,
             :funding_start_date, :funding_end_date, :status,
             :management_fee_percent, :gross_yield_percent, :net_yield_percent,
             :review_status, :review_comment, :reviewed_at,
             :created_at, :updated_at

  attribute :funding_progress_percent do |project|
    project.funding_progress_percent
  end

  attribute :available_shares do |project|
    project.available_shares
  end

  attribute :amount_raised_cents do |project|
    project.amount_raised_cents
  end

  attribute :property_title do |project|
    project.property.title
  end

  attribute :property_city do |project|
    project.property.city
  end

  attribute :owner_name do |project|
    project.property.owner.full_name
  end

  attribute :reviewer_name do |project|
    project.reviewer&.full_name
  end
end
