class AdminInvestmentSerializer
  include JSONAPI::Serializer

  attributes :id, :amount_cents, :shares_count, :status,
             :invested_at, :confirmed_at, :created_at

  attribute :project_title do |investment|
    investment.investment_project.title
  end

  attribute :project_id do |investment|
    investment.investment_project_id
  end

  attribute :share_price_cents do |investment|
    investment.investment_project.share_price_cents
  end

  attribute :current_value_cents do |investment|
    investment.shares_count * investment.investment_project.share_price_cents
  end

  attribute :investor_name do |investment|
    investment.user.full_name
  end

  attribute :investor_email do |investment|
    investment.user.email
  end

  attribute :investor_id do |investment|
    investment.user_id
  end
end
