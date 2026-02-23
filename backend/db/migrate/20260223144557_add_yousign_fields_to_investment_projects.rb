class AddYousignFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :investment_projects, :yousign_signature_request_id, :string
    add_column :investment_projects, :yousign_document_id, :string
    add_column :investment_projects, :yousign_signer_id, :string
    add_column :investment_projects, :yousign_signature_link, :text
    add_column :investment_projects, :yousign_status, :string
    add_column :investment_projects, :yousign_sent_at, :datetime
  end
end
