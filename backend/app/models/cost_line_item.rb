class CostLineItem < ApplicationRecord
  belongs_to :property

  has_one_attached :justificatif

  enum :category, { acquisition: 0, works: 1, expertise: 2, custom: 3 }

  validates :label, presence: true
  validates :amount_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :category, presence: true
end
