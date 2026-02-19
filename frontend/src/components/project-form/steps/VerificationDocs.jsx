import { Check, Info, Paperclip, AlertCircle } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';

function DocumentRow({ doc, onUpload, onToggleComment, onUpdateComment }) {
  const statusConfig = {
    empty: { icon: <AlertCircle size={14} />, label: 'À fournir', className: '' },
    uploaded: { icon: <Check size={14} />, label: 'Document chargé', className: 'uploaded' },
    commented: { icon: <Info size={14} />, label: 'Justification à analyser', className: 'commented' },
  };
  const status = statusConfig[doc.status] || statusConfig.empty;

  return (
    <div className={`pf-doc-row ${status.className}`}>
      <div className="pf-doc-row-main">
        <div className="pf-doc-row-info">
          <span className="pf-doc-title">{doc.label}</span>
          <span className={`pf-doc-status-badge ${status.className}`}>
            {status.icon} {status.label}
          </span>
        </div>
        <div className="pf-doc-row-actions">
          <label className="pf-file-upload-btn">
            <Paperclip size={14} />
            <span>Upload</span>
            <input type="file" onChange={(e) => {
              if (e.target.files?.[0]) onUpload(doc.type, e.target.files[0].name);
            }} />
          </label>
          <button type="button" className="pf-action-btn-text" onClick={() => onToggleComment(doc.type)}>
            {doc.showComment ? 'Masquer le commentaire' : 'Je n\'ai pas ce document'}
          </button>
        </div>
      </div>
      {doc.fileName && <div className="pf-doc-filename">Fichier: {doc.fileName}</div>}
      {doc.showComment && (
        <div className="pf-doc-comment">
          <label>Commentaire / justification</label>
          <textarea
            rows={2}
            value={doc.comment}
            onChange={(e) => onUpdateComment(doc.type, e.target.value)}
            placeholder="Expliquez pourquoi ce document n'est pas encore disponible..."
          />
        </div>
      )}
    </div>
  );
}

export default function VerificationDocs() {
  const assets = useProjectFormStore((s) => s.assets);
  const selectedAssetIndex = useProjectFormStore((s) => s.selectedAssetIndex);
  const updateDocStatus = useProjectFormStore((s) => s.updateDocStatus);
  const toggleDocComment = useProjectFormStore((s) => s.toggleDocComment);

  const asset = assets[selectedAssetIndex];
  if (!asset) return null;

  const docs = asset.documents;
  const uploaded = docs.filter((d) => d.status === 'uploaded').length;
  const commented = docs.filter((d) => d.status === 'commented').length;
  const pending = docs.filter((d) => d.status === 'empty').length;

  const requiredDocs = docs.filter((d) => d.required);
  const optionalDocs = docs.filter((d) => !d.required);

  const handleUpload = (type, fileName) => {
    updateDocStatus(type, 'fileName', fileName);
  };

  const handleCommentUpdate = (type, value) => {
    updateDocStatus(type, 'comment', value);
  };

  return (
    <div>
      <div className="pf-trust-dashboard">
        <div className="pf-trust-kpi">
          <div className="pf-trust-kpi-label">Documents chargés</div>
          <div className="pf-trust-kpi-value">{uploaded}</div>
        </div>
        <div className="pf-trust-kpi">
          <div className="pf-trust-kpi-label">Justifications à revoir</div>
          <div className="pf-trust-kpi-value">{commented}</div>
        </div>
        <div className="pf-trust-kpi">
          <div className="pf-trust-kpi-label">Documents manquants</div>
          <div className="pf-trust-kpi-value">{pending}</div>
        </div>
      </div>

      <h3 className="pf-section-title">Documents Requis</h3>
      {requiredDocs.map((doc) => (
        <DocumentRow
          key={doc.type}
          doc={doc}
          onUpload={handleUpload}
          onToggleComment={toggleDocComment}
          onUpdateComment={handleCommentUpdate}
        />
      ))}

      {optionalDocs.length > 0 && (
        <>
          <h3 className="pf-section-title">Documents Optionnels</h3>
          {optionalDocs.map((doc) => (
            <DocumentRow
              key={doc.type}
              doc={doc}
              onUpload={handleUpload}
              onToggleComment={toggleDocComment}
              onUpdateComment={handleCommentUpdate}
            />
          ))}
        </>
      )}
    </div>
  );
}
