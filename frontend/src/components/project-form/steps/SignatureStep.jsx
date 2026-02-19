import { Paperclip } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';

export default function SignatureStep() {
  const consentGiven = useProjectFormStore((s) => s.consentGiven);
  const setConsentGiven = useProjectFormStore((s) => s.setConsentGiven);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  return (
    <div>
      <h3 className="pf-section-title">Téléchargement des documents</h3>
      <div className="pf-dropzone">
        <label className="pf-file-upload-btn" style={{ width: '100%', justifyContent: 'center', padding: '20px', borderWidth: '2px' }}>
          <Paperclip size={16} />
          <span>Déposez vos documents ici ou cliquez pour sélectionner</span>
          <input type="file" multiple />
        </label>
      </div>

      <h3 className="pf-section-title">Consentement</h3>
      <div className={`pf-consent-box ${flags['signature.consent'] ? 'error' : ''}`}>
        <label className="pf-consent-label">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          <span>Je certifie l'exactitude des informations fournies.</span>
        </label>
        {flags['signature.consent'] && (
          <div className="pf-error-message">{flags['signature.consent']}</div>
        )}
      </div>
    </div>
  );
}
