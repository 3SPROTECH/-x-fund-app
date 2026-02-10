class CreateDividends < ActiveRecord::Migration[8.1]
  def change
    create_table :dividends do |t|
      t.references :investment_project, null: false, foreign_key: true

      t.bigint  :total_amount_cents,     null: false
      t.bigint  :amount_per_share_cents, null: false
      t.date    :distribution_date,      null: false
      t.date    :period_start,           null: false
      t.date    :period_end,             null: false
      t.integer :status,                 null: false, default: 0

      t.timestamps
    end

    add_index :dividends, :distribution_date
    add_index :dividends, :status
  end
end
