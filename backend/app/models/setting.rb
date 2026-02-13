class Setting < ApplicationRecord
  validates :key, presence: true, uniqueness: true
  validates :value_type, presence: true, inclusion: { in: %w[string integer decimal boolean] }
  validates :category, presence: true

  CATEGORIES = %w[platform investment kyc wallet project commissions notifications security].freeze

  scope :by_category, ->(cat) { where(category: cat) }

  def typed_value
    case value_type
    when "integer"  then value.to_i
    when "decimal"  then value.to_f
    when "boolean"  then ActiveModel::Type::Boolean.new.cast(value)
    else value
    end
  end

  def self.get(key)
    find_by(key: key)&.typed_value
  end

  def self.set(key, new_value)
    setting = find_by!(key: key)
    setting.update!(value: new_value.to_s)
    setting
  end
end
