class AddAdminYousignFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :investment_projects, :yousign_admin_signer_id, :string
    add_column :investment_projects, :yousign_admin_signature_link, :text
  end
end
