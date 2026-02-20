class DemoCreateInfoRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :demo_info_requests do |t|
      t.references :investment_project, null: false, foreign_key: true, index: true
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.jsonb :fields, null: false, default: []
      t.integer :status, null: false, default: 0
      t.jsonb :responses, null: false, default: {}
      t.datetime :submitted_at

      t.timestamps
    end

    add_index :demo_info_requests, [:investment_project_id, :status],
              name: "idx_demo_info_requests_on_project_and_status"
  end
end
