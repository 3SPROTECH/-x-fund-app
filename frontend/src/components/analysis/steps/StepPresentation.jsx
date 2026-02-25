import { useState } from 'react';
import { RichTextEditor } from '../../ui';

export default function StepPresentation() {
  const [investissement, setInvestissement] = useState('');

  return (
    <div className="an-step-section">
      <h4 className="an-step-section-title">Investissement</h4>
      <p className="an-step-section-desc">
        Decrivez la nature de l'investissement, ses objectifs et son positionnement strategique.
      </p>

      <div className="an-step-field">
        <label className="an-step-field-label">
          Description de l'investissement <span className="required">*</span>
        </label>
        <RichTextEditor
          value={investissement}
          onChange={setInvestissement}
          placeholder="Redigez votre description de l'investissement..."
          minHeight={180}
        />
      </div>
    </div>
  );
}
