class AddReviewFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :investment_projects, :review_status, :integer, default: 0, null: false
    add_column :investment_projects, :review_comment, :text
    add_reference :investment_projects, :reviewed_by, foreign_key: { to_table: :users }, null: true
    add_column :investment_projects, :reviewed_at, :datetime

    add_index :investment_projects, :review_status
  end
end
