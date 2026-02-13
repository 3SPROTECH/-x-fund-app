class InvestmentSerializer
  include JSONAPI::Serializer

  attributes :id, :amount_cents, :fee_cents, :shares_count, :status,
             :invested_at, :confirmed_at, :created_at

  attribute :project_title do |investment|
    investment.investment_project.title
  end

  attribute :share_price_cents do |investment|
    investment.investment_project.share_price_cents
  end

  attribute :current_value_cents do |investment|
    investment.shares_count * investment.investment_project.share_price_cents
  end
end
