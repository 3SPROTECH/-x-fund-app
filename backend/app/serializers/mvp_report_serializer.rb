class MvpReportSerializer
  include JSONAPI::Serializer

  attributes :id, :operation_status, :expected_repayment_date,
             :summary,
             :purchase_price_previsionnel_cents, :purchase_price_realise_cents,
             :works_previsionnel_cents, :works_realise_cents,
             :total_cost_previsionnel_cents, :total_cost_realise_cents,
             :target_sale_price_previsionnel_cents, :target_sale_price_realise_cents,
             :best_offer_previsionnel_cents, :best_offer_realise_cents,
             :works_progress_percent, :budget_variance_percent,
             :sale_start_date, :visits_count, :offers_count, :listed_price_cents,
             :risk_identified, :risk_impact, :corrective_action,
             :estimated_compromise_date, :estimated_deed_date,
             :estimated_repayment_date, :exit_confirmed,
             :created_at, :updated_at

  attribute :author_name do |report|
    report.author.full_name
  end

  attribute :project_title do |report|
    report.investment_project.title
  end
end
