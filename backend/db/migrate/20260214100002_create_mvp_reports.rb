class CreateMvpReports < ActiveRecord::Migration[8.0]
  def change
    create_table :mvp_reports do |t|
      t.references :investment_project, null: false, foreign_key: true, index: true
      t.references :author, null: false, foreign_key: { to_table: :users }

      # A. General Info - operation_status tracks detailed lifecycle
      t.integer :operation_status, null: false, default: 0
      t.date    :expected_repayment_date

      # B. Summary
      t.text :summary

      # C. Key Data - Previsionnel vs Realise (all in cents)
      t.bigint :purchase_price_previsionnel_cents
      t.bigint :purchase_price_realise_cents
      t.bigint :works_previsionnel_cents
      t.bigint :works_realise_cents
      t.bigint :total_cost_previsionnel_cents
      t.bigint :total_cost_realise_cents
      t.bigint :target_sale_price_previsionnel_cents
      t.bigint :target_sale_price_realise_cents
      t.bigint :best_offer_previsionnel_cents
      t.bigint :best_offer_realise_cents

      # D. Progress - Works phase
      t.decimal :works_progress_percent, precision: 5, scale: 2
      t.decimal :budget_variance_percent, precision: 5, scale: 2

      # D. Progress - Sale phase
      t.date    :sale_start_date
      t.integer :visits_count
      t.integer :offers_count
      t.bigint  :listed_price_cents

      # E. Main Risk
      t.string :risk_identified
      t.string :risk_impact
      t.text   :corrective_action

      # F. Exit Forecast
      t.date    :estimated_compromise_date
      t.date    :estimated_deed_date
      t.date    :estimated_repayment_date
      t.boolean :exit_confirmed, default: false, null: false

      t.timestamps
    end

    add_index :mvp_reports, [:investment_project_id, :created_at],
              name: "idx_mvp_reports_on_project_and_date"
  end
end
