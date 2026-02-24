class InvestmentProject < ApplicationRecord
  include Auditable

  has_many :investment_project_properties, dependent: :destroy
  has_many :properties, through: :investment_project_properties
  belongs_to :owner, class_name: "User"
  belongs_to :reviewer, class_name: "User", foreign_key: :reviewed_by_id, optional: true
  belongs_to :analyst, class_name: "User", optional: true
  has_many :investments, dependent: :restrict_with_error
  has_many :investors, through: :investments, source: :user
  has_many :dividends, dependent: :restrict_with_error
  has_many :financial_statements, dependent: :destroy
  has_many :mvp_reports, dependent: :destroy
  has_many :info_requests, dependent: :destroy
  has_many :analyst_reports, dependent: :destroy
  has_many :project_delays, dependent: :destroy
  has_many :chat_messages, dependent: :destroy
  has_many :asset_guarantees, dependent: :destroy

  has_one_attached :contrat_obligataire
  has_one_attached :fici_document
  has_one_attached :pv_decision
  has_one_attached :note_operation
  has_many_attached :additional_documents
  has_one_attached :price_grid
  has_one_attached :block_buyer_loi
  has_one_attached :sale_agreement
  has_one_attached :projected_balance_sheet
  has_one_attached :proof_of_funds

  enum :status, {
    draft: 0,
    pending_analysis: 1,
    info_requested: 2,
    rejected: 3,
    approved: 4,
    legal_structuring: 5,
    signing: 6,
    funding_active: 7,
    funded: 8,
    under_construction: 9,
    operating: 10,
    repaid: 11,
    info_resubmitted: 12,
    analyst_approved: 13
  }
  enum :exploitation_strategy, {
    seasonal_rental: 0,
    classic_rental: 1,
    resale: 2,
    colocation: 3
  }, prefix: :exploit
  enum :revenue_period, { monthly: 0, annual: 1 }, prefix: :rev
  enum :operation_type, {
    promotion_immobiliere: 0,
    marchand_de_biens: 1,
    rehabilitation_lourde: 2,
    division_fonciere: 3,
    immobilier_locatif: 4,
    transformation_usage: 5,
    refinancement: 6,
    amenagement_foncier: 7
  }, prefix: :op
  enum :bank_loan_status, { en_negociation: 0, accord_principe: 1, offre_editee: 2, offre_signee: 3 }, prefix: :bank
  enum :payment_frequency, { mensuel: 0, trimestriel: 1, annuel: 2, in_fine: 3 }, prefix: :freq
  enum :exit_scenario, { unit_sale: 0, block_sale: 1, refinance_exit: 2 }, prefix: :exit
  enum :analyst_opinion, {
    opinion_pending: 0,
    opinion_approved: 1,
    opinion_info_requested: 2,
    opinion_rejected: 3
  }, prefix: :analyst

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

  scope :active, -> { where(status: [:funding_active, :funded, :under_construction, :operating]) }
  scope :open_for_investment, -> { where(status: :funding_active) }
  scope :visible_to_investors, -> { where(status: [:funding_active, :funded, :under_construction, :operating, :repaid]) }

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

  # Compute guarantee aggregates from form_snapshot asset data and persist records
  def compute_guarantee_aggregates
    return unless form_snapshot.present?

    assets = form_snapshot["assets"] || []
    return if assets.empty?

    # Clear existing guarantee records for this project
    asset_guarantees.destroy_all

    scores = []
    summary = []

    assets.each_with_index do |asset, idx|
      g = asset["guarantee"]
      next unless g.present? && g["type"].present? && g["type"] != ""

      score = (g["protectionScore"] || 0).to_f
      scores << score

      # Create persistent record
      asset_guarantees.create!(
        asset_index: idx,
        asset_label: asset["label"],
        guarantee_type: g["type"],
        rank: g["rank"].presence,
        asset_value_cents: ((g["assetValue"] || 0).to_f * 100).round,
        debt_amount_cents: ((g["debtAmount"] || 0).to_f * 100).round,
        ltv: g["ltv"] || 0,
        protection_score: score,
        risk_level: g["riskLevel"].presence || "critical",
        description: g["description"],
        guarantor_name: g["guarantor"]
      )

      summary << {
        "asset_label" => asset["label"],
        "type" => g["type"],
        "rank" => g["rank"],
        "ltv" => g["ltv"],
        "protection_score" => score,
        "risk_level" => g["riskLevel"]
      }
    end

    return if scores.empty?

    avg = (scores.sum / scores.size).round(2)
    risk = case avg
           when 80..100 then "low"
           when 60..79  then "moderate"
           when 40..59  then "high"
           else              "critical"
           end

    aggregate_attrs = {}
    aggregate_attrs[:overall_protection_score] = avg if has_attribute?(:overall_protection_score)
    aggregate_attrs[:overall_risk_level] = risk if has_attribute?(:overall_risk_level)
    aggregate_attrs[:guarantee_type_summary] = summary if has_attribute?(:guarantee_type_summary)

    update_columns(aggregate_attrs) if aggregate_attrs.any?
  end

  private

  def end_date_after_start_date
    return unless funding_start_date && funding_end_date
    if funding_end_date <= funding_start_date
      errors.add(:funding_end_date, "doit etre posterieure a la date de debut")
    end
  end

  def must_be_approved_to_open
    # Prevent opening a project for funding directly from early stages
    if funding_active? && status_was.in?(["draft", "pending_analysis", "info_requested", "info_resubmitted", "analyst_approved"])
      errors.add(:status, "le projet doit etre approuve avant d'etre mis en collecte")
    end
  end
end
