class EnsureChatMessagesTableExists < ActiveRecord::Migration[8.1]
  def change
    unless table_exists?(:chat_messages)
      create_table :chat_messages do |t|
        t.references :investment_project, null: false, foreign_key: true
        t.references :sender, null: false, foreign_key: { to_table: :users }
        t.text :body, null: false
        t.datetime :read_at

        t.timestamps
      end

      add_index :chat_messages, [:investment_project_id, :created_at],
                name: "idx_chat_messages_on_project_and_date"
      add_index :chat_messages, [:investment_project_id, :sender_id, :read_at],
                name: "idx_chat_messages_unread"
    end
  end
end
