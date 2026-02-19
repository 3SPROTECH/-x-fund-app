class AddAdvancedFormFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :investment_projects, :progress_status, :integer
    add_column :investment_projects, :exploitation_strategy, :integer
    add_column :investment_projects, :market_segment, :string
    add_column :investment_projects, :revenue_period, :integer
    add_column :investment_projects, :additional_info, :text
    add_column :investment_projects, :yield_justification, :text
    add_column :investment_projects, :commercialization_strategy, :jsonb, default: []
    add_column :investment_projects, :financial_dossier_status, :jsonb, default: []
    add_column :investment_projects, :consent_given, :boolean, default: false, null: false
    add_column :investment_projects, :consent_given_at, :datetime

    add_index :investment_projects, :progress_status
    add_index :investment_projects, :exploitation_strategy
  end
end
