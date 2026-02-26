class CreateAnalysisDrafts < ActiveRecord::Migration[8.1]
  def change
    create_table :analysis_drafts do |t|
      t.references :user, null: false, foreign_key: true
      t.references :investment_project, null: false, foreign_key: true
      t.jsonb :form_data, null: false, default: {}
      t.integer :current_step, default: 0, null: false
      t.datetime :last_saved_at

      t.timestamps
    end

    add_index :analysis_drafts, [:user_id, :investment_project_id], unique: true, name: "idx_analysis_drafts_on_user_and_project"
  end
end
