class AssetGuarantee < ApplicationRecord
  belongs_to :investment_project

  has_many_attached :proof_documents

  enum :guarantee_type, {
    hypotheque: "hypotheque",
    fiducie: "fiducie",
    garantie_premiere_demande: "garantie_premiere_demande",
    caution_personnelle: "caution_personnelle",
    garantie_corporate: "garantie_corporate",
    aucune: "aucune"
  }, prefix: :gtype

  enum :risk_level, {
    low: "low",
    moderate: "moderate",
    high: "high",
    critical: "critical"
  }, prefix: :risk

  validates :guarantee_type, presence: true
  validates :asset_index, presence: true
end
