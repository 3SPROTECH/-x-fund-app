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
    title: 'Presentation du projet',
    desc: 'Evaluez la qualite et la coherence de la presentation du dossier.',
    Component: StepPresentation,
  },
  {
    label: "Analyse de l'actif",
    icon: Building,
    title: "Analyse de l'actif immobilier",
    desc: "Analysez l'actif, sa valorisation, son emplacement et les risques associes.",
    Component: StepAnalyseActif,
  },
  {
    label: 'Resume',
    icon: ClipboardList,
    title: 'Resume et synthese',
    desc: 'Redigez la synthese de votre analyse avec les points cles.',
    Component: StepResume,
  },
  {
    label: 'Scoring',
    icon: Star,
    title: 'Scoring et decision',
    desc: 'Attribuez les scores et prenez votre decision finale.',
    Component: StepScoring,
  },
];

export default function AnalysisStepper({ project }) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const StepComponent = step.Component;
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  const handleNext = () => {
    if (!isLast) setCurrentStep((s) => s + 1);
  };

  return (
    <div className="an-stepper">
      {/* Macro step navigation */}
      <div className="an-stepper-nav">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;

          return (
            <button
              key={idx}
              className={`an-stepper-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
              onClick={() => setCurrentStep(idx)}
            >
              <span className="an-stepper-step-icon">
                {isCompleted ? <Check size={12} /> : <Icon size={12} />}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Step header */}
      <div className="an-stepper-header">
        <h3>{step.title}</h3>
        <p>{step.desc}</p>
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
          disabled={isFirst}
        >
          <ArrowLeft size={14} /> Precedent
        </button>
        <button
          className="an-stepper-btn primary"
          onClick={handleNext}
          disabled={isLast}
        >
          Suivant <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
