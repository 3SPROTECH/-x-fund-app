import { useState, useRef, useCallback } from 'react';
import { FileText, Building, ClipboardList, Star, ArrowLeft, ArrowRight, Check } from 'lucide-react';

import StepRichText from './steps/StepRichText';
import StepSwotField from './steps/StepSwotField';
import StepResume from './steps/StepResume';
import StepScoring from './steps/StepScoring';

const STEPS = [
  {
    label: 'Presentation',
    icon: FileText,
    micro: [
      {
        title: "Opportunité & Stratégie d'Investissement",
        desc: "Résumez l’essence du projet : la nature de l’opération (marchand de biens, promotion), la stratégie de création de valeur (division, rénovation) et l’état d’avancement administratif (permis, diagnostics).",
        Component: StepRichText,
        field: 'investissement',
        props: {
          fieldLabel: "Description de l'investissement",
          placeholder: "Redigez votre description de l'investissement...",
        },
      },
      {
        title: 'Présentation du Porteur de Projet',
        desc: "Présentez l'émetteur de l'offre. Cette section doit détailler l'identité juridique de la société, la structure de son actionnariat et, surtout, le 'track-record' (l'historique) des dirigeants.",
        Component: StepRichText,
        field: 'porteur_du_projet',
        props: {
          fieldLabel: 'Analyse du porteur du projet',
          placeholder: 'Redigez votre analyse du porteur du projet...',
        },
      },
      {
        title: 'Localisation et Analyse du Marché',
        desc: "Détaillez l'emplacement précis du bien et le contexte économique local. L'objectif est de justifier la liquidité du projet : pourquoi y a-t-il une demande pour ce type de bien à cet endroit précis ? Mentionnez les points d'intérêt, les tendances du marché et les avis de valeur.",
        Component: StepRichText,
        field: 'localisation',
        props: {
          fieldLabel: 'Analyse de la localisation',
          placeholder: 'Redigez votre analyse de la localisation...',
        },
      },
      {
        title: 'Montage Financier et Rentabilité',
        desc: "Présentez l'équilibre financier de l'opération. Détaillez d'une part les 'Emplois' (coûts d'acquisition, travaux, frais) et d'autre part les 'Ressources' (apport personnel, levée de fonds). Concluez sur la marge prévisionnelle et les hypothèses de revente pour démontrer la rentabilité du projet.",
        Component: StepRichText,
        field: 'structure_financiere',
        props: {
          fieldLabel: 'Analyse de la structure financiere',
          placeholder: 'Redigez votre analyse de la structure financiere...',
        },
      },
      {
        title: "Sûretés et Garanties de l'Investissement",
        desc: "Détaillez l'ensemble des mécanismes de protection activés pour cette opération. Précisez les garanties réelles (hypothèque), les garanties personnelles (caution) et les mécanismes de contrôle (séquestre, open banking).",
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
        desc: "Identifiez et détaillez les atouts majeurs de l'actif. Chaque point doit mettre en lumière un avantage concret : qualité de l'emplacement, état du bien, rendement locatif, etc.",
        Component: StepSwotField,
        field: 'forces',
        props: {
          addLabel: 'Ajouter une force',
          titlePlaceholder: 'Ex: Emplacement premium en centre-ville',
          descPlaceholder: 'Détaillez en quoi cet élément constitue un atout pour le projet...',
        },
      },
      {
        title: "Faiblesses de l'actif",
        desc: "Relevez les points de vigilance et les faiblesses identifiées. Soyez précis sur les risques internes : travaux nécessaires, contraintes techniques, défauts structurels, etc.",
        Component: StepSwotField,
        field: 'faiblesses',
        props: {
          addLabel: 'Ajouter une faiblesse',
          titlePlaceholder: 'Ex: Travaux de toiture nécessaires',
          descPlaceholder: 'Détaillez en quoi cet élément représente un risque ou une faiblesse...',
        },
      },
      {
        title: "Opportunités de l'actif",
        desc: "Identifiez les facteurs externes favorables au projet. Projets d'infrastructure à proximité, dynamisme du marché local, évolutions réglementaires positives, etc.",
        Component: StepSwotField,
        field: 'opportunites',
        props: {
          addLabel: 'Ajouter une opportunité',
          titlePlaceholder: 'Ex: Projet de tramway à proximité',
          descPlaceholder: "Décrivez comment cette opportunité peut bénéficier au projet...",
        },
      },
      {
        title: "Menaces de l'actif",
        desc: "Signalez les risques externes pouvant impacter le projet. Évolution défavorable du marché, concurrence accrue, changements réglementaires, aléas environnementaux, etc.",
        Component: StepSwotField,
        field: 'menaces',
        props: {
          addLabel: 'Ajouter une menace',
          titlePlaceholder: 'Ex: Saturation du marché locatif local',
          descPlaceholder: 'Décrivez comment cette menace pourrait impacter le projet...',
        },
      },
    ],
  },
  {
    label: 'Resume',
    icon: ClipboardList,
    micro: [
      {
        title: 'Resume et synthese',
        desc: 'Redigez la synthese de votre analyse avec les points cles.',
        Component: StepResume,
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
      },
    ],
  },
];

export default function AnalysisStepper({ project }) {
  const [macroIndex, setMacroIndex] = useState(0);
  const [microIndex, setMicroIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const stepRef = useRef();

  const macro = STEPS[macroIndex];
  const micro = macro.micro[microIndex];
  const StepComponent = micro.Component;

  const isFirstGlobal = macroIndex === 0 && microIndex === 0;
  const isLastGlobal =
    macroIndex === STEPS.length - 1 &&
    microIndex === macro.micro.length - 1;

  const handleFieldChange = useCallback(
    (fieldName) => (value) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    },
    [],
  );

  const handlePrev = () => {
    if (microIndex > 0) {
      setMicroIndex((i) => i - 1);
    } else if (macroIndex > 0) {
      const prevMacro = STEPS[macroIndex - 1];
      setMacroIndex((i) => i - 1);
      setMicroIndex(prevMacro.micro.length - 1);
    }
  };

  const handleNext = () => {
    if (stepRef.current?.validate && !stepRef.current.validate()) {
      return;
    }

    if (microIndex < macro.micro.length - 1) {
      setMicroIndex((i) => i + 1);
    } else if (macroIndex < STEPS.length - 1) {
      setMacroIndex((i) => i + 1);
      setMicroIndex(0);
    }
  };

  const handleMacroClick = (idx) => {
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

  return (
    <div className="an-stepper">
      {/* Macro step navigation */}
      <div className="an-stepper-nav">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === macroIndex;
          const isCompleted = idx < macroIndex;

          return (
            <button
              key={idx}
              className={`an-stepper-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
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
        <h3>{micro.title}</h3>
        <p>{micro.desc}</p>
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
        <button
          className="an-stepper-btn primary"
          onClick={handleNext}
          disabled={isLastGlobal}
        >
          Suivant <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
