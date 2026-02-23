class DividendPayment < ApplicationRecord
  include Auditable

  belongs_to :dividend
  belongs_to :investment
  belongs_to :user

  enum :status, { en_attente: 0, verse: 1, echoue: 2 }, prefix: :payment

  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :shares_count, presence: true, numericality: { greater_than: 0 }
  validates :investment_id, uniqueness: { scope: :dividend_id }
end
