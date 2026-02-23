import { useState } from 'react';
import { Paperclip, FileText, Download, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import { generateContractPdf, getContractBlocks } from '../../../utils/contractGenerator';

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
  const [downloading, setDownloading] = useState(false);

  const a = projectAttrs?.attributes || projectAttrs || {};
  const signatureLink = a.yousign_signature_link;
  const yousignStatus = a.yousign_status;
  const isSigned = yousignStatus === 'done' || yousignStatus === 'signer_done';

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

  const handleSign = () => {
    if (signatureLink) {
      window.open(signatureLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="contract-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="pf-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} /> Convention de partenariat
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

      {/* Signing status banner */}
      {isSigned ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px', color: '#065f46'
        }}>
          <CheckCircle size={20} />
          <div>
            <strong>Contrat signe</strong>
            <span style={{ display: 'block', fontSize: '0.85rem', opacity: 0.8 }}>
              Vous avez signe le contrat avec succes via YouSign.
            </span>
          </div>
        </div>
      ) : signatureLink ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '10px', color: '#1e40af'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} />
            <div>
              <strong>Signature requise</strong>
              <span style={{ display: 'block', fontSize: '0.85rem', opacity: 0.8 }}>
                Veuillez consulter le contrat ci-dessous puis cliquer sur « Signer le contrat » pour proceder a la signature electronique.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSign}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)'; }}
          >
            <ExternalLink size={16} /> Signer le contrat
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '10px', color: '#92400e'
        }}>
          <Clock size={20} />
          <div>
            <strong>En attente</strong>
            <span style={{ display: 'block', fontSize: '0.85rem', opacity: 0.8 }}>
              Le contrat est en cours de preparation. Vous recevrez un email lorsqu'il sera pret a signer.
            </span>
          </div>
        </div>
      )}

      <ContractNarrative projectAttrs={projectAttrs} />
    </div>
  );
}
