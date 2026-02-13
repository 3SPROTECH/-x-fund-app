class Dividend < ApplicationRecord
  belongs_to :investment_project
  has_many :dividend_payments, dependent: :destroy

  enum :status, { planifie: 0, distribue: 1, annule: 2 }

  validates :total_amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :amount_per_share_cents, presence: true, numericality: { greater_than: 0 }
  validates :distribution_date, presence: true, if: :distribue?
  validates :period_start, presence: true
  validates :period_end, presence: true
  validate :end_after_start

  scope :distributed, -> { where(status: :distribue) }

  private

  def end_after_start
    return unless period_start && period_end
    if period_end <= period_start
      errors.add(:period_end, "doit etre posterieure a la date de debut")
    end
  end
end
