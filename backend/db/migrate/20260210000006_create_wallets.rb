class CreateWallets < ActiveRecord::Migration[8.1]
  def change
    create_table :wallets do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }

      t.bigint :balance_cents,          null: false, default: 0
      t.bigint :total_deposited_cents,  null: false, default: 0
      t.bigint :total_withdrawn_cents,  null: false, default: 0
      t.string :currency,               null: false, default: "EUR"

      t.timestamps
    end
  end
end
