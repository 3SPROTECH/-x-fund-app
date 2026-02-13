class AddOperationTypeToInvestmentProjects < ActiveRecord::Migration[8.0]
  def change
    add_column :investment_projects, :operation_type, :integer
    add_index :investment_projects, :operation_type
  end
end
