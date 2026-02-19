class Lot < ApplicationRecord
  belongs_to :property

  has_one_attached :sale_promise_doc
  has_one_attached :lease_doc

  enum :pre_commercialized, { not_pre_commercialized: 0, pre_commercialized_yes: 1 }, prefix: :precom

  validates :lot_number, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :lot_number, uniqueness: { scope: :property_id }
  validates :surface_area_sqm, numericality: { greater_than: 0 }, allow_nil: true
  validates :projected_sale_price_cents, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
