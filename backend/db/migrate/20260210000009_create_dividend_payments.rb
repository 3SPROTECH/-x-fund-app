class CreateDividendPayments < ActiveRecord::Migration[8.1]
  def change
    create_table :dividend_payments do |t|
      t.references :dividend,   null: false, foreign_key: true
      t.references :investment, null: false, foreign_key: true
      t.references :user,       null: false, foreign_key: true

      t.bigint   :amount_cents,  null: false
      t.integer  :shares_count,  null: false
      t.integer  :status,        null: false, default: 0
      t.datetime :paid_at

      t.timestamps
    end

    add_index :dividend_payments, [:dividend_id, :investment_id], unique: true
  end
end
