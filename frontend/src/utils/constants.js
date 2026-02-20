/**
 * Shared constants used across the application.
 * Organized by entity type.
 */

// ─── Roles ───
export const ROLE_LABELS = {
  investisseur: 'Investisseur',
  porteur_de_projet: 'Porteur de projet',
  administrateur: 'Administrateur',
  analyste: 'Analyste',
};

// ─── Analyst opinion statuses ───
export const ANALYST_OPINION_LABELS = {
  opinion_pending: 'En attente',
  opinion_approved: 'Validé',
  opinion_info_requested: 'Infos demandées',
  opinion_rejected: 'Refusé',
};
export const ANALYST_OPINION_BADGES = {
  opinion_pending: 'badge-warning',
  opinion_approved: 'badge-success',
  opinion_info_requested: 'badge-info',
  opinion_rejected: 'badge-danger',
};

// ─── Project statuses ───
export const PROJECT_STATUS_LABELS = {
  draft: 'Brouillon',
  pending_analysis: 'En Analyse',
  info_requested: 'Compléments requis',
  info_resubmitted: 'Compléments soumis',
  rejected: 'Refusé',
  analyst_approved: 'Pré-approuvé',
  approved: 'Approuvé',
  legal_structuring: 'Montage Juridique',
  signing: 'En Signature',
  funding_active: 'En Collecte',
  funded: 'Financé',
  under_construction: 'En Travaux',
  operating: 'En Exploitation',
  repaid: 'Remboursé',
};
export const PROJECT_STATUS_BADGES = {
  draft: 'badge-warning',
  pending_analysis: 'badge-info',
  info_requested: 'badge-warning',
  info_resubmitted: 'badge-info',
  rejected: 'badge-danger',
  analyst_approved: 'badge-success',
  approved: 'badge-success',
  legal_structuring: 'badge-info',
  signing: 'badge-info',
  funding_active: 'badge-success',
  funded: 'badge-success',
  under_construction: 'badge-warning',
  operating: 'badge-info',
  repaid: 'badge-success',
};

// ─── Project detail statuses (legacy labels used in ProjectDetailPage) ───
export const PROJECT_DETAIL_STATUS_LABELS = {
  brouillon: 'Brouillon',
  ouvert: 'Ouvert',
  finance: 'Financé',
  cloture: 'Clôturé',
  annule: 'Annulé',
};
export const PROJECT_DETAIL_STATUS_BADGES = {
  ouvert: 'badge-success',
  finance: 'badge-info',
  cloture: '',
  annule: 'badge-danger',
  brouillon: 'badge-warning',
};

// ─── Investment statuses ───
export const INVESTMENT_STATUS_LABELS = {
  en_cours: 'En cours',
  confirme: 'Confirmé',
  cloture: 'Clôturé',
  liquide: 'Liquidé',
  annule: 'Annulé',
};
export const INVESTMENT_STATUS_BADGES = {
  en_cours: 'badge-warning',
  confirme: 'badge-success',
  cloture: 'badge-info',
  liquide: '',
  annule: 'badge-danger',
};

// ─── Dividend statuses ───
export const DIVIDEND_STATUS_LABELS = {
  planifie: 'Planifié',
  distribue: 'Distribué',
  annule: 'Annulé',
};
export const DIVIDEND_STATUS_BADGES = {
  planifie: 'badge-warning',
  distribue: 'badge-success',
  annule: 'badge-danger',
};

// ─── Dividend payment statuses ───
export const PAYMENT_STATUS_LABELS = {
  en_attente: 'En attente',
  verse: 'Versé',
  echoue: 'Échoué',
};

// ─── Financial statement types ───
export const STATEMENT_TYPE_LABELS = {
  trimestriel: 'Trimestriel',
  semestriel: 'Semestriel',
  annuel: 'Annuel',
};

// ─── Property statuses ───
export const PROPERTY_STATUS_LABELS = {
  brouillon: 'Brouillon',
  en_financement: 'En financement',
  finance: 'Financé',
  en_gestion: 'En gestion',
  vendu: 'Vendu',
  annule: 'Annulé',
};
export const PROPERTY_STATUS_BADGES = {
  brouillon: 'badge-warning',
  en_financement: 'badge-info',
  finance: 'badge-success',
  en_gestion: 'badge-success',
  vendu: 'badge-info',
  annule: 'badge-danger',
};

// ─── Property types ───
export const PROPERTY_TYPE_LABELS = {
  appartement: 'Appartement',
  maison: 'Maison',
  immeuble: 'Immeuble',
  commercial: 'Commercial',
  terrain: 'Terrain',
};

// ─── Transaction types ───
export const TX_TYPE_LABELS = {
  depot: 'Dépôt',
  retrait: 'Retrait',
  investissement: 'Investissement',
  dividende: 'Dividende',
  remboursement: 'Remboursement',
  frais: 'Frais',
};
export const TX_TYPE_BADGES = {
  depot: 'badge-success',
  retrait: 'badge-danger',
  investissement: 'badge-info',
  dividende: 'badge-success',
  remboursement: 'badge-warning',
  frais: 'badge-warning',
};
export const TX_CREDIT_TYPES = ['depot', 'dividende', 'remboursement'];

// ─── Transaction statuses ───
export const TRANSACTION_STATUS_LABELS = {
  en_attente: 'En attente',
  complete: 'Complété',
  echoue: 'Échoué',
  annule: 'Annulé',
};
export const TRANSACTION_STATUS_BADGES = {
  en_attente: 'badge-warning',
  complete: 'badge-success',
  echoue: 'badge-danger',
  annule: 'badge-danger',
};

// ─── Fee types (admin wallet) ───
export const FEE_TYPE_LABELS = {
  investment_commission: 'Commission investissement',
  dividend_commission: 'Commission dividendes',
};

// ─── KYC statuses ───
export const KYC_STATUS_LABELS = {
  pending: 'En attente',
  submitted: 'Soumis',
  verified: 'Vérifié',
  rejected: 'Rejeté',
};
export const KYC_STATUS_BADGES = {
  pending: 'kyc-pending',
  submitted: 'kyc-submitted',
  verified: 'kyc-verified',
  rejected: 'kyc-rejected',
};

// ─── Audit log actions ───
export const ACTION_LABELS = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
};
export const ACTION_BADGES = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-danger',
};

// ─── MVP / Operation types ───
export const OPERATION_TYPES = {
  promotion_immobiliere: 'Promotion immobiliere (construction neuve)',
  marchand_de_biens: 'Marchand de biens (achat / revente)',
  rehabilitation_lourde: 'Rehabilitation lourde',
  division_fonciere: 'Division fonciere',
  immobilier_locatif: 'Immobilier locatif',
  transformation_usage: "Transformation d'usage",
};
export const OPERATION_TYPE_ICONS = {
  promotion_immobiliere: '\u{1F3D7}',
  marchand_de_biens: '\u{1F3E1}',
  rehabilitation_lourde: '\u{1F6E0}',
  division_fonciere: '\u{1F3D8}',
  immobilier_locatif: '\u{1F3E2}',
  transformation_usage: '\u{1F504}',
};
export const OPERATION_STATUSES = {
  acquisition_en_cours: 'Acquisition en cours',
  acte_signe: 'Acte signé',
  en_renovation: 'En renovation',
  en_commercialisation: 'En commercialisation',
  sous_offre: 'Sous offre',
  sous_compromis: 'Sous compromis',
  vendu: 'Vendu',
};
export const OPERATION_STATUS_LABELS_BY_TYPE = {
  promotion_immobiliere: {
    acquisition_en_cours: 'Acquisition terrain', acte_signe: 'Acte signé', en_renovation: 'Construction en cours',
    en_commercialisation: 'Commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Livré / Vendu',
  },
  marchand_de_biens: null,
  rehabilitation_lourde: {
    acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'Travaux en cours',
    en_commercialisation: 'En commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Vendu',
  },
  division_fonciere: {
    acquisition_en_cours: 'Étude / Acquisition', acte_signe: 'Acte signé', en_renovation: 'Division en cours',
    en_commercialisation: 'Commercialisation lots', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Vendu',
  },
  immobilier_locatif: {
    acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'Travaux / Mise aux normes',
    en_commercialisation: 'Mise en location', sous_offre: 'Locataire pressenti', sous_compromis: 'Bail signé', vendu: 'En gestion',
  },
  transformation_usage: {
    acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'Travaux de transformation',
    en_commercialisation: 'Commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Réalisé',
  },
};
export const getOperationStatusLabel = (operationType, status) =>
  (OPERATION_STATUS_LABELS_BY_TYPE[operationType]?.[status]) || OPERATION_STATUSES[status] || status;

export const MVP_STATUS_BADGES = {
  acquisition_en_cours: 'badge-warning', acte_signe: 'badge-info', en_renovation: 'badge-warning',
  en_commercialisation: 'badge-info', sous_offre: 'badge-info', sous_compromis: 'badge-success', vendu: 'badge-success',
};
export const REVIEW_STATUS_LABELS = {
  brouillon: 'Brouillon', soumis: 'Soumis', valide: 'Valide', rejete: 'Rejete',
};
export const REVIEW_STATUS_BADGES = {
  brouillon: 'badge-warning', soumis: 'badge-info', valide: 'badge-success', rejete: 'badge-danger',
};

// ─── Dividend frequency ───
export const FREQ_MONTHS = { mensuel: 1, trimestriel: 3, semestriel: 6, annuel: 12 };
export const FREQ_LABELS = { mensuel: 'Mensuel', trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel' };

// ─── Empty form templates ───
export const EMPTY_PROPERTY = {
  title: '', description: '', property_type: 'appartement', address_line1: '', address_line2: '',
  city: '', postal_code: '', country: 'France', surface_area_sqm: '', acquisition_price_cents: '',
  estimated_value_cents: '', number_of_lots: '', lots: [],
};

export const EMPTY_MVP_FORM = {
  operation_status: 'acquisition_en_cours', expected_repayment_date: '', summary: '',
  purchase_price_previsionnel: '', purchase_price_realise: '', works_previsionnel: '', works_realise: '',
  total_cost_previsionnel: '', total_cost_realise: '', target_sale_price_previsionnel: '', target_sale_price_realise: '',
  best_offer_previsionnel: '', best_offer_realise: '', works_progress_percent: '', budget_variance_percent: '',
  sale_start_date: '', visits_count: '', offers_count: '', listed_price: '',
  risk_identified: '', risk_impact: '', corrective_action: '',
  estimated_compromise_date: '', estimated_deed_date: '', estimated_repayment_date: '', exit_confirmed: false,
};
