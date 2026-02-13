import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dividendsApi } from '../../api/dividends';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, DollarSign, Calendar, Users, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = { planifie: 'Planifié', distribue: 'Distribué', annule: 'Annulé' };
const STATUS_BADGE = { planifie: 'badge-warning', distribue: 'badge-success', annule: 'badge-danger' };
const PAYMENT_STATUS = { en_attente: 'En attente', verse: 'Versé', echoue: 'Échoué' };

const fmt = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function DividendDetailPage() {
  const { projectId, dividendId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dividend, setDividend] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsMeta, setPaymentsMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [page, setPage] = useState(1);

  const isAdmin = user?.role === 'administrateur';

  useEffect(() => { loadDividend(); }, [projectId, dividendId]);
  useEffect(() => { loadPayments(); }, [projectId, dividendId, page]);

  const loadDividend = async () => {
    setLoading(true);
    try {
      const res = await dividendsApi.get(projectId, dividendId);
      setDividend(res.data.data);
    } catch {
      toast.error('Erreur lors du chargement du dividende');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await dividendsApi.listPayments(projectId, dividendId, { page, per_page: 15 });
      setPayments(res.data.data || []);
      setPaymentsMeta(res.data.meta || null);
    } catch {
      // silently fail for payments
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    try {
      const res = await dividendsApi.distribute(projectId, dividendId);
      setDividend(res.data.data);
      toast.success('Dividende distribué avec succès !');
      setShowConfirm(false);
      loadPayments();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Erreur lors de la distribution');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!dividend) return <div className="page"><div className="card"><p>Dividende introuvable</p></div></div>;

  const a = dividend.attributes || dividend;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/projects/${projectId}`)} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Retour au projet
      </button>

      <div className="page-header">
        <div>
          <h1>Dividende — {a.project_title}</h1>
          <p className="text-muted">
            Période : {fmtDate(a.period_start)} — {fmtDate(a.period_end)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
          {isAdmin && a.status === 'planifie' && (
            <button
              className="btn btn-success"
              onClick={() => setShowConfirm(true)}
              disabled={distributing}
            >
              <Send size={16} /> Distribuer
            </button>
          )}
        </div>
      </div>

      {/* Dividend Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{fmt(a.total_amount_cents)}</span>
            <span className="stat-label">Montant total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{fmt(a.amount_per_share_cents)}</span>
            <span className="stat-label">Par part</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{a.distribution_date ? fmtDate(a.distribution_date) : 'Non distribué'}</span>
            <span className="stat-label">Date de distribution</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(218, 165, 32, 0.1)', color: '#DAA520' }}>
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{a.payments_count || paymentsMeta?.total_count || 0}</span>
            <span className="stat-label">{a.status === 'planifie' ? 'Investisseurs concernés' : 'Paiements effectués'}</span>
          </div>
        </div>
      </div>

      {/* Dividend Details Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Détails du dividende</h3>
        <div className="detail-grid">
          <div className="detail-row"><span>Montant total</span><span style={{ fontWeight: 600 }}>{fmt(a.total_amount_cents)}</span></div>
          <div className="detail-row"><span>Montant par part</span><span style={{ fontWeight: 600 }}>{fmt(a.amount_per_share_cents)}</span></div>
          <div className="detail-row"><span>Période</span><span>{fmtDate(a.period_start)} — {fmtDate(a.period_end)}</span></div>
          <div className="detail-row"><span>Statut</span><span><span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span></span></div>
          <div className="detail-row"><span>Date de distribution</span><span>{a.distribution_date ? fmtDate(a.distribution_date) : '—'}</span></div>
          <div className="detail-row"><span>Date de création</span><span>{fmtDate(a.created_at)}</span></div>
        </div>
      </div>

      {/* Investors / Payments Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>
          {a.status === 'planifie' ? 'Investisseurs concernés (projection)' : 'Paiements effectués'}
        </h3>

        {payments.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>Aucun investisseur</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Investisseur</th>
                    <th>Email</th>
                    <th>Parts</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    {a.status === 'distribue' && <th>Date de paiement</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const pa = p.attributes || p;
                    return (
                      <tr key={p.id}>
                        <td>{pa.investor_name || '—'}</td>
                        <td>{pa.investor_email || '—'}</td>
                        <td>{pa.shares_count}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(pa.amount_cents)}</td>
                        <td>
                          <span className={`badge ${pa.status === 'verse' ? 'badge-success' : pa.status === 'echoue' ? 'badge-danger' : 'badge-warning'}`}>
                            {PAYMENT_STATUS[pa.status] || pa.status}
                          </span>
                        </td>
                        {a.status === 'distribue' && <td>{fmtDate(pa.paid_at)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paymentsMeta && paymentsMeta.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} /> Précédent
                </button>
                <span style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                  Page {paymentsMeta.current_page} sur {paymentsMeta.total_pages}
                </span>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={page >= paymentsMeta.total_pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
          }}
          onClick={() => !distributing && setShowConfirm(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '2rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem' }}>Confirmer la distribution</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Vous êtes sur le point de distribuer <strong>{fmt(a.total_amount_cents)}</strong> à tous les investisseurs actifs de ce projet.
              Cette action est irréversible et créditera immédiatement les portefeuilles des investisseurs.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirm(false)}
                disabled={distributing}
              >
                Annuler
              </button>
              <button
                className="btn btn-success"
                onClick={handleDistribute}
                disabled={distributing}
              >
                {distributing ? (
                  <><div className="spinner spinner-sm" /> Distribution en cours...</>
                ) : (
                  <><Send size={16} /> Confirmer la distribution</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
