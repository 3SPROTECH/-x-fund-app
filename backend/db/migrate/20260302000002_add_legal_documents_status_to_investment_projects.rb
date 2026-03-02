class AddLegalDocumentsStatusToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :investment_projects, :legal_documents_status, :jsonb, default: {}
  end
end
