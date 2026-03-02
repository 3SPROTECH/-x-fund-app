import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, FileSignature, FileText, FileCheck, Send, RefreshCw,
  CheckCircle, Clock, AlertCircle, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { investmentProjectsApi } from '../../api/investments';
import { adminApi } from '../../api/admin';
import { LoadingSpinner } from '../../components/ui';
import ContractViewerModal from '../../components/ContractViewerModal';
import { getContractBase64, generatePlaceholderPdfBase64 } from '../../utils/contractGenerator';
import '../../styles/admin-project-review.css';

/* ── Document definitions ── */

const LEGAL_DOCUMENTS = [
  {
    key: 'convention',
    title: 'Convention de partenariat',
    description: 'Contrat principal entre la plateforme et le porteur de projet. Doit etre cosigne par la plateforme avant envoi.',
    signerType: 'admin_and_porteur',
    icon: FileSignature,
  },
  {
    key: 'contrat_pret',
    title: 'Contrat de pret',
    description: 'Contrat definissant les termes du pret obligataire entre les investisseurs et le porteur de projet.',
    signerType: 'porteur_only',
    icon: FileText,
  },
  {
    key: 'fici',
    title: 'FICI',
    description: "Fiche d'Information Cle sur l'Investissement. Document reglementaire destine aux investisseurs.",
    signerType: 'porteur_only',
    icon: FileCheck,
  },
];

/* ── Status helpers ── */

const STATUS_CONFIG = {
  draft:           { label: 'A preparer',              icon: Clock,       className: 'apr-legal-badge-pending' },
  awaiting_admin:  { label: 'Signature admin requise', icon: AlertCircle, className: 'apr-legal-badge-warning' },
  awaiting_porteur:{ label: 'En attente du porteur',   icon: Clock,       className: 'apr-legal-badge-info' },
  sent:            { label: 'En attente de signature', icon: Clock,       className: 'apr-legal-badge-info' },
  done:            { label: 'Signe',                   icon: CheckCircle, className: 'apr-legal-badge-success' },
};

function getDocStatus(attrs, docKey) {
  if (docKey === 'convention') {
    const s = attrs.yousign_status;
    if (!s) return 'draft';
    if (['awaiting_admin', 'ongoing'].includes(s)) return 'awaiting_admin';
    if (s === 'admin_signed') return 'awaiting_porteur';
    if (s === 'done') return 'done';
    return s;
  }
  const data = (attrs.legal_documents_status || {})[docKey];
  if (!data || data.status === 'pending') return 'draft';
  if (data.status === 'signed') return 'done';
  return data.status;
}

/* ── Components ── */

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span className={`apr-legal-badge ${config.className}`}>
      <Icon size={12} /> {config.label}
    </span>
  );
}

function DocumentCard({ doc, status, attrs, projectId, onRefresh }) {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const Icon = doc.icon;
  const isConvention = doc.key === 'convention';

  const handleSignConvention = async () => {
    if (!window.confirm('Envoyer la convention via YouSign ? Vous serez redirige pour signer.')) return;
    setSending(true);
    try {
      const pdfBase64 = getContractBase64(attrs);
      const res = await adminApi.sendContract(projectId, pdfBase64);
      toast.success('Convention envoyee — signez maintenant');
      if (res.data?.admin_signature_link) {
        window.open(res.data.admin_signature_link, '_blank', 'noopener,noreferrer');
      }
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleCheckConvention = async () => {
    setChecking(true);
    try {
      const res = await adminApi.checkSignatureStatus(projectId);
      const s = res.data.yousign_status;
      if (s === 'done') toast.success('Convention signee par les deux parties');
      else if (s === 'admin_signed') toast.success('Signature admin confirmee');
      else toast('Statut mis a jour.');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckDocument = async () => {
    setChecking(true);
    try {
      const res = await adminApi.checkLegalDocumentStatus(projectId, doc.key);
      if (res.data.status === 'signed') toast.success(`${doc.title} signe`);
      else toast('Statut mis a jour.');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <div className={`apr-legal-card${status === 'done' ? ' done' : ''}`}>
        <div className="apr-legal-card-header">
          <div className="apr-legal-card-title">
            <Icon size={18} />
            <h3>{doc.title}</h3>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="apr-legal-card-meta">
          <span className={`apr-legal-signer-tag ${doc.signerType === 'admin_and_porteur' ? 'both' : 'porteur'}`}>
            {doc.signerType === 'admin_and_porteur' ? 'Plateforme + Porteur' : 'Porteur uniquement'}
          </span>
          <p>{doc.description}</p>
        </div>

        <div className="apr-legal-card-actions">
          {/* Preview */}
          {isConvention ? (
            <button className="apr-btn apr-btn-secondary" onClick={() => setShowContract(true)}>
              <Eye size={14} /> Visualiser
            </button>
          ) : (
            <button className="apr-btn apr-btn-secondary" onClick={() => {
              toast('Apercu provisoire. Document sera remplace par un modele definitif.');
            }}>
              <Eye size={14} /> Visualiser
            </button>
          )}

          {/* Convention: sign & send */}
          {isConvention && status === 'draft' && (
            <button className="apr-btn apr-btn-approve" onClick={handleSignConvention} disabled={sending}>
              <Send size={14} /> {sending ? 'Envoi...' : 'Signer et envoyer'}
            </button>
          )}

          {/* Convention: open signing link */}
          {isConvention && status === 'awaiting_admin' && attrs.yousign_admin_signature_link && (
            <button
              className="apr-btn apr-btn-approve"
              onClick={() => window.open(attrs.yousign_admin_signature_link, '_blank', 'noopener,noreferrer')}
            >
              <FileSignature size={14} /> Signer le contrat
            </button>
          )}

          {/* Convention: refresh status */}
          {isConvention && ['awaiting_admin', 'awaiting_porteur'].includes(status) && (
            <button className="apr-btn apr-btn-secondary" onClick={handleCheckConvention} disabled={checking}>
              <RefreshCw size={14} className={checking ? 'spinning' : ''} />
              {checking ? 'Verification...' : 'Verifier le statut'}
            </button>
          )}

          {/* Porteur docs: refresh status (only when already sent) */}
          {!isConvention && status === 'sent' && (
            <button className="apr-btn apr-btn-secondary" onClick={handleCheckDocument} disabled={checking}>
              <RefreshCw size={14} className={checking ? 'spinning' : ''} />
              {checking ? 'Verification...' : 'Verifier le statut'}
            </button>
          )}
        </div>
      </div>

      {showContract && (
        <ContractViewerModal
          projectAttrs={attrs}
          onClose={() => setShowContract(false)}
          onSendToOwner={async (pdfBase64) => {
            try {
              const res = await adminApi.sendContract(projectId, pdfBase64);
              toast.success('Convention envoyee via YouSign');
              setShowContract(false);
              if (res.data?.admin_signature_link) {
                window.open(res.data.admin_signature_link, '_blank', 'noopener,noreferrer');
              }
              onRefresh();
            } catch (err) {
              toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi");
            }
          }}
          showSendButton={status === 'draft'}
        />
      )}
    </>
  );
}

/* ── Main page ── */

export default function AdminLegalDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await investmentProjectsApi.get(id);
      setProject(res.data.data || res.data);
    } catch {
      toast.error('Erreur lors du chargement du projet');
      navigate(`/admin/projects/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const attrs = project.attributes || project;
  const projectId = project.id || attrs.id;

  const statuses = Object.fromEntries(
    LEGAL_DOCUMENTS.map(doc => [doc.key, getDocStatus(attrs, doc.key)])
  );

  // Convention must be signed by admin (or fully done) before sending porteur docs
  const conventionReady = ['awaiting_porteur', 'done'].includes(statuses.convention);
  const porteurDocsPending = LEGAL_DOCUMENTS
    .filter(d => d.signerType === 'porteur_only')
    .some(d => statuses[d.key] === 'draft');
  const canSendToPorteur = conventionReady && porteurDocsPending;
  const allDone = Object.values(statuses).every(s => s === 'done');

  const handleSendAllToPorteur = async () => {
    if (!window.confirm('Envoyer tous les documents au porteur pour signature ?')) return;
    setSendingAll(true);
    try {
      const docsToSend = LEGAL_DOCUMENTS.filter(
        d => d.signerType === 'porteur_only' && statuses[d.key] === 'draft'
      );
      for (const doc of docsToSend) {
        const pdfBase64 = generatePlaceholderPdfBase64(doc.title, attrs);
        await adminApi.sendLegalDocument(projectId, doc.key, pdfBase64);
      }
      toast.success('Documents envoyes au porteur');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi");
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="apr-page">
      <nav className="apr-breadcrumb">
        <Link to="/admin/projects">Projets</Link>
        <span className="apr-sep">&rsaquo;</span>
        <Link to={`/admin/projects/${id}`}>{attrs.title}</Link>
        <span className="apr-sep">&rsaquo;</span>
        <span className="apr-current">Documents legaux</span>
      </nav>

      {/* Stepper */}
      <div className="apr-legal-stepper">
        <div className="apr-legal-step completed" onClick={() => navigate(`/admin/projects/${id}/structuring`)}>
          <div className="apr-legal-step-num"><CheckCircle size={16} /></div>
          <span>Structuration financiere</span>
        </div>
        <div className="apr-legal-step-line" />
        <div className="apr-legal-step active">
          <div className="apr-legal-step-num">2</div>
          <span>Documents legaux</span>
        </div>
      </div>

      {/* Header */}
      <div className="apr-str-header">
        <div>
          <h1>Documents legaux</h1>
          <div className="apr-str-header-sub">{attrs.title}</div>
        </div>
        <button className="apr-str-back" onClick={() => navigate(`/admin/projects/${id}/structuring`)}>
          <ArrowLeft size={14} /> Retour a la structuration
        </button>
      </div>

      {/* Document Cards */}
      <div className="apr-legal-cards">
        {LEGAL_DOCUMENTS.map(doc => (
          <DocumentCard
            key={doc.key}
            doc={doc}
            status={statuses[doc.key]}
            attrs={attrs}
            projectId={projectId}
            onRefresh={loadProject}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="apr-legal-bottom">
        <button className="apr-btn apr-btn-secondary" onClick={() => navigate(`/admin/projects/${id}`)}>
          Retour au projet
        </button>

        {!allDone && (
          <button
            className="apr-btn apr-btn-approve"
            onClick={handleSendAllToPorteur}
            disabled={!canSendToPorteur || sendingAll}
            title={!conventionReady ? 'La convention doit etre signee par la plateforme avant envoi' : ''}
          >
            <Send size={14} />
            {sendingAll ? 'Envoi en cours...' : 'Envoyer au porteur'}
          </button>
        )}
      </div>
    </div>
  );
}
