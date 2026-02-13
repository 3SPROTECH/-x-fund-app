class CreateLots < ActiveRecord::Migration[7.1]
  def change
    create_table :lots do |t|
      t.references :property, null: false, foreign_key: true
      t.integer :lot_number, null: false
      t.decimal :surface_area_sqm, precision: 10, scale: 2
      t.string :description
      t.timestamps
    end

    add_index :lots, [:property_id, :lot_number], unique: true
  end
end
