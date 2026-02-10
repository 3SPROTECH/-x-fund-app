class Property < ApplicationRecord
  include Auditable

  belongs_to :owner, class_name: "User"
  has_one :investment_project, dependent: :destroy

  has_many_attached :photos
  has_many_attached :documents

  enum :property_type, { appartement: 0, maison: 1, immeuble: 2, commercial: 3, terrain: 4 }
  enum :status, { brouillon: 0, en_financement: 1, finance: 2, en_gestion: 3, vendu: 4, annule: 5 }

  validates :title, presence: true
  validates :address_line1, presence: true
  validates :city, presence: true
  validates :postal_code, presence: true
  validates :country, presence: true
  validates :acquisition_price_cents, presence: true, numericality: { greater_than: 0 }
  validates :estimated_annual_yield_percent, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :investment_duration_months, presence: true, numericality: { greater_than: 0 }

  scope :published, -> { where.not(status: :brouillon) }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
end
