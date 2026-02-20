import { useState } from 'react';
import { analysteApi } from '../api/analyste';
import {
    X, Plus, GripVertical, Trash2, Type, AlignLeft, Hash, Upload,
    MessageSquare, Send, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../pages/demo/demo-analyst.css';

const FIELD_TYPES = [
    { value: 'text', label: 'Texte court', icon: Type },
    { value: 'textarea', label: 'Texte long', icon: AlignLeft },
    { value: 'number', label: 'Nombre', icon: Hash },
    { value: 'file', label: 'Fichier', icon: Upload },
];

export default function InfoRequestForm({ projectId, onClose, onSubmitted }) {
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
        const newFields = [...fields];
        [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
        setFields(newFields);
    };

    const handleSubmit = async () => {
        const emptyLabels = fields.filter((f) => !f.label.trim());
        if (emptyLabels.length > 0) {
            toast.error('Tous les champs doivent avoir un libellé.');
            return;
        }

        setSubmitting(true);
        try {
            await analysteApi.requestInfo(projectId, fields, generalComment);
            toast.success('Demande de compléments envoyée !');
            onSubmitted?.();
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de l\'envoi');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="demo-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="demo-modal">
                <div className="demo-modal-header">
                    <div className="demo-modal-title">
                        <MessageSquare size={18} />
                        <h2>Demander des compléments d'information</h2>
                    </div>
                    <button className="demo-modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="demo-modal-body">
                    <p className="demo-modal-desc">
                        Créez les champs que le porteur de projet devra remplir. Ajoutez un commentaire pour chaque champ si nécessaire.
                    </p>

                    {/* General comment */}
                    <div className="demo-irf-general">
                        <label>
                            <AlertCircle size={14} />
                            Commentaire général (optionnel)
                        </label>
                        <textarea
                            value={generalComment}
                            onChange={(e) => setGeneralComment(e.target.value)}
                            placeholder="Message global pour le porteur de projet..."
                            rows={2}
                        />
                    </div>

                    {/* Field list */}
                    <div className="demo-irf-fields">
                        {fields.map((field, idx) => {
                            const TypeIcon = FIELD_TYPES.find((t) => t.value === field.field_type)?.icon || Type;
                            return (
                                <div key={idx} className="demo-irf-field-card">
                                    <div className="demo-irf-field-drag">
                                        <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="demo-irf-move">&#9650;</button>
                                        <GripVertical size={14} className="demo-irf-grip" />
                                        <button onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} className="demo-irf-move">&#9660;</button>
                                    </div>

                                    <div className="demo-irf-field-content">
                                        <div className="demo-irf-field-row">
                                            <div className="demo-irf-field-main">
                                                <input
                                                    type="text"
                                                    placeholder="Libellé du champ..."
                                                    value={field.label}
                                                    onChange={(e) => updateField(idx, 'label', e.target.value)}
                                                    className="demo-irf-label-input"
                                                />
                                                <select
                                                    value={field.field_type}
                                                    onChange={(e) => updateField(idx, 'field_type', e.target.value)}
                                                    className="demo-irf-type-select"
                                                >
                                                    {FIELD_TYPES.map((t) => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="demo-irf-field-actions">
                                                <label className="demo-irf-required-toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(e) => updateField(idx, 'required', e.target.checked)}
                                                    />
                                                    <span>Requis</span>
                                                </label>
                                                <button
                                                    className="demo-irf-delete-btn"
                                                    onClick={() => removeField(idx)}
                                                    disabled={fields.length <= 1}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <textarea
                                            placeholder="Commentaire / instruction pour le porteur..."
                                            value={field.comment}
                                            onChange={(e) => updateField(idx, 'comment', e.target.value)}
                                            className="demo-irf-comment-input"
                                            rows={2}
                                        />

                                        <div className="demo-irf-preview">
                                            <TypeIcon size={12} />
                                            <span>Aperçu: {field.field_type === 'text' ? 'Champ texte' : field.field_type === 'textarea' ? 'Zone de texte' : field.field_type === 'number' ? 'Champ numérique' : 'Upload fichier'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="demo-irf-add-btn" onClick={addField}>
                        <Plus size={16} /> Ajouter un champ
                    </button>
                </div>

                <div className="demo-modal-footer">
                    <button className="demo-action-btn demo-btn-cancel" onClick={onClose}>Annuler</button>
                    <button
                        className="demo-action-btn demo-btn-send"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        <Send size={16} /> {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>
                </div>
            </div>
        </div>
    );
}
