class Investment < ApplicationRecord
  include Auditable

  belongs_to :user
  belongs_to :investment_project
  has_many :transactions, dependent: :nullify
  has_many :dividend_payments, dependent: :restrict_with_error

  enum :status, { en_cours: 0, confirme: 1, cloture: 2, liquide: 3, annule: 4 }

  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :shares_count, presence: true, numericality: { greater_than: 0 }
  validates :invested_at, presence: true

  scope :active, -> { where(status: [:en_cours, :confirme]) }
  scope :for_user, ->(user) { where(user: user) }
end
