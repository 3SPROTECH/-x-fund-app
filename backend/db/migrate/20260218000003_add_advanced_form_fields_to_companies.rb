class AddAdvancedFormFieldsToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :website_url, :string
    add_column :companies, :years_of_experience, :integer
    add_column :companies, :core_expertise, :integer
    add_column :companies, :geo_experience, :integer
    add_column :companies, :certifications, :string
    add_column :companies, :team_description, :text
    add_column :companies, :additional_info, :text
  end
end
