import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { demoAnalystApi } from '../../api/demoAnalyst';
import {
    PROJECT_STATUS_LABELS as STATUS_LABELS,
    PROJECT_STATUS_BADGES as STATUS_BADGE,
    OPERATION_TYPES,
} from '../../utils';
import { formatCents, formatDate } from '../../utils';
import {
    ArrowLeft, CheckCircle, XCircle, MessageSquarePlus, MapPin, User,
    Calendar, DollarSign, TrendingUp, FileText, Home, Briefcase,
    ChevronDown, ChevronUp, Eye, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DemoAnalystInfoRequestForm from './DemoAnalystInfoRequestForm';
import './demo-analyst.css';

const INFO_REQUEST_STATUS_LABELS = { pending: 'En attente', submitted: 'Soumis', reviewed: 'Examiné' };
const INFO_REQUEST_STATUS_BADGE = { pending: 'badge-warning', submitted: 'badge-info', reviewed: 'badge-success' };

export default function DemoAnalystProjectReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [infoRequests, setInfoRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [expandedSections, setExpandedSections] = useState({ presentation: true, location: true, owner: true, financial: true, assets: false, projections: true });
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => { loadProject(); }, [id]);

    const loadProject = async () => {
        setLoading(true);
        try {
            const res = await demoAnalystApi.getProject(id);
            setProject(res.data.data);
            setInfoRequests(res.data.info_requests || []);
        } catch {
            toast.error('Erreur lors du chargement du projet');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Approuver ce projet ?')) return;
        setActionLoading('approve');
        try {
            await demoAnalystApi.approveProject(id);
            toast.success('Projet pré-approuvé !');
            loadProject();
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0] || 'Erreur');
        } finally {
            setActionLoading('');
        }
    };

    const handleReject = async () => {
        const comment = window.prompt('Raison du rejet (optionnel) :');
        if (comment === null) return;
        setActionLoading('reject');
        try {
            await demoAnalystApi.rejectProject(id, comment);
            toast.success('Projet rejeté.');
            loadProject();
        } catch (err) {
            toast.error(err.response?.data?.errors?.[0] || 'Erreur');
        } finally {
            setActionLoading('');
        }
    };

    const handleInfoSubmitted = () => {
        setShowInfoForm(false);
        loadProject();
    };

    const toggleSection = (key) => {
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <div className="demo-analyst-page">
                <div className="demo-loading"><div className="spinner" /><p>Chargement...</p></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="demo-analyst-page">
                <div className="demo-empty"><p>Projet introuvable</p></div>
            </div>
        );
    }

    const a = project.attributes || project;
    const snapshot = a.form_snapshot || {};

    return (
        <div className="demo-analyst-page">
            {/* ─── Back + Header ─── */}
            <button className="demo-back-btn" onClick={() => navigate('/demo/analyst')}>
                <ArrowLeft size={16} /> Retour au tableau de bord
            </button>

            <div className="demo-review-header">
                <div className="demo-review-header-left">
                    <div className="demo-analyst-badge">DÉMO</div>
                    <div>
                        <h1>{a.title}</h1>
                        <div className="demo-review-meta">
                            <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
                            <span><User size={13} /> {a.owner_name}</span>
                            {a.property_city && <span><MapPin size={13} /> {a.property_city}</span>}
                            <span><Calendar size={13} /> {formatDate(a.created_at)}</span>
                        </div>
                    </div>
                </div>
                <div className="demo-review-actions">
                    {(a.status === 'pending_analysis' || a.status === 'info_resubmitted') && (
                        <>
                            <button
                                className="demo-action-btn demo-btn-approve"
                                onClick={handleApprove}
                                disabled={!!actionLoading}
                            >
                                <CheckCircle size={16} /> {actionLoading === 'approve' ? 'En cours...' : 'Pré-approuver'}
                            </button>
                            <button
                                className="demo-action-btn demo-btn-reject"
                                onClick={handleReject}
                                disabled={!!actionLoading}
                            >
                                <XCircle size={16} /> {actionLoading === 'reject' ? 'En cours...' : 'Rejeter'}
                            </button>
                            <button
                                className="demo-action-btn demo-btn-info"
                                onClick={() => setShowInfoForm(true)}
                                disabled={!!actionLoading}
                            >
                                <MessageSquarePlus size={16} /> Demander des compléments
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ─── Info Request Form (Modal) ─── */}
            {showInfoForm && (
                <DemoAnalystInfoRequestForm
                    projectId={id}
                    onClose={() => setShowInfoForm(false)}
                    onSubmitted={handleInfoSubmitted}
                />
            )}

            {/* ─── Quick Metrics ─── */}
            <div className="demo-quick-metrics">
                <div className="demo-qm-card">
                    <DollarSign size={18} />
                    <div>
                        <span className="demo-qm-value">{formatCents(a.total_amount_cents)}</span>
                        <span className="demo-qm-label">Montant total</span>
                    </div>
                </div>
                <div className="demo-qm-card">
                    <TrendingUp size={18} />
                    <div>
                        <span className="demo-qm-value">{a.gross_yield_percent || '—'}%</span>
                        <span className="demo-qm-label">Rendement brut</span>
                    </div>
                </div>
                <div className="demo-qm-card">
                    <TrendingUp size={18} />
                    <div>
                        <span className="demo-qm-value">{a.net_yield_percent || '—'}%</span>
                        <span className="demo-qm-label">Rendement net</span>
                    </div>
                </div>
                <div className="demo-qm-card">
                    <Calendar size={18} />
                    <div>
                        <span className="demo-qm-value">{a.duration_months || '—'} mois</span>
                        <span className="demo-qm-label">Durée</span>
                    </div>
                </div>
            </div>

            {/* ─── Info Requests History ─── */}
            {infoRequests.length > 0 && (
                <div className="demo-section demo-info-requests-section">
                    <h3><AlertCircle size={16} /> Historique des demandes de compléments</h3>
                    {infoRequests.map((ir) => {
                        const irData = ir.attributes || ir;
                        return (
                            <div key={ir.id} className="demo-info-request-card">
                                <div className="demo-ir-header">
                                    <span className={`badge ${INFO_REQUEST_STATUS_BADGE[irData.status] || ''}`}>
                                        {INFO_REQUEST_STATUS_LABELS[irData.status] || irData.status}
                                    </span>
                                    <span className="demo-ir-date">Demandé le {formatDate(irData.created_at)}</span>
                                    <span className="demo-ir-by">par {irData.requested_by_name}</span>
                                </div>
                                <div className="demo-ir-fields">
                                    {(irData.fields || []).map((field, idx) => (
                                        <div key={idx} className="demo-ir-field">
                                            <div className="demo-ir-field-header">
                                                <span className="demo-ir-field-label">{field.label}</span>
                                                <span className="demo-ir-field-type">{field.field_type}</span>
                                                {field.required && <span className="demo-ir-required">Requis</span>}
                                            </div>
                                            {field.comment && <p className="demo-ir-field-comment">{field.comment}</p>}
                                            {irData.responses && irData.responses[String(idx)] && (
                                                <div className="demo-ir-response">
                                                    <Eye size={13} />
                                                    <span>{irData.responses[String(idx)]}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Form Data Sections ─── */}
            <div className="demo-form-data">
                {/* Presentation */}
                {snapshot.presentation && (
                    <CollapsibleSection
                        title="Présentation du projet"
                        icon={<FileText size={16} />}
                        isOpen={expandedSections.presentation}
                        onToggle={() => toggleSection('presentation')}
                    >
                        <DataGrid data={{
                            'Titre': snapshot.presentation.title,
                            'Type de bien': snapshot.presentation.propertyType,
                            'Type d\'opération': OPERATION_TYPES[snapshot.presentation.operationType] || snapshot.presentation.operationType,
                            'Pitch': snapshot.presentation.pitch,
                            'Valeur avant travaux': snapshot.presentation.valBefore ? `${Number(snapshot.presentation.valBefore).toLocaleString('fr-FR')} €` : '—',
                            'Valeur après travaux': snapshot.presentation.valAfter ? `${Number(snapshot.presentation.valAfter).toLocaleString('fr-FR')} €` : '—',
                            'Expert': snapshot.presentation.expertName,
                            'Date expertise': snapshot.presentation.expertDate,
                            'Durée (mois)': snapshot.presentation.durationMonths,
                            'Stratégie d\'exploitation': snapshot.presentation.exploitationStrategy,
                            'Segment de marché': snapshot.presentation.marketSegment,
                            'Revenu projeté': snapshot.presentation.projectedRevenue ? `${Number(snapshot.presentation.projectedRevenue).toLocaleString('fr-FR')} €` : '—',
                            'Période de revenu': snapshot.presentation.revenuePeriod,
                            'Info complémentaire': snapshot.presentation.additionalInfo,
                        }} />
                    </CollapsibleSection>
                )}

                {/* Location */}
                {snapshot.location && (
                    <CollapsibleSection
                        title="Localisation"
                        icon={<MapPin size={16} />}
                        isOpen={expandedSections.location}
                        onToggle={() => toggleSection('location')}
                    >
                        <DataGrid data={{
                            'Adresse': snapshot.location.address,
                            'Code postal': snapshot.location.postalCode,
                            'Ville': snapshot.location.city,
                            'Quartier': snapshot.location.neighborhood,
                            'Zone / Typologie': snapshot.location.zoneTypology,
                            'Transports': (snapshot.location.transportAccess || []).join(', '),
                            'Commodités': (snapshot.location.nearbyAmenities || []).join(', '),
                            'Avantages stratégiques': snapshot.location.strategicAdvantages,
                        }} />
                    </CollapsibleSection>
                )}

                {/* Project Owner */}
                {snapshot.projectOwner && (
                    <CollapsibleSection
                        title="Porteur de projet"
                        icon={<Briefcase size={16} />}
                        isOpen={expandedSections.owner}
                        onToggle={() => toggleSection('owner')}
                    >
                        <DataGrid data={{
                            'Structure': snapshot.projectOwner.structure,
                            'Société': snapshot.projectOwner.companyName,
                            'LinkedIn': snapshot.projectOwner.linkedinUrl,
                            'Années d\'expérience': snapshot.projectOwner.yearsExperience,
                            'Expertise': snapshot.projectOwner.coreExpertise,
                            'Projets réalisés': snapshot.projectOwner.completedProjects,
                            'Volume géré': snapshot.projectOwner.businessVolume ? `${Number(snapshot.projectOwner.businessVolume).toLocaleString('fr-FR')} €` : '—',
                            'Expérience géo': snapshot.projectOwner.geoExperience,
                            'Certifications': snapshot.projectOwner.certifications,
                            'Équipe': snapshot.projectOwner.teamDescription,
                            'Info complémentaire': snapshot.projectOwner.additionalInfo,
                        }} />
                    </CollapsibleSection>
                )}

                {/* Financial Structure */}
                {snapshot.financialStructure && (
                    <CollapsibleSection
                        title="Structure financière"
                        icon={<DollarSign size={16} />}
                        isOpen={expandedSections.financial}
                        onToggle={() => toggleSection('financial')}
                    >
                        <DataGrid data={{
                            'Total financement': snapshot.financialStructure.totalFunding ? `${Number(snapshot.financialStructure.totalFunding).toLocaleString('fr-FR')} €` : '—',
                            'Marge brute': snapshot.financialStructure.grossMargin ? `${snapshot.financialStructure.grossMargin}%` : '—',
                            'Rendement net': snapshot.financialStructure.netYield ? `${snapshot.financialStructure.netYield}%` : '—',
                            'Justification rendement': snapshot.financialStructure.yieldJustification,
                            'Stratégie commerciale': (snapshot.financialStructure.commercializationStrategy || []).join(', '),
                            'Dossier financier': (snapshot.financialStructure.financialDossierStatus || []).join(', '),
                            'Info complémentaire': snapshot.financialStructure.additionalInfo,
                        }} />
                    </CollapsibleSection>
                )}

                {/* Assets */}
                {snapshot.assets && snapshot.assets.length > 0 && (
                    <CollapsibleSection
                        title={`Actifs (${snapshot.assets.length})`}
                        icon={<Home size={16} />}
                        isOpen={expandedSections.assets}
                        onToggle={() => toggleSection('assets')}
                    >
                        {snapshot.assets.map((asset, idx) => (
                            <div key={idx} className="demo-asset-block">
                                <h4>{asset.label || `Actif ${idx + 1}`}</h4>
                                <DataGrid data={{
                                    'Refinancement': asset.details?.isRefinancing ? 'Oui' : 'Non',
                                    'Date signature': asset.details?.signatureDate || '—',
                                    'Nb lots': asset.details?.lotCount || '—',
                                    'Travaux nécessaires': asset.details?.worksNeeded ? 'Oui' : 'Non',
                                    'Durée travaux': asset.details?.worksDuration ? `${asset.details.worksDuration} mois` : '—',
                                    'Total coûts': `${(asset.costs?.total || 0).toLocaleString('fr-FR')} €`,
                                    'Total recettes': `${(asset.recettesTotal || 0).toLocaleString('fr-FR')} €`,
                                }} />
                                {asset.costs?.items?.length > 0 && (
                                    <div className="demo-costs-table">
                                        <table>
                                            <thead><tr><th>Poste</th><th>Catégorie</th><th>Montant</th></tr></thead>
                                            <tbody>
                                                {asset.costs.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{item.label}</td>
                                                        <td>{item.category}</td>
                                                        <td>{item.amount ? `${Number(item.amount).toLocaleString('fr-FR')} €` : '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CollapsibleSection>
                )}

                {/* Projections */}
                {snapshot.projections && (
                    <CollapsibleSection
                        title="Projections & Engagement"
                        icon={<TrendingUp size={16} />}
                        isOpen={expandedSections.projections}
                        onToggle={() => toggleSection('projections')}
                    >
                        <DataGrid data={{
                            'Apport porteur': `${snapshot.projections.contributionPct || 0}%`,
                            'Durée prévue': `${snapshot.projections.durationMonths || 0} mois`,
                            'Preuve de fonds': snapshot.projections.proofFileName || 'Non fourni',
                        }} />
                    </CollapsibleSection>
                )}
            </div>
        </div>
    );
}

/* ─── Helper Components ─── */

function CollapsibleSection({ title, icon, isOpen, onToggle, children }) {
    return (
        <div className={`demo-section ${isOpen ? 'open' : ''}`}>
            <button className="demo-section-header" onClick={onToggle}>
                <div className="demo-section-title">
                    {icon}
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isOpen && <div className="demo-section-content">{children}</div>}
        </div>
    );
}

function DataGrid({ data }) {
    return (
        <div className="demo-data-grid">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="demo-data-item">
                    <span className="demo-data-label">{key}</span>
                    <span className="demo-data-value">{value || '—'}</span>
                </div>
            ))}
        </div>
    );
}
