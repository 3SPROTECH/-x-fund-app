import { useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, FileText, Calculator, TrendingUp, PenTool, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import useProjectFormStore, { MACRO_STEPS, STEP_CONFIG } from '../../stores/useProjectFormStore';
import { projectDraftsApi } from '../../api/projectDrafts';
import { companiesApi } from '../../api/companies';
import { investmentProjectsApi } from '../../api/investments';

import StepPresentation from './steps/StepPresentation';
import StepLocation from './steps/StepLocation';
import StepProjectOwner from './steps/StepProjectOwner';
import StepFinancialStructure from './steps/StepFinancialStructure';
import AssetHub from './steps/AssetHub';
import AssetDetails from './steps/AssetDetails';
import ExpensePlan from './steps/ExpensePlan';
import SalesPlanLots from './steps/SalesPlanLots';
import VerificationDocs from './steps/VerificationDocs';
import ContributionStep from './steps/ContributionStep';
import FinancingSimulation from './steps/FinancingSimulation';
import SignatureStep from './steps/SignatureStep';

import './project-submission-form.css';

const MACRO_ICONS = [FileText, Calculator, TrendingUp, PenTool];

const STEP_COMPONENTS = [
  StepPresentation,        // 0  - Macro 0
  StepLocation,            // 1
  StepProjectOwner,        // 2
  StepFinancialStructure,  // 3
  AssetHub,                // 4  - Macro 1 (hub - not a real micro step)
  AssetDetails,            // 5  - Asset sub-flow step 1
  ExpensePlan,             // 6  - Asset sub-flow step 2
  SalesPlanLots,           // 7  - Asset sub-flow step 3
  VerificationDocs,        // 8  - Asset sub-flow step 4
  ContributionStep,        // 9  - Macro 2
  FinancingSimulation,     // 10
  SignatureStep,           // 11 - Macro 3 (locked until analyst approves)
];

const HUB_INDEX = 4;
const SUB_FLOW_START = 5;
const SUB_FLOW_END = 8;
const PROJECTION_START = 9;
const SUBMIT_STEP = 10; // FinancingSimulation — last editable step

const SUB_FLOW_LABELS = [
  'Détails de l\'actif',
  'Plan de dépenses',
  'Revenus par lot',
  'Vérification docs',
];

export default function ProjectSubmissionForm({ initialDraftId = null, initialProjectId = null }) {
  const scrollRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const store = useProjectFormStore();
  const {
    globalStepIndex, setGlobalStep, goNext, goPrev, jumpToMacroStep,
    validateCurrentStep, isStepLocked, allAssetsComplete,
    selectedAssetIndex, returnToHub,
    submitting, submitted, setSubmitting, setSubmitted,
    consentGiven,
    draftId, isDirty, setDraftId, setLastSavedAt, getSerializableState, loadFromDraft,
    reset,
  } = store;

  const stepConfig = STEP_CONFIG[globalStepIndex] || STEP_CONFIG[0];
  const currentMacro = stepConfig.macro;
  const isOnHub = globalStepIndex === HUB_INDEX;
  const isInSubFlow = globalStepIndex >= SUB_FLOW_START && globalStepIndex <= SUB_FLOW_END;

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
        if (project?.form_snapshot && Object.keys(project.form_snapshot).length > 0) {
          loadFromDraft(project.form_snapshot, null);
        } else {
          // Fallback: reconstruct minimal form state from project attributes
          const fallback = {
            globalStepIndex: 0,
            presentation: {
              title: project.title || '',
              progressStatus: project.progress_status || '',
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
            assets: [{ id: 1, label: project.property_title || 'Actif 1', completed: true, details: { isRefinancing: false, signatureDate: '', lotCount: '1', worksNeeded: false, worksDuration: '' }, costs: { items: [], total: 0 }, lots: [{ id: 1, preCommercialized: 'non', rented: 'non', surface: '', prix: 0, prixM2: 0, promesseRef: '', bailRef: '' }], documents: [], recettesTotal: 0 }],
            projections: { contributionPct: 20, durationMonths: project.duration_months || 12, proofFileName: '' },
            consentGiven: project.consent_given || false,
          };
          loadFromDraft(fallback, null);
        }
        setSubmitted(true);
        setGlobalStep(SUBMIT_STEP);
      }).catch(() => {});
    } else if (initialDraftId) {
      projectDraftsApi.get(initialDraftId).then((res) => {
        const draft = res.data.data || res.data;
        if (draft?.form_data && Object.keys(draft.form_data).length > 0) {
          loadFromDraft(draft.form_data, draft.id);
        }
      }).catch(() => {});
    }

    return () => {
      clearTimeout(autoSaveTimer.current);
      reset();
    };
  }, [initialDraftId, initialProjectId]);

  // ── Navigation ──
  const handleNext = () => {
    if (submitted) {
      // Read-only navigation: allow moving forward through steps 0-10
      if (globalStepIndex === SUB_FLOW_END) {
        returnToHub();
      } else if (isOnHub) {
        setGlobalStep(PROJECTION_START);
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
      await companiesApi.createOrUpdate({
        company_name: owner.companyName,
        legal_form: owner.structure,
        website_url: owner.linkedinUrl,
        years_of_experience: owner.yearsExperience ? parseInt(owner.yearsExperience) : undefined,
        core_expertise: owner.coreExpertise || undefined,
        completed_operations_count: owner.completedProjects ? parseInt(owner.completedProjects) : undefined,
        managed_volume_cents: owner.businessVolume ? Math.round(parseFloat(owner.businessVolume) * 100) : undefined,
        geo_experience: owner.geoExperience || undefined,
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
        progress_status: pres.progressStatus || undefined,
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
        share_price_cents: 10000,
        total_shares: Math.max(1, Math.floor((toCents(fin.totalFunding) || totalCosts * 100) / 10000)),
        min_investment_cents: 10000,
        funding_start_date: new Date().toISOString().split('T')[0],
        funding_end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      };

      await investmentProjectsApi.create({ ...projectPayload, properties_data: propertiesData, form_snapshot: state });

      if (draftId) {
        try { await projectDraftsApi.delete(draftId); } catch {}
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

  // ── Button labels ──
  const isSubmitStep = globalStepIndex === SUBMIT_STEP;
  const isEndOfSubFlow = globalStepIndex === SUB_FLOW_END;
  const hubAllComplete = isOnHub && allAssetsComplete();
  const isLastNavigable = globalStepIndex === SUBMIT_STEP;

  const nextLabel = submitted
    ? (isLastNavigable ? 'Dossier envoyé' : 'Suivant')
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
    || (submitted && isLastNavigable)
    || (isOnHub && !hubAllComplete && !submitted);

  const StepComponent = STEP_COMPONENTS[globalStepIndex];

  return (
    <div className="pf-app-container">
      {/* ── Macro Navigation ── */}
      <nav className="pf-macro-nav">
        {MACRO_STEPS.map((macro, idx) => {
          const Icon = MACRO_ICONS[idx];
          const isActive = currentMacro === idx;
          const isCompleted = submitted ? idx <= 2 : currentMacro > idx;
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

        {/* Success Banner - shown after submission */}
        {submitted && (
          <div className="pf-success-banner">
            <CheckCircle size={20} />
            <div>
              <strong>Dossier envoyé avec succès</strong>
              <span>Votre dossier est en cours d'analyse par notre équipe. Vous pouvez consulter vos informations ci-dessous.</span>
            </div>
          </div>
        )}

        {/* Dynamic Fields */}
        <div className={`pf-dynamic-fields${submitted ? ' pf-read-only' : ''}`} ref={scrollRef}>
          <StepComponent />
        </div>

        {/* Form Footer */}
        <div className="pf-form-footer">
          {globalStepIndex > 0 && (
            <button type="button" className="pf-nav-btn pf-btn-prev" onClick={handlePrev} disabled={submitting}>
              <ArrowLeft size={16} /> {prevLabel}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className={`pf-nav-btn pf-btn-next${isSubmitStep && !submitted ? ' pf-btn-submit' : ''}`}
            onClick={handleNext}
            disabled={nextDisabled}
          >
            {nextLabel} {!isSubmitStep && !submitted && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
