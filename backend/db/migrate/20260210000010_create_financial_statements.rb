class CreateFinancialStatements < ActiveRecord::Migration[8.1]
  def change
    create_table :financial_statements do |t|
      t.references :investment_project, null: false, foreign_key: true

      t.integer :statement_type,         null: false
      t.date    :period_start,           null: false
      t.date    :period_end,             null: false
      t.bigint  :total_revenue_cents,    null: false, default: 0
      t.bigint  :total_expenses_cents,   null: false, default: 0
      t.bigint  :management_fees_cents,  null: false, default: 0
      t.bigint  :net_income_cents,       null: false, default: 0
      t.decimal :gross_yield_percent,    precision: 5, scale: 2
      t.decimal :net_yield_percent,      precision: 5, scale: 2

      t.timestamps
    end

    add_index :financial_statements,
              [:investment_project_id, :period_start, :period_end],
              unique: true,
              name: "idx_financial_statements_on_project_and_period"
  end
end
