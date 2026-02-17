class Company < ApplicationRecord
  belongs_to :user

  has_one_attached :kbis
  has_one_attached :presentation_deck

  enum :legal_form, { sas: 0, sarl: 1, sci: 2, snc: 3, sccv: 4 }

  validates :company_name, presence: true
  validates :siret, format: { with: /\A\d{14}\z/, message: "doit contenir 14 chiffres" }, allow_blank: true
  validates :user_id, uniqueness: true
end
