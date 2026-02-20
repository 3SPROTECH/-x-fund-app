import { useState, useEffect, useCallback } from 'react';
import { porteurInfoApi } from '../../../api/porteurInfo';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdditionalInfoStep({ onSubmitRef }) {
    const projectId = useProjectFormStore((s) => s.loadedProjectId);
    const projectStatus = useProjectFormStore((s) => s.projectStatus);
    const setProjectStatus = useProjectFormStore((s) => s.setProjectStatus);

    const [infoRequest, setInfoRequest] = useState(null);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (projectId) loadInfoRequest();
    }, [projectId]);

    const loadInfoRequest = async () => {
        setLoading(true);
        try {
            const res = await porteurInfoApi.getInfoRequest(projectId);
            const irData = res.data.data;
            if (irData) {
                const ir = irData.attributes || irData;
                setInfoRequest(ir);
                if (ir.responses && Object.keys(ir.responses).length > 0) {
                    setResponses(ir.responses);
                }
                if (ir.status === 'submitted' || ir.status === 'reviewed') {
                    setSubmitted(true);
                }
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const updateResponse = (index, value) => {
        setResponses((prev) => ({ ...prev, [String(index)]: value }));
    };

    const handleSubmit = useCallback(async () => {
        if (!infoRequest) return false;

        const fields = infoRequest.fields || [];
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].required && !responses[String(i)]?.trim?.()) {
                toast.error(`Le champ "${fields[i].label}" est requis.`);
                return false;
            }
        }

        try {
            await porteurInfoApi.submitInfoResponse(projectId, responses);
            setSubmitted(true);
            setProjectStatus('info_resubmitted');
            toast.success('Compléments envoyés avec succès !');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de l\'envoi');
            return false;
        }
    }, [infoRequest, responses, projectId, setProjectStatus]);

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

    if (!infoRequest) {
        return (
            <div className="pf-additional-info-step">
                <div className="pf-ai-empty">
                    <AlertCircle size={32} strokeWidth={1.5} />
                    <p>Aucune demande de compléments trouvée.</p>
                </div>
            </div>
        );
    }

    const fields = infoRequest.fields || [];
    const isAlreadySubmitted = submitted || infoRequest.status === 'submitted' || infoRequest.status === 'reviewed';

    return (
        <div className="pf-additional-info-step">
            {/* Status banner */}
            {isAlreadySubmitted ? (
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
                        <span>L'analyste a besoin d'informations supplémentaires pour poursuivre l'analyse de votre projet. Veuillez remplir les champs ci-dessous.</span>
                    </div>
                </div>
            )}

            {/* Fields - using standard form components */}
            <FormGrid full>
                {fields.map((field, idx) => {
                    const value = responses[String(idx)] || '';
                    const label = `${field.label}${field.required ? ' *' : ''}`;

                    return (
                        <FormField key={idx} label={label} full>
                            {field.comment && (
                                <p className="pf-field-hint">{field.comment}</p>
                            )}

                            {isAlreadySubmitted ? (
                                <div className="pf-ai-field-readonly">
                                    {value || <span className="pf-ai-empty-value">Non renseigné</span>}
                                </div>
                            ) : (
                                <>
                                    {field.field_type === 'text' && (
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => updateResponse(idx, e.target.value)}
                                            placeholder="Votre réponse..."
                                        />
                                    )}
                                    {field.field_type === 'textarea' && (
                                        <textarea
                                            value={value}
                                            onChange={(e) => updateResponse(idx, e.target.value)}
                                            placeholder="Votre réponse..."
                                            rows={3}
                                        />
                                    )}
                                    {field.field_type === 'number' && (
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updateResponse(idx, e.target.value)}
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
                                                        if (file) updateResponse(idx, file.name);
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
}
