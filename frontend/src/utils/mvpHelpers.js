/**
 * Shared helper functions for MVP Report form conversion.
 * Used by ProjectReportsTab and PorteurReportsPage.
 */

export function mvpApiToForm(data) {
  const r = data.attributes || data;
  const c = (v) => v ? (v / 100).toString() : '';
  const s = (v) => v != null ? v.toString() : '';
  return {
    operation_status: r.operation_status || 'acquisition_en_cours', expected_repayment_date: r.expected_repayment_date || '',
    summary: r.summary || '',
    purchase_price_previsionnel: c(r.purchase_price_previsionnel_cents), purchase_price_realise: c(r.purchase_price_realise_cents),
    works_previsionnel: c(r.works_previsionnel_cents), works_realise: c(r.works_realise_cents),
    total_cost_previsionnel: c(r.total_cost_previsionnel_cents), total_cost_realise: c(r.total_cost_realise_cents),
    target_sale_price_previsionnel: c(r.target_sale_price_previsionnel_cents), target_sale_price_realise: c(r.target_sale_price_realise_cents),
    best_offer_previsionnel: c(r.best_offer_previsionnel_cents), best_offer_realise: c(r.best_offer_realise_cents),
    works_progress_percent: s(r.works_progress_percent), budget_variance_percent: s(r.budget_variance_percent),
    sale_start_date: r.sale_start_date || '', visits_count: s(r.visits_count), offers_count: s(r.offers_count),
    listed_price: c(r.listed_price_cents),
    risk_identified: r.risk_identified || '', risk_impact: r.risk_impact || '', corrective_action: r.corrective_action || '',
    estimated_compromise_date: r.estimated_compromise_date || '', estimated_deed_date: r.estimated_deed_date || '',
    estimated_repayment_date: r.estimated_repayment_date || '', exit_confirmed: r.exit_confirmed || false,
  };
}

export function mvpFormToApi(f) {
  const toC = (v) => v ? Math.round(parseFloat(v) * 100) : null;
  const toN = (v) => v ? parseFloat(v) : null;
  const toI = (v) => v ? parseInt(v, 10) : null;
  return {
    operation_status: f.operation_status, expected_repayment_date: f.expected_repayment_date || null, summary: f.summary || null,
    purchase_price_previsionnel_cents: toC(f.purchase_price_previsionnel), purchase_price_realise_cents: toC(f.purchase_price_realise),
    works_previsionnel_cents: toC(f.works_previsionnel), works_realise_cents: toC(f.works_realise),
    total_cost_previsionnel_cents: toC(f.total_cost_previsionnel), total_cost_realise_cents: toC(f.total_cost_realise),
    target_sale_price_previsionnel_cents: toC(f.target_sale_price_previsionnel), target_sale_price_realise_cents: toC(f.target_sale_price_realise),
    best_offer_previsionnel_cents: toC(f.best_offer_previsionnel), best_offer_realise_cents: toC(f.best_offer_realise),
    works_progress_percent: toN(f.works_progress_percent), budget_variance_percent: toN(f.budget_variance_percent),
    sale_start_date: f.sale_start_date || null, visits_count: toI(f.visits_count), offers_count: toI(f.offers_count),
    listed_price_cents: toC(f.listed_price),
    risk_identified: f.risk_identified || null, risk_impact: f.risk_impact || null, corrective_action: f.corrective_action || null,
    estimated_compromise_date: f.estimated_compromise_date || null, estimated_deed_date: f.estimated_deed_date || null,
    estimated_repayment_date: f.estimated_repayment_date || null, exit_confirmed: f.exit_confirmed,
  };
}
