class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.references :wallet,     null: false, foreign_key: true
      t.references :investment, foreign_key: true

      t.integer  :transaction_type,     null: false
      t.bigint   :amount_cents,         null: false
      t.bigint   :balance_after_cents,  null: false
      t.integer  :status,               null: false, default: 0
      t.string   :reference,            null: false
      t.text     :description
      t.jsonb    :metadata,             default: {}
      t.datetime :processed_at

      t.timestamps
    end

    add_index :transactions, :reference, unique: true
    add_index :transactions, :transaction_type
    add_index :transactions, :status
    add_index :transactions, :created_at
  end
end
