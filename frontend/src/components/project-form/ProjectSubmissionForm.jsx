import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Building, Landmark, Euro, ShieldCheck, Store } from 'lucide-react';
import toast from 'react-hot-toast';

import useProjectFormStore, { STEP_LABELS } from '../../stores/useProjectFormStore';
import { propertiesApi } from '../../api/properties';
import { investmentProjectsApi } from '../../api/investments';
import { projectImagesApi } from '../../api/images';
import { companiesApi } from '../../api/companies';

import StepOperator from './StepOperator';
import StepProject from './StepProject';
import StepFinance from './StepFinance';
import StepGuarantees from './StepGuarantees';
import StepCommercialization from './StepCommercialization';

const STEPS = [
  { id: 1, label: STEP_LABELS[0], icon: Building },
  { id: 2, label: STEP_LABELS[1], icon: Landmark },
  { id: 3, label: STEP_LABELS[2], icon: Euro },
  { id: 4, label: STEP_LABELS[3], icon: ShieldCheck },
  { id: 5, label: STEP_LABELS[4], icon: Store },
];

const STEP_COMPONENTS = [StepOperator, StepProject, StepFinance, StepGuarantees, StepCommercialization];

// --- Validation per step ---

function validateStep1(operator) {
  const errs = {};
  if (!operator.company_name?.trim()) errs.company_name = 'La dénomination sociale est requise';
  if (!operator.siret?.trim()) errs.siret = 'Le SIRET est requis';
  else if (!/^\d{14}$/.test(operator.siret)) errs.siret = 'Le SIRET doit contenir 14 chiffres';
  if (!operator.company_creation_date) errs.company_creation_date = 'La date de création est requise';
  if (!operator.legal_form) errs.legal_form = 'La forme juridique est requise';
  if (!operator.legal_representative_name?.trim()) errs.legal_representative_name = 'Le représentant légal est requis';
  if (!operator.headquarters_address?.trim()) errs.headquarters_address = "L'adresse du siège est requise";
  return errs;
}

function validateStep2(project, selectedPropertyId) {
  const errs = {};
  if (!selectedPropertyId) errs.selectedPropertyId = 'Veuillez sélectionner un bien immobilier';
  if (!project.title?.trim()) errs.title = "Le nom de l'opération est requis";
  if (!project.description?.trim()) errs.description = "Le résumé de l'opération est requis";
  if (!project.address_line1?.trim()) errs.address_line1 = "L'adresse est requise";
  if (!project.surface_area_sqm) errs.surface_area_sqm = 'La surface est requise';
  if (!project.property_type) errs.property_type = "Le type d'actif est requis";
  return errs;
}

function validateStep3(finance) {
  const errs = {};
  if (!finance.total_amount_cents || parseFloat(finance.total_amount_cents) <= 0) {
    errs.total_amount_cents = 'Le montant recherché est requis';
  }
  if (!finance.projected_revenue_cents || parseFloat(finance.projected_revenue_cents) <= 0) {
    errs.projected_revenue_cents = 'Le CA prévisionnel est requis';
  }
  const sharePrice = parseFloat(finance.share_price_cents);
  if (!sharePrice || sharePrice <= 0) {
    errs.share_price_cents = 'Le prix par part est requis';
  }
  const minInvest = parseFloat(finance.min_investment_cents);
  if (!minInvest || minInvest <= 0) {
    errs.min_investment_cents = "L'investissement minimum est requis";
  } else if (sharePrice > 0 && minInvest < sharePrice) {
    errs.min_investment_cents = `Doit être ≥ au prix par part (${sharePrice} €)`;
  }
  return errs;
}

function validateStep4() {
  return {};
}

function validateStep5(commercialization) {
  const errs = {};
  if (!commercialization.exit_scenario) errs.exit_scenario = 'Le scénario de sortie est requis';
  return errs;
}

const VALIDATORS = [validateStep1, validateStep2, validateStep3, validateStep4, validateStep5];

// --- Main Component ---

export default function ProjectSubmissionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);

  const store = useProjectFormStore();
  const { currentStep, setStep, nextStep, prevStep, setErrors, reset } = store;

  // Load all properties on mount and pre-select from URL param
  useEffect(() => {
    const propertyId = searchParams.get('propertyId');
    propertiesApi.list().then((res) => {
      const list = res.data.data || [];
      store.setProperties(list);
      if (propertyId) {
        store.selectProperty(propertyId);
      }
      setPropertiesLoaded(true);
    }).catch(() => {
      setPropertiesLoaded(true);
    });

    // Reset store on unmount
    return () => reset();
  }, []);

  const getSectionData = (step) => {
    const sections = ['operator', 'project', 'finance', 'guarantees', 'commercialization'];
    return store[sections[step - 1]];
  };

  const handleNext = () => {
    const data = getSectionData(currentStep);
    // Step 2 validator needs selectedPropertyId as extra arg
    const errs = currentStep === 2
      ? VALIDATORS[1](data, store.selectedPropertyId)
      : VALIDATORS[currentStep - 1](data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    nextStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    prevStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepId) => {
    // Only allow going to completed steps or the next step
    if (stepId < currentStep) {
      setStep(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    // Validate last step
    const errs = validateStep5(store.commercialization);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const { operator, project, finance, guarantees, commercialization, propertyIds, files } = store;

      // --- 1. Save operator/company data (Step 1) ---
      const companyData = {
        company_name: operator.company_name?.trim() || undefined,
        siret: operator.siret?.trim() || undefined,
        company_creation_date: operator.company_creation_date || undefined,
        legal_form: operator.legal_form || undefined,
        legal_representative_name: operator.legal_representative_name?.trim() || undefined,
        headquarters_address: operator.headquarters_address?.trim() || undefined,
        completed_operations_count: operator.completed_operations_count ? parseInt(operator.completed_operations_count) : undefined,
        managed_volume_cents: operator.managed_volume_cents ? Math.round(parseFloat(operator.managed_volume_cents) * 100) : undefined,
        default_rate_percent: operator.default_rate_percent ? parseFloat(operator.default_rate_percent) : undefined,
      };

      await companiesApi.createOrUpdate(companyData);

      // Upload company files (kbis, presentation_deck) if present
      if (files.kbis || files.presentation_deck) {
        const companyFileData = new FormData();
        if (files.kbis) companyFileData.append('company[kbis]', files.kbis);
        if (files.presentation_deck) companyFileData.append('company[presentation_deck]', files.presentation_deck);
        await companiesApi.createOrUpdate(companyFileData);
      }

      // --- 2. Create investment project (Steps 2-5) ---
      // Helper: convert EUR input to cents
      const toCents = (val) => {
        const n = parseFloat(val);
        return !isNaN(n) && n > 0 ? Math.round(n * 100) : undefined;
      };

      const projectData = {
        // Project info (Step 2)
        title: project.title.trim(),
        description: project.description?.trim() || undefined,
        operation_type: project.operation_type || undefined,

        // Finance (Step 3) - amounts in EUR, backend expects cents
        total_amount_cents: toCents(finance.total_amount_cents) || 0,
        notary_fees_cents: toCents(finance.notary_fees_cents),
        works_budget_cents: toCents(finance.works_budget_cents),
        financial_fees_cents: toCents(finance.financial_fees_cents),
        equity_cents: toCents(finance.equity_cents),
        bank_loan_cents: toCents(finance.bank_loan_cents),
        projected_revenue_cents: toCents(finance.projected_revenue_cents),
        projected_margin_cents: toCents(finance.projected_margin_cents),
        bank_name: finance.bank_name || undefined,
        bank_loan_status: finance.bank_loan_status || undefined,
        gross_yield_percent: finance.gross_yield_percent ? parseFloat(finance.gross_yield_percent) : undefined,
        management_fee_percent: finance.management_fee_percent ? parseFloat(finance.management_fee_percent) : undefined,
        net_yield_percent: finance.net_yield_percent ? parseFloat(finance.net_yield_percent) : undefined,
        duration_months: finance.duration_months ? parseInt(finance.duration_months) : undefined,
        payment_frequency: finance.payment_frequency || undefined,

        // Guarantees (Step 4)
        has_first_rank_mortgage: guarantees.has_first_rank_mortgage,
        has_share_pledge: guarantees.has_share_pledge,
        has_fiducie: guarantees.has_fiducie,
        has_interest_escrow: guarantees.has_interest_escrow,
        has_works_escrow: guarantees.has_works_escrow,
        has_personal_guarantee: guarantees.has_personal_guarantee,
        has_gfa: guarantees.has_gfa,
        has_open_banking: guarantees.has_open_banking,
        risk_description: guarantees.risk_description?.trim() || undefined,

        // Commercialization (Step 5)
        pre_commercialization_percent: commercialization.pre_commercialization_percent != null ? Number(commercialization.pre_commercialization_percent) : undefined,
        exit_price_per_sqm_cents: toCents(commercialization.exit_price_per_sqm_cents),
        exit_scenario: commercialization.exit_scenario || undefined,
        planned_acquisition_date: commercialization.planned_acquisition_date || undefined,
        planned_delivery_date: commercialization.planned_delivery_date || undefined,
        planned_repayment_date: commercialization.planned_repayment_date || undefined,

        // Shares structure (Step 3)
        share_price_cents: toCents(finance.share_price_cents) || 10000,
        total_shares: (() => {
          const manual = parseInt(finance.total_shares);
          if (manual > 0) return manual;
          const sp = parseFloat(finance.share_price_cents) || 0;
          const ta = parseFloat(finance.total_amount_cents) || 0;
          return sp > 0 && ta > 0 ? Math.floor(ta / sp) : 1;
        })(),
        min_investment_cents: toCents(finance.min_investment_cents) || toCents(finance.share_price_cents) || 10000,
        max_investment_cents: toCents(finance.max_investment_cents),
        // Dates derived from planning
        funding_start_date: commercialization.planned_acquisition_date || new Date().toISOString().split('T')[0],
        funding_end_date: commercialization.planned_repayment_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      const res = await investmentProjectsApi.create({
        ...projectData,
        property_ids: propertyIds,
      });
      const projectId = res.data.data?.id || res.data.id;

      // --- 3. Upload project photos (Step 2) ---
      if (files.photos.length > 0 && projectId) {
        try {
          await projectImagesApi.uploadImages(projectId, files.photos);
        } catch {
          toast.error("Projet créé mais erreur lors de l'upload des photos");
        }
      }

      toast.success("Projet soumis avec succès !");
      navigate('/properties');
    } catch (err) {
      const res = err.response;
      const msg = res?.data?.errors?.join(', ') || res?.data?.error || 'Erreur lors de la soumission';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!propertiesLoaded) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[currentStep - 1];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/properties')}>
          <ArrowLeft size={16} /> Retour aux biens
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>Soumission de Projet</h1>
          <p className="text-muted">Complétez les 5 étapes pour soumettre votre projet</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="wizard-steps">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="wizard-step-container">
              <div
                className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => handleStepClick(step.id)}
                style={{ cursor: isCompleted ? 'pointer' : 'default' }}
              >
                <div className="wizard-step-number">
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <div className="wizard-step-content">
                  <div className="wizard-step-title">{step.label}</div>
                  <div className="wizard-step-subtitle">Étape {step.id}/5</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`wizard-step-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        <StepComponent />
      </div>

      {/* Navigation */}
      <div className="wizard-actions">
        {currentStep > 1 && (
          <button type="button" className="btn btn-ghost" onClick={handleBack} disabled={submitting}>
            <ArrowLeft size={16} /> Précédent
          </button>
        )}
        <div style={{ flex: 1 }} />
        {currentStep < 5 ? (
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Soumission en cours...' : (
              <>
                <Check size={16} /> Soumettre le projet
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
