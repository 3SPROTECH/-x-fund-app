class Company < ApplicationRecord
  belongs_to :user

  has_one_attached :kbis
  has_one_attached :presentation_deck

  enum :legal_form, { independant: 5, sas: 0, sarl: 1, sci: 2, snc: 3, sccv: 4 }
  enum :core_expertise, {
    marchand_biens: 0,
    promoteur: 1,
    renovation: 2,
    gestion_locative: 3,
    autre_expertise: 4
  }, prefix: :expertise
  enum :geo_experience, {
    first_operation: 0,
    one_to_three: 1,
    expert_local: 2
  }, prefix: :geo

  validates :company_name, presence: true
  validates :siret, format: { with: /\A\d{14}\z/, message: "doit contenir 14 chiffres" }, allow_blank: true
  validates :user_id, uniqueness: true
end
