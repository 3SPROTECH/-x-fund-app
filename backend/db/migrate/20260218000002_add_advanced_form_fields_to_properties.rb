class AddAdvancedFormFieldsToProperties < ActiveRecord::Migration[8.1]
  def change
    add_column :properties, :neighborhood, :string
    add_column :properties, :zone_typology, :integer
    add_column :properties, :transport_access, :jsonb, default: []
    add_column :properties, :nearby_amenities, :jsonb, default: []
    add_column :properties, :strategic_advantages, :text
    add_column :properties, :expert_name, :string
    add_column :properties, :expert_date, :date
    add_column :properties, :is_refinancing, :boolean, default: false, null: false
    add_column :properties, :works_needed, :boolean, default: false, null: false
    add_column :properties, :works_duration_months, :integer
    add_column :properties, :agency_fees_cents, :bigint

    add_index :properties, :zone_typology
  end
end
