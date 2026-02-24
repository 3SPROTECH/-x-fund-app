class AddPerformanceIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :investment_projects, [:status, :created_at], name: "idx_projects_status_created"
    add_index :investment_projects, :analyst_opinion, name: "idx_projects_analyst_opinion"
    add_index :investments, :created_at, name: "idx_investments_created_at"
    add_index :users, [:role, :kyc_status], name: "idx_users_role_kyc"
  end
end
