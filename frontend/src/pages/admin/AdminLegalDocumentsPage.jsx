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
    title: "FICI",
    description: "Fiche d'Information Cle sur l'Investissement. Document reglementaire destine aux investisseurs.",
    signerType: 'porteur_only',
    icon: FileCheck,
  },
];

function getConventionStatus(a) {
  if (!a.yousign_status) return 'draft';
  if (['awaiting_admin', 'ongoing'].includes(a.yousign_status)) return 'awaiting_admin';
  if (a.yousign_status === 'admin_signed') return 'awaiting_porteur';
  if (a.yousign_status === 'done') return 'done';
  return a.yousign_status;
}

function getDocStatus(a, docKey) {
  if (docKey === 'convention') return getConventionStatus(a);
  const docData = (a.legal_documents_status || {})[docKey];
  if (!docData || docData.status === 'pending') return 'draft';
  if (docData.status === 'sent') return 'sent';
  if (docData.status === 'signed') return 'done';
  return docData.status || 'draft';
}

function StatusBadge({ status }) {
  const configs = {
    draft: { label: 'A envoyer', icon: Clock, className: 'apr-legal-badge-pending' },
    awaiting_admin: { label: 'Signature admin requise', icon: AlertCircle, className: 'apr-legal-badge-warning' },
    awaiting_porteur: { label: 'En attente du porteur', icon: Clock, className: 'apr-legal-badge-info' },
    sent: { label: 'En attente de signature', icon: Clock, className: 'apr-legal-badge-info' },
    done: { label: 'Signe', icon: CheckCircle, className: 'apr-legal-badge-success' },
  };
  const c = configs[status] || configs.draft;
  const Icon = c.icon;
  return (
    <span className={`apr-legal-badge ${c.className}`}>
      <Icon size={12} /> {c.label}
    </span>
  );
}

function DocumentCard({ doc, status, a, projectId, onRefresh }) {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const Icon = doc.icon;

  const handleSendConvention = async () => {
    if (!window.confirm('Envoyer la convention via YouSign ? Vous serez redirige pour signer en premier.')) return;
    setSending(true);
    try {
      const pdfBase64 = getContractBase64(a);
      const res = await adminApi.sendContract(projectId, pdfBase64);
      toast.success('Convention envoyee via YouSign — signez maintenant');
      const adminSignLink = res.data?.admin_signature_link;
      if (adminSignLink) {
        window.open(adminSignLink, '_blank', 'noopener,noreferrer');
      }
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleSendDocument = async () => {
    if (!window.confirm(`Envoyer "${doc.title}" au porteur pour signature ?`)) return;
    setSending(true);
    try {
      const pdfBase64 = generatePlaceholderPdfBase64(doc.title, a);
      await adminApi.sendLegalDocument(projectId, doc.key, pdfBase64);
      toast.success(`${doc.title} envoye pour signature`);
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
      else if (s === 'admin_signed') toast.success('Signature admin confirmee. En attente du porteur.');
      else toast('Statut mis a jour.', { icon: 'i' });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la verification');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckDocument = async () => {
    setChecking(true);
    try {
      const res = await adminApi.checkLegalDocumentStatus(projectId, doc.key);
      if (res.data.status === 'signed') toast.success(`${doc.title} signe`);
      else toast('Statut mis a jour.', { icon: 'i' });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la verification');
    } finally {
      setChecking(false);
    }
  };

  const adminSignLink = a.yousign_admin_signature_link;

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
          {/* View/Preview */}
          {doc.key === 'convention' ? (
            <button className="apr-btn apr-btn-secondary" onClick={() => setShowContract(true)}>
              <Eye size={14} /> Visualiser
            </button>
          ) : (
            <button className="apr-btn apr-btn-secondary" onClick={() => {
              toast('Apercu du document provisoire. Ce document sera remplace par un modele definitif.', { icon: 'i' });
            }}>
              <Eye size={14} /> Visualiser
            </button>
          )}

          {/* Convention-specific actions */}
          {doc.key === 'convention' && status === 'draft' && (
            <button className="apr-btn apr-btn-approve" onClick={handleSendConvention} disabled={sending}>
              <Send size={14} /> {sending ? 'Envoi...' : 'Signer et envoyer'}
            </button>
          )}
          {doc.key === 'convention' && status === 'awaiting_admin' && adminSignLink && (
            <button className="apr-btn apr-btn-approve" onClick={() => window.open(adminSignLink, '_blank', 'noopener,noreferrer')}>
              <Send size={14} /> Signer le contrat
            </button>
          )}
          {doc.key === 'convention' && ['awaiting_admin', 'awaiting_porteur'].includes(status) && (
            <button className="apr-btn apr-btn-secondary" onClick={handleCheckConvention} disabled={checking}>
              <RefreshCw size={14} style={checking ? { animation: 'spin 1s linear infinite' } : undefined} />
              {checking ? 'Verification...' : 'Verifier le statut'}
            </button>
          )}

          {/* Porteur-only doc actions */}
          {doc.key !== 'convention' && status === 'draft' && (
            <button className="apr-btn apr-btn-approve" onClick={handleSendDocument} disabled={sending}>
              <Send size={14} /> {sending ? 'Envoi...' : 'Envoyer au porteur'}
            </button>
          )}
          {doc.key !== 'convention' && status === 'sent' && (
            <button className="apr-btn apr-btn-secondary" onClick={handleCheckDocument} disabled={checking}>
              <RefreshCw size={14} style={checking ? { animation: 'spin 1s linear infinite' } : undefined} />
              {checking ? 'Verification...' : 'Verifier le statut'}
            </button>
          )}
        </div>
      </div>

      {showContract && (
        <ContractViewerModal
          projectAttrs={a}
          onClose={() => setShowContract(false)}
          onSendToOwner={async (pdfBase64) => {
            try {
              const res = await adminApi.sendContract(projectId, pdfBase64);
              toast.success('Convention envoyee via YouSign');
              setShowContract(false);
              const link = res.data?.admin_signature_link;
              if (link) window.open(link, '_blank', 'noopener,noreferrer');
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

export default function AdminLegalDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const a = project.attributes || project;
  const projectId = project.id || a.id;

  return (
    <div className="apr-page">
      <nav className="apr-breadcrumb">
        <Link to="/admin/projects">Projets</Link>
        <span className="apr-sep">&rsaquo;</span>
        <Link to={`/admin/projects/${id}`}>{a.title}</Link>
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
          <div className="apr-str-header-sub">{a.title}</div>
        </div>
        <button className="apr-str-back" onClick={() => navigate(`/admin/projects/${id}/structuring`)}>
          <ArrowLeft size={14} /> Retour a la structuration
        </button>
      </div>

      {/* Document Cards */}
      <div className="apr-legal-cards">
        {LEGAL_DOCUMENTS.map((doc) => (
          <DocumentCard
            key={doc.key}
            doc={doc}
            status={getDocStatus(a, doc.key)}
            a={a}
            projectId={projectId}
            onRefresh={loadProject}
          />
        ))}
      </div>

      {/* Bottom action */}
      <div className="apr-legal-bottom">
        <button className="apr-btn apr-btn-secondary" onClick={() => navigate(`/admin/projects/${id}`)}>
          Retour au projet
        </button>
      </div>
    </div>
  );
}
