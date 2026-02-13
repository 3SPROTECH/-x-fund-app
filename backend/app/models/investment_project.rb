class InvestmentProject < ApplicationRecord
  include Auditable

  has_many :investment_project_properties, dependent: :destroy
  has_many :properties, through: :investment_project_properties
  belongs_to :owner, class_name: "User"
  belongs_to :reviewer, class_name: "User", foreign_key: :reviewed_by_id, optional: true
  has_many :investments, dependent: :restrict_with_error
  has_many :investors, through: :investments, source: :user
  has_many :dividends, dependent: :restrict_with_error
  has_many :financial_statements, dependent: :destroy
  has_many :mvp_reports, dependent: :destroy

  has_one_attached :contrat_obligataire
  has_one_attached :fici_document
  has_one_attached :pv_decision
  has_one_attached :note_operation
  has_many_attached :additional_documents

  enum :status, { brouillon: 0, ouvert: 1, finance: 2, cloture: 3, annule: 4 }
  enum :review_status, { en_attente: 0, approuve: 1, rejete: 2 }, prefix: :review
  enum :operation_type, {
    promotion_immobiliere: 0,
    marchand_de_biens: 1,
    rehabilitation_lourde: 2,
    division_fonciere: 3,
    immobilier_locatif: 4,
    transformation_usage: 5
  }, prefix: :op

  validates :title, presence: true
  validates :total_amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :share_price_cents, presence: true, numericality: { greater_than: 0 }
  validates :total_shares, presence: true, numericality: { greater_than: 0 }
  validates :min_investment_cents, presence: true, numericality: { greater_than: 0 }
  validates :funding_start_date, presence: true
  validates :funding_end_date, presence: true
  validates :management_fee_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validate :end_date_after_start_date
  validate :must_be_approved_to_open

  scope :active, -> { where(status: [:ouvert, :finance]) }
  scope :open_for_investment, -> { where(status: :ouvert) }
  scope :pending_review, -> { where(review_status: :en_attente) }
  scope :approved, -> { where(review_status: :approuve) }
  scope :rejected, -> { where(review_status: :rejete) }

  # Premier bien (pour affichage titre/ville/photos)
  def primary_property
    properties.first
  end

  def funding_progress_percent
    return 0.0 if total_shares.zero?
    (shares_sold.to_f / total_shares * 100).round(2)
  end

  def available_shares
    total_shares - shares_sold
  end

  def amount_raised_cents
    shares_sold * share_price_cents
  end

  private

  def end_date_after_start_date
    return unless funding_start_date && funding_end_date
    if funding_end_date <= funding_start_date
      errors.add(:funding_end_date, "doit etre posterieure a la date de debut")
    end
  end

  def must_be_approved_to_open
    if ouvert? && !review_approuve?
      errors.add(:status, "le projet doit etre approuve avant d'etre ouvert")
    end
  end
end
