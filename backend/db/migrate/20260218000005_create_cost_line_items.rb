class CreateCostLineItems < ActiveRecord::Migration[8.1]
  def change
    create_table :cost_line_items do |t|
      t.references :property, null: false, foreign_key: true
      t.integer :category, null: false
      t.string :label, null: false
      t.bigint :amount_cents, null: false, default: 0
      t.integer :position

      t.timestamps
    end

    add_index :cost_line_items, [:property_id, :category]
  end
end
