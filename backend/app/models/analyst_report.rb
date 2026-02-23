class AnalystReport < ApplicationRecord
  include Auditable

  belongs_to :investment_project
  belongs_to :analyst, class_name: "User"

  validates :report_data, presence: true
  validates :risk_score, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :success_score, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :recommendation, presence: true

  scope :latest_first, -> { order(created_at: :desc) }
end
