import { useState } from 'react';
import { Paperclip, FileText, Download } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import { generateContractPdf, getContractNarrative } from '../../../utils/contractGenerator';

export default function SignatureStep() {
  const consentGiven = useProjectFormStore((s) => s.consentGiven);
  const setConsentGiven = useProjectFormStore((s) => s.setConsentGiven);
  const flags = useProjectFormStore((s) => s.flaggedFields);
  const projectStatus = useProjectFormStore((s) => s.projectStatus);
  const projectAttrs = useProjectFormStore((s) => s.projectAttributes);

  if (projectStatus === 'signing' && projectAttrs) {
    return <ContractView projectAttrs={projectAttrs} />;
  }

  return (
    <div>
      <h3 className="pf-section-title">Telechargement des documents</h3>
      <div className="pf-dropzone">
        <label className="pf-file-upload-btn" style={{ width: '100%', justifyContent: 'center', padding: '20px', borderWidth: '2px' }}>
          <Paperclip size={16} />
          <span>Deposez vos documents ici ou cliquez pour selectionner</span>
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

function ContractNarrative({ projectAttrs }) {
  const narrative = getContractNarrative(projectAttrs);

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", color: '#111', lineHeight: 1.65, fontSize: '15px' }}>
      <p style={{ margin: '0 0 0.75rem 0', fontWeight: 700, letterSpacing: '0.02em' }}>{narrative.title}</p>
      <p style={{ margin: '0 0 0.75rem 0' }}>{narrative.reference}</p>
      <p style={{ margin: '0 0 1rem 0' }}>{narrative.intro}</p>

      {narrative.sections.map((section) => (
        <div key={section.heading} style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>{section.heading}</p>
          {section.paragraphs.map((paragraph, idx) => (
            <p key={`${section.heading}-${idx}`} style={{ margin: '0 0 0.55rem 0' }}>{paragraph}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function ContractView({ projectAttrs }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    try {
      generateContractPdf(projectAttrs);
    } catch (e) {
      console.error('Contract PDF generation error:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="contract-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="pf-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} /> Contrat d'investissement
        </h3>
        <button
          type="button"
          className="pf-nav-btn pf-btn-next"
          onClick={handleDownload}
          disabled={downloading}
          style={{ padding: '0.5rem 1rem' }}
        >
          <Download size={16} /> {downloading ? 'Generation...' : 'Telecharger PDF'}
        </button>
      </div>

      <ContractNarrative projectAttrs={projectAttrs} />
    </div>
  );
}
