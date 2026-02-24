import { Paperclip, FileText } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import { getContractBlocks } from '../../../utils/contractGenerator';

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
  const blocks = getContractBlocks(projectAttrs);

  return (
    <div style={{ fontFamily: 'var(--font)', color: '#111', lineHeight: 1.6, fontSize: '14px', letterSpacing: 0, maxWidth: '174mm', margin: '0 auto' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'hr') {
          return <hr key={idx} style={{ border: 0, borderTop: '1px solid #d6d6d6', margin: '0.75rem 0' }} />;
        }

        if (block.type === 'h1') {
          return <p key={idx} style={{ margin: '0 0 0.55rem 0', fontWeight: 700, fontSize: '1.1rem' }}>{block.text}</p>;
        }

        if (block.type === 'h2') {
          return <p key={idx} style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>{block.text}</p>;
        }

        if (block.type === 'h3' || block.type === 'article') {
          return <p key={idx} style={{ margin: '0.55rem 0 0.45rem 0', fontWeight: 700 }}>{block.text}</p>;
        }

        const isBullet = block.type === 'li';
        const segments = block.segments || [{ text: block.text || '', bold: false }];

        return (
          <p key={idx} style={{ margin: '0 0 0.4rem 0', paddingLeft: isBullet ? '1.2rem' : 0, textIndent: isBullet ? '-0.8rem' : 0 }}>
            {isBullet ? '* ' : ''}
            {segments.map((seg, sidx) => (
              <span key={sidx} style={{ fontWeight: seg.bold ? 700 : 400 }}>{seg.text}</span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ContractView({ projectAttrs }) {
  return (
    <div className="contract-view">
      <h3 className="pf-section-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={18} /> Convention de partenariat
      </h3>
      <ContractNarrative projectAttrs={projectAttrs} />
    </div>
  );
}
