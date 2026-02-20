class AddAnalystFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    add_reference :investment_projects, :analyst, foreign_key: { to_table: :users }, null: true
    add_column :investment_projects, :analyst_opinion, :integer, default: 0, null: false
    add_column :investment_projects, :analyst_comment, :text
    add_column :investment_projects, :analyst_legal_check, :boolean, default: false, null: false
    add_column :investment_projects, :analyst_financial_check, :boolean, default: false, null: false
    add_column :investment_projects, :analyst_risk_check, :boolean, default: false, null: false
    add_column :investment_projects, :analyst_reviewed_at, :datetime

    add_index :investment_projects, :analyst_opinion
  end
end
