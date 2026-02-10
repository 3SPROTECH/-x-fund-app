class CreateProperties < ActiveRecord::Migration[8.1]
  def change
    create_table :properties do |t|
      t.references :owner, null: false, foreign_key: { to_table: :users }

      t.string  :title, null: false
      t.text    :description
      t.integer :property_type, null: false, default: 0

      ## Location
      t.string  :address_line1, null: false
      t.string  :address_line2
      t.string  :city, null: false
      t.string  :postal_code, null: false
      t.string  :country, null: false, default: "FR"
      t.decimal :latitude,  precision: 10, scale: 8
      t.decimal :longitude, precision: 11, scale: 8

      ## Financial
      t.decimal :surface_area_sqm, precision: 10, scale: 2
      t.bigint  :acquisition_price_cents, null: false
      t.bigint  :estimated_value_cents
      t.decimal :estimated_annual_yield_percent, precision: 5, scale: 2, null: false
      t.integer :investment_duration_months, null: false

      ## Status
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :properties, :city
    add_index :properties, :status
    add_index :properties, [:status, :city]
  end
end
