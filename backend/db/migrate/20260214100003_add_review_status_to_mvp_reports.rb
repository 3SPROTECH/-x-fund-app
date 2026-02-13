class AddReviewStatusToMvpReports < ActiveRecord::Migration[8.0]
  def change
    add_column :mvp_reports, :review_status, :integer, null: false, default: 0
    add_column :mvp_reports, :review_comment, :text
    add_column :mvp_reports, :reviewed_by_id, :bigint
    add_column :mvp_reports, :reviewed_at, :datetime
    add_index :mvp_reports, :review_status
    add_foreign_key :mvp_reports, :users, column: :reviewed_by_id
  end
end
