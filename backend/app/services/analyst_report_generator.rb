class AnalystReportGenerator
  GUARANTEE_WEIGHT = 0.20
  FINANCIAL_WEIGHT = 0.25
  DOCUMENTATION_WEIGHT = 0.15
  MARKET_WEIGHT = 0.15
  RISK_WEIGHT = 0.25

  GUARANTEE_FIELDS = %w[
    has_first_rank_mortgage has_share_pledge has_fiducie
    has_interest_escrow has_works_escrow has_personal_guarantee
    has_gfa has_open_banking
  ].freeze

  OPERATION_TYPE_RISK = {
    "promotion_immobiliere" => 0.55,
    "marchand_de_biens" => 0.60,
    "rehabilitation_lourde" => 0.50,
    "division_fonciere" => 0.65,
    "immobilier_locatif" => 0.75,
    "transformation_usage" => 0.50,
    "refinancement" => 0.70,
    "amenagement_foncier" => 0.55
  }.freeze

  def initialize(project, analyst, checks: {})
    @project = project
    @analyst = analyst
    @checks = checks
  end

  def generate
    financial = compute_financial_metrics
    risks = compute_risk_factors
    guarantee = compute_guarantee_score
    documentation = compute_documentation_score
    market = compute_market_score

    raw_success = (
      guarantee[:score] * GUARANTEE_WEIGHT +
      financial[:score] * FINANCIAL_WEIGHT +
      documentation[:score] * DOCUMENTATION_WEIGHT +
      market[:score] * MARKET_WEIGHT +
      risks[:resilience_score] * RISK_WEIGHT
    ).round(2)

    success_score = [[raw_success, 0].max, 100].min
    risk_score = (100 - success_score).round(2)

    recommendation = compute_recommendation(success_score)

    report_data = {
      project_summary: build_project_summary,
      guarantee_analysis: guarantee,
      financial_analysis: financial,
      documentation_analysis: documentation,
      market_analysis: market,
      risk_analysis: risks,
      scores: {
        guarantee: guarantee[:score].round(1),
        financial: financial[:score].round(1),
        documentation: documentation[:score].round(1),
        market: market[:score].round(1),
        risk_resilience: risks[:resilience_score].round(1)
      },
      generated_at: Time.current.iso8601,
      analyst_name: @analyst.full_name
    }

    {
      report_data: report_data,
      risk_score: risk_score,
      success_score: success_score,
      financial_metrics: financial,
      risk_factors: risks,
      recommendation: recommendation
    }
  end

  private

  def build_project_summary
    prop = @project.primary_property
    {
      title: @project.title,
      description: @project.description,
      operation_type: @project.operation_type,
      owner_name: @project.owner&.full_name,
      property_city: prop&.city,
      property_address: prop&.address_line1,
      total_amount: cents_to_eur(@project.total_amount_cents),
      share_price: cents_to_eur(@project.share_price_cents),
      total_shares: @project.total_shares,
      min_investment: cents_to_eur(@project.min_investment_cents),
      duration_months: @project.duration_months,
      funding_start: @project.funding_start_date&.iso8601,
      funding_end: @project.funding_end_date&.iso8601
    }
  end

  def compute_guarantee_score
    summary = per_asset_guarantee_summary
    if summary.present?
      score = (summary.sum { |g| g["protection_score"].to_f } / summary.size.to_f).round(2)
      details = summary.map do |g|
        {
          name: "#{g['asset_label']} - #{(g['type'] || '').tr('_', ' ').capitalize}",
          present: g["type"] != "aucune",
          score: g["protection_score"],
          ltv: g["ltv"],
          risk_level: g["risk_level"]
        }
      end

      return {
        score: score,
        count: summary.count { |g| g["type"] != "aucune" },
        total: summary.size,
        details: details,
        per_asset: true
      }
    end

    active = GUARANTEE_FIELDS.select { |f| @project.send(f) }
    score = (active.size.to_f / GUARANTEE_FIELDS.size * 100).round(2)

    details = GUARANTEE_FIELDS.map do |f|
      { name: f.sub("has_", "").titleize, present: @project.send(f) }
    end

    { score: score, count: active.size, total: GUARANTEE_FIELDS.size, details: details, per_asset: false }
  end

  def compute_financial_metrics
    scores = []
    total = effective_total_amount_cents
    equity = effective_equity_cents(total)
    bank_loan = effective_bank_loan_cents(total, equity)

    gross = @project.gross_yield_percent || 0
    yield_score = [[gross / 10.0 * 100, 100].min, 0].max
    scores << yield_score

    equity_ratio = (equity.to_f / total * 100).round(2)
    equity_score = [[equity_ratio / 30.0 * 100, 100].min, 0].max
    scores << equity_score

    bank_coverage = total > 0 ? ((total - bank_loan).to_f / total * 100).round(2) : 100
    bank_score = [[bank_coverage, 100].min, 0].max
    scores << bank_score

    revenue = @project.projected_revenue_cents || 0
    margin = @project.projected_margin_cents || 0
    margin_ratio = revenue > 0 ? (margin.to_f / revenue * 100).round(2) : 0
    margin_score = [[margin_ratio / 25.0 * 100, 100].min, 0].max
    scores << margin_score

    composite = scores.sum / scores.size.to_f

    {
      score: composite.round(2),
      gross_yield: gross,
      net_yield: @project.net_yield_percent || 0,
      equity_ratio: equity_ratio,
      equity_amount: cents_to_eur(equity),
      apport_amount: cents_to_eur(equity),
      apport_percent: (total > 0 ? (equity.to_f / total * 100).round(2) : 0),
      bank_loan_amount: cents_to_eur(bank_loan),
      bank_coverage_percent: bank_coverage,
      total_amount: cents_to_eur(total),
      projected_revenue: cents_to_eur(revenue),
      projected_margin: cents_to_eur(margin),
      margin_ratio: margin_ratio,
      notary_fees: cents_to_eur(@project.notary_fees_cents || 0),
      works_budget: cents_to_eur(@project.works_budget_cents || 0),
      financial_fees: cents_to_eur(@project.financial_fees_cents || 0),
      cost_breakdown: {
        equity: cents_to_eur(equity),
        bank_loan: cents_to_eur(bank_loan),
        notary_fees: cents_to_eur(@project.notary_fees_cents || 0),
        works_budget: cents_to_eur(@project.works_budget_cents || 0),
        financial_fees: cents_to_eur(@project.financial_fees_cents || 0)
      }
    }
  end

  def compute_documentation_score
    checks = {
      legal: @checks[:legal_check] || @project.analyst_legal_check,
      financial: @checks[:financial_check] || @project.analyst_financial_check,
      risk: @checks[:risk_check] || @project.analyst_risk_check
    }
    passed = checks.values.count(true)
    score = (passed.to_f / 3 * 100).round(2)

    { score: score, checks: checks, passed: passed, total: 3 }
  end

  def compute_market_score
    op_score = (OPERATION_TYPE_RISK[@project.operation_type] || 0.5) * 100

    pre_com = @project.pre_commercialization_percent || 0
    pre_com_bonus = pre_com * 0.3

    score = [[op_score + pre_com_bonus, 100].min, 0].max

    {
      score: score.round(2),
      operation_type: @project.operation_type,
      operation_type_label: @project.operation_type&.titleize,
      base_score: op_score.round(2),
      pre_commercialization: pre_com,
      market_segment: @project.market_segment
    }
  end

  def compute_risk_factors
    factors = []
    total = effective_total_amount_cents
    equity = effective_equity_cents(total)
    financed = effective_bank_loan_cents(total, equity)

    duration = @project.duration_months || 12
    duration_risk = [[duration / 36.0 * 100, 100].min, 0].max
    factors << { name: "Duree du projet", value: duration_risk.round(1), detail: "#{duration} mois" }

    amount = total
    amount_risk = [[amount / 5_000_000_00.to_f * 100, 100].min, 0].max
    factors << { name: "Montant total", value: amount_risk.round(1), detail: cents_to_eur(amount) }

    leverage = (financed.to_f / total * 100).round(2)
    leverage_risk = [[leverage, 100].min, 0].max
    apport_pct = total > 0 ? (equity.to_f / total * 100).round(2) : 0
    factors << {
      name: "Effet de levier",
      value: leverage_risk.round(1),
      detail: "#{leverage}% (apport: #{apport_pct}%)"
    }

    exit_risk = case @project.exit_scenario
                when "unit_sale" then 40
                when "block_sale" then 60
                when "refinance_exit" then 50
                else 50
                end
    factors << { name: "Strategie de sortie", value: exit_risk.round(1), detail: @project.exit_scenario&.titleize || "Non definie" }

    summary = per_asset_guarantee_summary
    if summary.present?
      guarantee_score = summary.sum { |g| g["protection_score"].to_f } / summary.size.to_f
      risk_level = risk_level_for_score(guarantee_score)
      guarantee_risk = (100 - guarantee_score).round(1)
      detail_str = "Score #{guarantee_score.round(0)}% - #{risk_level}"
    else
      guarantee_count = GUARANTEE_FIELDS.count { |f| @project.send(f) }
      guarantee_risk = (100 - (guarantee_count.to_f / GUARANTEE_FIELDS.size * 100)).round(1)
      detail_str = "#{guarantee_count}/#{GUARANTEE_FIELDS.size}"
    end
    factors << { name: "Couverture garanties", value: guarantee_risk, detail: detail_str }

    avg_risk = factors.sum { |f| f[:value] } / factors.size.to_f
    resilience = (100 - avg_risk).round(2)

    { factors: factors, average_risk: avg_risk.round(2), resilience_score: resilience }
  end

  def compute_recommendation(success_score)
    case success_score
    when 75..100 then "Favorable"
    when 55..74 then "Favorable avec reserves"
    when 35..54 then "Neutre - analyse approfondie recommandee"
    else "Defavorable"
    end
  end

  def cents_to_eur(cents)
    (cents.to_f / 100).round(2)
  end

  def snapshot
    @snapshot ||= @project.form_snapshot || {}
  end

  def snapshot_total_costs_cents
    assets = snapshot["assets"].is_a?(Array) ? snapshot["assets"] : []
    total_eur = assets.sum do |asset|
      costs = asset.is_a?(Hash) ? asset["costs"] : nil
      (costs.is_a?(Hash) ? costs["total"] : 0).to_f
    end
    (total_eur * 100).round
  end

  def snapshot_apport_percent
    projections = snapshot["projections"].is_a?(Hash) ? snapshot["projections"] : {}
    [[projections["contributionPct"].to_f, 0].max, 100].min
  end

  def snapshot_apport_cents(total_cents)
    ((total_cents * snapshot_apport_percent) / 100.0).round
  end

  def effective_total_amount_cents
    snap_total = snapshot_total_costs_cents
    return snap_total if snap_total.positive?

    persisted = @project.total_amount_cents.to_i
    persisted.positive? ? persisted : 1
  end

  def effective_equity_cents(total_cents)
    persisted = @project.equity_cents.to_i
    return persisted if persisted.positive?

    snapshot_apport_cents(total_cents)
  end

  def effective_bank_loan_cents(total_cents, equity_cents)
    persisted = @project.bank_loan_cents.to_i
    return persisted if persisted.positive?

    remaining = total_cents - equity_cents
    remaining.positive? ? remaining : 0
  end

  def per_asset_guarantee_summary
    return @per_asset_guarantee_summary if defined?(@per_asset_guarantee_summary)

    summary = []

    if @project.respond_to?(:guarantee_type_summary) && @project.guarantee_type_summary.present?
      summary = @project.guarantee_type_summary
    elsif @project.asset_guarantees.exists?
      summary = @project.asset_guarantees.order(:asset_index).map do |g|
        {
          "asset_label" => g.asset_label,
          "type" => g.guarantee_type,
          "rank" => g.rank,
          "ltv" => g.ltv.to_f,
          "protection_score" => g.protection_score.to_f,
          "risk_level" => g.risk_level
        }
      end
    elsif snapshot["assets"].is_a?(Array)
      summary = snapshot["assets"].map do |asset|
        g = asset.is_a?(Hash) ? asset["guarantee"] : nil
        next if g.blank? || g["type"].blank?

        {
          "asset_label" => asset["label"],
          "type" => g["type"],
          "rank" => g["rank"],
          "ltv" => g["ltv"].to_f,
          "protection_score" => g["protectionScore"].to_f,
          "risk_level" => g["riskLevel"].presence || risk_level_for_score(g["protectionScore"].to_f)
        }
      end.compact
    end

    @per_asset_guarantee_summary = summary
  end

  def risk_level_for_score(score)
    case score.to_f
    when 80..100 then "low"
    when 60...80 then "moderate"
    when 40...60 then "high"
    else "critical"
    end
  end
end
