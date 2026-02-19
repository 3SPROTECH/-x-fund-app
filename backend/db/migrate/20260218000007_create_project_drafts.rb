class CreateProjectDrafts < ActiveRecord::Migration[8.1]
  def change
    create_table :project_drafts do |t|
      t.references :user, null: false, foreign_key: true
      t.jsonb :form_data, null: false, default: {}
      t.integer :current_step, default: 0, null: false
      t.datetime :last_saved_at

      t.timestamps
    end

    add_index :project_drafts, [:user_id, :updated_at]
  end
end
