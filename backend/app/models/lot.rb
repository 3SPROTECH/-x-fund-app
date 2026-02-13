class Lot < ApplicationRecord
  belongs_to :property

  validates :lot_number, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :lot_number, uniqueness: { scope: :property_id }
  validates :surface_area_sqm, numericality: { greater_than: 0 }, allow_nil: true
end
