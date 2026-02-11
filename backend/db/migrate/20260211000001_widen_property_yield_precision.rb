# Correction: decimal(5,2) n'accepte que des valeurs < 1000.
# Élargir la précision pour éviter PG::NumericValueOutOfRange sur estimated_annual_yield_percent.
class WidenPropertyYieldPrecision < ActiveRecord::Migration[8.1]
  def up
    change_column :properties, :estimated_annual_yield_percent,
                  :decimal, precision: 8, scale: 2, null: false
  end

  def down
    change_column :properties, :estimated_annual_yield_percent,
                  :decimal, precision: 5, scale: 2, null: false
  end
end
