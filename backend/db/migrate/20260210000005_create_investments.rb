class CreateInvestments < ActiveRecord::Migration[8.1]
  def change
    create_table :investments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :investment_project, null: false, foreign_key: true

      t.bigint   :amount_cents,  null: false
      t.integer  :shares_count,  null: false
      t.integer  :status,        null: false, default: 0
      t.datetime :invested_at,   null: false
      t.datetime :confirmed_at

      t.timestamps
    end

    add_index :investments, [:user_id, :investment_project_id]
    add_index :investments, :status
  end
end
