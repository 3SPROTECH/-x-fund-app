import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, AlertTriangle, MessageSquare } from 'lucide-react';

const STATUS_CONFIG = {
  uploaded: { icon: CheckCircle, label: 'Chargé', className: 'uploaded' },
  warning: { icon: AlertTriangle, label: 'Non fourni par le porteur', className: 'warning' },
  commented: { icon: MessageSquare, label: 'Commenté', className: '' },
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
        <div className="an-empty">Aucun document dans cette catégorie.</div>
      </div>
    );
  }

  return (
    <div className="an-section">
      <div className="an-section-title">{title} ({docs.length})</div>
      {docs.map((doc) => {
        const effectiveStatus = doc.status === 'uploaded' ? 'uploaded' : 'warning';
        const config = STATUS_CONFIG[effectiveStatus];
        const StatusIcon = config.icon;
        const isClickable = doc.status === 'uploaded' && doc.fileName;

        return (
          <div
            className={`an-doc-item${isClickable ? ' clickable' : ''}`}
            key={doc.type}
            onClick={isClickable ? () => onOpenDocument?.({ label: doc.label, fileName: doc.fileName }) : undefined}
          >
            <div className={`an-doc-icon${config.className ? ` ${config.className}` : ''}`}>
              <StatusIcon size={16} />
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

function buildCostDocs(asset) {
  return (asset?.costs?.items || []).map(item => ({
    type: `cost_${item.id}`,
    label: `Justificatif — ${item.label || 'Poste de dépense'}`,
    required: false,
    status: item.hasJustificatif && item.justificatifName ? 'uploaded' : 'warning',
    fileName: item.justificatifName || '',
  }));
}

function buildLotDocs(asset) {
  return (asset?.lots || []).flatMap((lot, idx) => {
    const docs = [];
    if (lot.preCommercialized === 'oui') {
      docs.push({
        type: `lot_promesse_${lot.id}`,
        label: `Lot ${idx + 1} — Promesse de vente`,
        required: false,
        status: lot.promesseFileName ? 'uploaded' : 'warning',
        fileName: lot.promesseFileName || '',
      });
    }
    if (lot.rented === 'oui') {
      docs.push({
        type: `lot_bail_${lot.id}`,
        label: `Lot ${idx + 1} — Bail`,
        required: false,
        status: lot.bailFileName ? 'uploaded' : 'warning',
        fileName: lot.bailFileName || '',
      });
    }
    return docs;
  });
}

function buildProofDoc(projections) {
  return [{
    type: 'proof_of_funds',
    label: 'Preuve des fonds propres',
    required: false,
    status: projections?.proofFileName ? 'uploaded' : 'warning',
    fileName: projections?.proofFileName || '',
  }];
}

function Justificatifs({ assets, selectedAsset, setSelectedAsset, projections, onOpenDocument }) {
  if (assets.length === 0) {
    return <div className="an-empty">Aucun actif renseigné.</div>;
  }

  const asset = assets[selectedAsset] || assets[0];
  const verificationDocs = asset.documents || [];
  const costDocs = buildCostDocs(asset);
  const lotDocs = buildLotDocs(asset);
  const proofDocs = buildProofDoc(projections);

  return (
    <>
      <AssetSelector assets={assets} selected={selectedAsset} onSelect={setSelectedAsset} />
      <DocList docs={verificationDocs} title="Documents de vérification" onOpenDocument={onOpenDocument} />
      {costDocs.length > 0 && (
        <DocList docs={costDocs} title="Justificatifs de dépenses" onOpenDocument={onOpenDocument} />
      )}
      {lotDocs.length > 0 && (
        <DocList docs={lotDocs} title="Documents des lots" onOpenDocument={onOpenDocument} />
      )}
      <DocList docs={proofDocs} title="Preuve de fonds" onOpenDocument={onOpenDocument} />
    </>
  );
}

function PreuvesGaranties({ assets, selectedAsset, setSelectedAsset, onOpenDocument }) {
  if (assets.length === 0) {
    return <div className="an-empty">Aucun actif renseigné.</div>;
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
  const projections = snapshot.projections || {};
  const [selectedAsset, setSelectedAsset] = useState(0);

  switch (subTab) {
    case 0: return <Justificatifs assets={assets} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} projections={projections} onOpenDocument={onOpenDocument} />;
    case 1: return <PreuvesGaranties assets={assets} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} onOpenDocument={onOpenDocument} />;
    default: return <Justificatifs assets={assets} selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} projections={projections} onOpenDocument={onOpenDocument} />;
  }
}
