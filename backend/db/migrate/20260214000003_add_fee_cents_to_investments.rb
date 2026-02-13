class AddFeeCentsToInvestments < ActiveRecord::Migration[8.1]
  def change
    add_column :investments, :fee_cents, :bigint, default: 0, null: false
  end
end
