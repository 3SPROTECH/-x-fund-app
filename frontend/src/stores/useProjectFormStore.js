import { create } from 'zustand';

// ─── Step configuration ─────────────────────────────────────────────
export const MACRO_STEPS = [
  { label: 'Présentation', icon: 'FileText' },
  { label: 'Finances', icon: 'Calculator' },
  { label: 'Projections', icon: 'TrendingUp' },
  { label: 'Compléments', icon: 'MessageSquare' },
  { label: 'Signature', icon: 'PenTool' },
];

export const STEP_CONFIG = [
  // Macro 1 - Présentation
  { macro: 0, micro: 0, title: 'Fiche présentation du projet', desc: 'Informations générales, valorisation et stratégie.' },
  { macro: 0, micro: 1, title: 'Localisation du projet', desc: 'Adresse, environnement et atouts de l\'emplacement.' },
  { macro: 0, micro: 2, title: 'Le porteur de projet', desc: 'Identité, expérience et track record.' },
  { macro: 0, micro: 3, title: 'La structuration financière', desc: 'Montant, rentabilité et stratégie de commercialisation.' },
  // Macro 2 - Finances
  { macro: 1, micro: 0, title: 'Hub des adresses', desc: 'Gérez les actifs liés à ce projet.' },
  { macro: 1, micro: 1, title: 'Détails de l\'actif et calendrier', desc: 'Acquisition, lots et calendrier des travaux.' },
  { macro: 1, micro: 2, title: 'Plan de dépenses', desc: 'Coûts d\'acquisition, travaux, honoraires.' },
  { macro: 1, micro: 3, title: 'Plan de revente et revenus par lot', desc: 'Gestion des lots et projections de revenus.' },
  { macro: 1, micro: 4, title: 'Vérification et documents justificatifs', desc: 'Chargez les documents requis.' },
  // Macro 3 - Projections
  { macro: 2, micro: 0, title: 'Engagement du porteur', desc: 'Définissez votre apport et prouvez vos fonds.' },
  { macro: 2, micro: 1, title: 'Simulation de financement', desc: 'Paramètres et projection de la collecte.' },
  // Macro 4 - Compléments (demo)
  { macro: 3, micro: 0, title: 'Informations complémentaires', desc: 'Répondez aux questions de l\'analyste.' },
  // Macro 5 - Signature
  { macro: 4, micro: 0, title: 'Signature des contrats', desc: 'Téléchargement des documents et consentement final.' },
];

// ─── Initial data shapes ────────────────────────────────────────────
const INITIAL_PRESENTATION = {
  title: '',
  progressStatus: '',
  propertyType: '',
  operationType: '',
  pitch: '',
  valBefore: '',
  valAfter: '',
  expertName: '',
  expertDate: '',
  durationMonths: '',
  exploitationStrategy: '',
  marketSegment: '',
  projectedRevenue: '',
  revenuePeriod: '',
  additionalInfo: '',
};

const INITIAL_LOCATION = {
  address: '',
  postalCode: '',
  city: '',
  neighborhood: '',
  zoneTypology: '',
  transportAccess: [],
  nearbyAmenities: [],
  strategicAdvantages: '',
};

const INITIAL_PROJECT_OWNER = {
  structure: '',
  companyName: '',
  linkedinUrl: '',
  yearsExperience: '',
  coreExpertise: '',
  completedProjects: '',
  businessVolume: '',
  geoExperience: '',
  certifications: '',
  teamDescription: '',
  additionalInfo: '',
};

const INITIAL_FINANCIAL_STRUCTURE = {
  totalFunding: '',
  grossMargin: '',
  netYield: '',
  yieldJustification: '',
  commercializationStrategy: [],
  financialDossierStatus: [],
  additionalInfo: '',
};

const INITIAL_PROJECTIONS = {
  contributionPct: 20,
  durationMonths: 12,
  proofFileName: '',
};

// ─── Empty asset / lot / doc factories ──────────────────────────────
let assetIdCounter = 1;
let lotIdCounter = 1;

export function createEmptyLot() {
  return {
    id: lotIdCounter++,
    preCommercialized: 'non',
    rented: 'non',
    surface: '',
    prix: 0,
    prixM2: 0,
    promesseRef: '',
    bailRef: '',
  };
}

export function createEmptyAsset(label = '') {
  const id = assetIdCounter++;
  return {
    id,
    label: label || `Adresse ${id}`,
    completed: false,
    details: {
      isRefinancing: false,
      signatureDate: '',
      lotCount: '',
      worksNeeded: false,
      worksDuration: '',
    },
    costs: {
      items: [
        { id: Date.now(), category: 'acquisition', label: 'Prix d\'acquisition (Net vendeur)', amount: '', hasJustificatif: false },
        { id: Date.now() + 1, category: 'acquisition', label: 'Frais de notaire', amount: '', hasJustificatif: false },
        { id: Date.now() + 2, category: 'acquisition', label: 'Frais d\'agence', amount: '', hasJustificatif: false },
        { id: Date.now() + 3, category: 'expertise', label: 'Architecte', amount: '', hasJustificatif: false },
        { id: Date.now() + 4, category: 'expertise', label: 'Bureau d\'étude (Structure/Thermique)', amount: '', hasJustificatif: false },
        { id: Date.now() + 5, category: 'expertise', label: 'Géomètre / Expert', amount: '', hasJustificatif: false },
      ],
      total: 0,
    },
    lots: [createEmptyLot()],
    documents: [
      { type: 'expertise_report', label: 'Rapport d\'expertise / avis de valeur', required: true, status: 'empty', fileName: '', comment: '', showComment: false },
      { type: 'pua', label: 'PUA (Promesse Unilatérale d\'Achat)', required: true, status: 'empty', fileName: '', comment: '', showComment: false },
      { type: 'admin_permit', label: 'Permis administratif validé', required: true, status: 'empty', fileName: '', comment: '', showComment: false },
      { type: 'business_plan', label: 'Prévisions financières / Business Plan', required: true, status: 'empty', fileName: '', comment: '', showComment: false },
      { type: 'building_permit', label: 'Permis d\'aménager / construire', required: false, status: 'empty', fileName: '', comment: '', showComment: false },
    ],
    recettesTotal: 0,
  };
}

// ─── Validation helpers ─────────────────────────────────────────────
function validatePresentation(data) {
  const errors = {};
  if (!data.title || data.title.trim().length < 3) errors['presentation.title'] = 'Le nom du projet est requis (min. 3 caractères).';
  if (!data.propertyType) errors['presentation.propertyType'] = 'Sélectionnez un type de bien.';
  if (!data.operationType) errors['presentation.operationType'] = 'Sélectionnez un type d\'opération.';
  if (data.pitch && data.pitch.length > 150) errors['presentation.pitch'] = 'Le pitch ne doit pas dépasser 150 caractères.';
  if (data.valBefore && parseFloat(data.valBefore) < 0) errors['presentation.valBefore'] = 'Le montant doit être positif.';
  if (data.valAfter && parseFloat(data.valAfter) < 0) errors['presentation.valAfter'] = 'Le montant doit être positif.';
  return errors;
}

function validateLocation(data) {
  const errors = {};
  if (!data.address || !data.address.trim()) errors['location.address'] = 'L\'adresse est requise.';
  if (!data.postalCode || !/^\d{5}$/.test(data.postalCode)) errors['location.postalCode'] = 'Code postal invalide (5 chiffres).';
  if (!data.city || !data.city.trim()) errors['location.city'] = 'La ville est requise.';
  return errors;
}

function validateProjectOwner(data) {
  const errors = {};
  if (!data.companyName || !data.companyName.trim()) errors['projectOwner.companyName'] = 'Le nom est requis.';
  if (!data.structure) errors['projectOwner.structure'] = 'La structure est requise.';
  return errors;
}

function validateFinancialStructure(data) {
  const errors = {};
  if (!data.totalFunding || parseFloat(data.totalFunding) <= 0) errors['financialStructure.totalFunding'] = 'Le montant de financement doit être supérieur à 0.';
  if (data.grossMargin && (parseFloat(data.grossMargin) < 0 || parseFloat(data.grossMargin) > 100)) errors['financialStructure.grossMargin'] = 'La marge doit être entre 0 et 100%.';
  if (data.netYield && (parseFloat(data.netYield) < 0 || parseFloat(data.netYield) > 100)) errors['financialStructure.netYield'] = 'La rentabilité doit être entre 0 et 100%.';
  return errors;
}

function validateAssetDetails(details) {
  const errors = {};
  if (!details.lotCount || parseInt(details.lotCount) < 1) errors['assetDetails.lotCount'] = 'Au moins 1 lot est requis.';
  if (!details.isRefinancing && !details.signatureDate) errors['assetDetails.signatureDate'] = 'La date de signature est requise.';
  if (details.worksNeeded && !details.worksDuration) errors['assetDetails.worksDuration'] = 'La durée des travaux est requise.';
  return errors;
}

function validateExpensePlan(costs) {
  const errors = {};
  const acqItem = costs.items.find(i => i.category === 'acquisition' && i.label.includes('acquisition'));
  if (!acqItem || !acqItem.amount || parseFloat(acqItem.amount) <= 0) errors['expensePlan.acquisitionPrice'] = 'Le prix d\'acquisition est requis.';
  return errors;
}

function validateSignature(consentGiven) {
  const errors = {};
  if (!consentGiven) errors['signature.consent'] = 'Vous devez certifier l\'exactitude des informations.';
  return errors;
}

export const STEP_VALIDATORS = [
  (state) => validatePresentation(state.presentation),
  (state) => validateLocation(state.location),
  (state) => validateProjectOwner(state.projectOwner),
  (state) => validateFinancialStructure(state.financialStructure),
  () => ({}), // Hub - no validation, just need at least 1 asset
  (state) => {
    const asset = state.assets[state.selectedAssetIndex];
    return asset ? validateAssetDetails(asset.details) : {};
  },
  (state) => {
    const asset = state.assets[state.selectedAssetIndex];
    return asset ? validateExpensePlan(asset.costs) : {};
  },
  () => ({}), // Lots - validated via asset completion
  () => ({}), // Docs - validated via asset completion
  () => ({}), // Contribution - no blocking validation
  () => ({}), // Simulation - no blocking validation
  () => ({}), // Additional Info - no blocking validation (handled internally)
  (state) => validateSignature(state.consentGiven),
];

// ─── Store ──────────────────────────────────────────────────────────
const useProjectFormStore = create((set, get) => ({
  // Navigation
  globalStepIndex: 0,

  // Form data sections
  presentation: { ...INITIAL_PRESENTATION },
  location: { ...INITIAL_LOCATION },
  projectOwner: { ...INITIAL_PROJECT_OWNER },
  financialStructure: { ...INITIAL_FINANCIAL_STRUCTURE },

  // Multi-asset system
  assets: [createEmptyAsset()],
  selectedAssetIndex: null,

  // Projections
  projections: { ...INITIAL_PROJECTIONS },

  // Submission
  consentGiven: false,
  submitting: false,
  submitted: false,

  // Draft
  draftId: null,
  lastSavedAt: null,
  isDirty: false,

  // Flagged fields (errors + warnings)
  flaggedFields: {},

  // Step completion tracking
  completedSteps: new Set(),

  // Project info (for info_requested flow)
  loadedProjectId: null,
  projectStatus: null,
  projectAttributes: null,

  // ── Navigation ──────────────────────────────────────────────────
  setGlobalStep: (index) => set({ globalStepIndex: index, flaggedFields: {} }),

  goNext: () => {
    const { globalStepIndex } = get();
    const max = STEP_CONFIG.length - 1;
    if (globalStepIndex < max) {
      set({ globalStepIndex: globalStepIndex + 1, flaggedFields: {} });
    }
  },

  goPrev: () => {
    const { globalStepIndex } = get();
    if (globalStepIndex > 0) {
      set({ globalStepIndex: globalStepIndex - 1, flaggedFields: {} });
    }
  },

  jumpToMacroStep: (macroIdx) => {
    const stepIdx = STEP_CONFIG.findIndex(s => s.macro === macroIdx);
    if (stepIdx >= 0) set({ globalStepIndex: stepIdx, flaggedFields: {} });
  },

  // ── Validation ──────────────────────────────────────────────────
  validateCurrentStep: () => {
    const state = get();
    const validator = STEP_VALIDATORS[state.globalStepIndex];
    if (!validator) return true;
    const errors = validator(state);
    if (Object.keys(errors).length > 0) {
      set({ flaggedFields: errors });
      return false;
    }
    set({ flaggedFields: {} });
    return true;
  },

  // ── Section updaters ────────────────────────────────────────────
  updatePresentation: (field, value) =>
    set((s) => ({
      presentation: { ...s.presentation, [field]: value },
      flaggedFields: { ...s.flaggedFields, [`presentation.${field}`]: undefined },
      isDirty: true,
    })),

  updateLocation: (field, value) =>
    set((s) => ({
      location: { ...s.location, [field]: value },
      flaggedFields: { ...s.flaggedFields, [`location.${field}`]: undefined },
      isDirty: true,
    })),

  updateProjectOwner: (field, value) =>
    set((s) => ({
      projectOwner: { ...s.projectOwner, [field]: value },
      flaggedFields: { ...s.flaggedFields, [`projectOwner.${field}`]: undefined },
      isDirty: true,
    })),

  updateFinancialStructure: (field, value) =>
    set((s) => ({
      financialStructure: { ...s.financialStructure, [field]: value },
      flaggedFields: { ...s.flaggedFields, [`financialStructure.${field}`]: undefined },
      isDirty: true,
    })),

  updateProjections: (field, value) =>
    set((s) => ({
      projections: { ...s.projections, [field]: value },
      isDirty: true,
    })),

  // ── Asset management ────────────────────────────────────────────
  addAsset: () =>
    set((s) => ({
      assets: [...s.assets, createEmptyAsset()],
      isDirty: true,
    })),

  removeAsset: (index) =>
    set((s) => {
      if (s.assets.length <= 1) return s;
      const newAssets = s.assets.filter((_, i) => i !== index);
      return { assets: newAssets, selectedAssetIndex: null, isDirty: true };
    }),

  openAsset: (index) =>
    set({ selectedAssetIndex: index, globalStepIndex: 5 }),

  returnToHub: () =>
    set({ selectedAssetIndex: null, globalStepIndex: 4 }),

  updateAssetLabel: (index, label) =>
    set((s) => {
      const assets = [...s.assets];
      assets[index] = { ...assets[index], label };
      return { assets, isDirty: true };
    }),

  updateAssetDetails: (field, value) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      asset.details = { ...asset.details, [field]: value };

      // Sync lots array when lotCount changes
      if (field === 'lotCount') {
        const target = Math.max(1, parseInt(value) || 1);
        const current = asset.lots.length;
        if (target > current) {
          asset.lots = [...asset.lots];
          for (let i = current; i < target; i++) {
            asset.lots.push(createEmptyLot());
          }
        } else if (target < current) {
          asset.lots = asset.lots.slice(0, target);
        }
        asset.recettesTotal = asset.lots.reduce((sum, l) => sum + (l.prix || 0), 0);
      }

      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  // ── Cost management ─────────────────────────────────────────────
  updateCostItem: (itemId, field, value) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      const items = asset.costs.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      );
      const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      asset.costs = { items, total };
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  addCostItem: (category, label = '') =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      const newItem = { id: Date.now(), category, label: label || '', amount: '', hasJustificatif: false };
      asset.costs = { ...asset.costs, items: [...asset.costs.items, newItem] };
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  removeCostItem: (itemId) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      const items = asset.costs.items.filter(item => item.id !== itemId);
      const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      asset.costs = { items, total };
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  // ── Lot management ──────────────────────────────────────────────
  addLot: () =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      asset.lots = [...asset.lots, createEmptyLot()];
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  removeLot: (lotId) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      if (asset.lots.length <= 1) {
        asset.lots = [createEmptyLot()];
      } else {
        asset.lots = asset.lots.filter(l => l.id !== lotId);
      }
      const recettesTotal = asset.lots.reduce((sum, l) => sum + (l.prix || 0), 0);
      asset.recettesTotal = recettesTotal;
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  updateLot: (lotId, field, value) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      const PRICE_PER_M2 = 2130;
      asset.lots = asset.lots.map(lot => {
        if (lot.id !== lotId) return lot;
        const updated = { ...lot, [field]: value };
        // Recalculate price when surface changes
        if (field === 'surface' || field === 'preCommercialized' || field === 'rented') {
          if (updated.preCommercialized === 'oui' || updated.rented === 'oui') {
            updated.prix = 0;
            updated.prixM2 = 0;
          } else {
            const surf = parseFloat(updated.surface) || 0;
            updated.prix = surf * PRICE_PER_M2;
            updated.prixM2 = surf > 0 ? PRICE_PER_M2 : 0;
          }
        }
        return updated;
      });
      asset.recettesTotal = asset.lots.reduce((sum, l) => sum + (l.prix || 0), 0);
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  // ── Document management ─────────────────────────────────────────
  updateDocStatus: (docType, field, value) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      asset.documents = asset.documents.map(doc => {
        if (doc.type !== docType) return doc;
        const updated = { ...doc, [field]: value };
        // Compute status
        if (updated.fileName) {
          updated.status = 'uploaded';
        } else if (updated.comment && updated.comment.trim().length > 0) {
          updated.status = 'commented';
        } else {
          updated.status = 'empty';
        }
        return updated;
      });
      // Check asset completion
      const requiredSatisfied = asset.documents
        .filter(d => d.required)
        .every(d => d.status !== 'empty');
      asset.completed = requiredSatisfied && asset.lots.length > 0;
      assets[s.selectedAssetIndex] = asset;
      return { assets, isDirty: true };
    }),

  toggleDocComment: (docType) =>
    set((s) => {
      if (s.selectedAssetIndex === null) return s;
      const assets = [...s.assets];
      const asset = { ...assets[s.selectedAssetIndex] };
      asset.documents = asset.documents.map(doc =>
        doc.type === docType ? { ...doc, showComment: !doc.showComment } : doc
      );
      assets[s.selectedAssetIndex] = asset;
      return { assets };
    }),

  // ── Consent ─────────────────────────────────────────────────────
  setConsentGiven: (value) => set({ consentGiven: value, isDirty: true }),

  // ── Submission ──────────────────────────────────────────────────
  setSubmitting: (value) => set({ submitting: value }),
  setSubmitted: (value) => set({ submitted: value }),

  // ── Draft ───────────────────────────────────────────────────────
  setDraftId: (id) => set({ draftId: id }),
  setLastSavedAt: (date) => set({ lastSavedAt: date, isDirty: false }),
  setProjectStatus: (status) => set({ projectStatus: status }),
  setLoadedProjectId: (id) => set({ loadedProjectId: id }),
  setProjectAttributes: (attrs) => set({ projectAttributes: attrs }),

  getSerializableState: () => {
    const s = get();
    return {
      globalStepIndex: s.globalStepIndex,
      selectedAssetIndex: s.selectedAssetIndex,
      presentation: s.presentation,
      location: s.location,
      projectOwner: s.projectOwner,
      financialStructure: s.financialStructure,
      assets: s.assets,
      projections: s.projections,
      consentGiven: s.consentGiven,
    };
  },

  loadFromDraft: (draftData, draftId) => {
    // Reset counters based on loaded data
    if (draftData.assets) {
      const maxAssetId = Math.max(...draftData.assets.map(a => a.id), 0);
      assetIdCounter = maxAssetId + 1;
      const allLots = draftData.assets.flatMap(a => a.lots || []);
      const maxLotId = Math.max(...allLots.map(l => l.id), 0);
      lotIdCounter = maxLotId + 1;
    }
    set({
      ...draftData,
      draftId,
      isDirty: false,
      flaggedFields: {},
      submitting: false,
      submitted: false,
    });
  },

  // ── Computed helpers ────────────────────────────────────────────
  getCurrentStepConfig: () => STEP_CONFIG[get().globalStepIndex] || STEP_CONFIG[0],
  getCurrentMacroStep: () => STEP_CONFIG[get().globalStepIndex]?.macro ?? 0,

  getAggregatedCosts: () => {
    return get().assets.reduce((sum, asset) => sum + (asset.costs.total || 0), 0);
  },

  getAggregatedRecettes: () => {
    return get().assets.reduce((sum, asset) => sum + (asset.recettesTotal || 0), 0);
  },

  getProjectionTotals: () => {
    const s = get();
    const totalCosts = s.assets.reduce((sum, asset) => sum + (asset.costs.total || 0), 0);
    const pct = Math.max(0, Math.min(100, s.projections.contributionPct || 0));
    const apport = totalCosts * (pct / 100);
    const base = totalCosts - apport;
    const duration = Math.max(1, s.projections.durationMonths || 12);
    const reserveRate = (0.11 / 12) * duration;
    const denominator = 1 - 0.06 - reserveRate;
    const totalCollecte = denominator > 0 ? base / denominator : 0;
    const platformFee = totalCollecte * 0.06;
    const interestReserve = totalCollecte * reserveRate;
    const montantReverse = totalCollecte - platformFee - interestReserve;
    const resaleAmount = s.assets.reduce((sum, a) => sum + (a.recettesTotal || 0), 0);
    const warningRatio = base > 0 ? resaleAmount / base : 0;

    return { totalCosts, contributionPct: pct, apport, duration, totalCollecte, platformFee, interestReserve, montantReverse, resaleAmount, warningRatio };
  },

  allAssetsComplete: () => get().assets.every(a => a.completed),

  isStepLocked: (stepIndex) => {
    const s = get();
    const config = STEP_CONFIG[stepIndex];
    if (!config) return true;

    // Macro 1 steps are always unlocked
    if (config.macro === 0) return false;

    // Macro 2: requires presentation title + type filled
    if (config.macro === 1) {
      if (!s.presentation.title || !s.presentation.propertyType) return true;
      // Sub-flow steps (5-8) require an asset to be selected
      if (stepIndex >= 5 && stepIndex <= 8 && s.selectedAssetIndex === null) return true;
      return false;
    }

    // Macro 3: all assets must be complete
    if (config.macro === 2) {
      return !s.assets.every(a => a.completed);
    }

    // Macro 4 (Compléments): unlocked only when project status is info_requested
    if (config.macro === 3) {
      return s.projectStatus !== 'info_requested' && s.projectStatus !== 'info_resubmitted';
    }

    // Macro 5 (Signature): locked unless signing status
    if (config.macro === 4) {
      return s.projectStatus !== 'signing';
    }

    return false;
  },

  // ── Reset ───────────────────────────────────────────────────────
  reset: () => {
    assetIdCounter = 1;
    lotIdCounter = 1;
    set({
      globalStepIndex: 0,
      presentation: { ...INITIAL_PRESENTATION },
      location: { ...INITIAL_LOCATION },
      projectOwner: { ...INITIAL_PROJECT_OWNER },
      financialStructure: { ...INITIAL_FINANCIAL_STRUCTURE },
      assets: [createEmptyAsset()],
      selectedAssetIndex: null,
      projections: { ...INITIAL_PROJECTIONS },
      consentGiven: false,
      submitting: false,
      submitted: false,
      draftId: null,
      lastSavedAt: null,
      isDirty: false,
      flaggedFields: {},
      completedSteps: new Set(),
      loadedProjectId: null,
      projectStatus: null,
      projectAttributes: null,
    });
  },
}));

export default useProjectFormStore;
