import { useState } from 'react';
import { FileText, Building, ClipboardList, Star, ArrowLeft, ArrowRight, Check } from 'lucide-react';

import StepPresentation from './steps/StepPresentation';
import StepAnalyseActif from './steps/StepAnalyseActif';
import StepResume from './steps/StepResume';
import StepScoring from './steps/StepScoring';

const STEPS = [
  {
    label: 'Presentation',
    icon: FileText,
    micro: [
      {
        title: 'Presentation du projet',
        desc: 'Evaluez la qualite et la coherence de la presentation du dossier.',
        Component: StepPresentation,
      },
    ],
  },
  {
    label: "Analyse de l'actif",
    icon: Building,
    micro: [
      {
        title: "Analyse de l'actif immobilier",
        desc: "Analysez l'actif, sa valorisation, son emplacement et les risques associes.",
        Component: StepAnalyseActif,
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

  const macro = STEPS[macroIndex];
  const micro = macro.micro[microIndex];
  const StepComponent = micro.Component;

  const isFirstGlobal = macroIndex === 0 && microIndex === 0;
  const isLastGlobal =
    macroIndex === STEPS.length - 1 &&
    microIndex === macro.micro.length - 1;

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
        <StepComponent project={project} />
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
