class RenameDemoInfoRequestsToInfoRequests < ActiveRecord::Migration[8.1]
  def change
    rename_table :demo_info_requests, :info_requests

    # Rename composite index
    rename_index :info_requests,
                 "idx_demo_info_requests_on_project_and_status",
                 "idx_info_requests_on_project_and_status"
  end
end
