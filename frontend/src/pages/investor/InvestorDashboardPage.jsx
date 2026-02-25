import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, investmentProjectsApi } from '../../api/investments';
import toast from 'react-hot-toast';
import { formatCents as fmt } from '../../utils';
import { LoadingSpinner } from '../../components/ui';
import { PiggyBank, TrendingUp, Percent, MapPin, MoreHorizontal, Info, ImageIcon } from 'lucide-react';
import { getImageUrl } from '../../api/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const STATIC_BADGE = (
  <span className="static-data-badge">
    <Info size={12} />
    Données statiques
  </span>
);

function PortfolioChart() {
  const chartRef = useRef(null);
  const [gradient, setGradient] = useState(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, 400);
    g.addColorStop(0, 'rgba(218, 165, 32, 0.2)');
    g.addColorStop(1, 'rgba(218, 165, 32, 0)');
    setGradient(g);
  }, []);

  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Valeur du portefeuille',
      data: [80000, 85000, 89000, 94000, 101000, 105000],
      borderColor: '#DAA520',
      backgroundColor: gradient || 'rgba(218, 165, 32, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#DAA520',
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1a1a2e',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ctx.parsed.y.toLocaleString('fr-FR') + ' €',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: '#e4e6f1', drawBorder: false },
        ticks: { callback: (v) => v / 1000 + 'k €' },
      },
      x: {
        grid: { display: false, drawBorder: false },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}

function StatusDoughnut() {
  const data = {
    labels: ['En cours', 'Terminés', 'En retard'],
    datasets: [{
      data: [4, 2, 0],
      backgroundColor: ['#1a1a2e', '#4a4a6a', '#c8c8d4'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, boxHeight: 12, usePointStyle: false, padding: 16, font: { size: 12 } },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}

function TypologyDoughnut() {
  const data = {
    labels: ['Résidentiel', 'Commerces', 'Bureaux'],
    datasets: [{
      data: [5, 1, 2],
      backgroundColor: ['#0f172a', '#64748b', '#cbd5e1'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, boxHeight: 12, usePointStyle: false, padding: 16, font: { size: 12 } },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}

function ProjectCard({ project, onClick }) {
  const p = project.attributes || project;
  const funded = Math.min(p.funding_progress_percent ?? 0, 100);
  const yieldRate = p.net_yield_percent ?? p.gross_yield_percent ?? 0;
  const raisedFormatted = fmt(p.amount_raised_cents ?? 0);
  const firstImage =
    p.photos?.length > 0 ? p.photos[0] :
    p.images?.length > 0 ? p.images[0] :
    p.property_photos?.length > 0 ? p.property_photos[0] : null;

  return (
    <div className="dash-project-card" onClick={onClick}>
      <div className="dash-project-image">
        {firstImage ? (
          <img src={getImageUrl(firstImage.url)} alt={p.title} />
        ) : (
          <div className="dash-project-image-placeholder"><ImageIcon size={32} /></div>
        )}
        <span className="dash-badge-status">
          {p.status === 'funding_active' ? 'Collecte en cours' : 'À venir'}
        </span>
      </div>
      <div className="dash-project-details">
        <div className="dash-project-header">
          <div>
            <div className="dash-project-title">{p.title}</div>
            <div className="dash-project-location">
              <MapPin size={14} />
              {p.property_city || 'France'}
            </div>
          </div>
          <div className="dash-project-yield">{yieldRate}%</div>
        </div>
        <div className="dash-progress-container">
          <div className="dash-progress-bar-bg">
            <div className="dash-progress-bar-fill" style={{ width: `${funded}%` }} />
          </div>
          <div className="dash-progress-stats">
            <span>{raisedFormatted} collectés</span>
            <span>{funded}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investorDashboard, setInvestorDashboard] = useState(null);
  const [featuredProjects, setFeaturedProjects] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, projectsRes] = await Promise.allSettled([
        dashboardApi.get(),
        investmentProjectsApi.list({ status: 'funding_active', per_page: 6 }),
      ]);
      if (dashRes.status === 'fulfilled') {
        setInvestorDashboard(dashRes.value.data.data || dashRes.value.data);
      }
      if (projectsRes.status === 'fulfilled') {
        setFeaturedProjects(projectsRes.value.data.data || []);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalInvested = investorDashboard?.total_invested_cents ?? 0;
  const totalDividends = investorDashboard?.total_dividends_received_cents ?? 0;
  const avgYield = totalInvested > 0 ? ((totalDividends / totalInvested) * 100).toFixed(2) : '0.00';

  return (
    <div className="inv-dashboard">
      <div className="inv-dashboard-header">
        <h1>Bonjour {user?.first_name} !</h1>
        <p>Voici un aperçu de vos performances et des nouvelles opportunités.</p>
      </div>

      <div className="inv-dashboard-grid">
        {/* Left column */}
        <div className="inv-portfolio-section">
          <div className="inv-metrics-grid">
            <div className="inv-metric-card">
              <div className="inv-metric-label">
                <PiggyBank size={16} /> Capital investi
              </div>
              <div className="inv-metric-value">{fmt(totalInvested)}</div>
            </div>
            <div className="inv-metric-card">
              <div className="inv-metric-label">
                <TrendingUp size={16} /> Gains générés
              </div>
              <div className="inv-metric-value">{fmt(totalDividends)}</div>
            </div>
            <div className="inv-metric-card">
              <div className="inv-metric-label">
                <Percent size={16} /> Rendement annualisé
              </div>
              <div className="inv-metric-value gold">{avgYield} %</div>
            </div>
          </div>

          <div className="inv-card inv-chart-card">
            <div className="inv-card-header">
              <div className="inv-card-title">Évolution du portefeuille</div>
              <div className="inv-card-header-right">
                {STATIC_BADGE}
                <button className="inv-icon-btn"><MoreHorizontal size={20} /></button>
              </div>
            </div>
            <div className="inv-main-chart-container">
              <PortfolioChart />
            </div>
          </div>

          <div className="inv-allocation-grid">
            <div className="inv-card">
              <div className="inv-card-header">
                <div className="inv-card-title">Statut des projets</div>
                {STATIC_BADGE}
              </div>
              <div className="inv-donut-container">
                <StatusDoughnut />
              </div>
            </div>
            <div className="inv-card">
              <div className="inv-card-header">
                <div className="inv-card-title">Typologie d'actifs</div>
                {STATIC_BADGE}
              </div>
              <div className="inv-donut-container">
                <TypologyDoughnut />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="inv-opportunities-section">
          <div className="inv-card">
            <div className="inv-card-header">
              <div className="inv-card-title">Opportunités du moment</div>
            </div>

            {featuredProjects.length === 0 ? (
              <p className="inv-no-projects">Aucun projet disponible pour le moment.</p>
            ) : (
              <div className="inv-opportunities-list">
                {featuredProjects.slice(0, 2).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/investor/projects/${project.id}`)}
                  />
                ))}
              </div>
            )}

            <button
              className="inv-view-all"
              onClick={() => navigate('/investor/projects')}
            >
              Découvrir tous les projets →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
