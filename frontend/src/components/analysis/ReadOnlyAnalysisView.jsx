import { CheckCircle } from 'lucide-react';
import StepSummary from './steps/StepSummary';

export default function ReadOnlyAnalysisView({ formData, loading }) {
  if (loading || !formData) {
    return (
      <div className="an-stepper">
        <div className="an-stepper-loading">
          {loading ? "Chargement de l'analyse..." : "Aucune analyse disponible."}
        </div>
      </div>
    );
  }

  return (
    <div className="an-stepper">
      <div className="an-readonly-banner">
        <CheckCircle size={16} />
        <span>Analyse soumise — Mode consultation</span>
      </div>

      <div className="an-stepper-content">
        <StepSummary formData={formData} />
      </div>
    </div>
  );
}
