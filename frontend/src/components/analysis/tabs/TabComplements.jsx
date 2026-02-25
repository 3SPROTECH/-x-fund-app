import { useState } from 'react';
import {
  Plus, Trash2, Send, Type, AlignLeft, Hash, Upload,
  CheckCircle, Clock, Eye, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analysteApi } from '../../../api/analyste';
import client from '../../../api/client';

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court', icon: Type },
  { value: 'textarea', label: 'Texte long', icon: AlignLeft },
  { value: 'number', label: 'Nombre', icon: Hash },
  { value: 'file', label: 'Fichier', icon: Upload },
];

const FIELD_TYPE_LABELS = {
  text: 'Texte', textarea: 'Texte long', number: 'Nombre', file: 'Fichier',
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', className: 'an-status-pending', icon: Clock },
  submitted: { label: 'Repondu', className: 'an-status-submitted', icon: CheckCircle },
  reviewed: { label: 'Examine', className: 'an-status-reviewed', icon: Eye },
};

/* ─── New request form ─── */

function NouvelleDemande({ projectId, onSubmitted }) {
  const [fields, setFields] = useState([
    { label: '', field_type: 'text', comment: '', required: true },
  ]);
  const [generalComment, setGeneralComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addField = () => {
    setFields((prev) => [...prev, { label: '', field_type: 'text', comment: '', required: true }]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) return;
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));
  };

  const moveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const next = [...fields];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setFields(next);
  };

  const handleSubmit = async () => {
    const empty = fields.filter((f) => !f.label.trim());
    if (empty.length > 0) {
      toast.error('Tous les champs doivent avoir un libelle.');
      return;
    }

    setSubmitting(true);
    try {
      await analysteApi.requestInfo(projectId, fields, generalComment);
      toast.success('Demande de complements envoyee !');
      setFields([{ label: '', field_type: 'text', comment: '', required: true }]);
      setGeneralComment('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* General comment */}
      <div className="an-section">
        <div className="an-section-title">Message pour le porteur (optionnel)</div>
        <textarea
          className="an-irf-textarea"
          value={generalComment}
          onChange={(e) => setGeneralComment(e.target.value)}
          placeholder="Message global pour le porteur de projet..."
          rows={2}
        />
      </div>

      {/* Field builder */}
      <div className="an-section">
        <div className="an-section-title">Champs a remplir ({fields.length})</div>

        <div className="an-irf-fields">
          {fields.map((field, idx) => (
            <div key={idx} className="an-irf-card">
              <div className="an-irf-card-header">
                <span className="an-irf-card-num">{idx + 1}</span>

                <input
                  type="text"
                  className="an-irf-input"
                  placeholder="Libelle du champ..."
                  value={field.label}
                  onChange={(e) => updateField(idx, 'label', e.target.value)}
                />

                <select
                  className="an-irf-select"
                  value={field.field_type}
                  onChange={(e) => updateField(idx, 'field_type', e.target.value)}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <label className="an-irf-required">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                  />
                  Requis
                </label>

                <div className="an-irf-card-actions">
                  <button
                    className="an-irf-icon-btn"
                    onClick={() => moveField(idx, -1)}
                    disabled={idx === 0}
                    title="Monter"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="an-irf-icon-btn"
                    onClick={() => moveField(idx, 1)}
                    disabled={idx === fields.length - 1}
                    title="Descendre"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    className="an-irf-icon-btn danger"
                    onClick={() => removeField(idx)}
                    disabled={fields.length <= 1}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <textarea
                className="an-irf-comment"
                placeholder="Instruction / commentaire pour le porteur..."
                value={field.comment}
                onChange={(e) => updateField(idx, 'comment', e.target.value)}
                rows={1}
              />
            </div>
          ))}
        </div>

        <button className="an-irf-add" onClick={addField}>
          <Plus size={14} /> Ajouter un champ
        </button>
      </div>

      {/* Submit */}
      <div className="an-irf-submit-row">
        <button
          className="an-irf-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Send size={14} />
          {submitting ? 'Envoi...' : 'Envoyer la demande'}
        </button>
      </div>
    </>
  );
}

/* ─── History — requests + responses ─── */

function FileDownloadLink({ projectId, infoRequestId, fieldIndex, fileName }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await client.get(
        `/analyste/projects/${projectId}/info_requests/${infoRequestId}/file/${fieldIndex}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors du telechargement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button className="an-doc-attach" onClick={handleDownload} disabled={downloading} title={`Telecharger ${fileName}`}>
      <Download size={11} />
      {downloading ? 'Telechargement...' : (fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName)}
    </button>
  );
}

function Historique({ infoRequests, projectId }) {
  if (!infoRequests || infoRequests.length === 0) {
    return <div className="an-empty">Aucune demande envoyee pour le moment.</div>;
  }

  return (
    <>
      {infoRequests.map((ir) => {
        const attr = ir.attributes || ir;
        const fields = attr.fields || [];
        const responses = attr.responses || {};
        const responseFileFields = attr.response_file_fields || {};
        const hasResponses = Object.keys(responses).length > 0;
        const config = STATUS_CONFIG[attr.status] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;

        return (
          <div className="an-ir-card" key={ir.id}>
            {/* Header */}
            <div className="an-ir-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`an-status-badge ${config.className}`}>
                  <StatusIcon size={11} />
                  {config.label}
                </span>
                {attr.requested_by_name && (
                  <span className="an-ir-meta">par {attr.requested_by_name}</span>
                )}
              </div>
              <span className="an-ir-meta">
                {attr.created_at ? new Date(attr.created_at).toLocaleDateString('fr-FR') : ''}
              </span>
            </div>

            {/* Fields + responses */}
            {fields.map((field, idx) => {
              const idxStr = String(idx);
              const response = responses[idxStr];
              const isFileField = field.field_type === 'file';
              const hasFile = !!responseFileFields[idxStr];

              return (
                <div className="an-ir-field" key={idx}>
                  <div className="an-ir-field-header">
                    <span className="an-ir-field-label">
                      {field.label}
                      {field.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                    </span>
                    <span className="an-ir-field-type">
                      {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                    </span>
                  </div>
                  {field.comment && (
                    <div className="an-ir-field-comment">{field.comment}</div>
                  )}
                  {hasResponses && (
                    isFileField && hasFile ? (
                      <div className="an-ir-response">
                        <FileDownloadLink
                          projectId={projectId}
                          infoRequestId={ir.id}
                          fieldIndex={idx}
                          fileName={responseFileFields[idxStr]}
                        />
                      </div>
                    ) : (
                      <div className={`an-ir-response${response ? '' : ' empty'}`}>
                        {response || 'Non renseigne'}
                      </div>
                    )
                  )}
                </div>
              );
            })}

            {/* Submission date */}
            {attr.submitted_at && (
              <div className="an-ir-footer">
                Repondu le {new Date(attr.submitted_at).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ─── Main export ─── */

export default function TabComplements({ subTab, projectId, infoRequests, onRefresh }) {
  switch (subTab) {
    case 0:
      return <NouvelleDemande projectId={projectId} onSubmitted={onRefresh} />;
    case 1:
      return <Historique infoRequests={infoRequests} projectId={projectId} />;
    default:
      return <NouvelleDemande projectId={projectId} onSubmitted={onRefresh} />;
  }
}
