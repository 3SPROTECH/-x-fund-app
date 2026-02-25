import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  uploaded: { icon: CheckCircle, label: 'Charge', className: 'uploaded' },
  commented: { icon: MessageSquare, label: 'Commente', className: '' },
  empty: { icon: AlertCircle, label: 'Non fourni', className: '' },
};

function AssetSelector({ assets, selected, onSelect }) {
  if (assets.length <= 1) return null;
  return (
    <div className="an-asset-tabs">
      {assets.map((asset, idx) => (
        <button
          key={asset.id}
          className={`an-asset-tab${idx === selected ? ' active' : ''}`}
          onClick={() => onSelect(idx)}
        >
          {asset.label || `Actif ${idx + 1}`}
        </button>
      ))}
    </div>
  );
}

function DocList({ docs, title, onOpenDocument }) {
  if (!docs || docs.length === 0) {
    return (
      <div className="an-section">
        <div className="an-section-title">{title}</div>
        <div className="an-empty">Aucun document dans cette categorie.</div>
      </div>
    );
  }

  return (
    <div className="an-section">
      <div className="an-section-title">{title} ({docs.length})</div>
      {docs.map((doc) => {
        const config = STATUS_CONFIG[doc.status] || STATUS_CONFIG.empty;
        const isClickable = doc.status === 'uploaded' && doc.fileName;

        return (
          <div
            className={`an-doc-item${isClickable ? ' clickable' : ''}`}
            key={doc.type}
            onClick={isClickable ? () => onOpenDocument?.({ label: doc.label, fileName: doc.fileName }) : undefined}
          >
            <div className={`an-doc-icon${doc.status === 'uploaded' ? ' uploaded' : ''}`}>
              {doc.status === 'uploaded' ? <CheckCircle size={16} /> : <FileText size={16} />}
            </div>
            <div className="an-doc-info">
              <div className="an-doc-name">
                {doc.label}
                {doc.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
              </div>
              <div className="an-doc-meta">
                {config.label}
                {doc.fileName && ` — ${doc.fileName}`}
              </div>
              {doc.comment && (
                <div className="an-doc-meta" style={{ marginTop: 2, fontStyle: 'italic' }}>
                  {doc.comment}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Justificatifs({ assets, selectedAsset, setSelectedAsset, onOpenDocument }) {
  if (assets.length === 0) {
    return <div className="an-empty">Aucun actif renseigne.</div>;
  }

  const asset = assets[selectedAsset] || assets[0];
  const docs = asset.documents || [];

  return (
    <>
      <AssetSelector assets={assets} selected={selectedAsset} onSelect={setSelectedAsset} />
      <DocList docs={docs} title="Documents justificatifs" onOpenDocument={onOpenDocument} />
    </>
  );
}

function PreuvesGaranties({ assets, selectedAsset, setSelectedAsset, onOpenDocument }) {
  if (assets.length === 0) {
    return <div className="an-empty">Aucun actif renseigne.</div>;
  }

  const asset = assets[selectedAsset] || assets[0];
  const docs = asset.guaranteeDocs || [];

  return (
    <>
      <AssetSelector assets={assets} selected={selectedAsset} onSelect={setSelectedAsset} />
      <DocList docs={docs} title="Preuves de garanties" onOpenDocument={onOpenDocument} />
    </>
  );
}

export default function TabDocuments({ subTab, project, onOpenDocument }) {
  const attrs = project?.attributes || project || {};
  const snapshot = attrs.form_snapshot || {};
  const assets = snapshot.assets || [];
  const [selectedAsset, setSelectedAsset] = useState(0);

  switch (subTab) {
    case 0: return <Justificatifs assets={assets} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} onOpenDocument={onOpenDocument} />;
    case 1: return <PreuvesGaranties assets={assets} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} onOpenDocument={onOpenDocument} />;
    default: return <Justificatifs assets={assets} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} onOpenDocument={onOpenDocument} />;
  }
}
