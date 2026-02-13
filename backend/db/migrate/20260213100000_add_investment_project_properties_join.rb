# frozen_string_literal: true

class AddInvestmentProjectPropertiesJoin < ActiveRecord::Migration[8.0]
  def up
    create_table :investment_project_properties do |t|
      t.references :investment_project, null: false, foreign_key: true
      t.references :property, null: false, foreign_key: true
      t.timestamps
    end

    add_index :investment_project_properties, [:investment_project_id, :property_id],
              unique: true, name: "idx_ipp_on_project_and_property"
    add_index :investment_project_properties, :property_id,
              unique: true, name: "idx_ipp_on_property_unique"

    # Migrate existing project -> property into join table
    execute <<-SQL.squish
      INSERT INTO investment_project_properties (investment_project_id, property_id, created_at, updated_at)
      SELECT id, property_id, NOW(), NOW() FROM investment_projects
    SQL

    remove_index :investment_projects, name: "index_investment_projects_on_property_id"
    remove_foreign_key :investment_projects, :properties
    remove_column :investment_projects, :property_id
  end

  def down
    add_reference :investment_projects, :property, null: true, foreign_key: true

    # Copy first property per project back
    execute <<-SQL.squish
      UPDATE investment_projects ip
      SET property_id = (
        SELECT property_id FROM investment_project_properties ipp
        WHERE ipp.investment_project_id = ip.id
        ORDER BY ipp.id ASC LIMIT 1
      )
    SQL

    change_column_null :investment_projects, :property_id, false
    add_index :investment_projects, :property_id, unique: true

    drop_table :investment_project_properties
  end
end
