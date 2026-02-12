class AddOwnerToInvestmentProjects < ActiveRecord::Migration[8.1]
  def up
    # Add owner_id column (nullable initially)
    add_reference :investment_projects, :owner, null: true, foreign_key: { to_table: :users }, index: true

    # Backfill: set owner_id from property.owner_id for existing projects
    execute <<-SQL
      UPDATE investment_projects
      SET owner_id = properties.owner_id
      FROM properties
      WHERE investment_projects.property_id = properties.id
    SQL

    # Make it non-nullable now that all records have an owner
    change_column_null :investment_projects, :owner_id, false
  end

  def down
    remove_reference :investment_projects, :owner, foreign_key: { to_table: :users }, index: true
  end
end
