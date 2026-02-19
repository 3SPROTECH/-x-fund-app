class RelaxPropertyUniquenessOnInvestmentProjectProperties < ActiveRecord::Migration[8.1]
  def change
    # Remove the unique index on property_id to allow multiple properties per project
    remove_index :investment_project_properties, name: "idx_ipp_on_property_unique"

    # Add a non-unique index on property_id for query performance
    add_index :investment_project_properties, :property_id, name: "idx_ipp_on_property"

    # Add label column for asset hub display
    add_column :investment_project_properties, :label, :string
  end
end
