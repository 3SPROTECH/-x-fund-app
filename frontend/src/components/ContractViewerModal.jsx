import { useState } from 'react';
import { X, Download, FileText, Send } from 'lucide-react';
import { generateContractPdf, getContractBlocks, getContractBase64 } from '../utils/contractGenerator';
import '../styles/report-viewer.css';

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
    if (!window.confirm('Envoyer le contrat via YouSign ? Vous serez redirige pour signer en premier, puis le porteur recevra le contrat.')) return;
    setSending(true);
    try {
      // Generate the PDF as base64 and pass it to the parent handler
      const pdfBase64 = getContractBase64(a);
      await onSendToOwner(pdfBase64);
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
              <h2 className="rv-title">Convention de partenariat</h2>
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
                {sending ? 'Envoi via YouSign...' : 'Envoyer & Signer (YouSign)'}
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
