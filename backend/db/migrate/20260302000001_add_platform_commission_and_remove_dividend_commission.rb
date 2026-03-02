class AddPlatformCommissionAndRemoveDividendCommission < ActiveRecord::Migration[8.1]
  def up
    # Add platform commission (6% default) — main commission taken from total collected
    Setting.find_or_create_by!(key: "platform_commission_percent") do |s|
      s.value = "6.0"
      s.value_type = "decimal"
      s.category = "commissions"
      s.description = "Commission plateforme sur montant collecte (%)"
    end

    # Remove dividend commission — no longer applicable
    Setting.find_by(key: "platform_dividend_commission_percent")&.destroy
    Rails.cache.delete("settings/platform_dividend_commission_percent")
  end

  def down
    Setting.find_by(key: "platform_commission_percent")&.destroy
    Rails.cache.delete("settings/platform_commission_percent")

    Setting.find_or_create_by!(key: "platform_dividend_commission_percent") do |s|
      s.value = "0.0"
      s.value_type = "decimal"
      s.category = "commissions"
      s.description = "Commission plateforme sur dividendes (%)"
    end
  end
end
