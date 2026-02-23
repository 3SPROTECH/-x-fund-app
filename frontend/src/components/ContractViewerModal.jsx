import { useState } from 'react';
import { X, Download, FileText, Send } from 'lucide-react';
import { generateContractPdf, getContractNarrative } from '../utils/contractGenerator';
import '../styles/report-viewer.css';

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

export default function ContractViewerModal({ projectAttrs, onClose, onSendToOwner, showSendButton = false }) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  if (!projectAttrs) return null;

  const a = projectAttrs;

  const handleDownload = () => {
    setDownloading(true);
    try {
      generateContractPdf(a);
    } catch (e) {
      console.error('Contract PDF generation error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleSend = async () => {
    if (!window.confirm('Envoyer le contrat au porteur ? Le statut du projet sera mis a jour en "En Signature".')) return;
    setSending(true);
    try {
      await onSendToOwner();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rv-overlay" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rv-header">
          <div className="rv-header-left">
            <FileText size={20} />
            <div>
              <h2 className="rv-title">Contrat d'investissement</h2>
              <p className="rv-subtitle">{a.title || 'Projet'}</p>
            </div>
          </div>
          <div className="rv-header-actions">
            <button className="rv-btn rv-btn-gold" onClick={handleDownload} disabled={downloading}>
              <Download size={16} />
              {downloading ? 'Generation...' : 'Telecharger PDF'}
            </button>
            {showSendButton && onSendToOwner && (
              <button
                className="rv-btn rv-btn-gold"
                onClick={handleSend}
                disabled={sending}
                style={{ background: 'var(--rv-emerald, #10b981)' }}
              >
                <Send size={16} />
                {sending ? 'Envoi...' : 'Envoyer au Porteur'}
              </button>
            )}
            <button className="rv-btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="rv-content">
          <ContractNarrative projectAttrs={projectAttrs} />
        </div>
      </div>
    </div>
  );
}
