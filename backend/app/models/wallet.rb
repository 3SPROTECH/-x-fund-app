class Wallet < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :restrict_with_error

  validates :currency, presence: true
  validates :balance_cents, numericality: { greater_than_or_equal_to: 0 }
end
