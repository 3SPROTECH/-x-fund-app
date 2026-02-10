class FinancialStatement < ApplicationRecord
  belongs_to :investment_project

  has_one_attached :report_document

  enum :statement_type, { trimestriel: 0, semestriel: 1, annuel: 2 }

  validates :statement_type, presence: true
  validates :period_start, presence: true
  validates :period_end, presence: true
  validates :period_start, uniqueness: { scope: [:investment_project_id, :period_end] }
end
