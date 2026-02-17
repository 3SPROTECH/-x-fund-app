class Property < ApplicationRecord
  include Auditable

  belongs_to :owner, class_name: "User"
  has_one :investment_project_property, dependent: :destroy
  has_one :investment_project, through: :investment_project_property

  has_many :lots, dependent: :destroy
  accepts_nested_attributes_for :lots, allow_destroy: true

  has_many_attached :photos
  has_many_attached :documents

  enum :property_type, { appartement: 0, maison: 1, immeuble: 2, commercial: 3, terrain: 4, logistique: 5, mixte: 6 }
  enum :status, { brouillon: 0, en_financement: 1, finance: 2, en_gestion: 3, vendu: 4, annule: 5 }
  enum :dpe_current, { dpe_current_a: 0, dpe_current_b: 1, dpe_current_c: 2, dpe_current_d: 3, dpe_current_e: 4, dpe_current_f: 5, dpe_current_g: 6 }, prefix: :dpe_current
  enum :dpe_target, { dpe_target_a: 0, dpe_target_b: 1, dpe_target_c: 2, dpe_target_d: 3, dpe_target_e: 4, dpe_target_f: 5, dpe_target_g: 6 }, prefix: :dpe_target
  enum :permit_status, { obtenu_purge: 0, obtenu_non_purge: 1, depose: 2 }, prefix: :permit

  validates :title, presence: true
  validates :address_line1, presence: true
  validates :city, presence: true
  validates :postal_code, presence: true
  validates :country, presence: true
  validates :acquisition_price_cents, presence: true, numericality: { greater_than: 0 }
  validates :number_of_lots, numericality: { greater_than: 0, only_integer: true }, allow_nil: true
  validates :number_of_lots, presence: true, if: :immeuble?

  scope :published, -> { where.not(status: :brouillon) }
  scope :by_city, ->(city) { where(city: city) if city.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
end
