class AddDefaultSharePriceSetting < ActiveRecord::Migration[8.0]
  def up
    Setting.find_or_create_by!(key: "default_share_price_cents") do |s|
      s.value = "10000"
      s.value_type = "integer"
      s.category = "project"
      s.description = "Prix par part par défaut (centimes)"
    end
  end

  def down
    Setting.find_by(key: "default_share_price_cents")&.destroy
  end
end
