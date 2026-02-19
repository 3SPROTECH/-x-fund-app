class AddFormSnapshotToInvestmentProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :investment_projects, :form_snapshot, :jsonb
  end
end
