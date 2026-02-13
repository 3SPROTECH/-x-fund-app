class CreateSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :settings do |t|
      t.string :key, null: false
      t.text :value, null: false, default: ""
      t.string :value_type, null: false, default: "string"
      t.string :category, null: false
      t.string :description

      t.timestamps
    end

    add_index :settings, :key, unique: true
    add_index :settings, :category

    reversible do |dir|
      dir.up do
        now = Time.current.to_fs(:db)
        defaults = [
          # Platform
          ["platform_name", "X-Fund", "string", "platform", "Nom de la plateforme"],
          ["platform_contact_email", "contact@x-fund.com", "string", "platform", "Email de contact"],
          ["platform_currency", "EUR", "string", "platform", "Devise par defaut"],
          ["maintenance_mode", "false", "boolean", "platform", "Mode maintenance (desactive les nouvelles inscriptions et investissements)"],

          # Investment
          ["default_min_investment_cents", "100000", "integer", "investment", "Montant minimum d'investissement par defaut (en centimes)"],
          ["default_max_investment_cents", "50000000", "integer", "investment", "Montant maximum d'investissement par defaut (en centimes)"],
          ["default_management_fee_percent", "2.0", "decimal", "investment", "Frais de gestion par defaut (%)"],
          ["auto_close_funded_projects", "true", "boolean", "investment", "Cloturer automatiquement les projets entierement finances"],
          ["max_projects_per_owner", "10", "integer", "investment", "Nombre maximum de projets actifs par porteur"],

          # KYC
          ["kyc_required_for_investment", "true", "boolean", "kyc", "KYC obligatoire pour investir"],
          ["kyc_require_identity_document", "true", "boolean", "kyc", "Document d'identite requis"],
          ["kyc_require_proof_of_address", "true", "boolean", "kyc", "Justificatif de domicile requis"],
          ["kyc_expiry_months", "12", "integer", "kyc", "Duree de validite du KYC (mois)"],
          ["kyc_reminder_days", "7", "integer", "kyc", "Rappel automatique KYC en attente (jours)"],

          # Wallet
          ["min_deposit_cents", "1000", "integer", "wallet", "Depot minimum (en centimes)"],
          ["max_deposit_cents", "100000000", "integer", "wallet", "Depot maximum (en centimes)"],
          ["min_withdrawal_cents", "5000", "integer", "wallet", "Retrait minimum (en centimes)"],
          ["max_withdrawal_cents", "50000000", "integer", "wallet", "Retrait maximum (en centimes)"],
          ["withdrawal_delay_hours", "48", "integer", "wallet", "Delai de traitement des retraits (heures)"],
          ["transaction_fee_percent", "0.0", "decimal", "wallet", "Frais de transaction (%)"],

          # Project
          ["project_approval_required", "true", "boolean", "project", "Approbation admin requise avant publication"],
          ["max_funding_period_days", "365", "integer", "project", "Duree maximale de financement (jours)"],
          ["min_funding_period_days", "30", "integer", "project", "Duree minimale de financement (jours)"],
          ["require_contrat_obligataire", "true", "boolean", "project", "Contrat obligataire requis"],
          ["require_fici_document", "true", "boolean", "project", "Document FICI requis"],

          # Commissions
          ["platform_investment_commission_percent", "0.0", "decimal", "commissions", "Commission plateforme sur investissements (%)"],
          ["platform_dividend_commission_percent", "0.0", "decimal", "commissions", "Commission plateforme sur dividendes (%)"],
          ["management_fee_cap_percent", "5.0", "decimal", "commissions", "Plafond des frais de gestion (%)"],

          # Notifications
          ["email_notifications_enabled", "true", "boolean", "notifications", "Activer les notifications par email"],
          ["notify_investment_confirmed", "true", "boolean", "notifications", "Notifier lors de la confirmation d'un investissement"],
          ["notify_dividend_received", "true", "boolean", "notifications", "Notifier lors de la reception d'un dividende"],
          ["notify_kyc_status_change", "true", "boolean", "notifications", "Notifier lors du changement de statut KYC"],
          ["notify_project_status_change", "true", "boolean", "notifications", "Notifier lors du changement de statut d'un projet"],
          ["admin_alert_investment_threshold_cents", "10000000", "integer", "notifications", "Seuil d'alerte admin pour investissements importants (en centimes)"],

          # Security
          ["jwt_expiry_hours", "24", "integer", "security", "Duree de validite des tokens JWT (heures)"],
          ["max_login_attempts", "5", "integer", "security", "Tentatives de connexion max avant blocage"],
          ["min_password_length", "8", "integer", "security", "Longueur minimale du mot de passe"],
          ["force_password_change_days", "0", "integer", "security", "Forcer le changement de mot de passe (jours, 0 = desactive)"],
        ]

        values = defaults.map do |key, value, value_type, category, description|
          escaped_desc = description.gsub("'", "''")
          "('#{key}', '#{value}', '#{value_type}', '#{category}', '#{escaped_desc}', '#{now}', '#{now}')"
        end

        execute <<~SQL
          INSERT INTO settings (key, value, value_type, category, description, created_at, updated_at)
          VALUES #{values.join(",\n                 ")}
        SQL
      end
    end
  end
end
