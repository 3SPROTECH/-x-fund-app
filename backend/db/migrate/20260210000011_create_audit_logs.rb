class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :user, foreign_key: true

      t.string  :auditable_type, null: false
      t.bigint  :auditable_id,   null: false
      t.string  :action,         null: false
      t.jsonb   :changes_data,   default: {}
      t.inet    :ip_address
      t.string  :user_agent

      t.datetime :created_at, null: false
    end

    add_index :audit_logs, [:auditable_type, :auditable_id]
    add_index :audit_logs, :action
    add_index :audit_logs, :created_at
  end
end
