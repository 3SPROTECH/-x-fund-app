import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, projectInvestorsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import { getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import useWalletStore from '../../stores/useWalletStore';
import {
  ArrowLeft, ArrowRight, MapPin, Grid, Map, Hammer, FileCheck, ShieldCheck,
  Home, Banknote, Maximize, Building2, BadgeCheck, FileText, FileCheck2,
  FileBarChart, Download, Calculator, Info, Phone, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCents as fmt, formatDate as fmtDate, PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGES } from '../../utils';
import { LoadingSpinner } from '../../components/ui';
import '../../styles/InvestorProjectDetail.css';

export default function InvestorProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { wallet, fetchWallet } = useWalletStore();
  const [project, setProject] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [statements, setStatements] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [investorsMeta, setInvestorsMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('general');

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

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="page"><div className="card"><p>Projet introuvable</p></div></div>;

  const a = project.attributes || project;

  // Collect all available images
  const allImages = [
    ...(a.images || []).map(img => ({ id: img.id, url: getImageUrl(img.url), alt: img.filename })),
    ...(a.property_photos || []).map(p => ({ id: p.id, url: getImageUrl(p.url), alt: p.filename })),
  ];
  const totalPhotos = allImages.length;

  // Dynamic values from API
  const progressPercent = Math.min(a.funding_progress_percent || 0, 100);
  const totalInvestors = investorsMeta?.total_investors || 0;

  return (
    <div className="page">

      {/* Back link */}
      <button className="ipd-back-link" onClick={() => navigate('/investor/projects')}>
        <ArrowLeft size={14} /> Projets
      </button>

      {/* ─── Hero: Gallery + Info ─── */}
      <div className="ipd-hero">
        <div className="ipd-hero-gallery">
          {totalPhotos >= 3 ? (
            <>
              <img src={allImages[0].url} alt={allImages[0].alt} className="ipd-gallery-item main" />
              <img src={allImages[1].url} alt={allImages[1].alt} className="ipd-gallery-item" />
              <img src={allImages[2].url} alt={allImages[2].alt} className="ipd-gallery-item" />
            </>
          ) : totalPhotos === 2 ? (
            <>
              <img src={allImages[0].url} alt={allImages[0].alt} className="ipd-gallery-item main" />
              <img src={allImages[1].url} alt={allImages[1].alt} className="ipd-gallery-item" />
              <div className="ipd-gallery-placeholder"><ImageIcon size={24} /></div>
            </>
          ) : totalPhotos === 1 ? (
            <>
              <img src={allImages[0].url} alt={allImages[0].alt} className="ipd-gallery-item main" />
              <div className="ipd-gallery-placeholder"><ImageIcon size={24} /></div>
              <div className="ipd-gallery-placeholder"><ImageIcon size={24} /></div>
            </>
          ) : (
            <>
              <div className="ipd-gallery-placeholder main"><ImageIcon size={32} /><span>Aucune photo</span></div>
              <div className="ipd-gallery-placeholder"><ImageIcon size={24} /></div>
              <div className="ipd-gallery-placeholder"><ImageIcon size={24} /></div>
            </>
          )}
          {totalPhotos > 0 && (
            <button className="ipd-btn-view-photos" onClick={() => setTab('photos')}>
              <Grid size={13} /> {totalPhotos} photos
            </button>
          )}
        </div>

        <div className="ipd-hero-info">
          <div className="ipd-hero-type">Résidentiel &middot; Marchand de biens</div>
          <h1 className="ipd-hero-title">{a.title}</h1>
          {a.property_city && (
            <div className="ipd-hero-location">
              <MapPin size={15} /> {a.property_title ? `${a.property_title}, ` : ''}{a.property_city}
            </div>
          )}

          <div className="ipd-hero-metrics">
            <div>
              <div className="ipd-hero-metric-value">{a.net_yield_percent ?? '—'} %</div>
              <div className="ipd-hero-metric-label">Rendement cible</div>
            </div>
            <div>
              <div className="ipd-hero-metric-value">18 mois</div>
              <div className="ipd-hero-metric-label">Horizon</div>
            </div>
            <div>
              <div className="ipd-hero-metric-value">245 m&sup2;</div>
              <div className="ipd-hero-metric-label">Surface</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Layout ─── */}
      <div className="ipd-content-layout">

        {/* ─── Main Content ─── */}
        <div>
          <div className="ipd-tabs">
            <button className={`ipd-tab-btn${tab === 'general' ? ' active' : ''}`} onClick={() => setTab('general')}>Général</button>
            <button className={`ipd-tab-btn${tab === 'finance' ? ' active' : ''}`} onClick={() => setTab('finance')}>Finance</button>
            <button className={`ipd-tab-btn${tab === 'location' ? ' active' : ''}`} onClick={() => setTab('location')}>Lieu</button>
            <button className={`ipd-tab-btn${tab === 'faq' ? ' active' : ''}`} onClick={() => setTab('faq')}>FAQ</button>
          </div>

          {tab === 'general' && <GeneralTab />}

          {tab === 'finance' && (
            <div className="ipd-section">
              <div className="ipd-section-label">Informations financières</div>
              <div className="ipd-text-content">
                <p>Les détails financiers complets de ce projet seront disponibles prochainement. Consultez le panneau latéral pour les indicateurs clés.</p>
              </div>
            </div>
          )}

          {tab === 'location' && (
            <div className="ipd-section">
              <div className="ipd-section-label">Localisation</div>
              <div className="ipd-text-content">
                <p>Les informations détaillées sur la localisation du bien seront disponibles prochainement.</p>
              </div>
            </div>
          )}

          {tab === 'faq' && (
            <div className="ipd-section">
              <div className="ipd-section-label">Questions fréquentes</div>
              <div className="ipd-text-content">
                <p>La section FAQ sera disponible prochainement. En attendant, n&apos;hésitez pas à contacter notre équipe.</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Sidebar ─── */}
        <div className="ipd-sidebar">
          {/* Invest Widget */}
          <div className="ipd-invest-widget">
            <div className="ipd-widget-top">
              <div>
                <div className="ipd-widget-amount">{fmt(a.total_amount_cents)}</div>
                <div className="ipd-widget-amount-label">Objectif de financement</div>
              </div>
              <span className={`badge ${PROJECT_STATUS_BADGES[a.status] || ''}`}>
                {PROJECT_STATUS_LABELS[a.status] || a.status}
              </span>
            </div>

            <div className="ipd-progress-track">
              <div className="ipd-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="ipd-progress-row">
              <span><strong>{fmt(a.amount_raised_cents)}</strong> financés</span>
              <span><strong>{Math.round(progressPercent)} %</strong></span>
            </div>

            <button className="ipd-btn-invest">
              Investir dans ce projet
              <ArrowRight size={16} />
            </button>

            {totalInvestors > 0 && (
              <div className="ipd-investor-row">
                <div className="ipd-avatar-stack">
                  <div className="ipd-avatar-sm" style={{ background: '#c4b5fd' }} />
                  <div className="ipd-avatar-sm" style={{ background: '#fbbf24' }} />
                  <div className="ipd-avatar-sm" style={{ background: '#6ee7b7' }} />
                </div>
                <span>{totalInvestors} investisseur{totalInvestors > 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="ipd-widget-divider" />

            <button className="ipd-btn-secondary">
              <Calculator size={15} />
              Simuler mon investissement
            </button>

            <div className="ipd-risk-note">
              <Info size={14} />
              <span>L&apos;investissement présente un risque de perte en capital et d&apos;illiquidité.</span>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="ipd-sidebar-stats">
            <div className="ipd-sidebar-stats-title">Détails financiers</div>
            <div className="ipd-stat-row">
              <span className="ipd-stat-row-label">Rendement cible</span>
              <span className="ipd-stat-row-value">{a.net_yield_percent ?? '—'} %</span>
            </div>
            <div className="ipd-stat-row">
              <span className="ipd-stat-row-label">Durée</span>
              <span className="ipd-stat-row-value">18 mois</span>
            </div>
            <div className="ipd-stat-row">
              <span className="ipd-stat-row-label">Remboursement</span>
              <span className="ipd-stat-row-value">In fine</span>
            </div>
            <div className="ipd-stat-row">
              <span className="ipd-stat-row-label">Ticket minimum</span>
              <span className="ipd-stat-row-value">{fmt(a.min_investment_cents)}</span>
            </div>
            <div className="ipd-stat-row">
              <span className="ipd-stat-row-label">Marge opération</span>
              <span className="ipd-stat-row-value">{a.management_fee_percent ?? '—'} %</span>
            </div>
          </div>

          {/* Support */}
          <div className="ipd-support-row">
            <div className="ipd-support-text">
              <strong>Des questions ?</strong>
              Notre équipe est disponible.
            </div>
            <button className="ipd-btn-support"><Phone size={14} /> Appeler</button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── General Tab (static content) ─── */
function GeneralTab() {
  return (
    <>
      {/* Key Points */}
      <div className="ipd-section">
        <div className="ipd-section-label">Pourquoi investir</div>
        <div className="ipd-key-points">
          <div className="ipd-point-item">
            <div className="ipd-point-icon"><Map size={18} /></div>
            <div className="ipd-point-title">Localisation</div>
            <div className="ipd-point-desc">Quartier prisé, forte demande locative et potentiel de valorisation</div>
          </div>
          <div className="ipd-point-item">
            <div className="ipd-point-icon"><Hammer size={18} /></div>
            <div className="ipd-point-title">Création de valeur</div>
            <div className="ipd-point-desc">Rénovation lourde et division parcellaire prévue</div>
          </div>
          <div className="ipd-point-item">
            <div className="ipd-point-icon"><FileCheck size={18} /></div>
            <div className="ipd-point-title">Permis purgé</div>
            <div className="ipd-point-desc">Obtenu et purgé de tout recours des tiers</div>
          </div>
          <div className="ipd-point-item">
            <div className="ipd-point-icon"><ShieldCheck size={18} /></div>
            <div className="ipd-point-title">Garanties</div>
            <div className="ipd-point-desc">Caution personnelle et hypothèque de 1er rang</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="ipd-section">
        <div className="ipd-section-label">Présentation</div>
        <div className="ipd-desc-header">
          <div className="ipd-desc-chip"><Home size={13} /> Résidentiel</div>
          <div className="ipd-desc-chip"><Banknote size={13} /> Marchand de biens</div>
          <div className="ipd-desc-chip"><Maximize size={13} /> 1 200 m&sup2; terrain</div>
        </div>
        <div className="ipd-text-content">
          <p>
            <strong>Opportunité d&apos;investissement :</strong> L&apos;opération consiste en l&apos;acquisition d&apos;une villa individuelle
            de 245 m&sup2; habitables, édifiée sur une parcelle de 1 200 m&sup2; dans un quartier prisé.
          </p>
          <p>
            Le porteur de projet, un marchand de biens expérimenté, prévoit une rénovation complète des prestations
            intérieures (haut de gamme), la création d&apos;une piscine à débordement et l&apos;aménagement paysager du terrain.
            La commercialisation se fera à la découpe avec le détachement d&apos;une parcelle constructible en fond de lot.
          </p>
          <p>
            La marge prévisionnelle de l&apos;opération est estimée à 22 %, offrant un matelas de sécurité confortable
            pour les investisseurs X-Fund.
          </p>
        </div>
      </div>

      {/* Operator */}
      <div className="ipd-section">
        <div className="ipd-section-label">Opérateur</div>
        <div className="ipd-operator">
          <div className="ipd-operator-avatar"><Building2 size={20} /></div>
          <div>
            <div className="ipd-operator-name">Groupe Riviera Développement</div>
            <div className="ipd-operator-detail">5 opérations réalisées &middot; Toutes remboursées par anticipation</div>
          </div>
          <div className="ipd-operator-badge"><BadgeCheck size={13} /> Vérifié</div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="ipd-section">
        <div className="ipd-section-label">Analyse du risque</div>
        <div className="ipd-analysis">
          <div className="ipd-analysis-row">
            <div className="ipd-analysis-marker" />
            <div>
              <h4>Expertise de l&apos;opérateur</h4>
              <p>5 opérations similaires dans ce secteur au cours des 3 dernières années, toutes remboursées par anticipation.</p>
            </div>
          </div>
          <div className="ipd-analysis-row">
            <div className="ipd-analysis-marker" />
            <div>
              <h4>Aléas de travaux limités</h4>
              <p>Les devis travaux ont été validés par notre AMO indépendant. Les entreprises retenues disposent toutes de la garantie décennale à jour.</p>
            </div>
          </div>
          <div className="ipd-analysis-row">
            <div className="ipd-analysis-marker" />
            <div>
              <h4>Risque commercial maîtrisé</h4>
              <p>Le prix de sortie estimé (8 500 &euro;/m&sup2;) se situe dans la fourchette basse des transactions récentes pour des biens équivalents.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="ipd-section">
        <div className="ipd-section-label">Calendrier</div>
        <div className="ipd-timeline">
          <div className="ipd-tl-step">
            <div className="ipd-tl-dot active" />
            <div className="ipd-tl-date">Février 2026</div>
            <div className="ipd-tl-label">Collecte &amp; Acquisition</div>
            <div className="ipd-tl-sublabel">En cours</div>
          </div>
          <div className="ipd-tl-step">
            <div className="ipd-tl-dot" />
            <div className="ipd-tl-date">Août 2026</div>
            <div className="ipd-tl-label">Fin des travaux</div>
            <div className="ipd-tl-sublabel">~6 mois</div>
          </div>
          <div className="ipd-tl-step">
            <div className="ipd-tl-dot" />
            <div className="ipd-tl-date">Août 2027</div>
            <div className="ipd-tl-label">Remboursement visé</div>
            <div className="ipd-tl-sublabel">In fine</div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="ipd-section">
        <div className="ipd-section-label">Documents</div>
        <div className="ipd-doc-list">
          <button className="ipd-doc-row">
            <div className="ipd-doc-row-left">
              <div className="ipd-doc-icon"><FileText size={15} /></div>
              <div>
                <div>Document d&apos;Information (DICI)</div>
                <div className="ipd-doc-meta">PDF &middot; 2.4 Mo</div>
              </div>
            </div>
            <Download size={16} color="var(--text-muted)" />
          </button>
          <button className="ipd-doc-row">
            <div className="ipd-doc-row-left">
              <div className="ipd-doc-icon"><FileCheck2 size={15} /></div>
              <div>
                <div>Permis de Construire</div>
                <div className="ipd-doc-meta">PDF &middot; 1.8 Mo</div>
              </div>
            </div>
            <Download size={16} color="var(--text-muted)" />
          </button>
          <button className="ipd-doc-row">
            <div className="ipd-doc-row-left">
              <div className="ipd-doc-icon"><FileBarChart size={15} /></div>
              <div>
                <div>Bilan Financier</div>
                <div className="ipd-doc-meta">PDF &middot; 3.1 Mo</div>
              </div>
            </div>
            <Download size={16} color="var(--text-muted)" />
          </button>
        </div>
      </div>
    </>
  );
}
