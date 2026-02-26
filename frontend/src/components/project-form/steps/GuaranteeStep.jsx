import { Check, Info, AlertCircle, Paperclip } from 'lucide-react';
import FormSelect from '../../FormSelect';
import useProjectFormStore, {
  GUARANTEE_TYPES,
  HYPOTHEQUE_RANKS,
} from '../../../stores/useProjectFormStore';

function GuaranteeDocRow({ doc, onUpload, onToggleComment, onUpdateComment }) {
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
              const f = e.target.files?.[0];
              if (f) onUpload(doc.type, f.name, f);
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

export default function GuaranteeStep() {
  const assets = useProjectFormStore((s) => s.assets);
  const selectedAssetIndex = useProjectFormStore((s) => s.selectedAssetIndex);
  const updateAssetGuarantee = useProjectFormStore((s) => s.updateAssetGuarantee);
  const updateGuaranteeDoc = useProjectFormStore((s) => s.updateGuaranteeDoc);
  const toggleGuaranteeDocComment = useProjectFormStore((s) => s.toggleGuaranteeDocComment);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  const asset = assets[selectedAssetIndex];

  if (!asset) return null;

  const guarantee = asset.guarantee || {};
  const guaranteeDocs = asset.guaranteeDocs || [];

  const showRank = guarantee.type === 'hypotheque';
  const showGuarantor = ['caution_personnelle', 'garantie_corporate', 'garantie_premiere_demande'].includes(guarantee.type);

  const requiredDocs = guaranteeDocs.filter((d) => d.required);
  const optionalDocs = guaranteeDocs.filter((d) => !d.required);
  const uploaded = guaranteeDocs.filter((d) => d.status === 'uploaded').length;
  const commented = guaranteeDocs.filter((d) => d.status === 'commented').length;
  const pending = guaranteeDocs.filter((d) => d.status === 'empty').length;

  const addDocumentFile = useProjectFormStore((s) => s.addDocumentFile);

  const handleDocUpload = (docType, fileName, file) => {
    updateGuaranteeDoc(docType, 'fileName', fileName);
    if (file) addDocumentFile(fileName, file);
  };

  const handleDocComment = (docType, value) => {
    updateGuaranteeDoc(docType, 'comment', value);
  };

  return (
    <div>
      <h3 className="pf-section-title">Type de garantie</h3>
      <div className="pf-form-grid">
        <div className="pf-form-group">
          <label>Type de garantie *</label>
          <FormSelect
            value={guarantee.type}
            onChange={(e) => updateAssetGuarantee('type', e.target.value)}
            options={GUARANTEE_TYPES}
            placeholder="Sélectionnez..."
            className={flags['guarantee.type'] ? 'error' : ''}
          />
          {flags['guarantee.type'] && (
            <div className="pf-error-message">{flags['guarantee.type']}</div>
          )}
        </div>

        {showRank && (
          <div className="pf-form-group">
            <label>Rang de l'hypothèque *</label>
            <FormSelect
              value={guarantee.rank}
              onChange={(e) => updateAssetGuarantee('rank', e.target.value)}
              options={HYPOTHEQUE_RANKS}
              placeholder="Sélectionnez..."
              className={flags['guarantee.rank'] ? 'error' : ''}
            />
            {flags['guarantee.rank'] && (
              <div className="pf-error-message">{flags['guarantee.rank']}</div>
            )}
          </div>
        )}
      </div>

      {showGuarantor && (
        <>
          <h3 className="pf-section-title">Garant</h3>
          <div className="pf-form-grid full">
            <div className="pf-form-group full">
              <label>Nom du garant</label>
              <input
                type="text"
                value={guarantee.guarantor || ''}
                onChange={(e) => updateAssetGuarantee('guarantor', e.target.value)}
                placeholder="Nom de la personne ou entité garante"
              />
            </div>
          </div>
        </>
      )}

      {guarantee.type && (
        <>
          <h3 className="pf-section-title">Description</h3>
          <div className="pf-form-grid full">
            <div className="pf-form-group full">
              <label>Description détaillée de la garantie</label>
              <textarea
                rows={3}
                value={guarantee.description || ''}
                onChange={(e) => updateAssetGuarantee('description', e.target.value)}
                placeholder="Décrivez les conditions et détails de la garantie..."
              />
            </div>
          </div>
        </>
      )}

      {guaranteeDocs.length > 0 && (
        <>
          <h3 className="pf-section-title">Documents justificatifs</h3>

          <div className="pf-trust-dashboard">
            <div className="pf-trust-kpi">
              <div className="pf-trust-kpi-label">Documents chargés</div>
              <div className="pf-trust-kpi-value">{uploaded}</div>
            </div>
            <div className="pf-trust-kpi">
              <div className="pf-trust-kpi-label">Justifications</div>
              <div className="pf-trust-kpi-value">{commented}</div>
            </div>
            <div className="pf-trust-kpi">
              <div className="pf-trust-kpi-label">Manquants</div>
              <div className="pf-trust-kpi-value">{pending}</div>
            </div>
          </div>

          {flags['guarantee.docs'] && (
            <div className="pf-error-message" style={{ marginBottom: '1rem' }}>{flags['guarantee.docs']}</div>
          )}

          {requiredDocs.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '1rem 0 0.5rem', color: 'var(--text-muted)' }}>Requis</h4>
              {requiredDocs.map((doc) => (
                <GuaranteeDocRow
                  key={doc.type}
                  doc={doc}
                  onUpload={handleDocUpload}
                  onToggleComment={toggleGuaranteeDocComment}
                  onUpdateComment={handleDocComment}
                />
              ))}
            </>
          )}

          {optionalDocs.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '1rem 0 0.5rem', color: 'var(--text-muted)' }}>Optionnels</h4>
              {optionalDocs.map((doc) => (
                <GuaranteeDocRow
                  key={doc.type}
                  doc={doc}
                  onUpload={handleDocUpload}
                  onToggleComment={toggleGuaranteeDocComment}
                  onUpdateComment={handleDocComment}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
