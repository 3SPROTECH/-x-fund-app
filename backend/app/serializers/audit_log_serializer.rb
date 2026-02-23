class AuditLogSerializer
  include JSONAPI::Serializer

  attributes :id, :auditable_type, :auditable_id, :action,
             :changes_data, :ip_address, :user_agent, :created_at

  attribute :user_email do |log|
    log.user&.email
  end

  attribute :user_name do |log|
    log.user&.full_name
  end

  attribute :resource_label do |log|
    case log.auditable_type
    when "User"
      log.auditable&.full_name
    when "InvestmentProject"
      log.auditable&.title
    when "Property"
      log.auditable&.title
    when "Investment"
      "Investissement ##{log.auditable_id}"
    when "MvpReport"
      "Rapport ##{log.auditable_id}"
    when "ProjectDelay"
      log.auditable&.title
    when "Dividend"
      "Dividende ##{log.auditable_id}"
    when "Setting"
      log.auditable&.key
    when "Company"
      log.auditable&.company_name
    else
      "#{log.auditable_type} ##{log.auditable_id}"
    end
  end
end
