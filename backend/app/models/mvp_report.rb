class MvpReport < ApplicationRecord
  include Auditable

  belongs_to :investment_project
  belongs_to :author, class_name: "User"

  enum :operation_status, {
    acquisition_en_cours: 0,
    acte_signe: 1,
    en_renovation: 2,
    en_commercialisation: 3,
    sous_offre: 4,
    sous_compromis: 5,
    vendu: 6
  }

  validates :operation_status, presence: true
  validates :summary, length: { maximum: 500 }, allow_blank: true

  scope :latest_first, -> { order(created_at: :desc) }

  def self.latest
    latest_first.first
  end
end
