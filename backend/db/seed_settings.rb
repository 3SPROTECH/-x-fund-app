default_settings = [
  { key: "platform_name", value: "X-Fund", value_type: "string", category: "platform", description: "Nom de la plateforme" },
  { key: "platform_contact_email", value: "contact@x-fund.com", value_type: "string", category: "platform", description: "Email de contact" },
  { key: "platform_currency", value: "EUR", value_type: "string", category: "platform", description: "Devise par defaut" },
  { key: "maintenance_mode", value: "false", value_type: "boolean", category: "platform", description: "Mode maintenance" },
  { key: "default_min_investment_cents", value: "100000", value_type: "integer", category: "investment", description: "Montant minimum investissement par defaut (centimes)" },
  { key: "default_max_investment_cents", value: "50000000", value_type: "integer", category: "investment", description: "Montant maximum investissement par defaut (centimes)" },
  { key: "default_management_fee_percent", value: "2.0", value_type: "decimal", category: "investment", description: "Frais de gestion par defaut (%)" },
  { key: "auto_close_funded_projects", value: "true", value_type: "boolean", category: "investment", description: "Cloturer auto les projets finances" },
  { key: "max_projects_per_owner", value: "10", value_type: "integer", category: "investment", description: "Max projets actifs par porteur" },
  { key: "kyc_required_for_investment", value: "true", value_type: "boolean", category: "kyc", description: "KYC obligatoire pour investir" },
  { key: "kyc_require_identity_document", value: "true", value_type: "boolean", category: "kyc", description: "Document identite requis" },
  { key: "kyc_require_proof_of_address", value: "true", value_type: "boolean", category: "kyc", description: "Justificatif de domicile requis" },
  { key: "kyc_expiry_months", value: "12", value_type: "integer", category: "kyc", description: "Duree validite KYC (mois)" },
  { key: "kyc_reminder_days", value: "7", value_type: "integer", category: "kyc", description: "Rappel KYC en attente (jours)" },
  { key: "min_deposit_cents", value: "1000", value_type: "integer", category: "wallet", description: "Depot minimum (centimes)" },
  { key: "max_deposit_cents", value: "100000000", value_type: "integer", category: "wallet", description: "Depot maximum (centimes)" },
  { key: "min_withdrawal_cents", value: "5000", value_type: "integer", category: "wallet", description: "Retrait minimum (centimes)" },
  { key: "max_withdrawal_cents", value: "50000000", value_type: "integer", category: "wallet", description: "Retrait maximum (centimes)" },
  { key: "withdrawal_delay_hours", value: "48", value_type: "integer", category: "wallet", description: "Delai traitement retraits (heures)" },
  { key: "transaction_fee_percent", value: "0.0", value_type: "decimal", category: "wallet", description: "Frais de transaction (%)" },
  { key: "project_approval_required", value: "true", value_type: "boolean", category: "project", description: "Approbation admin requise" },
  { key: "max_funding_period_days", value: "365", value_type: "integer", category: "project", description: "Duree max financement (jours)" },
  { key: "min_funding_period_days", value: "30", value_type: "integer", category: "project", description: "Duree min financement (jours)" },
  { key: "require_contrat_obligataire", value: "true", value_type: "boolean", category: "project", description: "Contrat obligataire requis" },
  { key: "require_fici_document", value: "true", value_type: "boolean", category: "project", description: "Document FICI requis" },
  { key: "default_share_price_cents", value: "10000", value_type: "integer", category: "project", description: "Prix par part par defaut (centimes)" },
  { key: "platform_investment_commission_percent", value: "0.0", value_type: "decimal", category: "commissions", description: "Commission plateforme sur investissements (%)" },
  { key: "platform_dividend_commission_percent", value: "0.0", value_type: "decimal", category: "commissions", description: "Commission plateforme sur dividendes (%)" },
  { key: "management_fee_cap_percent", value: "5.0", value_type: "decimal", category: "commissions", description: "Plafond frais de gestion (%)" },
  { key: "email_notifications_enabled", value: "true", value_type: "boolean", category: "notifications", description: "Activer notifications email" },
  { key: "notify_investment_confirmed", value: "true", value_type: "boolean", category: "notifications", description: "Notifier confirmation investissement" },
  { key: "notify_dividend_received", value: "true", value_type: "boolean", category: "notifications", description: "Notifier reception dividende" },
  { key: "notify_kyc_status_change", value: "true", value_type: "boolean", category: "notifications", description: "Notifier changement statut KYC" },
  { key: "notify_project_status_change", value: "true", value_type: "boolean", category: "notifications", description: "Notifier changement statut projet" },
  { key: "admin_alert_investment_threshold_cents", value: "10000000", value_type: "integer", category: "notifications", description: "Seuil alerte admin investissements (centimes)" },
  { key: "jwt_expiry_hours", value: "24", value_type: "integer", category: "security", description: "Duree validite tokens JWT (heures)" },
  { key: "max_login_attempts", value: "5", value_type: "integer", category: "security", description: "Tentatives connexion max" },
  { key: "min_password_length", value: "8", value_type: "integer", category: "security", description: "Longueur min mot de passe" },
  { key: "force_password_change_days", value: "0", value_type: "integer", category: "security", description: "Forcer changement mot de passe (jours, 0=desactive)" },
]

default_settings.each do |attrs|
  Setting.find_or_create_by!(key: attrs[:key]) do |s|
    s.value = attrs[:value]
    s.value_type = attrs[:value_type]
    s.category = attrs[:category]
    s.description = attrs[:description]
  end
end

puts "#{Setting.count} settings seeded successfully"
