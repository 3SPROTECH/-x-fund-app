module Auditable
  extend ActiveSupport::Concern

  included do
    has_many :audit_logs, as: :auditable, dependent: :nullify

    after_create  { log_audit("create") }
    after_update  { log_audit("update") }
    after_destroy { log_audit("delete") }
  end

  private

  def audit_excluded_fields
    %w[updated_at created_at]
  end

  def log_audit(action)
    AuditLog.create!(
      user: Current.user,
      auditable: self,
      action: action,
      changes_data: saved_changes.except(*audit_excluded_fields),
      ip_address: Current.ip_address,
      user_agent: Current.user_agent
    )
  rescue => e
    Rails.logger.error("Audit log creation failed: #{e.message}")
  end
end
