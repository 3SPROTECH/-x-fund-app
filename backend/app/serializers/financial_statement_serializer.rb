class FinancialStatementSerializer
  include JSONAPI::Serializer

  attributes :id, :statement_type, :period_start, :period_end,
             :total_revenue_cents, :total_expenses_cents,
             :management_fees_cents, :net_income_cents,
             :gross_yield_percent, :net_yield_percent, :created_at
end
