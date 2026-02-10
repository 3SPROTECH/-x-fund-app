class Transaction < ApplicationRecord
  belongs_to :wallet
  belongs_to :investment, optional: true

  enum :transaction_type, { depot: 0, retrait: 1, investissement: 2, dividende: 3, remboursement: 4, frais: 5 }
  enum :status, { en_attente: 0, complete: 1, echoue: 2, annule: 3 }, prefix: :tx

  validates :transaction_type, presence: true
  validates :amount_cents, presence: true
  validates :balance_after_cents, presence: true
  validates :reference, presence: true, uniqueness: true

  scope :recent, -> { order(created_at: :desc) }
  scope :completed, -> { where(status: :complete) }
end
