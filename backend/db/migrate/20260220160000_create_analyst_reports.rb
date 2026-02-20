class CreateAnalystReports < ActiveRecord::Migration[8.1]
  def change
    create_table :analyst_reports do |t|
      t.references :investment_project, null: false, foreign_key: true, index: true
      t.references :analyst, null: false, foreign_key: { to_table: :users }, index: true
      t.jsonb :report_data, null: false, default: {}
      t.decimal :risk_score, precision: 5, scale: 2
      t.decimal :success_score, precision: 5, scale: 2
      t.jsonb :financial_metrics, null: false, default: {}
      t.jsonb :risk_factors, null: false, default: {}
      t.string :recommendation
      t.text :comment
      t.timestamps
    end

    add_index :analyst_reports, [:investment_project_id, :created_at], name: "idx_analyst_reports_on_project_and_date"
  end
end
