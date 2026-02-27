import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Building, ClipboardList, Star, ClipboardCheck, ArrowLeft, ArrowRight, Check, Send, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import StepRichText from './steps/StepRichText';
import StepSwotField from './steps/StepSwotField';
import StepHighlights from './steps/StepHighlights';
import StepNumberedList from './steps/StepNumberedList';
import StepScoring from './steps/StepScoring';
import StepSummary from './steps/StepSummary';
import useAnalysisDraft from '../../hooks/useAnalysisDraft';
import { analysteApi } from '../../api/analyste';
import { generateTestData, PROFILE_OPTIONS } from './testData';

const STEPS = [
  {
    label: 'Presentation',
    icon: FileText,
    micro: [
      {
        title: "Opportunite & Strategie d'Investissement",
        desc: "Resumez l'essence du projet : la nature de l'operation (marchand de biens, promotion), la strategie de creation de valeur (division, renovation) et l'etat d'avancement administratif (permis, diagnostics).",
        Component: StepRichText,
        field: 'investissement',
        props: {
          fieldLabel: "Description de l'investissement",
          placeholder: "Redigez votre description de l'investissement...",
        },
      },
      {
        title: 'Presentation du Porteur de Projet',
        desc: "Presentez l'emetteur de l'offre. Cette section doit detailler l'identite juridique de la societe, la structure de son actionnariat et, surtout, le 'track-record' (l'historique) des dirigeants.",
        Component: StepRichText,
        field: 'porteur_du_projet',
        props: {
          fieldLabel: 'Analyse du porteur du projet',
          placeholder: 'Redigez votre analyse du porteur du projet...',
        },
      },
      {
        title: 'Localisation et Analyse du Marche',
        desc: "Detaillez l'emplacement precis du bien et le contexte economique local. L'objectif est de justifier la liquidite du projet : pourquoi y a-t-il une demande pour ce type de bien a cet endroit precis ? Mentionnez les points d'interet, les tendances du marche et les avis de valeur.",
        Component: StepRichText,
        field: 'localisation',
        props: {
          fieldLabel: 'Analyse de la localisation',
          placeholder: 'Redigez votre analyse de la localisation...',
        },
      },
      {
        title: 'Montage Financier et Rentabilite',
        desc: "Presentez l'equilibre financier de l'operation. Detaillez d'une part les 'Emplois' (couts d'acquisition, travaux, frais) et d'autre part les 'Ressources' (apport personnel, levee de fonds). Concluez sur la marge previsionnelle et les hypotheses de revente pour demontrer la rentabilite du projet.",
        Component: StepRichText,
        field: 'structure_financiere',
        props: {
          fieldLabel: 'Analyse de la structure financiere',
          placeholder: 'Redigez votre analyse de la structure financiere...',
        },
      },
      {
        title: "Suretes et Garanties de l'Investissement",
        desc: "Detaillez l'ensemble des mecanismes de protection actives pour cette operation. Precisez les garanties reelles (hypotheque), les garanties personnelles (caution) et les mecanismes de controle (sequestre, open banking).",
        Component: StepRichText,
        field: 'garanties',
        props: {
          fieldLabel: 'Analyse des garanties',
          placeholder: 'Redigez votre analyse des garanties...',
        },
      },
    ],
  },
  {
    label: "Analyse de l'actif",
    icon: Building,
    micro: [
      {
        title: "Forces de l'actif",
        desc: "Identifiez et detaillez les atouts majeurs de l'actif. Chaque point doit mettre en lumiere un avantage concret : qualite de l'emplacement, etat du bien, rendement locatif, etc.",
        Component: StepSwotField,
        field: 'forces',
        props: {
          addLabel: 'Ajouter une force',
          titlePlaceholder: 'Ex: Emplacement premium en centre-ville',
          descPlaceholder: "Detaillez en quoi cet element constitue un atout pour le projet...",
        },
      },
      {
        title: "Faiblesses de l'actif",
        desc: "Relevez les points de vigilance et les faiblesses identifiees. Soyez precis sur les risques internes : travaux necessaires, contraintes techniques, defauts structurels, etc.",
        Component: StepSwotField,
        field: 'faiblesses',
        props: {
          addLabel: 'Ajouter une faiblesse',
          titlePlaceholder: 'Ex: Travaux de toiture necessaires',
          descPlaceholder: "Detaillez en quoi cet element represente un risque ou une faiblesse...",
        },
      },
      {
        title: "Opportunites de l'actif",
        desc: "Identifiez les facteurs externes favorables au projet. Projets d'infrastructure a proximite, dynamisme du marche local, evolutions reglementaires positives, etc.",
        Component: StepSwotField,
        field: 'opportunites',
        props: {
          addLabel: 'Ajouter une opportunite',
          titlePlaceholder: 'Ex: Projet de tramway a proximite',
          descPlaceholder: "Decrivez comment cette opportunite peut beneficier au projet...",
        },
      },
      {
        title: "Menaces de l'actif",
        desc: "Signalez les risques externes pouvant impacter le projet. Evolution defavorable du marche, concurrence accrue, changements reglementaires, aleas environnementaux, etc.",
        Component: StepSwotField,
        field: 'menaces',
        props: {
          addLabel: 'Ajouter une menace',
          titlePlaceholder: 'Ex: Saturation du marche locatif local',
          descPlaceholder: 'Decrivez comment cette menace pourrait impacter le projet...',
        },
      },
    ],
  },
  {
    label: 'Resume',
    icon: ClipboardList,
    micro: [
      {
        title: 'Points Cles du Projet',
        desc: "Selectionnez 4 a 6 caracteristiques majeures qui definissent l'attractivite immediate du projet. Chaque bloc doit comporter un titre court (2-3 mots) et une description d'une ligne. Choisissez des icones qui illustrent la strategie.",
        Component: StepHighlights,
        field: 'highlights',
      },
      {
        title: "Elements Cles de l'Analyse",
        desc: "Presentez une liste numerotee des conclusions de votre audit. Cette section doit equilibrer les facteurs de reassurance et les realites du marche.",
        Component: StepNumberedList,
        field: 'elements_cles',
        props: {
          addLabel: 'Ajouter une conclusion',
          titlePlaceholder: 'Ex: Rentabilite nette superieure au marche',
          descPlaceholder: 'Developpez cette conclusion en detaillant les elements factuels qui la soutiennent...',
        },
      },
    ],
  },
  {
    label: 'Scoring',
    icon: Star,
    micro: [
      {
        title: 'Scoring et decision',
        desc: 'Attribuez les scores et prenez votre decision finale.',
        Component: StepScoring,
        field: 'scoring',
      },
    ],
  },
  {
    label: 'Recapitulatif',
    icon: ClipboardCheck,
    micro: [
      {
        title: "Recapitulatif de l'analyse",
        desc: "Relisez l'ensemble de votre analyse avant de la soumettre.",
        Component: StepSummary,
        field: null,
        passFormData: true,
      },
    ],
  },
];

function getGradeColor(grade) {
  if (!grade) return '';
  const letter = grade.charAt(0);
  if (letter === 'A') return 'green';
  if (letter === 'B') return 'orange';
  return 'red';
}

export default function AnalysisStepper({ project }) {
  const projectId = project?.id || project?.data?.id;
  const navigate = useNavigate();

  const {
    loadingDraft,
    initialData,
    lastSavedAt,
    saving,
    markDirty,
    updateStep,
    saveDraft,
  } = useAnalysisDraft(projectId);

  const [macroIndex, setMacroIndex] = useState(0);
  const [microIndex, setMicroIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [completedMacros, setCompletedMacros] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const stepRef = useRef();

  // Restore draft data once loaded
  useEffect(() => {
    if (initialData) {
      setFormData(initialData.formData);
      setMacroIndex(initialData.macroIndex);
      setMicroIndex(initialData.microIndex);
      // Mark all macros before the restored position as completed
      const restored = new Set();
      for (let i = 0; i < (initialData.macroIndex ?? 0); i++) restored.add(i);
      setCompletedMacros(restored);
    }
  }, [initialData]);

  const macro = STEPS[macroIndex];
  const micro = macro.micro[microIndex];
  const StepComponent = micro.Component;

  const isFirstGlobal = macroIndex === 0 && microIndex === 0;
  const isLastGlobal =
    macroIndex === STEPS.length - 1 &&
    microIndex === macro.micro.length - 1;

  const handleFieldChange = useCallback(
    (fieldName) => (value) => {
      setFormData((prev) => {
        const next = { ...prev, [fieldName]: value };
        markDirty(next, macroIndex, microIndex);
        return next;
      });
    },
    [macroIndex, microIndex, markDirty],
  );

  const handlePrev = () => {
    let newMacro = macroIndex;
    let newMicro = microIndex;
    if (microIndex > 0) {
      newMicro = microIndex - 1;
    } else if (macroIndex > 0) {
      newMacro = macroIndex - 1;
      newMicro = STEPS[newMacro].micro.length - 1;
    }
    updateStep(newMacro, newMicro);
    saveDraft();
    setMacroIndex(newMacro);
    setMicroIndex(newMicro);
  };

  const handleNext = () => {
    if (stepRef.current?.validate && !stepRef.current.validate()) {
      return;
    }
    let newMacro = macroIndex;
    let newMicro = microIndex;
    if (microIndex < macro.micro.length - 1) {
      newMicro = microIndex + 1;
    } else if (macroIndex < STEPS.length - 1) {
      setCompletedMacros((prev) => new Set(prev).add(macroIndex));
      newMacro = macroIndex + 1;
      newMicro = 0;
    }
    updateStep(newMacro, newMicro);
    saveDraft();
    setMacroIndex(newMacro);
    setMicroIndex(newMicro);
  };

  const handleSubmitAnalysis = async () => {
    if (!window.confirm("Voulez-vous soumettre votre analyse ? Cette action est definitive.")) return;

    setSubmitting(true);
    try {
      const scoring = formData.scoring || {};
      await analysteApi.submitAnalysis(projectId, {
        analysis_data: formData,
        comment: formData.analyst_comment || '',
        legal_check: scoring.criteria?.[2]?.grade > 0,
        financial_check: scoring.criteria?.[1]?.grade > 0,
        risk_check: scoring.criteria?.[4]?.grade > 0,
      });
      toast.success('Analyse soumise avec succes');
      navigate('/analyste/projects');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de la soumission de l'analyse");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestFill = (profileKey) => {
    const data = generateTestData(profileKey);
    setFormData(data);
    // Mark all macros as completed so user can navigate freely
    const all = new Set();
    for (let i = 0; i < STEPS.length; i++) all.add(i);
    setCompletedMacros(all);
    markDirty(data, macroIndex, microIndex);
    saveDraft();
    toast.success(`Donnees de test "${PROFILE_OPTIONS.find(p => p.key === profileKey)?.label}" injectees`);
  };

  const canNavigateToMacro = (idx) => {
    if (idx === macroIndex) return false; // already there
    if (completedMacros.has(idx)) return true; // already completed
    // Allow navigating to the next macro if the current one is being completed
    // (i.e. all prior macros are done and this is the immediate next)
    if (idx === macroIndex + 1 && microIndex === macro.micro.length - 1) return true;
    return false;
  };

  const handleMacroClick = (idx) => {
    if (!canNavigateToMacro(idx)) return;
    updateStep(idx, 0);
    saveDraft();
    setMacroIndex(idx);
    setMicroIndex(0);
  };

  // Build props for the current step component
  const stepProps = { project };
  if (micro.field) {
    stepProps.value = formData[micro.field];
    stepProps.onChange = handleFieldChange(micro.field);
  }
  if (micro.props) {
    Object.assign(stepProps, micro.props);
  }
  if (micro.passFormData) {
    stepProps.formData = formData;
  }

  if (loadingDraft) {
    return (
      <div className="an-stepper">
        <div className="an-stepper-loading">Chargement du brouillon...</div>
      </div>
    );
  }

  return (
    <div className="an-stepper">
      {/* Macro step navigation */}
      <div className="an-stepper-nav">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === macroIndex;
          const isCompleted = completedMacros.has(idx) && !isActive;
          const isLocked = !isActive && !completedMacros.has(idx);

          return (
            <button
              key={idx}
              className={`an-stepper-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}${isLocked ? ' locked' : ''}`}
              onClick={() => handleMacroClick(idx)}
            >
              <span className="an-stepper-step-icon">
                {isCompleted ? <Check size={12} /> : <Icon size={12} />}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Save status + test fill */}
      <div className="an-stepper-save-status">
        <div className="an-test-fill">
          <FlaskConical size={13} />
          {PROFILE_OPTIONS.map((p) => (
            <button key={p.key} className="an-test-fill-btn" onClick={() => handleTestFill(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        {saving ? (
          <span className="an-save-saving">Sauvegarde...</span>
        ) : lastSavedAt ? (
          <span className="an-save-saved">
            Sauvegarde auto. {new Date(lastSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}
      </div>

      {/* Micro step progress bar */}
      {macro.micro.length > 1 && (
        <div className="an-micro-nav">
          <div className="an-micro-tabs">
            {macro.micro.map((_, idx) => (
              <div
                key={idx}
                className={`an-micro-tab${idx < microIndex ? ' completed' : ''}${idx === microIndex ? ' active' : ''}`}
              />
            ))}
          </div>
          <div className="an-micro-status">
            Etape {microIndex + 1} sur {macro.micro.length}
          </div>
        </div>
      )}

      {/* Step header */}
      <div className="an-stepper-header">
        <div className="an-stepper-header-text">
          <h3>{micro.title}</h3>
          <p>{micro.desc}</p>
        </div>
        {macroIndex >= STEPS.length - 2 && formData.scoring?.finalScore != null && (
          <div className="an-stepper-header-score">
            <span className={`an-header-grade ${getGradeColor(formData.scoring.grade)}`}>
              {formData.scoring.grade}
            </span>
            <span className="an-header-score-value">
              {formData.scoring.finalScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="an-stepper-content">
        <StepComponent
          key={micro.field || `${macroIndex}-${microIndex}`}
          ref={stepRef}
          {...stepProps}
        />
      </div>

      {/* Footer navigation */}
      <div className="an-stepper-footer">
        <button
          className="an-stepper-btn"
          onClick={handlePrev}
          disabled={isFirstGlobal}
        >
          <ArrowLeft size={14} /> Precedent
        </button>
        {isLastGlobal ? (
          <button
            className="an-stepper-btn submit"
            onClick={handleSubmitAnalysis}
            disabled={submitting}
          >
            {submitting ? 'Soumission...' : (
              <><Send size={14} /> Soumettre l&apos;analyse</>
            )}
          </button>
        ) : (
          <button
            className="an-stepper-btn primary"
            onClick={handleNext}
          >
            Suivant <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
