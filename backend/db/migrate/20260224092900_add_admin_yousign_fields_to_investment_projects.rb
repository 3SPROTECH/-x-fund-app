class AddAdminYousignFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:investment_projects, :yousign_admin_signer_id)
      add_column :investment_projects, :yousign_admin_signer_id, :string
    end
    unless column_exists?(:investment_projects, :yousign_admin_signature_link)
      add_column :investment_projects, :yousign_admin_signature_link, :text
    end
  end
end
