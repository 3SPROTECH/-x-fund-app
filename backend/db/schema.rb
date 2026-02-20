# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_20_200000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "auditable_id"
    t.string "auditable_type"
    t.jsonb "changes_data", default: {}
    t.datetime "created_at", null: false
    t.inet "ip_address"
    t.string "user_agent"
    t.bigint "user_id"
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable_type_and_auditable_id"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "companies", force: :cascade do |t|
    t.text "additional_info"
    t.string "certifications"
    t.date "company_creation_date"
    t.string "company_name", null: false
    t.integer "completed_operations_count", default: 0
    t.integer "core_expertise"
    t.datetime "created_at", null: false
    t.decimal "default_rate_percent", precision: 5, scale: 2, default: "0.0"
    t.integer "geo_experience"
    t.string "headquarters_address"
    t.integer "legal_form"
    t.string "legal_representative_name"
    t.bigint "managed_volume_cents", default: 0
    t.string "siret", limit: 14
    t.text "team_description"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "website_url"
    t.integer "years_of_experience"
    t.index ["siret"], name: "index_companies_on_siret", unique: true, where: "(siret IS NOT NULL)"
    t.index ["user_id"], name: "index_companies_on_user_id", unique: true
  end

  create_table "cost_line_items", force: :cascade do |t|
    t.bigint "amount_cents", default: 0, null: false
    t.integer "category", null: false
    t.datetime "created_at", null: false
    t.string "label", null: false
    t.integer "position"
    t.bigint "property_id", null: false
    t.datetime "updated_at", null: false
    t.index ["property_id", "category"], name: "index_cost_line_items_on_property_id_and_category"
    t.index ["property_id"], name: "index_cost_line_items_on_property_id"
  end

  create_table "dividend_payments", force: :cascade do |t|
    t.bigint "amount_cents", null: false
    t.datetime "created_at", null: false
    t.bigint "dividend_id", null: false
    t.bigint "investment_id", null: false
    t.datetime "paid_at"
    t.integer "shares_count", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["dividend_id", "investment_id"], name: "index_dividend_payments_on_dividend_id_and_investment_id", unique: true
    t.index ["dividend_id"], name: "index_dividend_payments_on_dividend_id"
    t.index ["investment_id"], name: "index_dividend_payments_on_investment_id"
    t.index ["user_id"], name: "index_dividend_payments_on_user_id"
  end

  create_table "dividends", force: :cascade do |t|
    t.bigint "amount_per_share_cents", null: false
    t.datetime "created_at", null: false
    t.date "distribution_date"
    t.bigint "financial_statement_id"
    t.bigint "investment_project_id", null: false
    t.date "period_end", null: false
    t.date "period_start", null: false
    t.integer "status", default: 0, null: false
    t.bigint "total_amount_cents", null: false
    t.datetime "updated_at", null: false
    t.index ["distribution_date"], name: "index_dividends_on_distribution_date"
    t.index ["financial_statement_id", "status"], name: "index_dividends_on_financial_statement_id_and_status"
    t.index ["financial_statement_id"], name: "index_dividends_on_financial_statement_id"
    t.index ["investment_project_id"], name: "index_dividends_on_investment_project_id"
    t.index ["status"], name: "index_dividends_on_status"
  end

  create_table "financial_statements", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "distributable_cash_cents", default: 0, null: false
    t.bigint "gross_rental_income_cents", default: 0, null: false
    t.decimal "gross_yield_percent", precision: 5, scale: 2
    t.bigint "hoa_fees_cents", default: 0, null: false
    t.bigint "insurance_cents", default: 0, null: false
    t.bigint "investment_project_id", null: false
    t.bigint "management_fees_cents", default: 0, null: false
    t.bigint "mortgage_interest_cents", default: 0, null: false
    t.bigint "net_income_cents", default: 0, null: false
    t.bigint "net_operating_income_cents", default: 0, null: false
    t.decimal "net_yield_percent", precision: 5, scale: 2
    t.decimal "occupancy_rate_percent", precision: 5, scale: 2
    t.bigint "other_income_cents", default: 0, null: false
    t.date "period_end", null: false
    t.date "period_start", null: false
    t.bigint "property_management_cents", default: 0, null: false
    t.bigint "property_taxes_cents", default: 0, null: false
    t.bigint "property_value_cents"
    t.bigint "rental_income_cents", default: 0, null: false
    t.bigint "repairs_maintenance_cents", default: 0, null: false
    t.bigint "reserve_contributions_cents", default: 0, null: false
    t.integer "statement_type", null: false
    t.bigint "total_expenses_cents", default: 0, null: false
    t.bigint "total_revenue_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "utilities_cents", default: 0, null: false
    t.bigint "vacancy_loss_cents", default: 0, null: false
    t.index ["distributable_cash_cents"], name: "index_financial_statements_on_distributable_cash_cents"
    t.index ["investment_project_id", "period_start", "period_end"], name: "idx_financial_statements_on_project_and_period", unique: true
    t.index ["investment_project_id"], name: "index_financial_statements_on_investment_project_id"
  end

  create_table "info_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "fields", default: [], null: false
    t.bigint "investment_project_id", null: false
    t.bigint "requested_by_id", null: false
    t.jsonb "responses", default: {}, null: false
    t.integer "status", default: 0, null: false
    t.datetime "submitted_at"
    t.datetime "updated_at", null: false
    t.index ["investment_project_id", "status"], name: "idx_info_requests_on_project_and_status"
    t.index ["investment_project_id"], name: "index_info_requests_on_investment_project_id"
    t.index ["requested_by_id"], name: "index_info_requests_on_requested_by_id"
  end

  create_table "investment_project_properties", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "investment_project_id", null: false
    t.string "label"
    t.bigint "property_id", null: false
    t.datetime "updated_at", null: false
    t.index ["investment_project_id", "property_id"], name: "idx_ipp_on_project_and_property", unique: true
    t.index ["investment_project_id"], name: "index_investment_project_properties_on_investment_project_id"
    t.index ["property_id"], name: "idx_ipp_on_property"
    t.index ["property_id"], name: "index_investment_project_properties_on_property_id"
  end

  create_table "investment_projects", force: :cascade do |t|
    t.text "additional_info"
    t.text "analyst_comment"
    t.boolean "analyst_financial_check", default: false, null: false
    t.bigint "analyst_id"
    t.boolean "analyst_legal_check", default: false, null: false
    t.integer "analyst_opinion", default: 0, null: false
    t.datetime "analyst_reviewed_at"
    t.boolean "analyst_risk_check", default: false, null: false
    t.bigint "bank_loan_cents"
    t.integer "bank_loan_status"
    t.string "bank_name"
    t.jsonb "commercialization_strategy", default: []
    t.boolean "consent_given", default: false, null: false
    t.datetime "consent_given_at"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration_months"
    t.bigint "equity_cents"
    t.bigint "exit_price_per_sqm_cents"
    t.integer "exit_scenario"
    t.integer "exploitation_strategy"
    t.jsonb "financial_dossier_status", default: []
    t.bigint "financial_fees_cents"
    t.jsonb "form_snapshot"
    t.date "funding_end_date", null: false
    t.date "funding_start_date", null: false
    t.decimal "gross_yield_percent", precision: 5, scale: 2
    t.boolean "has_fiducie", default: false, null: false
    t.boolean "has_first_rank_mortgage", default: false, null: false
    t.boolean "has_gfa", default: false, null: false
    t.boolean "has_interest_escrow", default: false, null: false
    t.boolean "has_open_banking", default: false, null: false
    t.boolean "has_personal_guarantee", default: false, null: false
    t.boolean "has_share_pledge", default: false, null: false
    t.boolean "has_works_escrow", default: false, null: false
    t.decimal "management_fee_percent", precision: 5, scale: 2, default: "0.0", null: false
    t.string "market_segment"
    t.bigint "max_investment_cents"
    t.bigint "min_investment_cents", null: false
    t.decimal "net_yield_percent", precision: 5, scale: 2
    t.bigint "notary_fees_cents"
    t.integer "operation_type"
    t.bigint "owner_id", null: false
    t.integer "payment_frequency"
    t.date "planned_acquisition_date"
    t.date "planned_delivery_date"
    t.date "planned_repayment_date"
    t.decimal "pre_commercialization_percent", precision: 5, scale: 2
    t.bigint "projected_margin_cents"
    t.bigint "projected_revenue_cents"
    t.integer "revenue_period"
    t.text "review_comment"
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.text "risk_description"
    t.bigint "share_price_cents", null: false
    t.integer "shares_sold", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.bigint "total_amount_cents", null: false
    t.integer "total_shares", null: false
    t.datetime "updated_at", null: false
    t.bigint "works_budget_cents"
    t.text "yield_justification"
    t.index ["analyst_id"], name: "index_investment_projects_on_analyst_id"
    t.index ["analyst_opinion"], name: "index_investment_projects_on_analyst_opinion"
    t.index ["bank_loan_status"], name: "index_investment_projects_on_bank_loan_status"
    t.index ["exit_scenario"], name: "index_investment_projects_on_exit_scenario"
    t.index ["exploitation_strategy"], name: "index_investment_projects_on_exploitation_strategy"
    t.index ["funding_end_date"], name: "index_investment_projects_on_funding_end_date"
    t.index ["funding_start_date"], name: "index_investment_projects_on_funding_start_date"
    t.index ["operation_type"], name: "index_investment_projects_on_operation_type"
    t.index ["owner_id"], name: "index_investment_projects_on_owner_id"
    t.index ["reviewed_by_id"], name: "index_investment_projects_on_reviewed_by_id"
    t.index ["status"], name: "index_investment_projects_on_status"
  end

  create_table "investments", force: :cascade do |t|
    t.bigint "amount_cents", null: false
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.bigint "fee_cents", default: 0, null: false
    t.datetime "invested_at", null: false
    t.bigint "investment_project_id", null: false
    t.integer "shares_count", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["investment_project_id"], name: "index_investments_on_investment_project_id"
    t.index ["status"], name: "index_investments_on_status"
    t.index ["user_id", "investment_project_id"], name: "index_investments_on_user_id_and_investment_project_id"
    t.index ["user_id"], name: "index_investments_on_user_id"
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.datetime "exp", null: false
    t.string "jti", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti"
  end

  create_table "lots", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.boolean "is_rented", default: false, null: false
    t.string "lease_ref"
    t.integer "lot_number", null: false
    t.integer "pre_commercialized", default: 0, null: false
    t.bigint "projected_sale_price_cents"
    t.bigint "property_id", null: false
    t.string "sale_promise_ref"
    t.decimal "surface_area_sqm", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["property_id", "lot_number"], name: "index_lots_on_property_id_and_lot_number", unique: true
    t.index ["property_id"], name: "index_lots_on_property_id"
  end

  create_table "mvp_reports", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.bigint "best_offer_previsionnel_cents"
    t.bigint "best_offer_realise_cents"
    t.decimal "budget_variance_percent", precision: 5, scale: 2
    t.text "corrective_action"
    t.datetime "created_at", null: false
    t.date "estimated_compromise_date"
    t.date "estimated_deed_date"
    t.date "estimated_repayment_date"
    t.boolean "exit_confirmed", default: false, null: false
    t.date "expected_repayment_date"
    t.bigint "investment_project_id", null: false
    t.bigint "listed_price_cents"
    t.integer "offers_count"
    t.integer "operation_status", default: 0, null: false
    t.bigint "purchase_price_previsionnel_cents"
    t.bigint "purchase_price_realise_cents"
    t.text "review_comment"
    t.integer "review_status", default: 0, null: false
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "risk_identified"
    t.string "risk_impact"
    t.date "sale_start_date"
    t.text "summary"
    t.bigint "target_sale_price_previsionnel_cents"
    t.bigint "target_sale_price_realise_cents"
    t.bigint "total_cost_previsionnel_cents"
    t.bigint "total_cost_realise_cents"
    t.datetime "updated_at", null: false
    t.integer "visits_count"
    t.bigint "works_previsionnel_cents"
    t.decimal "works_progress_percent", precision: 5, scale: 2
    t.bigint "works_realise_cents"
    t.index ["author_id"], name: "index_mvp_reports_on_author_id"
    t.index ["investment_project_id", "created_at"], name: "idx_mvp_reports_on_project_and_date"
    t.index ["investment_project_id"], name: "index_mvp_reports_on_investment_project_id"
    t.index ["review_status"], name: "index_mvp_reports_on_review_status"
  end

  create_table "project_documents", force: :cascade do |t|
    t.text "comment"
    t.datetime "created_at", null: false
    t.integer "document_type", null: false
    t.bigint "documentable_id", null: false
    t.string "documentable_type", null: false
    t.boolean "required", default: true, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["document_type"], name: "index_project_documents_on_document_type"
    t.index ["documentable_type", "documentable_id"], name: "index_project_documents_on_documentable"
    t.index ["status"], name: "index_project_documents_on_status"
  end

  create_table "project_drafts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "current_step", default: 0, null: false
    t.jsonb "form_data", default: {}, null: false
    t.datetime "last_saved_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "updated_at"], name: "index_project_drafts_on_user_id_and_updated_at"
    t.index ["user_id"], name: "index_project_drafts_on_user_id"
  end

  create_table "properties", force: :cascade do |t|
    t.bigint "acquisition_price_cents", null: false
    t.string "address_line1", null: false
    t.string "address_line2"
    t.bigint "agency_fees_cents"
    t.string "city", null: false
    t.string "country", default: "FR", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "dpe_current"
    t.integer "dpe_target"
    t.bigint "estimated_value_cents"
    t.date "expert_date"
    t.string "expert_name"
    t.decimal "floor_area_sqm", precision: 10, scale: 2
    t.boolean "is_land_division", default: false, null: false
    t.boolean "is_refinancing", default: false, null: false
    t.decimal "latitude", precision: 10, scale: 8
    t.decimal "longitude", precision: 11, scale: 8
    t.jsonb "nearby_amenities", default: []
    t.string "neighborhood"
    t.integer "number_of_lots"
    t.bigint "owner_id", null: false
    t.date "permit_date"
    t.string "permit_number"
    t.integer "permit_status"
    t.string "postal_code", null: false
    t.integer "property_type", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.text "strategic_advantages"
    t.decimal "surface_area_sqm", precision: 10, scale: 2
    t.string "title", null: false
    t.jsonb "transport_access", default: []
    t.datetime "updated_at", null: false
    t.integer "works_duration_months"
    t.boolean "works_needed", default: false, null: false
    t.integer "zone_typology"
    t.index ["city"], name: "index_properties_on_city"
    t.index ["owner_id"], name: "index_properties_on_owner_id"
    t.index ["permit_status"], name: "index_properties_on_permit_status"
    t.index ["status", "city"], name: "index_properties_on_status_and_city"
    t.index ["status"], name: "index_properties_on_status"
    t.index ["zone_typology"], name: "index_properties_on_zone_typology"
  end

  create_table "settings", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.string "description"
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.text "value", default: "", null: false
    t.string "value_type", default: "string", null: false
    t.index ["category"], name: "index_settings_on_category"
    t.index ["key"], name: "index_settings_on_key", unique: true
  end

  create_table "transactions", force: :cascade do |t|
    t.bigint "amount_cents", null: false
    t.bigint "balance_after_cents", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "investment_id"
    t.jsonb "metadata", default: {}
    t.datetime "processed_at"
    t.string "reference", null: false
    t.integer "status", default: 0, null: false
    t.integer "transaction_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "wallet_id", null: false
    t.index ["created_at"], name: "index_transactions_on_created_at"
    t.index ["investment_id"], name: "index_transactions_on_investment_id"
    t.index ["reference"], name: "index_transactions_on_reference", unique: true
    t.index ["status"], name: "index_transactions_on_status"
    t.index ["transaction_type"], name: "index_transactions_on_transaction_type"
    t.index ["wallet_id"], name: "index_transactions_on_wallet_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "address_line1"
    t.string "address_line2"
    t.string "city"
    t.string "country", default: "FR"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.inet "current_sign_in_ip"
    t.date "date_of_birth"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "first_name", null: false
    t.string "jti", null: false
    t.text "kyc_rejection_reason"
    t.integer "kyc_status", default: 0, null: false
    t.datetime "kyc_submitted_at"
    t.datetime "kyc_verified_at"
    t.string "last_name", null: false
    t.datetime "last_sign_in_at"
    t.inet "last_sign_in_ip"
    t.string "phone"
    t.string "postal_code"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["kyc_status"], name: "index_users_on_kyc_status"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  create_table "wallets", force: :cascade do |t|
    t.bigint "balance_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.string "currency", default: "EUR", null: false
    t.boolean "is_platform", default: false, null: false
    t.bigint "total_deposited_cents", default: 0, null: false
    t.bigint "total_withdrawn_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["is_platform"], name: "index_wallets_on_is_platform", unique: true, where: "(is_platform = true)"
    t.index ["user_id"], name: "index_wallets_on_user_id", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "audit_logs", "users"
  add_foreign_key "companies", "users"
  add_foreign_key "cost_line_items", "properties"
  add_foreign_key "dividend_payments", "dividends"
  add_foreign_key "dividend_payments", "investments"
  add_foreign_key "dividend_payments", "users"
  add_foreign_key "dividends", "financial_statements"
  add_foreign_key "dividends", "investment_projects"
  add_foreign_key "financial_statements", "investment_projects"
  add_foreign_key "info_requests", "investment_projects"
  add_foreign_key "info_requests", "users", column: "requested_by_id"
  add_foreign_key "investment_project_properties", "investment_projects"
  add_foreign_key "investment_project_properties", "properties"
  add_foreign_key "investment_projects", "users", column: "analyst_id"
  add_foreign_key "investment_projects", "users", column: "owner_id"
  add_foreign_key "investment_projects", "users", column: "reviewed_by_id"
  add_foreign_key "investments", "investment_projects"
  add_foreign_key "investments", "users"
  add_foreign_key "lots", "properties"
  add_foreign_key "mvp_reports", "investment_projects"
  add_foreign_key "mvp_reports", "users", column: "author_id"
  add_foreign_key "mvp_reports", "users", column: "reviewed_by_id"
  add_foreign_key "project_drafts", "users"
  add_foreign_key "properties", "users", column: "owner_id"
  add_foreign_key "transactions", "investments"
  add_foreign_key "transactions", "wallets"
  add_foreign_key "wallets", "users"
end
