class InvestmentProjectSerializer
  include JSONAPI::Serializer

  attributes :id, :title, :description, :operation_type, :total_amount_cents, :share_price_cents,
             :total_shares, :shares_sold, :min_investment_cents, :max_investment_cents,
             :funding_start_date, :funding_end_date,
             :management_fee_percent, :gross_yield_percent, :net_yield_percent,
             :review_comment, :reviewed_at,
             # Advanced form fields
             :exploitation_strategy, :market_segment,
             :revenue_period, :additional_info, :yield_justification,
             :commercialization_strategy, :financial_dossier_status,
             :consent_given, :consent_given_at,
             :duration_months, :equity_cents,
             :notary_fees_cents, :works_budget_cents, :financial_fees_cents,
             :bank_loan_cents, :projected_revenue_cents, :projected_margin_cents,
             :bank_name, :bank_loan_status, :payment_frequency,
             :pre_commercialization_percent, :exit_price_per_sqm_cents, :exit_scenario,
             :planned_acquisition_date, :planned_delivery_date, :planned_repayment_date,
             :has_first_rank_mortgage, :has_share_pledge, :has_fiducie,
             :has_interest_escrow, :has_works_escrow, :has_personal_guarantee,
             :has_gfa, :has_open_banking, :risk_description,
             :overall_protection_score, :overall_risk_level, :guarantee_type_summary,
             :yousign_status, :yousign_sent_at, :yousign_admin_signer_id,
             :created_at, :updated_at

  attribute :status do |project, params|
    if params && params[:hide_analyst_approved] && project.analyst_approved?
      "pending_analysis"
    else
      project.status
    end
  end

  attribute :funding_progress_percent do |project|
    project.funding_progress_percent
  end

  attribute :available_shares do |project|
    project.available_shares
  end

  attribute :amount_raised_cents do |project|
    project.amount_raised_cents
  end

  attribute :property_title do |project|
    project.primary_property&.title
  end

  attribute :property_city do |project|
    project.primary_property&.city
  end

  attribute :property_ids do |project|
    project.properties.map(&:id)
  end

  attribute :owner_id do |project|
    project.owner_id
  end

  attribute :owner_name do |project|
    project.owner.full_name
  end

  attribute :reviewer_name do |project|
    project.reviewer&.full_name
  end

  attribute :analyst_id do |project|
    project.analyst_id
  end

  attribute :analyst_name do |project|
    project.analyst&.full_name
  end

  attribute :analyst_opinion do |project|
    project.analyst_opinion
  end

  attribute :analyst_comment do |project|
    project.analyst_comment
  end

  attribute :analyst_legal_check do |project|
    project.analyst_legal_check
  end

  attribute :analyst_financial_check do |project|
    project.analyst_financial_check
  end

  attribute :analyst_risk_check do |project|
    project.analyst_risk_check
  end

  attribute :analyst_reviewed_at do |project|
    project.analyst_reviewed_at
  end

  attribute :has_form_snapshot do |project|
    project.form_snapshot.present?
  end

  attribute :form_snapshot do |project, params|
    if params && params[:include_snapshot]
      project.form_snapshot
    else
      nil
    end
  end

  attribute :has_analyst_report do |project|
    project.analyst_reports.any?
  end

  attribute :latest_analyst_report_id do |project|
    project.analyst_reports.max_by(&:created_at)&.id
  end

  attribute :has_pending_info_request do |project|
    project.info_requests.any? { |ir| ir.status == "pending" }
  end

  attribute :latest_info_request_id do |project|
    project.info_requests.max_by(&:created_at)&.id
  end

  attribute :investment_fee_percent do |_project|
    Setting.get("platform_investment_commission_percent") || 0.0
  end

  attribute :yousign_signature_link do |project|
    project.signing? ? project.yousign_signature_link : nil
  end

  attribute :yousign_admin_signature_link do |project|
    project.signing? ? project.yousign_admin_signature_link : nil
  end

  attribute :images do |project|
    next [] unless project.additional_documents.attached?

    project.additional_documents.map { |img|
      begin
        {
          id: img.id,
          url: Rails.application.routes.url_helpers.rails_blob_path(img, only_path: true),
          filename: img.filename.to_s,
          content_type: img.content_type,
          byte_size: img.byte_size
        }
      rescue => e
        Rails.logger.error("Error generating image URL: #{e.message}")
        nil
      end
    }.compact
  end

  attribute :property_photos do |project|
    prop = project.primary_property
    next [] unless prop&.photos&.attached?

    prop.photos.map { |photo|
      begin
        {
          id: photo.id,
          url: Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true),
          filename: photo.filename.to_s,
          content_type: photo.content_type
        }
      rescue => e
        Rails.logger.error("Error generating property photo URL: #{e.message}")
        nil
      end
    }.compact
  end
end
