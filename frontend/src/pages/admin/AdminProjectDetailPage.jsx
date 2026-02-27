import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { investmentProjectsApi, projectInvestorsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import useWalletStore from '../../stores/useWalletStore';
import { adminApi } from '../../api/admin';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui';
import ReportViewerModal from '../../components/ReportViewerModal';
import ContractViewerModal from '../../components/ContractViewerModal';

import HeroSection from '../../components/admin-review/HeroSection';
import DecisionBanner from '../../components/admin-review/DecisionBanner';
import RedoModal from '../../components/admin-review/RedoModal';
import ContractBanner from '../../components/admin-review/ContractBanner';
import KpiStrip from '../../components/admin-review/KpiStrip';
import OverviewTab from '../../components/admin-review/tabs/OverviewTab';
import AnalysisTab from '../../components/admin-review/tabs/AnalysisTab';
import FinancialsTab from '../../components/admin-review/tabs/FinancialsTab';
import AssetsTab from '../../components/admin-review/tabs/AssetsTab';
import OwnerTab from '../../components/admin-review/tabs/OwnerTab';
import DocumentsTab from '../../components/admin-review/tabs/DocumentsTab';
import PhotosTab from '../../components/admin-review/tabs/PhotosTab';
import HistoryTab from '../../components/admin-review/tabs/HistoryTab';

import '../../styles/admin-project-review.css';

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet, fetchWallet } = useWalletStore();

  const [project, setProject] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [statements, setStatements] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [investorsMeta, setInvestorsMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('overview');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showRedo, setShowRedo] = useState(false);
  const [redoSubmitting, setRedoSubmitting] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(false);

  // ─── Data Loading ───
  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projRes, divRes, stmtRes, investorsRes] = await Promise.allSettled([
        investmentProjectsApi.get(id),
        dividendsApi.list(id),
        financialStatementsApi.list(id),
        projectInvestorsApi.list(id),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data.data || projRes.value.data);
      if (divRes.status === 'fulfilled') setDividends(divRes.value.data.data || []);
      if (stmtRes.status === 'fulfilled') setStatements(stmtRes.value.data.data || []);
      if (investorsRes.status === 'fulfilled') {
        setInvestors(investorsRes.value.data.data || []);
        setInvestorsMeta(investorsRes.value.data.meta || null);
      }
      fetchWallet();
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Eagerly load report when project has one
  useEffect(() => {
    const a = project?.attributes || project;
    if (a?.has_analyst_report && !reportData) {
      loadReport();
    }
  }, [project]);

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const res = await adminApi.getProjectReport(id);
      setReportData(res.data.report);
    } catch {
      // Report not critical — fail silently
    } finally {
      setReportLoading(false);
    }
  };

  // ─── Action Handlers ───
  const handleDeleteProject = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ? Cette action est irreversible.')) return;
    try {
      await investmentProjectsApi.delete(id);
      toast.success('Projet supprime avec succes');
      navigate('/admin/projects');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleViewReport = async () => {
    if (reportData) {
      setShowReport(true);
      return;
    }
    try {
      const res = await adminApi.getProjectReport(id);
      setReportData(res.data.report);
      setShowReport(true);
    } catch {
      toast.error('Erreur lors du chargement du rapport');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Voulez-vous approuver ce projet ?')) return;
    try {
      await adminApi.approveProject(id);
      toast.success('Projet approuve avec succes');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    const comment = window.prompt('Raison du rejet :');
    if (comment === null) return;
    if (!comment.trim()) { toast.error('Veuillez fournir une raison'); return; }
    try {
      await adminApi.rejectProject(id, comment);
      toast.success('Projet rejete');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors du rejet');
    }
  };

  const handleRequestRedo = async (comment) => {
    setRedoSubmitting(true);
    try {
      await adminApi.requestRedo(id, comment);
      toast.success("Demande de reprise d'analyse envoyee");
      setShowRedo(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la demande');
    } finally {
      setRedoSubmitting(false);
    }
  };

  const handleSendContract = async (pdfBase64) => {
    try {
      const res = await adminApi.sendContract(id, pdfBase64);
      toast.success('Contrat envoye via YouSign — signez maintenant');
      setShowContract(false);
      loadAll();
      const adminSignLink = res.data?.admin_signature_link;
      if (adminSignLink) {
        window.open(adminSignLink, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Erreur lors de l'envoi du contrat via YouSign");
    }
  };

  const handleCheckSignatureStatus = async () => {
    setCheckingSignature(true);
    try {
      const res = await adminApi.checkSignatureStatus(id);
      const status = res.data.yousign_status;
      const adminStatus = res.data.admin_signer_status;
      const ownerStatus = res.data.owner_signer_status;

      if (status === 'done') {
        toast.success('Le contrat a ete signe par les deux parties ! Statut mis a jour.');
      } else if (status === 'admin_signed') {
        toast.success('Votre signature a ete confirmee. Le contrat a ete envoye au porteur de projet.');
      } else if (status === 'owner_signed') {
        toast.success('Le porteur a signe. En attente de votre signature.');
      } else if (adminStatus === 'pending' && ownerStatus === 'pending') {
        toast('Aucune signature detectee pour le moment. Veuillez signer le contrat.', { icon: 'i' });
      } else {
        toast('Statut mis a jour. En attente des signatures.', { icon: 'i' });
      }
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la verification');
    } finally {
      setCheckingSignature(false);
    }
  };

  // ─── Loading / Error States ───
  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="page"><div className="card"><p>Projet introuvable</p></div></div>;

  const a = project.attributes || project;
  const snapshot = a.form_snapshot || {};
  const assets = snapshot.assets || [];
  const photos = a.photos || a.property_photos || a.images || [];
  const documents = a.documents || [];

  // ─── Tab Definitions ───
  const TABS = [
    { key: 'overview', label: "Vue d'ensemble" },
    { key: 'analysis', label: "Rapport d'analyse" },
    { key: 'financials', label: 'Structure financiere' },
    { key: 'assets', label: 'Actifs', count: assets.length || undefined },
    { key: 'owner', label: 'Porteur de projet' },
    { key: 'documents', label: 'Documents', count: documents.length || undefined },
    { key: 'photos', label: 'Photos', count: photos.length || undefined },
    { key: 'history', label: 'Historique' },
  ];

  return (
    <div className="apr-page">
      {/* Breadcrumb */}
      <nav className="apr-breadcrumb">
        <Link to="/admin/projects">Projets</Link>
        <span className="apr-sep">›</span>
        <span className="apr-current">{a.title}</span>
      </nav>

      {/* Hero */}
      <HeroSection
        project={project}
        onNavigateReport={() => setTab('analysis')}
        onEdit={() => navigate(`/admin/projects/${id}/edit`)}
        onDelete={handleDeleteProject}
      />

      {/* Decision Banner — analysis_submitted */}
      {a.status === 'analysis_submitted' && (
        <DecisionBanner
          onApprove={handleApprove}
          onReject={handleReject}
          onRedo={() => setShowRedo(true)}
        />
      )}

      {/* Contract Banners — approved / signing */}
      <ContractBanner
        project={project}
        onGenerateContract={() => setShowContract(true)}
        onShowContract={() => setShowContract(true)}
        onCheckSignature={handleCheckSignatureStatus}
        checkingSignature={checkingSignature}
      />

      {/* KPI Strip */}
      <KpiStrip project={project} reportData={reportData} />

      {/* Tabs */}
      <div className="apr-tabs apr-anim apr-d3">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`apr-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count != null && <span className="apr-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === 'overview' && <OverviewTab project={project} reportData={reportData} />}
      {tab === 'analysis' && <AnalysisTab project={project} reportData={reportData} />}
      {tab === 'financials' && <FinancialsTab project={project} />}
      {tab === 'assets' && <AssetsTab project={project} />}
      {tab === 'owner' && <OwnerTab project={project} />}
      {tab === 'documents' && <DocumentsTab project={project} />}
      {tab === 'photos' && <PhotosTab project={project} />}
      {tab === 'history' && <HistoryTab project={project} />}

      {/* Modals */}
      {showReport && reportData && (
        <ReportViewerModal
          report={reportData}
          projectAttrs={a}
          onClose={() => setShowReport(false)}
        />
      )}

      {showContract && (
        <ContractViewerModal
          projectAttrs={a}
          onClose={() => setShowContract(false)}
          onSendToOwner={handleSendContract}
          showSendButton={a.status === 'approved'}
        />
      )}

      {showRedo && (
        <RedoModal
          onConfirm={handleRequestRedo}
          onClose={() => setShowRedo(false)}
          submitting={redoSubmitting}
        />
      )}
    </div>
  );
}
