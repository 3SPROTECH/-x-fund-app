class CreateInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :investment_projects do |t|
      t.references :property, null: false, foreign_key: true, index: { unique: true }

      t.string  :title, null: false
      t.text    :description

      ## Financial structure
      t.bigint  :total_amount_cents,     null: false
      t.bigint  :share_price_cents,      null: false
      t.integer :total_shares,           null: false
      t.integer :shares_sold,            null: false, default: 0
      t.bigint  :min_investment_cents,   null: false
      t.bigint  :max_investment_cents

      ## Dates
      t.date :funding_start_date, null: false
      t.date :funding_end_date,   null: false

      ## Status and fees
      t.integer :status, null: false, default: 0
      t.decimal :management_fee_percent, precision: 5, scale: 2, null: false, default: 0
      t.decimal :gross_yield_percent,    precision: 5, scale: 2
      t.decimal :net_yield_percent,      precision: 5, scale: 2

      t.timestamps
    end

    add_index :investment_projects, :status
    add_index :investment_projects, :funding_start_date
    add_index :investment_projects, :funding_end_date
  end
end
