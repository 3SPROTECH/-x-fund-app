class AnalystReportSerializer
  include JSONAPI::Serializer

  attributes :report_data, :risk_score, :success_score,
             :financial_metrics, :risk_factors,
             :recommendation, :comment,
             :created_at, :updated_at

  attribute :analyst_name do |report|
    report.analyst&.full_name
  end

  attribute :project_title do |report|
    report.investment_project&.title
  end
end
