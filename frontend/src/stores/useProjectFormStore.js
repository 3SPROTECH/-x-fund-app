import { create } from 'zustand';

const INITIAL_OPERATOR = {
  company_name: '',
  siret: '',
  company_creation_date: '',
  legal_form: '',
  legal_representative_name: '',
  headquarters_address: '',
  completed_operations_count: '',
  managed_volume_cents: '',
  default_rate_percent: '',
};

const INITIAL_PROJECT = {
  title: '',
  description: '',
  address_line1: '',
  city: '',
  postal_code: '',
  surface_area_sqm: '',
  property_type: '',
  operation_type: 'promotion_immobiliere',
  floor_area_sqm: '',
  number_of_lots: '',
  is_land_division: false,
  dpe_current: '',
  dpe_target: '',
  permit_status: 'obtenu_purge',
  permit_date: '',
  permit_number: '',
};

const INITIAL_FINANCE = {
  acquisition_price_cents: '',
  notary_fees_cents: '',
  works_budget_cents: '',
  financial_fees_cents: '',
  total_amount_cents: '',
  share_price_cents: '',
  total_shares: '',
  min_investment_cents: '',
  max_investment_cents: '',
  equity_cents: '',
  bank_loan_cents: '',
  projected_revenue_cents: '',
  projected_margin_cents: '',
  bank_name: '',
  bank_loan_status: '',
  gross_yield_percent: '',
  duration_months: '',
  payment_frequency: '',
};

const INITIAL_GUARANTEES = {
  has_first_rank_mortgage: false,
  has_share_pledge: false,
  has_fiducie: false,
  has_interest_escrow: false,
  has_works_escrow: false,
  has_personal_guarantee: false,
  has_gfa: false,
  has_open_banking: false,
  risk_description: '',
};

const INITIAL_COMMERCIALIZATION = {
  pre_commercialization_percent: 0,
  exit_price_per_sqm_cents: '',
  exit_scenario: '',
  planned_acquisition_date: '',
  planned_delivery_date: '',
  planned_repayment_date: '',
};

export const STEP_LABELS = [
  "L'Opérateur",
  'Le Projet',
  'Financement',
  'Garanties',
  'Commercialisation',
];

const useProjectFormStore = create((set, get) => ({
  currentStep: 1,
  properties: [],
  selectedPropertyId: null,
  propertyIds: [],
  operator: { ...INITIAL_OPERATOR },
  project: { ...INITIAL_PROJECT },
  finance: { ...INITIAL_FINANCE },
  guarantees: { ...INITIAL_GUARANTEES },
  commercialization: { ...INITIAL_COMMERCIALIZATION },
  files: {
    kbis: null,
    presentation_deck: null,
    photos: [],
    price_grid: null,
    block_buyer_loi: null,
    sale_agreement: null,
    projected_balance_sheet: null,
  },
  errors: {},

  // Navigation
  setStep: (step) => set({ currentStep: step, errors: {} }),
  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 5) set({ currentStep: currentStep + 1, errors: {} });
  },
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) set({ currentStep: currentStep - 1, errors: {} });
  },

  // Field updates per section
  updateOperator: (field, value) =>
    set((s) => ({ operator: { ...s.operator, [field]: value }, errors: { ...s.errors, [field]: undefined } })),
  updateProject: (field, value) =>
    set((s) => ({ project: { ...s.project, [field]: value }, errors: { ...s.errors, [field]: undefined } })),
  updateFinance: (field, value) =>
    set((s) => ({ finance: { ...s.finance, [field]: value }, errors: { ...s.errors, [field]: undefined } })),
  updateGuarantees: (field, value) =>
    set((s) => ({ guarantees: { ...s.guarantees, [field]: value }, errors: { ...s.errors, [field]: undefined } })),
  updateCommercialization: (field, value) =>
    set((s) => ({ commercialization: { ...s.commercialization, [field]: value }, errors: { ...s.errors, [field]: undefined } })),

  // File management
  setFile: (key, file) =>
    set((s) => ({ files: { ...s.files, [key]: file } })),
  addPhotos: (newPhotos) =>
    set((s) => ({ files: { ...s.files, photos: [...s.files.photos, ...newPhotos] } })),
  removePhoto: (index) =>
    set((s) => ({ files: { ...s.files, photos: s.files.photos.filter((_, i) => i !== index) } })),

  // Property management
  setProperties: (list) => set({ properties: list }),
  setPropertyIds: (ids) => set({ propertyIds: ids }),

  selectProperty: (id) => {
    const { properties } = get();
    const prop = properties.find((p) => String(p.id) === String(id));
    if (!prop) return;
    const attrs = prop.attributes || prop;
    set((s) => ({
      selectedPropertyId: String(id),
      propertyIds: [String(id)],
      project: {
        ...s.project,
        title: attrs.title || '',
        description: attrs.description || '',
        address_line1: attrs.address_line1 || '',
        city: attrs.city || '',
        postal_code: attrs.postal_code || '',
        surface_area_sqm: attrs.surface_area_sqm != null ? String(attrs.surface_area_sqm) : '',
        property_type: attrs.property_type || '',
        number_of_lots: attrs.number_of_lots != null ? String(attrs.number_of_lots) : '',
      },
      finance: {
        ...s.finance,
        acquisition_price_cents: attrs.acquisition_price_cents
          ? String(attrs.acquisition_price_cents / 100)
          : '',
      },
      errors: { ...s.errors, selectedPropertyId: undefined },
    }));
  },

  clearProperty: () =>
    set((s) => ({
      selectedPropertyId: null,
      propertyIds: [],
      project: { ...INITIAL_PROJECT },
      finance: { ...s.finance, acquisition_price_cents: '' },
      errors: { ...s.errors, selectedPropertyId: undefined },
    })),

  getSelectedProperty: () => {
    const { properties, selectedPropertyId } = get();
    if (!selectedPropertyId) return null;
    return properties.find((p) => String(p.id) === String(selectedPropertyId)) || null;
  },

  // Errors
  setErrors: (errors) => set({ errors }),
  clearError: (field) => set((s) => ({ errors: { ...s.errors, [field]: undefined } })),

  // Computed: total cost
  getTotalCost: () => {
    const { finance } = get();
    const vals = [
      finance.acquisition_price_cents,
      finance.notary_fees_cents,
      finance.works_budget_cents,
      finance.financial_fees_cents,
    ];
    return vals.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  },

  // Reset
  reset: () =>
    set({
      currentStep: 1,
      properties: [],
      selectedPropertyId: null,
      propertyIds: [],
      operator: { ...INITIAL_OPERATOR },
      project: { ...INITIAL_PROJECT },
      finance: { ...INITIAL_FINANCE },
      guarantees: { ...INITIAL_GUARANTEES },
      commercialization: { ...INITIAL_COMMERCIALIZATION },
      files: { kbis: null, presentation_deck: null, photos: [], price_grid: null, block_buyer_loi: null, sale_agreement: null, projected_balance_sheet: null },
      errors: {},
    }),
}));

export default useProjectFormStore;
