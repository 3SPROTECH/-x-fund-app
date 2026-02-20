class CreateProjectDelays < ActiveRecord::Migration[8.1]
  def change
    create_table :project_delays do |t|
      t.references :investment_project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :delay_type, null: false, default: 0
      t.string :title, null: false
      t.text :description, null: false
      t.text :justification
      t.date :original_date, null: false
      t.date :new_estimated_date, null: false
      t.integer :delay_days, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.datetime :resolved_at
      t.timestamps
    end

    add_index :project_delays, :delay_type
    add_index :project_delays, :status
  end
end
