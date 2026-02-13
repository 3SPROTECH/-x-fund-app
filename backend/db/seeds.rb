puts "Seeding database..."

# Admin user
admin = User.find_or_create_by!(email: "admin@x-fund.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.first_name = "Admin"
  u.last_name = "X-Fund"
  u.role = :administrateur
  u.kyc_status = :verified
  u.kyc_verified_at = Time.current
end
puts "  Admin created: #{admin.email}"

# Investor users
investors = []
3.times do |i|
  investor = User.find_or_create_by!(email: "investisseur#{i + 1}@example.com") do |u|
    u.password = "password123"
    u.password_confirmation = "password123"
    u.first_name = ["Jean", "Marie", "Pierre"][i]
    u.last_name = ["Dupont", "Martin", "Bernard"][i]
    u.phone = "+3361234567#{i}"
    u.role = :investisseur
    u.kyc_status = :verified
    u.kyc_verified_at = Time.current
    u.city = "Paris"
    u.country = "FR"
  end
  investors << investor
  puts "  Investor created: #{investor.email}"
end

# Project owner
porteur = User.find_or_create_by!(email: "porteur@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.first_name = "Sophie"
  u.last_name = "Leroy"
  u.phone = "+33698765432"
  u.role = :porteur_de_projet
  u.kyc_status = :verified
  u.kyc_verified_at = Time.current
end
puts "  Project owner created: #{porteur.email}"

# Properties
property1 = Property.find_or_create_by!(title: "Residence Voltaire") do |p|
  p.owner = porteur
  p.description = "Bel immeuble de rapport dans le 11eme arrondissement de Paris"
  p.property_type = :immeuble
  p.address_line1 = "42 Boulevard Voltaire"
  p.city = "Paris"
  p.postal_code = "75011"
  p.country = "FR"
  p.acquisition_price_cents = 50_000_000
  p.estimated_value_cents = 52_000_000
  p.estimated_annual_yield_percent = 6.5
  p.investment_duration_months = 60
  p.status = :en_financement
end
puts "  Property created: #{property1.title}"

property2 = Property.find_or_create_by!(title: "Villa Mediterranee") do |p|
  p.owner = porteur
  p.description = "Villa de luxe avec vue mer a Nice"
  p.property_type = :maison
  p.address_line1 = "15 Promenade des Anglais"
  p.city = "Nice"
  p.postal_code = "06000"
  p.country = "FR"
  p.acquisition_price_cents = 120_000_000
  p.estimated_value_cents = 125_000_000
  p.estimated_annual_yield_percent = 5.2
  p.investment_duration_months = 84
  p.status = :en_financement
end
puts "  Property created: #{property2.title}"

# Investment Projects
project1 = InvestmentProject.find_or_create_by!(property: property1) do |p|
  p.title = "Projet Voltaire - Rendement Locatif"
  p.description = "Investissez dans un immeuble de rapport au coeur de Paris"
  p.total_amount_cents = 50_000_000
  p.share_price_cents = 100_000
  p.total_shares = 500
  p.min_investment_cents = 100_000
  p.max_investment_cents = 10_000_000
  p.funding_start_date = Date.current - 30.days
  p.funding_end_date = Date.current + 60.days
  p.status = :ouvert
  p.review_status = :approuve
  p.management_fee_percent = 2.0
  p.gross_yield_percent = 6.5
  p.net_yield_percent = 4.5
end
puts "  Project created: #{project1.title}"

project2 = InvestmentProject.find_or_create_by!(property: property2) do |p|
  p.title = "Projet Mediterranee - Plus-Value"
  p.description = "Participez a l'acquisition d'une villa premium a Nice"
  p.total_amount_cents = 120_000_000
  p.share_price_cents = 500_000
  p.total_shares = 240
  p.min_investment_cents = 500_000
  p.max_investment_cents = 24_000_000
  p.funding_start_date = Date.current - 15.days
  p.funding_end_date = Date.current + 90.days
  p.status = :ouvert
  p.review_status = :approuve
  p.management_fee_percent = 2.5
  p.gross_yield_percent = 5.2
  p.net_yield_percent = 2.7
end
puts "  Project created: #{project2.title}"

# Deposit funds into investor wallets
investors.each do |investor|
  wallet = investor.wallet
  Wallets::WalletService.new(wallet).deposit(
    amount_cents: 5_000_000,
    reference: "SEED-DEP-#{investor.id}-#{SecureRandom.hex(4).upcase}"
  )
  puts "  Deposited 50,000 EUR into #{investor.email}'s wallet"
end

# Platform Settings
puts "Seeding settings..."

default_settings = [
  # Platform
  { key: "platform_name", value: "X-Fund", value_type: "string", category: "platform", description: "Nom de la plateforme" },
  { key: "platform_contact_email", value: "contact@x-fund.com", value_type: "string", category: "platform", description: "Email de contact" },
  { key: "platform_currency", value: "EUR", value_type: "string", category: "platform", description: "Devise par defaut" },
  { key: "maintenance_mode", value: "false", value_type: "boolean", category: "platform", description: "Mode maintenance (desactive les nouvelles inscriptions et investissements)" },

  # Investment
  { key: "default_min_investment_cents", value: "100000", value_type: "integer", category: "investment", description: "Montant minimum d'investissement par defaut (en centimes)" },
  { key: "default_max_investment_cents", value: "50000000", value_type: "integer", category: "investment", description: "Montant maximum d'investissement par defaut (en centimes)" },
  { key: "default_management_fee_percent", value: "2.0", value_type: "decimal", category: "investment", description: "Frais de gestion par defaut (%)" },
  { key: "auto_close_funded_projects", value: "true", value_type: "boolean", category: "investment", description: "Cloturer automatiquement les projets entierement finances" },
  { key: "max_projects_per_owner", value: "10", value_type: "integer", category: "investment", description: "Nombre maximum de projets actifs par porteur" },

  # KYC
  { key: "kyc_required_for_investment", value: "true", value_type: "boolean", category: "kyc", description: "KYC obligatoire pour investir" },
  { key: "kyc_require_identity_document", value: "true", value_type: "boolean", category: "kyc", description: "Document d'identite requis" },
  { key: "kyc_require_proof_of_address", value: "true", value_type: "boolean", category: "kyc", description: "Justificatif de domicile requis" },
  { key: "kyc_expiry_months", value: "12", value_type: "integer", category: "kyc", description: "Duree de validite du KYC (mois)" },
  { key: "kyc_reminder_days", value: "7", value_type: "integer", category: "kyc", description: "Rappel automatique KYC en attente (jours)" },

  # Wallet
  { key: "min_deposit_cents", value: "1000", value_type: "integer", category: "wallet", description: "Depot minimum (en centimes)" },
  { key: "max_deposit_cents", value: "100000000", value_type: "integer", category: "wallet", description: "Depot maximum (en centimes)" },
  { key: "min_withdrawal_cents", value: "5000", value_type: "integer", category: "wallet", description: "Retrait minimum (en centimes)" },
  { key: "max_withdrawal_cents", value: "50000000", value_type: "integer", category: "wallet", description: "Retrait maximum (en centimes)" },
  { key: "withdrawal_delay_hours", value: "48", value_type: "integer", category: "wallet", description: "Delai de traitement des retraits (heures)" },
  { key: "transaction_fee_percent", value: "0.0", value_type: "decimal", category: "wallet", description: "Frais de transaction (%)" },

  # Project
  { key: "project_approval_required", value: "true", value_type: "boolean", category: "project", description: "Approbation admin requise avant publication" },
  { key: "max_funding_period_days", value: "365", value_type: "integer", category: "project", description: "Duree maximale de financement (jours)" },
  { key: "min_funding_period_days", value: "30", value_type: "integer", category: "project", description: "Duree minimale de financement (jours)" },
  { key: "require_contrat_obligataire", value: "true", value_type: "boolean", category: "project", description: "Contrat obligataire requis" },
  { key: "require_fici_document", value: "true", value_type: "boolean", category: "project", description: "Document FICI requis" },

  # Commissions
  { key: "platform_investment_commission_percent", value: "0.0", value_type: "decimal", category: "commissions", description: "Commission plateforme sur investissements (%)" },
  { key: "platform_dividend_commission_percent", value: "0.0", value_type: "decimal", category: "commissions", description: "Commission plateforme sur dividendes (%)" },
  { key: "management_fee_cap_percent", value: "5.0", value_type: "decimal", category: "commissions", description: "Plafond des frais de gestion (%)" },

  # Notifications
  { key: "email_notifications_enabled", value: "true", value_type: "boolean", category: "notifications", description: "Activer les notifications par email" },
  { key: "notify_investment_confirmed", value: "true", value_type: "boolean", category: "notifications", description: "Notifier lors de la confirmation d'un investissement" },
  { key: "notify_dividend_received", value: "true", value_type: "boolean", category: "notifications", description: "Notifier lors de la reception d'un dividende" },
  { key: "notify_kyc_status_change", value: "true", value_type: "boolean", category: "notifications", description: "Notifier lors du changement de statut KYC" },
  { key: "notify_project_status_change", value: "true", value_type: "boolean", category: "notifications", description: "Notifier lors du changement de statut d'un projet" },
  { key: "admin_alert_investment_threshold_cents", value: "10000000", value_type: "integer", category: "notifications", description: "Seuil d'alerte admin pour investissements importants (en centimes)" },

  # Security
  { key: "jwt_expiry_hours", value: "24", value_type: "integer", category: "security", description: "Duree de validite des tokens JWT (heures)" },
  { key: "max_login_attempts", value: "5", value_type: "integer", category: "security", description: "Tentatives de connexion max avant blocage" },
  { key: "min_password_length", value: "8", value_type: "integer", category: "security", description: "Longueur minimale du mot de passe" },
  { key: "force_password_change_days", value: "0", value_type: "integer", category: "security", description: "Forcer le changement de mot de passe (jours, 0 = desactive)" },
]

default_settings.each do |attrs|
  Setting.find_or_create_by!(key: attrs[:key]) do |s|
    s.value = attrs[:value]
    s.value_type = attrs[:value_type]
    s.category = attrs[:category]
    s.description = attrs[:description]
  end
end
puts "  #{default_settings.size} settings seeded"

puts "Seeding complete!"
