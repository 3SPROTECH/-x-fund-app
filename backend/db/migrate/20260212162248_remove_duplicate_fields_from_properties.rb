class RemoveDuplicateFieldsFromProperties < ActiveRecord::Migration[8.1]
  def change
    remove_column :properties, :estimated_annual_yield_percent, :decimal
    remove_column :properties, :investment_duration_months, :integer
  end
end
