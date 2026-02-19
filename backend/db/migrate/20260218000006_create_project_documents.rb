class CreateProjectDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :project_documents do |t|
      t.string :documentable_type, null: false
      t.bigint :documentable_id, null: false
      t.integer :document_type, null: false
      t.integer :status, default: 0, null: false
      t.text :comment
      t.boolean :required, default: true, null: false

      t.timestamps
    end

    add_index :project_documents, [:documentable_type, :documentable_id], name: "index_project_documents_on_documentable"
    add_index :project_documents, :document_type
    add_index :project_documents, :status
  end
end
