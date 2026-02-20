import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentsApi } from '../../api/investments';
import { TrendingUp, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCents as fmt, formatDate as fmtDate } from '../../utils';

export default function ProjectDetailsTab({ project, projectId, wallet, user, onRefresh }) {
  const navigate = useNavigate();
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const a = project.attributes || project;
  const isAdmin = user?.role === 'administrateur';
  const canInvest = (user?.role === 'investisseur' || isAdmin) && a.status === 'ouvert';

  const handleInvest = async (e) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(investAmount) * 100);
    if (!cents || cents <= 0) { toast.error('Montant invalide'); return; }
    setSubmitting(true);
    try {
      await investmentsApi.create(projectId, cents);
      toast.success('Investissement effectué !');
      setInvestAmount('');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="two-col">
      <div className="two-col-main">
        {/* Informations clés en haut */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon stat-icon-primary">
              <TrendingUp size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value" style={{ color: '#10B981' }}>{a.net_yield_percent ?? '—'}%</span>
              <span className="stat-label">Rendement net annuel</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-success">
              <DollarSign size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{fmt(a.share_price_cents)}</span>
              <span className="stat-label">Prix par part</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-info">
              <Calendar size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{a.available_shares}</span>
              <span className="stat-label">Parts disponibles</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {a.description && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Description du projet</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: '1.6' }}>
              {a.description}
            </p>
          </div>
        )}

        {/* Période de financement */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Période de levée de fonds</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginBottom: '.25rem' }}>Date de début</div>
              <div style={{ fontWeight: 600 }}>{fmtDate(a.funding_start_date)}</div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'var(--border-color)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginBottom: '.25rem' }}>Date de fin</div>
              <div style={{ fontWeight: 600 }}>{fmtDate(a.funding_end_date)}</div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'var(--border-color)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginBottom: '.25rem' }}>Durée restante</div>
              <div style={{ fontWeight: 600, color: new Date(a.funding_end_date) > new Date() ? '#10B981' : '#EF4444' }}>
                {new Date(a.funding_end_date) > new Date()
                  ? `${Math.ceil((new Date(a.funding_end_date) - new Date()) / (1000 * 60 * 60 * 24))} jours`
                  : 'Terminé'}
              </div>
            </div>
          </div>
        </div>

        {/* Détails financiers complets */}
        <div className="card">
          <h3>Détails financiers</h3>
          <div className="detail-grid">
            <div className="detail-row"><span>Montant total (objectif)</span><span style={{ fontWeight: 600 }}>{fmt(a.total_amount_cents)}</span></div>
            <div className="detail-row"><span>Montant levé</span><span style={{ fontWeight: 600, color: '#10B981' }}>{fmt(a.amount_raised_cents)}</span></div>
            <div className="detail-row"><span>Parts totales</span><span>{a.total_shares} parts</span></div>
            <div className="detail-row"><span>Parts vendues</span><span>{a.shares_sold}</span></div>
            <div className="detail-row"><span>Parts disponibles</span><span style={{ fontWeight: 600 }}>{a.available_shares}</span></div>
            <div className="detail-row"><span>Prix par part</span><span>{fmt(a.share_price_cents)}</span></div>
            <div className="detail-row"><span>Investissement minimum</span><span>{fmt(a.min_investment_cents)}</span></div>
            <div className="detail-row"><span>Investissement maximum</span><span>{a.max_investment_cents ? fmt(a.max_investment_cents) : 'Aucune limite'}</span></div>
            <div className="detail-row"><span>Frais de gestion</span><span>{a.management_fee_percent}%</span></div>
            <div className="detail-row"><span>Rendement brut</span><span className="text-success">{a.gross_yield_percent ?? '—'}%</span></div>
            <div className="detail-row"><span>Rendement net</span><span className="text-success" style={{ fontWeight: 600 }}>{a.net_yield_percent ?? '—'}%</span></div>
          </div>
        </div>
      </div>

      <div className="two-col-side">
        <div className="card">
          <h3>Suivi de l'avancement du financement</h3>
          <div className="progress-bar-container" style={{ marginBottom: '.5rem' }}>
            <div className="progress-bar" style={{ width: `${Math.min(a.funding_progress_percent || 0, 100)}%` }} />
          </div>
          <div className="progress-info">
            <span>{fmt(a.amount_raised_cents)} levés</span>
            <span>{Math.round(a.funding_progress_percent || 0)}%</span>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '.9rem', color: 'var(--text-secondary)' }}>
            Objectif : {fmt(a.total_amount_cents)} · Période de levée : {fmtDate(a.funding_start_date)} → {fmtDate(a.funding_end_date)}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span className="stat-value">{a.available_shares}</span>
            <span className="stat-label">parts disponibles</span>
          </div>
        </div>

        {canInvest && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 style={{ color: 'var(--primary)' }}>Investir dans ce projet</h3>

            {/* Vérification KYC */}
            {user?.kyc_status !== 'verified' && (
              <div style={{ padding: '.75rem', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                  <AlertCircle size={18} color="#FFC107" />
                  <span style={{ fontWeight: 600, color: '#FFC107' }}>Vérification KYC requise</span>
                </div>
                <p style={{ fontSize: '.875rem', margin: 0, color: 'var(--text-secondary)' }}>
                  Vous devez compléter votre vérification d'identité avant d'investir.
                </p>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate('/kyc')}
                  style={{ marginTop: '.5rem' }}
                >
                  Compléter mon KYC
                </button>
              </div>
            )}

            {/* Info solde wallet */}
            {wallet && (
              <div style={{ padding: '.75rem', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>Solde disponible</span>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{fmt(wallet.balance_cents)}</span>
                </div>
              </div>
            )}

            <div className="invest-constraints">
              <span>Min: {fmt(a.min_investment_cents)}</span>
              {a.max_investment_cents && <span>Max: {fmt(a.max_investment_cents)}</span>}
              <span>Prix/part: {fmt(a.share_price_cents)}</span>
            </div>

            <form onSubmit={handleInvest}>
              <div className="form-group">
                <label>Montant à investir (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={investAmount}
                  onChange={e => setInvestAmount(e.target.value)}
                  placeholder="1000.00"
                  required
                  disabled={user?.kyc_status !== 'verified'}
                />
              </div>

              {/* Calcul automatique des parts */}
              {investAmount && parseFloat(investAmount) > 0 && a.share_price_cents > 0 && (() => {
                const amountCents = parseFloat(investAmount) * 100;
                const feePercent = a.investment_fee_percent || 0;
                const feeCents = feePercent > 0 ? Math.round(amountCents * feePercent / 100) : 0;
                const shares = Math.floor(amountCents / a.share_price_cents);
                const netCents = amountCents - feeCents;
                return (
                  <div style={{ padding: '.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginTop: '.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                      <CheckCircle size={18} color="#10B981" />
                      <span style={{ fontWeight: 600, color: '#10B981' }}>Détails de l'investissement</span>
                    </div>
                    <div style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                        <span>Nombre de parts</span>
                        <span style={{ fontWeight: 600 }}>{shares} parts</span>
                      </div>
                      {feeCents > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                            <span>Frais de plateforme ({feePercent}%)</span>
                            <span style={{ fontWeight: 600, color: '#EF4444' }}>-{fmt(feeCents)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem', paddingTop: '.25rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <span style={{ fontWeight: 600 }}>Montant net investi</span>
                            <span style={{ fontWeight: 600 }}>{fmt(netCents)}</span>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                        <span>Rendement estimé annuel</span>
                        <span style={{ fontWeight: 600, color: '#10B981' }}>
                          {a.net_yield_percent ? `${fmt(amountCents * a.net_yield_percent / 100)} (${a.net_yield_percent}%)` : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>% du projet détenu</span>
                        <span style={{ fontWeight: 600 }}>
                          {((shares / a.total_shares) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Warnings */}
              {wallet && investAmount && parseFloat(investAmount) * 100 > wallet.balance_cents && (
                <div style={{ padding: '.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginTop: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <AlertCircle size={18} color="#EF4444" />
                    <span style={{ fontSize: '.875rem', color: '#EF4444', fontWeight: 600 }}>
                      Solde insuffisant. Veuillez recharger votre portefeuille.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={
                  submitting ||
                  user?.kyc_status !== 'verified' ||
                  (wallet && investAmount && parseFloat(investAmount) * 100 > wallet.balance_cents)
                }
                style={{ marginTop: '.75rem' }}
              >
                {submitting ? (
                  <><div className="spinner spinner-sm" /> Traitement...</>
                ) : (
                  'Confirmer l\'investissement'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
