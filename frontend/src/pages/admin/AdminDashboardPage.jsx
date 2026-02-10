import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import {
  Users, ShieldCheck, Building, TrendingUp, Download,
  DollarSign, Briefcase, Activity, Clock, CreditCard,
  Wallet, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (cents) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);

const ACTION_LABELS = { create: 'Création', update: 'Modification', delete: 'Suppression' };

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminApi.getDashboard();
      setData(res.data.data || res.data);
    } catch {
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    try {
      const fn = { users: adminApi.exportUsers, investments: adminApi.exportInvestments, transactions: adminApi.exportTransactions }[type];
      const res = await fn(format);
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      const content = format === 'csv' ? res.data : JSON.stringify(res.data, null, 2);
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Export ${type} téléchargé`);
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const users = data?.users || {};
  const properties = data?.properties || {};
  const projects = data?.projects || {};
  const investments = data?.investments || {};
  const financial = data?.financial || {};
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard Administrateur</h1>
          <p className="text-muted">Vue d'ensemble de la plateforme X-Fund</p>
        </div>
      </div>

      {data ? (
        <>
          {/* Main KPIs */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary"><Users size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{users.total ?? '—'}</span>
                <span className="stat-label">Utilisateurs</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-warning"><ShieldCheck size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{users.kyc_pending ?? '—'}</span>
                <span className="stat-label">KYC en attente</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-info"><Building size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{properties.total ?? '—'}</span>
                <span className="stat-label">Biens immobiliers</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success"><TrendingUp size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{investments.total_count ?? '—'}</span>
                <span className="stat-label">Investissements</span>
              </div>
            </div>
          </div>

          {/* Projects & Financial KPIs */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary"><Briefcase size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{projects.total ?? '—'}</span>
                <span className="stat-label">Projets totaux</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-warning"><Clock size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{projects.pending_review ?? '—'}</span>
                <span className="stat-label">En attente de validation</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success"><Activity size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{projects.ouvert ?? '—'}</span>
                <span className="stat-label">Projets ouverts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-info"><Wallet size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(financial.total_wallets_balance_cents)}</span>
                <span className="stat-label">Solde total wallets</span>
              </div>
            </div>
          </div>

          {/* Financial summary */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success"><DollarSign size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(investments.total_amount_cents)}</span>
                <span className="stat-label">Volume investi</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-primary"><CheckCircle size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{fmt(financial.total_deposits_cents)}</span>
                <span className="stat-label">Total dépôts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-warning"><CreditCard size={20} /></div>
              <div className="stat-content">
                <span className="stat-value">{financial.total_transactions ?? '—'}</span>
                <span className="stat-label">Transactions</span>
              </div>
            </div>
          </div>

          {/* Pending review alert */}
          {(projects.pending_review ?? 0) > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <Clock size={20} style={{ color: 'var(--warning)' }} />
                  <div>
                    <strong>{projects.pending_review} projet(s) en attente de validation</strong>
                    <p className="text-muted" style={{ marginTop: '.15rem' }}>Des projets soumis par les porteurs de projets nécessitent votre attention.</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/projects', { state: { filter: 'en_attente' } })}>
                  Examiner
                </button>
              </div>
            </div>
          )}

          {/* Quick navigation + Recent activity */}
          <div className="two-col">
            <div>
              {/* Quick navigation */}
              <div className="card">
                <div className="card-header">
                  <h3>Accès rapide</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.75rem' }}>
                  <button className="btn" onClick={() => navigate('/admin/users')} style={{ justifyContent: 'flex-start' }}>
                    <Users size={16} /> Utilisateurs
                  </button>
                  <button className="btn" onClick={() => navigate('/admin/properties')} style={{ justifyContent: 'flex-start' }}>
                    <Building size={16} /> Biens immobiliers
                  </button>
                  <button className="btn" onClick={() => navigate('/admin/projects')} style={{ justifyContent: 'flex-start' }}>
                    <Briefcase size={16} /> Projets
                  </button>
                  <button className="btn" onClick={() => navigate('/admin/investments')} style={{ justifyContent: 'flex-start' }}>
                    <TrendingUp size={16} /> Investissements
                  </button>
                  <button className="btn" onClick={() => navigate('/admin/transactions')} style={{ justifyContent: 'flex-start' }}>
                    <CreditCard size={16} /> Transactions
                  </button>
                  <button className="btn" onClick={() => navigate('/admin/audit')} style={{ justifyContent: 'flex-start' }}>
                    <Activity size={16} /> Audit Logs
                  </button>
                </div>
              </div>

              {/* User breakdown */}
              <div className="card">
                <div className="card-header">
                  <h3>Répartition des utilisateurs</h3>
                </div>
                <div className="detail-grid">
                  <div className="detail-row"><span>Investisseurs</span><span>{users.investisseurs ?? '—'}</span></div>
                  <div className="detail-row"><span>Porteurs de projet</span><span>{users.porteurs_de_projet ?? '—'}</span></div>
                  <div className="detail-row"><span>Administrateurs</span><span>{users.administrateurs ?? '—'}</span></div>
                  <div className="detail-row"><span>KYC vérifiés</span><span className="text-success">{users.kyc_verified ?? '—'}</span></div>
                  <div className="detail-row"><span>KYC en attente</span><span className="text-warning">{users.kyc_pending ?? '—'}</span></div>
                </div>
              </div>
            </div>

            <div>
              {/* Recent activity */}
              <div className="card">
                <div className="card-header">
                  <h3>Activité récente</h3>
                  <Activity size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                {recentActivity.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {recentActivity.map((log) => (
                      <div key={log.id} style={{ padding: '.6rem .75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 550 }}>
                            {ACTION_LABELS[log.action] || log.action} — {log.resource_type}
                          </span>
                          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                            {new Date(log.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {log.user_name && (
                          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>par {log.user_name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Aucune activité récente</p>
                )}
              </div>

              {/* Project breakdown */}
              <div className="card">
                <div className="card-header">
                  <h3>Statut des projets</h3>
                </div>
                <div className="detail-grid">
                  <div className="detail-row"><span>Brouillon</span><span>{projects.brouillon ?? '—'}</span></div>
                  <div className="detail-row"><span>Ouverts</span><span className="text-primary">{projects.ouvert ?? '—'}</span></div>
                  <div className="detail-row"><span>Financés</span><span className="text-success">{projects.finance ?? '—'}</span></div>
                  <div className="detail-row"><span>Clôturés</span><span>{projects.cloture ?? '—'}</span></div>
                  <div className="detail-row"><span>Approuvés</span><span className="text-success">{projects.approved ?? '—'}</span></div>
                  <div className="detail-row"><span>Rejetés</span><span className="text-danger">{projects.rejected ?? '—'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Exports */}
          <div className="card">
            <div className="card-header">
              <h3>Exports de données</h3>
              <Download size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="export-grid">
              {[
                { key: 'users', label: 'Utilisateurs', icon: Users },
                { key: 'investments', label: 'Investissements', icon: TrendingUp },
                { key: 'transactions', label: 'Transactions', icon: DollarSign },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="export-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                    <span className="export-label">{label}</span>
                  </div>
                  <div className="export-actions">
                    <button className="btn btn-sm" onClick={() => handleExport(key, 'json')}>JSON</button>
                    <button className="btn btn-sm" onClick={() => handleExport(key, 'csv')}>CSV</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Activity size={48} />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}
