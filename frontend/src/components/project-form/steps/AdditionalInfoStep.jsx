import { useState, useEffect, useCallback } from 'react';
import { porteurInfoApi } from '../../../api/porteurInfo';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';
import { AlertCircle, CheckCircle, Upload, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdditionalInfoStep({ onSubmitRef }) {
    const projectId = useProjectFormStore((s) => s.loadedProjectId);
    const setProjectStatus = useProjectFormStore((s) => s.setProjectStatus);

    const [pendingRequests, setPendingRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    // { [requestId]: { "0": "value", "1": "value" } }  (text responses + filenames for display)
    const [responsesMap, setResponsesMap] = useState({});
    // { [requestId]: { "2": File } }  (actual File objects for upload)
    const [fileMap, setFileMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (projectId) loadInfoRequests();
    }, [projectId]);

    const loadInfoRequests = async () => {
        setLoading(true);
        try {
            const res = await porteurInfoApi.getInfoRequest(projectId);
            const raw = res.data.data || [];
            const allRequests = raw.map(r => ({ id: r.id, ...(r.attributes || r) }));

            const pending = allRequests.filter(ir => ir.status === 'pending');
            const history = allRequests.filter(ir => ir.status !== 'pending');

            setPendingRequests(pending);
            setHistoryRequests(history);

            // Pre-fill responses if any were partially saved
            const map = {};
            pending.forEach(ir => {
                if (ir.responses && Object.keys(ir.responses).length > 0) {
                    map[ir.id] = ir.responses;
                }
            });
            setResponsesMap(map);

            if (pending.length === 0 && history.length > 0) {
                setSubmitted(true);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const updateResponse = (requestId, index, value) => {
        setResponsesMap(prev => ({
            ...prev,
            [requestId]: { ...(prev[requestId] || {}), [String(index)]: value },
        }));
    };

    const updateFile = (requestId, index, file) => {
        setFileMap(prev => ({
            ...prev,
            [requestId]: { ...(prev[requestId] || {}), [String(index)]: file },
        }));
        // Also store the filename in responsesMap for display and validation
        updateResponse(requestId, index, file.name);
    };

    const handleSubmit = useCallback(async () => {
        if (pendingRequests.length === 0) return true; // no pending, pass through

        // Validate required fields across all pending requests
        for (const ir of pendingRequests) {
            const fields = ir.fields || [];
            const irResponses = responsesMap[ir.id] || {};
            const irFiles = fileMap[ir.id] || {};
            for (let i = 0; i < fields.length; i++) {
                const idx = String(i);
                if (fields[i].required) {
                    const hasValue = fields[i].field_type === 'file'
                        ? !!irFiles[idx]
                        : !!irResponses[idx]?.trim?.();
                    if (!hasValue) {
                        toast.error(`Le champ "${fields[i].label}" est requis.`);
                        return false;
                    }
                }
            }
        }

        // Build submissions: { "id1": { "0": "val" }, "id2": { "0": "val" } }
        const submissions = {};
        pendingRequests.forEach(ir => {
            submissions[ir.id] = responsesMap[ir.id] || {};
        });

        try {
            await porteurInfoApi.submitInfoResponse(projectId, submissions, fileMap);
            setSubmitted(true);
            setProjectStatus('info_resubmitted');
            toast.success('Compléments envoyés avec succès !');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de l\'envoi');
            return false;
        }
    }, [pendingRequests, responsesMap, fileMap, projectId, setProjectStatus]);

    // Expose submit handler to parent via ref
    useEffect(() => {
        if (onSubmitRef) {
            onSubmitRef.current = handleSubmit;
        }
    }, [handleSubmit, onSubmitRef]);

    if (loading) {
        return (
            <div className="pf-additional-info-step">
                <div className="pf-ai-loading">
                    <div className="spinner" />
                    <p>Chargement des informations demandées...</p>
                </div>
            </div>
        );
    }

    if (pendingRequests.length === 0 && historyRequests.length === 0) {
        return (
            <div className="pf-additional-info-step">
                <div className="pf-ai-empty">
                    <AlertCircle size={32} strokeWidth={1.5} />
                    <p>Aucune demande de compléments trouvée.</p>
                </div>
            </div>
        );
    }

    const isAllSubmitted = submitted || pendingRequests.length === 0;

    return (
        <div className="pf-additional-info-step">
            {/* Status banner */}
            {isAllSubmitted ? (
                <div className="pf-success-banner">
                    <CheckCircle size={20} />
                    <div>
                        <strong>Compléments envoyés avec succès</strong>
                        <span>L'analyste va examiner vos informations complémentaires. Vous serez notifié de la décision.</span>
                    </div>
                </div>
            ) : (
                <div className="pf-info-banner">
                    <AlertCircle size={20} />
                    <div>
                        <strong>Compléments d'information requis</strong>
                        <span>
                            L'analyste a besoin d'informations supplémentaires pour poursuivre l'analyse de votre projet.
                            {pendingRequests.length > 1 && ` (${pendingRequests.length} demandes en attente)`}
                        </span>
                    </div>
                </div>
            )}

            {/* Pending requests - editable forms (or read-only if just submitted) */}
            {pendingRequests.map((ir, irIdx) => {
                const fields = ir.fields || [];
                const irResponses = responsesMap[ir.id] || {};

                return (
                    <div key={ir.id} style={pendingRequests.length > 1 ? { marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e9ecef' } : undefined}>
                        {pendingRequests.length > 1 && (
                            <h4 style={{ fontSize: '.95rem', color: '#495057', marginBottom: '.75rem' }}>
                                Demande {irIdx + 1} — {new Date(ir.created_at).toLocaleDateString('fr-FR')}
                            </h4>
                        )}
                        <FormGrid full>
                            {fields.map((field, idx) => {
                                const value = irResponses[String(idx)] || '';
                                const label = `${field.label}${field.required ? ' *' : ''}`;

                                return (
                                    <FormField key={idx} label={label} full>
                                        {field.comment && (
                                            <p className="pf-field-hint">{field.comment}</p>
                                        )}

                                        {isAllSubmitted ? (
                                            <div className="pf-ai-field-readonly">
                                                {value ? (
                                                    field.field_type === 'file' ? (
                                                        <a href={value} download style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', color: '#0d6efd', textDecoration: 'none' }}>
                                                            <Upload size={14} /> {value}
                                                        </a>
                                                    ) : (
                                                        <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                                                    )
                                                ) : (
                                                    <span className="pf-ai-empty-value">Non renseigné</span>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                {field.field_type === 'text' && (
                                                    <input
                                                        type="text"
                                                        value={value}
                                                        onChange={(e) => updateResponse(ir.id, idx, e.target.value)}
                                                        placeholder="Votre réponse..."
                                                    />
                                                )}
                                                {field.field_type === 'textarea' && (
                                                    <textarea
                                                        value={value}
                                                        onChange={(e) => updateResponse(ir.id, idx, e.target.value)}
                                                        placeholder="Votre réponse..."
                                                        rows={3}
                                                    />
                                                )}
                                                {field.field_type === 'number' && (
                                                    <input
                                                        type="number"
                                                        value={value}
                                                        onChange={(e) => updateResponse(ir.id, idx, e.target.value)}
                                                        placeholder="0"
                                                    />
                                                )}
                                                {field.field_type === 'file' && (
                                                    <div className="pf-ai-file-upload">
                                                        <label className="pf-ai-file-btn">
                                                            <Upload size={14} />
                                                            <span>{value ? 'Fichier sélectionné' : 'Choisir un fichier'}</span>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) updateFile(ir.id, idx, file);
                                                                }}
                                                            />
                                                        </label>
                                                        {value && <span className="pf-ai-file-name">{value}</span>}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </FormField>
                                );
                            })}
                        </FormGrid>
                    </div>
                );
            })}

            {/* History: previously submitted info requests */}
            {historyRequests.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', fontSize: '1rem', color: '#495057' }}>
                        <Clock size={16} />
                        Historique des demandes précédentes
                    </h4>
                    {historyRequests.map((ir) => {
                        const fields = ir.fields || [];
                        const irResponses = ir.responses || {};
                        return (
                            <div key={ir.id} style={{ padding: '1rem', borderRadius: '8px', background: '#f8f9fa', border: '1px solid #e9ecef', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                                    <span className={`badge ${ir.status === 'submitted' ? 'badge-success' : ir.status === 'reviewed' ? 'badge-info' : 'badge-warning'}`}>
                                        {ir.status === 'submitted' ? 'Soumis' : ir.status === 'reviewed' ? 'Examiné' : 'En attente'}
                                    </span>
                                    <span style={{ fontSize: '.8rem', color: '#6c757d' }}>
                                        {new Date(ir.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                {fields.map((field, idx) => {
                                    const value = irResponses[String(idx)];
                                    return (
                                        <div key={idx} style={{ padding: '.5rem .75rem', background: '#fff', borderRadius: '6px', border: '1px solid #dee2e6', marginBottom: '.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '.25rem' }}>
                                                {field.label}
                                            </div>
                                            {field.comment && (
                                                <p style={{ fontSize: '.8rem', color: '#6c757d', margin: '0 0 .25rem' }}>{field.comment}</p>
                                            )}
                                            <div className="pf-ai-field-readonly" style={{ fontSize: '.85rem' }}>
                                                {value ? (
                                                    field.field_type === 'file' ? (
                                                        <a href={value} download style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', color: '#0d6efd', textDecoration: 'none' }}>
                                                            <Upload size={14} /> {value}
                                                        </a>
                                                    ) : (
                                                        <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
                                                    )
                                                ) : (
                                                    <span className="pf-ai-empty-value">Non renseigné</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {ir.submitted_at && (
                                    <div style={{ marginTop: '.25rem', fontSize: '.8rem', color: '#6c757d', textAlign: 'right' }}>
                                        Soumis le {new Date(ir.submitted_at).toLocaleDateString('fr-FR')}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
