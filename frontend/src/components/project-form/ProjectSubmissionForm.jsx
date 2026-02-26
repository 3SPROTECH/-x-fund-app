import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Calculator, TrendingUp, PenTool, CheckCircle, ChevronLeft, MessageSquare, Info, Send, Download, ExternalLink, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

import useProjectFormStore, { MACRO_STEPS, STEP_CONFIG, createEmptyLot } from '../../stores/useProjectFormStore';
import { projectDraftsApi } from '../../api/projectDrafts';
import { companiesApi } from '../../api/companies';
import { investmentProjectsApi, platformConfigApi } from '../../api/investments';
import { projectPhotosApi, projectDocumentsApi } from '../../api/images';
import { generatePdfReport } from '../../utils/reportGenerator';

import StepPresentation from './steps/StepPresentation';
import StepPhotos from './steps/StepPhotos';
import StepLocation from './steps/StepLocation';
import StepProjectOwner from './steps/StepProjectOwner';
import StepFinancialStructure from './steps/StepFinancialStructure';
import AssetHub from './steps/AssetHub';
import AssetDetails from './steps/AssetDetails';
import ExpensePlan from './steps/ExpensePlan';
import SalesPlanLots from './steps/SalesPlanLots';
import GuaranteeStep from './steps/GuaranteeStep';
import VerificationDocs from './steps/VerificationDocs';
import ContributionStep from './steps/ContributionStep';
import FinancingSimulation from './steps/FinancingSimulation';
import AdditionalInfoStep from './steps/AdditionalInfoStep';
import SignatureStep from './steps/SignatureStep';

import './project-submission-form.css';

const MACRO_ICONS = [FileText, Calculator, TrendingUp, MessageSquare, PenTool];

const STEP_COMPONENTS = [
  StepPresentation,        // 0  - Macro 0
  StepPhotos,              // 1  - Macro 0 (photos)
  StepLocation,            // 2
  StepProjectOwner,        // 3
  StepFinancialStructure,  // 4
  AssetHub,                // 5  - Macro 1 (hub)
  AssetDetails,            // 6  - Asset sub-flow step 1
  ExpensePlan,             // 7  - Asset sub-flow step 2
  SalesPlanLots,           // 8  - Asset sub-flow step 3
  GuaranteeStep,           // 9  - Asset sub-flow step 4
  VerificationDocs,        // 10 - Asset sub-flow step 5
  ContributionStep,        // 11 - Macro 2
  FinancingSimulation,     // 12
  AdditionalInfoStep,      // 13 - Macro 3 (Compléments)
  SignatureStep,           // 14 - Macro 4 (locked until signing)
];

const HUB_INDEX = 5;
const SUB_FLOW_START = 6;
const SUB_FLOW_END = 10;
const PROJECTION_START = 11;
const SUBMIT_STEP = 12; // FinancingSimulation — last editable step
const ADDITIONAL_INFO_STEP = 13; // Compléments step
const SIGNATURE_STEP = 14; // SignatureStep

const SUB_FLOW_LABELS = [
  'Détails de l\'actif',
  'Plan de dépenses',
  'Revenus par lot',
  'Garanties',
  'Vérification docs',
];

export default function ProjectSubmissionForm({ initialDraftId = null, initialProjectId = null }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const additionalInfoSubmitRef = useRef(null);

  const store = useProjectFormStore();
  const {
    globalStepIndex, setGlobalStep, goNext, goPrev, jumpToMacroStep,
    validateCurrentStep, isStepLocked, allAssetsComplete,
    selectedAssetIndex, returnToHub,
    submitting, submitted, setSubmitting, setSubmitted,
    consentGiven,
    draftId, isDirty, setDraftId, setLastSavedAt, getSerializableState, loadFromDraft,
    reset,
    projectStatus, projectAttributes, setProjectStatus, setLoadedProjectId, setProjectAttributes,
  } = store;

  const [downloadingReport, setDownloadingReport] = useState(false);
  const [defaultSharePriceCents, setDefaultSharePriceCents] = useState(10000);

  useEffect(() => {
    platformConfigApi.get().then((res) => {
      const price = res.data?.data?.default_share_price_cents;
      if (price && price > 0) setDefaultSharePriceCents(price);
    }).catch(() => { });
  }, []);

  const stepConfig = STEP_CONFIG[globalStepIndex] || STEP_CONFIG[0];
  const currentMacro = stepConfig.macro;
  const isOnHub = globalStepIndex === HUB_INDEX;
  const isInSubFlow = globalStepIndex >= SUB_FLOW_START && globalStepIndex <= SUB_FLOW_END;
  const isInfoFlow = projectStatus === 'info_requested' || projectStatus === 'info_resubmitted';

  // ── Micro tabs computation ──
  let microSteps = [];
  let microIndex = -1;

  if (isOnHub) {
    // No micro bar on hub
  } else if (isInSubFlow) {
    // Sub-flow has its own 4-step micro bar
    microSteps = SUB_FLOW_LABELS;
    microIndex = globalStepIndex - SUB_FLOW_START;
  } else {
    // Normal macro micro tabs (only for macros 0, 2, 3)
    const macroMicroSteps = STEP_CONFIG
      .map((s, i) => ({ ...s, globalIdx: i }))
      .filter((s) => s.macro === currentMacro && s.globalIdx !== HUB_INDEX);
    if (macroMicroSteps.length > 1) {
      microSteps = macroMicroSteps;
      microIndex = macroMicroSteps.findIndex((s) => s.globalIdx === globalStepIndex);
    }
  }
  const showMicroBar = microSteps.length > 0 && microIndex >= 0;

  // ── Draft auto-save ──
  const saveDraft = useCallback(async () => {
    if (submitted || initialProjectId) return;
    try {
      const data = { form_data: getSerializableState(), current_step: globalStepIndex };
      if (draftId) {
        await projectDraftsApi.update(draftId, data);
      } else {
        const res = await projectDraftsApi.create(data);
        setDraftId(res.data.data.id);
      }
      setLastSavedAt(new Date().toISOString());
    } catch {
      // Silent fail for auto-save
    }
  }, [draftId, globalStepIndex, submitted]);

  useEffect(() => {
    if (isDirty && !submitted) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(saveDraft, 5000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [isDirty, globalStepIndex, saveDraft, submitted]);

  useEffect(() => {
    if (initialProjectId) {
      // Load from a submitted project's form snapshot (read-only mode)
      investmentProjectsApi.get(initialProjectId).then((res) => {
        const project = res.data.data?.attributes || res.data.data || res.data;
        // Store project ID, status, and raw attributes
        setLoadedProjectId(initialProjectId);
        setProjectStatus(project?.status || null);
        setProjectAttributes(project);

        if (project?.form_snapshot && Object.keys(project.form_snapshot).length > 0) {
          loadFromDraft(project.form_snapshot, null);
        } else {
          // Fallback: reconstruct minimal form state from project attributes
          const fallback = {
            globalStepIndex: 0,
            presentation: {
              title: project.title || '',
              propertyType: '',
              operationType: project.operation_type || '',
              pitch: project.description || '',
              valBefore: '',
              valAfter: '',
              expertName: '',
              expertDate: '',
              durationMonths: project.duration_months ? String(project.duration_months) : '',
              exploitationStrategy: project.exploitation_strategy || '',
              marketSegment: project.market_segment || '',
              projectedRevenue: project.projected_revenue_cents ? String(project.projected_revenue_cents / 100) : '',
              revenuePeriod: project.revenue_period || '',
              additionalInfo: project.additional_info || '',
            },
            location: {
              address: '',
              postalCode: '',
              city: project.property_city || '',
              neighborhood: '',
              zoneTypology: '',
              transportAccess: [],
              nearbyAmenities: [],
              strategicAdvantages: '',
            },
            projectOwner: {
              structure: '', companyName: '', linkedinUrl: '', yearsExperience: '',
              coreExpertise: '', completedProjects: '', businessVolume: '',
              geoExperience: '', certifications: '', teamDescription: '', additionalInfo: '',
            },
            financialStructure: {
              totalFunding: project.total_amount_cents ? String(project.total_amount_cents / 100) : '',
              grossMargin: project.gross_yield_percent ? String(project.gross_yield_percent) : '',
              netYield: project.net_yield_percent ? String(project.net_yield_percent) : '',
              yieldJustification: project.yield_justification || '',
              commercializationStrategy: project.commercialization_strategy || [],
              financialDossierStatus: project.financial_dossier_status || [],
              additionalInfo: '',
            },
            assets: [{ id: 1, label: project.property_title || 'Actif 1', completed: true, details: { isRefinancing: false, signatureDate: '', lotCount: '1', worksNeeded: false, worksDuration: '' }, costs: { items: [], total: 0 }, lots: [{ id: 1, preCommercialized: 'non', rented: 'non', surface: '', prix: 0, prixM2: 0, promesseRef: '', bailRef: '' }], documents: [], recettesTotal: 0, guarantee: { type: '', rank: '', assetValue: 0, debtAmount: 0, ltv: 0, protectionScore: 0, riskLevel: '', description: '', guarantor: '' }, guaranteeDocs: [] }],
            projections: { contributionPct: 20, durationMonths: project.duration_months || 12, proofFileName: '' },
            consentGiven: project.consent_given || false,
          };
          loadFromDraft(fallback, null);
        }
        setSubmitted(true);
        // If info flow, go to the Compléments step; otherwise show projection summary
        if (project?.status === 'info_requested' || project?.status === 'info_resubmitted') {
          setGlobalStep(ADDITIONAL_INFO_STEP);
        } else if (project?.status === 'signing') {
          setGlobalStep(SIGNATURE_STEP);
          // Auto-refresh signature link from YouSign if not yet available
          if (!project.yousign_signature_link) {
            investmentProjectsApi.refreshSignatureStatus(initialProjectId).then((res) => {
              const refreshed = res.data.data?.attributes || res.data.data || res.data;
              setProjectAttributes(refreshed);
            }).catch(() => { });
          }
        } else {
          setGlobalStep(SUBMIT_STEP);
        }
      }).catch(() => { });
    } else if (initialDraftId) {
      projectDraftsApi.get(initialDraftId).then((res) => {
        const draft = res.data.data || res.data;
        if (draft?.form_data && Object.keys(draft.form_data).length > 0) {
          loadFromDraft(draft.form_data, draft.id);
        }
      }).catch(() => { });
    }

    return () => {
      clearTimeout(autoSaveTimer.current);
      reset();
    };
  }, [initialDraftId, initialProjectId]);

  // ── Navigation ──
  const handleNext = async () => {
    // Additional Info step: use Suivant to submit responses (don't navigate)
    if (globalStepIndex === ADDITIONAL_INFO_STEP && submitted) {
      if (projectStatus === 'info_resubmitted') return; // Already submitted
      if (additionalInfoSubmitRef.current) {
        await additionalInfoSubmitRef.current();
      }
      return;
    }

    if (submitted) {
      // Read-only navigation
      if (globalStepIndex === SUB_FLOW_END) {
        returnToHub();
      } else if (isOnHub) {
        setGlobalStep(PROJECTION_START);
      } else if (globalStepIndex === SUBMIT_STEP && isInfoFlow) {
        setGlobalStep(ADDITIONAL_INFO_STEP);
      } else if (globalStepIndex < SUBMIT_STEP) {
        goNext();
      }
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // End of sub-flow: return to hub
    if (globalStepIndex === SUB_FLOW_END) {
      returnToHub();
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate current step
    if (!validateCurrentStep()) return;

    // Save draft immediately before navigating (covers auto-fill scenario)
    if (isDirty && !submitted && !initialProjectId) {
      saveDraft();
    }

    // Hub: skip sub-flow, jump to projections
    if (isOnHub) {
      if (!allAssetsComplete()) {
        toast.error('Tous les actifs doivent être complets avant de continuer.');
        return;
      }
      setGlobalStep(PROJECTION_START);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Submit step: submit the dossier
    if (globalStepIndex === SUBMIT_STEP) {
      handleSubmit();
      return;
    }

    goNext();
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    // From first sub-flow step: return to hub
    if (globalStepIndex === SUB_FLOW_START && selectedAssetIndex !== null) {
      returnToHub();
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // From contribution: back to hub (skip sub-flow)
    if (globalStepIndex === PROJECTION_START) {
      setGlobalStep(HUB_INDEX);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    goPrev();
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMacroClick = (macroIdx) => {
    if (isStepLocked(STEP_CONFIG.findIndex((s) => s.macro === macroIdx))) return;
    if (isDirty && !submitted) saveDraft();
    jumpToMacroStep(macroIdx);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submission ──
  const handleSubmit = async () => {
    if (!consentGiven) {
      toast.error('Vous devez certifier l\'exactitude des informations.');
      return;
    }

    setSubmitting(true);
    try {
      const state = getSerializableState();
      const owner = state.projectOwner;
      const VALID_CORE_EXPERTISE = ['marchand_biens', 'promoteur', 'renovation', 'gestion_locative', 'autre_expertise'];
      const VALID_GEO_EXPERIENCE = ['first_operation', 'one_to_three', 'expert_local'];
      await companiesApi.createOrUpdate({
        company_name: owner.companyName,
        legal_form: owner.structure,
        website_url: owner.linkedinUrl,
        years_of_experience: owner.yearsExperience ? parseInt(owner.yearsExperience) : undefined,
        core_expertise: VALID_CORE_EXPERTISE.includes(owner.coreExpertise) ? owner.coreExpertise : undefined,
        completed_operations_count: owner.completedProjects ? parseInt(owner.completedProjects) : undefined,
        managed_volume_cents: owner.businessVolume ? Math.round(parseFloat(owner.businessVolume) * 100) : undefined,
        geo_experience: VALID_GEO_EXPERIENCE.includes(owner.geoExperience) ? owner.geoExperience : undefined,
        certifications: owner.certifications || undefined,
        team_description: owner.teamDescription || undefined,
        additional_info: owner.additionalInfo || undefined,
      });

      const pres = state.presentation;
      const loc = state.location;
      const fin = state.financialStructure;
      const proj = state.projections;
      const totalCosts = state.assets.reduce((sum, a) => sum + (a.costs.total || 0), 0);
      const toCents = (v) => { const n = parseFloat(v); return !isNaN(n) && n > 0 ? Math.round(n * 100) : undefined; };

      // Build properties_data from form assets
      const propertiesData = state.assets.map((asset, idx) => {
        const acqItem = asset.costs.items.find(i => i.category === 'acquisition' && i.label.includes('acquisition'));
        const acqPrice = acqItem ? Math.round((parseFloat(acqItem.amount) || 1) * 100) : Math.round((asset.costs.total || 1) * 100);
        return {
          title: asset.label || `${pres.title || 'Bien'} - Actif ${idx + 1}`,
          address_line1: loc.address || 'Adresse à préciser',
          city: loc.city || 'Ville à préciser',
          postal_code: loc.postalCode || '00000',
          country: 'FR',
          property_type: pres.propertyType || 'appartement',
          acquisition_price_cents: Math.max(acqPrice, 1),
          estimated_value_cents: toCents(pres.valAfter),
          number_of_lots: asset.details.lotCount ? parseInt(asset.details.lotCount) : undefined,
          neighborhood: loc.neighborhood || undefined,
          zone_typology: loc.zoneTypology || undefined,
          transport_access: loc.transportAccess || [],
          nearby_amenities: loc.nearbyAmenities || [],
          strategic_advantages: loc.strategicAdvantages || undefined,
          expert_name: pres.expertName || undefined,
          expert_date: pres.expertDate || undefined,
          is_refinancing: asset.details.isRefinancing || false,
          works_needed: asset.details.worksNeeded || false,
          works_duration_months: asset.details.worksDuration ? parseInt(asset.details.worksDuration) : undefined,
        };
      });

      const projectPayload = {
        title: pres.title,
        description: pres.pitch || undefined,
        operation_type: pres.operationType || undefined,
        exploitation_strategy: pres.exploitationStrategy || undefined,
        market_segment: pres.marketSegment || undefined,
        projected_revenue_cents: toCents(pres.projectedRevenue),
        revenue_period: pres.revenuePeriod || undefined,
        duration_months: pres.durationMonths ? parseInt(pres.durationMonths) : proj.durationMonths,
        additional_info: pres.additionalInfo || undefined,
        yield_justification: fin.yieldJustification || undefined,
        gross_yield_percent: fin.grossMargin ? parseFloat(fin.grossMargin) : undefined,
        net_yield_percent: fin.netYield ? parseFloat(fin.netYield) : undefined,
        total_amount_cents: toCents(fin.totalFunding) || Math.round(totalCosts * 100),
        commercialization_strategy: fin.commercializationStrategy || [],
        financial_dossier_status: fin.financialDossierStatus || [],
        equity_cents: Math.round(totalCosts * (proj.contributionPct / 100) * 100),
        consent_given: state.consentGiven,
        consent_given_at: state.consentGiven ? new Date().toISOString() : undefined,
        share_price_cents: defaultSharePriceCents,
        total_shares: Math.max(1, Math.floor((toCents(fin.totalFunding) || totalCosts * 100) / defaultSharePriceCents)),
        min_investment_cents: defaultSharePriceCents,
        funding_start_date: new Date().toISOString().split('T')[0],
        funding_end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      };

      const createRes = await investmentProjectsApi.create({ ...projectPayload, properties_data: propertiesData, form_snapshot: state });

      // Upload project photos after creation
      const createdProjectId = createRes.data?.data?.id;
      if (createdProjectId && store.photos.length > 0) {
        try {
          await projectPhotosApi.uploadPhotos(createdProjectId, store.photos);
        } catch {
          // Non-blocking: project is created, photos upload failed
          toast.error('Le projet a été soumis mais certaines photos n\'ont pas pu être uploadées.');
        }
      }

      const docFiles = Object.values(store.documentFiles);
      if (createdProjectId && docFiles.length > 0) {
        try {
          await projectDocumentsApi.uploadDocuments(createdProjectId, docFiles);
        } catch {
          toast.error('Le projet a été soumis mais certains documents n\'ont pas pu être uploadés.');
        }
      }

      if (draftId) {
        try { await projectDraftsApi.delete(draftId); } catch { }
      }

      setSubmitting(false);
      setSubmitted(true);
      toast.success('Votre dossier a été soumis avec succès !');
    } catch (err) {
      const msg = err.response?.data?.errors?.join(', ') || 'Erreur lors de la soumission';
      toast.error(msg);
      setSubmitting(false);
    }
  };

  // ── TEST: Auto-populate current step ──
  const handleTestFill = () => {
    const s = store;
    switch (globalStepIndex) {
      case 0: // Presentation
        s.updatePresentation('title', 'Résidence Les Oliviers - Marseille 8e');
        s.updatePresentation('propertyType', 'immeuble');
        s.updatePresentation('operationType', 'marchand_de_biens');
        s.updatePresentation('pitch', 'Réhabilitation d\'un immeuble de 6 lots en plein centre de Marseille.');
        s.updatePresentation('valBefore', '450000');
        s.updatePresentation('valAfter', '820000');
        s.updatePresentation('expertName', 'Cabinet Durand Expertise');
        s.updatePresentation('expertDate', '2026-01-15');
        s.updatePresentation('durationMonths', '18');
        s.updatePresentation('exploitationStrategy', 'resale');
        s.updatePresentation('marketSegment', 'Résidentiel standing');
        s.updatePresentation('projectedRevenue', '820000');
        s.updatePresentation('revenuePeriod', 'annual');
        s.updatePresentation('additionalInfo', 'Quartier en pleine revalorisation, proximité métro.');
        break;
      case 1: // Photos (no test fill — requires actual files)
        toast('Pas de données test pour les photos (fichiers requis)', { icon: 'ℹ️' });
        break;
      case 2: // Location
        s.updateLocation('address', '24 Rue du Rouet');
        s.updateLocation('postalCode', '13008');
        s.updateLocation('city', 'Marseille');
        s.updateLocation('neighborhood', 'Rouet - Menpenti');
        s.updateLocation('zoneTypology', 'hypercentre');
        s.updateLocation('transportAccess', ['metro', 'bus', 'tramway']);
        s.updateLocation('nearbyAmenities', ['commerces', 'ecoles', 'sante']);
        s.updateLocation('strategicAdvantages', 'Quartier en forte revalorisation, proche du Prado et du Vélodrome.');
        break;
      case 3: // Project Owner
        s.updateProjectOwner('structure', 'sas');
        s.updateProjectOwner('companyName', 'Immo Sud Développement SAS');
        s.updateProjectOwner('linkedinUrl', 'https://linkedin.com/company/immo-sud-dev');
        s.updateProjectOwner('yearsExperience', '8');
        s.updateProjectOwner('coreExpertise', 'renovation');
        s.updateProjectOwner('completedProjects', '12');
        s.updateProjectOwner('businessVolume', '6500000');
        s.updateProjectOwner('geoExperience', 'expert_local');
        s.updateProjectOwner('certifications', 'RGE, Qualibat');
        s.updateProjectOwner('teamDescription', 'Équipe de 5 personnes : 2 chefs de projet, 1 architecte partenaire, 1 comptable, 1 commercial.');
        s.updateProjectOwner('additionalInfo', 'Partenariat bancaire avec CIC et Crédit Agricole.');
        break;
      case 4: // Financial Structure
        s.updateFinancialStructure('totalFunding', '650000');
        s.updateFinancialStructure('grossMargin', '12.5');
        s.updateFinancialStructure('netYield', '9.2');
        s.updateFinancialStructure('yieldJustification', 'Marge basée sur le différentiel acquisition/revente après travaux, dans un marché marseillais en hausse.');
        s.updateFinancialStructure('commercializationStrategy', ['vente_lots', 'mandat_agence']);
        s.updateFinancialStructure('financialDossierStatus', ['business_plan_valide', 'financement_bancaire_obtenu']);
        s.updateFinancialStructure('additionalInfo', 'Pré-commercialisation de 2 lots sur 6 déjà engagée.');
        break;
      case 6: { // Asset Details
        const ai = s.selectedAssetIndex;
        if (ai !== null) {
          s.updateAssetDetails('isRefinancing', false);
          s.updateAssetDetails('signatureDate', '2026-03-01');
          s.updateAssetDetails('lotCount', '4');
          s.updateAssetDetails('worksNeeded', true);
          s.updateAssetDetails('worksDuration', '10');
        }
        break;
      }
      case 7: { // Expense Plan
        const ai2 = s.selectedAssetIndex;
        if (ai2 !== null) {
          const asset = s.assets[ai2];
          asset.costs.items.forEach((item) => {
            if (item.label.includes('acquisition')) s.updateCostItem(item.id, 'amount', '450000');
            else if (item.label.includes('notaire')) s.updateCostItem(item.id, 'amount', '35000');
            else if (item.label.includes('agence')) s.updateCostItem(item.id, 'amount', '15000');
            else if (item.label.includes('Architecte')) s.updateCostItem(item.id, 'amount', '12000');
            else if (item.label.includes('Bureau')) s.updateCostItem(item.id, 'amount', '5000');
            else if (item.label.includes('Géomètre')) s.updateCostItem(item.id, 'amount', '3000');
          });
        }
        break;
      }
      case 8: { // Sales Plan / Lots
        const ai3 = s.selectedAssetIndex;
        if (ai3 !== null) {
          const asset = s.assets[ai3];
          asset.lots.forEach((lot) => {
            s.updateLot(lot.id, 'surface', String(35 + Math.floor(Math.random() * 40)));
          });
        }
        break;
      }
      case 9: { // Guarantee
        if (s.selectedAssetIndex !== null) {
          s.updateAssetGuarantee('type', 'hypotheque');
          s.updateAssetGuarantee('rank', '1er_rang');
          s.updateAssetGuarantee('description', 'Hypothèque de premier rang sur le bien immobilier objet de l\'opération.');
          s.updateAssetGuarantee('guarantor', '');
        }
        break;
      }
      case 11: // Contribution
        s.updateProjections('contributionPct', 25);
        s.updateProjections('durationMonths', 18);
        break;
      default:
        toast('Pas de données test pour cette étape', { icon: 'ℹ️' });
    }
    toast.success('Données test injectées !');
  };

  // ── Report download (for approved projects) ──
  const handleDownloadReport = async () => {
    if (!initialProjectId) return;
    setDownloadingReport(true);
    try {
      const res = await investmentProjectsApi.getAnalystReport(initialProjectId);
      const report = res.data.report;
      const rd = report?.attributes || report;
      generatePdfReport(rd, store.presentation);
    } catch {
      toast.error('Erreur lors du téléchargement du rapport');
    } finally {
      setDownloadingReport(false);
    }
  };

  // ── Button labels ──
  const isSubmitStep = globalStepIndex === SUBMIT_STEP;
  const isAdditionalInfoStep = globalStepIndex === ADDITIONAL_INFO_STEP;
  const isSignatureStep = globalStepIndex === SIGNATURE_STEP;
  const isEndOfSubFlow = globalStepIndex === SUB_FLOW_END;
  const hubAllComplete = isOnHub && allAssetsComplete();
  const isLastNavigable = globalStepIndex === SUBMIT_STEP;

  const nextLabel = isSignatureStep && submitted && projectStatus === 'signing'
    ? 'Contrat en cours de signature'
    : isAdditionalInfoStep && submitted
      ? (projectStatus === 'info_resubmitted' ? 'Compléments envoyés' : 'Envoyer les compléments')
      : submitted
        ? ((isLastNavigable && !isInfoFlow) ? 'Dossier envoyé' : 'Suivant')
        : submitting
          ? 'Envoi en cours...'
          : isSubmitStep
            ? 'Envoyer mon dossier en analyse'
            : isEndOfSubFlow
              ? 'Terminer cet actif'
              : 'Suivant';

  const prevLabel = (globalStepIndex === SUB_FLOW_START && selectedAssetIndex !== null)
    ? 'Retour au Hub'
    : globalStepIndex === PROJECTION_START
      ? 'Retour au Hub'
      : 'Précédent';

  const nextDisabled = submitting
    || (submitted && isLastNavigable && !isInfoFlow)
    || (submitted && isAdditionalInfoStep && projectStatus === 'info_resubmitted')
    || (submitted && isSignatureStep && projectStatus === 'signing')
    || (isOnHub && !hubAllComplete && !submitted);

  const StepComponent = STEP_COMPONENTS[globalStepIndex];

  return (
    <div className="pf-app-container">
      {/* ── Macro Navigation (with integrated back link) ── */}
      <nav className="pf-macro-nav">
        <button type="button" className="pf-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} /> Retour
        </button>
        {MACRO_STEPS.map((macro, idx) => {
          // When viewing a submitted project, hide Compléments unless info flow
          if (submitted && !isInfoFlow && idx === 3) return null;

          const Icon = MACRO_ICONS[idx];
          const isActive = currentMacro === idx;
          const isCompleted = submitted
            ? (idx <= 2 || (idx === 3 && projectStatus === 'info_resubmitted'))
            : currentMacro > idx;
          const locked = isStepLocked(STEP_CONFIG.findIndex((s) => s.macro === idx));

          return (
            <div
              key={idx}
              className={`pf-macro-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => !locked && handleMacroClick(idx)}
            >
              <div className="pf-macro-step-icon">
                {isCompleted ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span>{macro.label}</span>
            </div>
          );
        })}
      </nav>

      {/* ── Main Content ── */}
      <div className="pf-main-content">
        {/* Micro Progress - hidden on hub */}
        {showMicroBar && (
          <div className="pf-micro-nav">
            <div className="pf-micro-tabs">
              {microSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`pf-micro-tab ${idx < microIndex ? 'completed' : ''} ${idx === microIndex ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="pf-micro-status-text">
              Étape {microIndex + 1} sur {microSteps.length}
            </div>
          </div>
        )}

        {/* Form Header */}
        <div className="pf-form-header">
          <h2>{stepConfig.title}</h2>
          <p>{stepConfig.desc}</p>
        </div>

        {/* Success / Info Banner - context-aware (hidden on Additional Info step which has its own) */}
        {submitted && globalStepIndex !== ADDITIONAL_INFO_STEP && (
          projectStatus === 'approved' ? (
            <div className="pf-success-banner" style={{ borderColor: 'var(--gold-color, #DAA520)' }}>
              <CheckCircle size={20} />
              <div style={{ flex: 1 }}>
                <strong>Projet approuve</strong>
                <span>Votre projet a ete analyse et approuve. Vous pouvez telecharger le rapport d'analyse ci-dessous.</span>
              </div>
              <button
                type="button"
                className="pf-nav-btn pf-btn-next"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
              >
                <Download size={16} /> {downloadingReport ? 'Telechargement...' : 'Telecharger le rapport'}
              </button>
            </div>
          ) : projectStatus === 'signing' ? (
            (() => {
              const pa = projectAttributes?.attributes || projectAttributes || {};
              const sigLink = pa.yousign_signature_link;
              const yStat = pa.yousign_status;
              const signed = yStat === 'done' || yStat === 'owner_signed';

              if (signed) return (
                <div className="pf-success-banner" style={{ borderColor: 'var(--success-color, #10b981)' }}>
                  <CheckCircle size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>Contrat signe avec succes</strong>
                    <span>Vous avez signe le contrat via YouSign. Le statut de votre projet sera mis a jour prochainement apres verification. Merci de votre patience.</span>
                  </div>
                </div>
              );

              return (
                <div className="pf-success-banner" style={{ borderColor: 'var(--info-color, #3498db)' }}>
                  <Clock size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>Votre signature est requise</strong>
                    <span>Le contrat a ete signe par la plateforme et vous a ete envoye par email. Vous pouvez egalement cliquer sur le bouton ci-dessous pour signer directement. Apres votre signature, le statut de votre projet sera mis a jour automatiquement. Merci de votre patience.</span>
                  </div>
                  {sigLink && (
                    <button
                      type="button"
                      className="pf-nav-btn pf-btn-next"
                      onClick={() => window.open(sigLink, '_blank', 'noopener,noreferrer')}
                      style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
                    >
                      <ExternalLink size={16} /> Signer le contrat
                    </button>
                  )}
                </div>
              );
            })()
          ) : projectStatus === 'info_requested' ? (
            <div className="pf-info-banner">
              <Info size={20} />
              <div>
                <strong>Compléments d'information requis</strong>
                <span>L'analyste a demandé des informations supplémentaires. Rendez-vous à l'étape « Compléments » pour y répondre.</span>
              </div>
            </div>
          ) : projectStatus === 'info_resubmitted' ? (
            <div className="pf-success-banner">
              <CheckCircle size={20} />
              <div>
                <strong>Compléments envoyés</strong>
                <span>Vos informations complémentaires ont été envoyées. L'analyste va les examiner.</span>
              </div>
            </div>
          ) : (
            <div className="pf-success-banner">
              <CheckCircle size={20} />
              <div>
                <strong>Dossier envoyé avec succès</strong>
                <span>Votre dossier est en cours d'analyse par notre équipe. Vous pouvez consulter vos informations ci-dessous.</span>
              </div>
            </div>
          )
        )}

        {/* Dynamic Fields */}
        <div className={`pf-dynamic-fields${submitted && globalStepIndex !== ADDITIONAL_INFO_STEP ? ' pf-read-only' : ''}`} ref={scrollRef}>
          {globalStepIndex === ADDITIONAL_INFO_STEP
            ? <StepComponent onSubmitRef={additionalInfoSubmitRef} />
            : globalStepIndex === SUBMIT_STEP
              ? <StepComponent defaultSharePriceCents={defaultSharePriceCents} />
              : <StepComponent />
          }
        </div>

        {/* Form Footer */}
        <div className="pf-form-footer">
          {globalStepIndex > 0 && (
            <button type="button" className="pf-nav-btn pf-btn-prev" onClick={handlePrev} disabled={submitting}>
              <ArrowLeft size={16} /> {prevLabel}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!submitted && (
            <button
              type="button"
              onClick={handleTestFill}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                background: 'repeating-linear-gradient(45deg, #fff3cd, #fff3cd 10px, #fff9e6 10px, #fff9e6 20px)',
                color: '#856404',
                border: '2px dashed #ffc107',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.03em',
              }}
            >
              TEST: Remplir cette étape
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className={`pf-nav-btn pf-btn-next${(isSubmitStep && !submitted) || (isAdditionalInfoStep && submitted && projectStatus !== 'info_resubmitted') ? ' pf-btn-submit' : ''}`}
            onClick={handleNext}
            disabled={nextDisabled}
          >
            {isAdditionalInfoStep && submitted && projectStatus !== 'info_resubmitted'
              ? <><Send size={16} /> {nextLabel}</>
              : <>{nextLabel} {!isSubmitStep && !isAdditionalInfoStep && !submitted && <ArrowRight size={16} />}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
