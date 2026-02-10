class AuditLogSerializer
  include JSONAPI::Serializer

  attributes :id, :auditable_type, :auditable_id, :action,
             :changes_data, :ip_address, :user_agent, :created_at

  attribute :user_email do |log|
    log.user&.email
  end
end
