class AddAdvancedFormFieldsToLots < ActiveRecord::Migration[8.1]
  def change
    add_column :lots, :pre_commercialized, :integer, default: 0, null: false
    add_column :lots, :is_rented, :boolean, default: false, null: false
    add_column :lots, :projected_sale_price_cents, :bigint
    add_column :lots, :sale_promise_ref, :string
    add_column :lots, :lease_ref, :string
  end
end
