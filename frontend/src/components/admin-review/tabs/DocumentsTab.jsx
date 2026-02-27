import { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { getImageUrl } from '../../../api/client';
import DocumentViewer from '../../analysis/DocumentViewer';
import '../../../styles/analysis.css';

/* ── Document builders (same logic as analyst TabDocuments) ── */

function buildVerificationDocs(asset) {
  return (asset?.documents || []).map((doc, i) => ({
    type: `verif_${i}`,
    label: doc.label || `Document de verification ${i + 1}`,
    status: doc.status === 'uploaded' ? 'uploaded' : doc.fileName ? 'uploaded' : 'warning',
    fileName: doc.fileName || '',
    required: doc.required || false,
  }));
}

function buildCostDocs(asset) {
  return (asset?.costs?.items || []).map(item => ({
    type: `cost_${item.id}`,
    label: `Justificatif — ${item.label || 'Poste de depense'}`,
    status: item.hasJustificatif && item.justificatifName ? 'uploaded' : 'warning',
    fileName: item.justificatifName || '',
    required: false,
  }));
}

function buildLotDocs(asset) {
  return (asset?.lots || []).flatMap((lot, idx) => {
    const docs = [];
    if (lot.preCommercialized === 'oui') {
      docs.push({
        type: `lot_promesse_${lot.id}`,
        label: `Lot ${idx + 1} — Promesse de vente`,
        status: lot.promesseFileName ? 'uploaded' : 'warning',
        fileName: lot.promesseFileName || '',
        required: false,
      });
    }
    if (lot.rented === 'oui') {
      docs.push({
        type: `lot_bail_${lot.id}`,
        label: `Lot ${idx + 1} — Bail`,
        status: lot.bailFileName ? 'uploaded' : 'warning',
        fileName: lot.bailFileName || '',
        required: false,
      });
    }
    return docs;
  });
}

function buildProofDoc(projections) {
  return [{
    type: 'proof_of_funds',
    label: 'Preuve des fonds propres',
    status: projections?.proofFileName ? 'uploaded' : 'warning',
    fileName: projections?.proofFileName || '',
    required: false,
  }];
}

function buildProjectDocs(attrs) {
  return (attrs.project_documents || []).map((doc, i) => ({
    type: `proj_doc_${doc.id || i}`,
    label: doc.filename || `Document projet ${i + 1}`,
    status: 'uploaded',
    fileName: doc.filename || '',
    required: false,
  }));
}

/* ── Sub-components ── */

function AssetSelector({ assets, selected, onSelect }) {
  if (assets.length <= 1) return null;
  return (
    <div className="apr-doc-asset-tabs">
      {assets.map((asset, idx) => (
        <button
          key={asset.id || idx}
          className={`apr-doc-asset-tab${idx === selected ? ' active' : ''}`}
          onClick={() => onSelect(idx)}
        >
          {asset.label || `Actif ${idx + 1}`}
        </button>
      ))}
    </div>
  );
}

function DocSection({ title, docs, onOpenDocument }) {
  if (!docs || docs.length === 0) return null;

  return (
    <div className="apr-doc-section">
      <div className="apr-doc-section-title">{title} ({docs.length})</div>
      {docs.map((doc) => {
        const isUploaded = doc.status === 'uploaded' && doc.fileName;
        const StatusIcon = isUploaded ? CheckCircle : AlertTriangle;
        const statusClass = isUploaded ? 'uploaded' : 'warning';
        const statusLabel = isUploaded ? 'Charge' : 'Non fourni';

        return (
          <div
            className={`apr-doc${isUploaded ? ' apr-doc-clickable' : ''}`}
            key={doc.type}
            onClick={isUploaded ? () => onOpenDocument({ label: doc.label, fileName: doc.fileName }) : undefined}
          >
            <div className={`apr-doc-ico apr-doc-ico-${statusClass}`}>
              <StatusIcon size={14} />
            </div>
            <div className="apr-doc-info">
              <div className="apr-doc-name">
                {doc.label}
                {doc.required && <span style={{ color: 'var(--apr-red, #e53935)', marginLeft: 4 }}>*</span>}
              </div>
              <div className="apr-doc-meta">
                {statusLabel}
                {doc.fileName && ` — ${doc.fileName}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */

export default function DocumentsTab({ project }) {
  const attrs = project?.attributes || project || {};
  const snapshot = attrs.form_snapshot || {};
  const assets = snapshot.assets || [];
  const projections = snapshot.projections || {};
  const [subTab, setSubTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(0);
  const [activeDocument, setActiveDocument] = useState(null);

  // Build filename→url lookup from API-served attachments
  const fileUrlMap = useMemo(() => {
    const map = {};
    const sources = [
      ...(attrs.photos || []),
      ...(attrs.images || []),
      ...(attrs.property_photos || []),
      ...(attrs.documents || []),
      ...(attrs.project_documents || []),
    ];
    for (const file of sources) {
      if (file.filename && file.url) {
        map[file.filename] = file.url;
      }
    }
    return map;
  }, [project]);

  const handleOpenDocument = (doc) => {
    const rawUrl = doc.url || fileUrlMap[doc.fileName] || null;
    const url = rawUrl ? getImageUrl(rawUrl) : null;
    setActiveDocument({ ...doc, url });
  };

  // If viewing a document, show the previewer
  if (activeDocument) {
    return (
      <div className="apr-panel active">
        <DocumentViewer
          document={activeDocument}
          onBack={() => setActiveDocument(null)}
        />
      </div>
    );
  }

  // Build document lists for current asset
  const asset = assets[selectedAsset] || assets[0];
  const verificationDocs = asset ? buildVerificationDocs(asset) : [];
  const costDocs = asset ? buildCostDocs(asset) : [];
  const lotDocs = asset ? buildLotDocs(asset) : [];
  const proofDocs = buildProofDoc(projections);
  const guaranteeDocs = asset?.guaranteeDocs || [];
  const projectDocs = buildProjectDocs(attrs);

  const SUB_TABS = [
    { label: 'Justificatifs' },
    { label: 'Preuves garanties' },
  ];

  return (
    <div className="apr-panel active">
      <div className="apr-card">
        <div className="apr-card-h">
          <div className="apr-card-h-left">
            <div className="apr-card-icon"><FileText size={14} /></div>
            <span className="apr-card-t">Documents du projet</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="apr-doc-subtabs">
          {SUB_TABS.map((t, i) => (
            <button
              key={i}
              className={`apr-doc-subtab${subTab === i ? ' active' : ''}`}
              onClick={() => setSubTab(i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="apr-card-b">
          {assets.length === 0 && subTab !== 1 ? (
            <div className="apr-empty">
              <FileText size={28} style={{ opacity: 0.25, marginBottom: 6 }} /><br />
              Aucun actif renseigne pour ce projet.
            </div>
          ) : subTab === 0 ? (
            <>
              <AssetSelector assets={assets} selected={selectedAsset} onSelect={setSelectedAsset} />
              <DocSection title="Documents de verification" docs={verificationDocs} onOpenDocument={handleOpenDocument} />
              {costDocs.length > 0 && (
                <DocSection title="Justificatifs de depenses" docs={costDocs} onOpenDocument={handleOpenDocument} />
              )}
              {lotDocs.length > 0 && (
                <DocSection title="Documents des lots" docs={lotDocs} onOpenDocument={handleOpenDocument} />
              )}
              <DocSection title="Preuve de fonds" docs={proofDocs} onOpenDocument={handleOpenDocument} />
              {projectDocs.length > 0 && (
                <DocSection title="Documents du projet" docs={projectDocs} onOpenDocument={handleOpenDocument} />
              )}
            </>
          ) : (
            <>
              <AssetSelector assets={assets} selected={selectedAsset} onSelect={setSelectedAsset} />
              {guaranteeDocs.length > 0 ? (
                <DocSection title="Preuves de garanties" docs={guaranteeDocs} onOpenDocument={handleOpenDocument} />
              ) : (
                <div className="apr-empty">
                  <Shield size={28} style={{ opacity: 0.25, marginBottom: 6 }} /><br />
                  Aucune preuve de garantie pour cet actif.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
