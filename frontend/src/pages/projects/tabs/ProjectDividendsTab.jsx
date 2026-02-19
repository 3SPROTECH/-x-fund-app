import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dividendsApi } from '../../../api/dividends';
import { DollarSign, Eye, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  formatCents as fmt, formatDate as fmtDate,
  FREQ_MONTHS, FREQ_LABELS, DIVIDEND_STATUS_LABELS as DIV_STATUS,
} from '../../../utils';

export default function ProjectDividendsTab({ project, projectId, dividends, isAdmin, onRefresh }) {
  const navigate = useNavigate();
  const [divFrequency, setDivFrequency] = useState('trimestriel');
  const [divConfirm, setDivConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const a = project.attributes || project;

  const getAutoDividend = () => {
    const yieldPercent = a?.net_yield_percent || 0;
    if (!yieldPercent || !a?.amount_raised_cents || !a?.shares_sold) return null;
    const months = FREQ_MONTHS[divFrequency] || 3;
    const lastDiv = dividends.length > 0
      ? dividends.reduce((latest, d) => {
          const de = (d.attributes || d).period_end;
          return de > (latest || '') ? de : latest;
        }, null)
      : null;
    const periodStart = lastDiv || a.funding_start_date || new Date().toISOString().split('T')[0];
    const startDate = new Date(periodStart);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    const periodEnd = endDate.toISOString().split('T')[0];
    const totalCents = Math.round(a.amount_raised_cents * (yieldPercent / 100) * (months / 12));
    return { totalCents, periodStart, periodEnd, perShareCents: Math.round(totalCents / a.shares_sold), yieldPercent };
  };

  const handleAutoCreateDividend = async () => {
    const calc = getAutoDividend();
    if (!calc || calc.totalCents <= 0) { toast.error('Impossible de calculer le dividende'); return; }
    setSubmitting(true);
    try {
      const res = await dividendsApi.create(projectId, {
        total_amount_cents: calc.totalCents,
        period_start: calc.periodStart,
        period_end: calc.periodEnd,
      });
      const newDivId = res.data?.data?.id;
      if (newDivId) {
        await dividendsApi.distribute(projectId, newDivId);
        toast.success('Dividende créé et distribué automatiquement');
      } else {
        toast.success('Dividende créé avec succès');
      }
      setDivConfirm(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDividend = async (dividendId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce dividende ?')) return;
    try {
      await dividendsApi.delete(projectId, dividendId);
      toast.success('Dividende supprimé');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleDistributeDividend = async (dividendId) => {
    if (!confirm('Voulez-vous vraiment distribuer ce dividende ? Cette action est irréversible et créditera immédiatement les portefeuilles des investisseurs.')) return;
    try {
      await dividendsApi.distribute(projectId, dividendId);
      toast.success('Dividende distribué avec succès !');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Erreur lors de la distribution');
    }
  };

  const yieldVal = a?.net_yield_percent || 0;
  const calc = getAutoDividend();
  const noInvestors = !a?.shares_sold || a.shares_sold === 0;
  const noAmount = !a?.amount_raised_cents || a.amount_raised_cents === 0;
  const noYield = !yieldVal;
  const blocked = noInvestors || noAmount || noYield;

  return (
    <div>
      {isAdmin && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Dividende automatique</h3>

          {/* Données du projet */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '.5rem 0 .75rem', fontSize: '.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '.75rem' }}>
            <span>Montant levé : <strong style={{ color: noAmount ? 'var(--danger)' : 'var(--text)' }}>{a?.amount_raised_cents ? fmt(a.amount_raised_cents) : '0,00 €'}</strong></span>
            <span>Parts vendues : <strong style={{ color: noInvestors ? 'var(--danger)' : 'var(--text)' }}>{a?.shares_sold || 0}</strong></span>
            <span>Rendement net : <strong style={{ color: noYield ? 'var(--danger)' : 'var(--success)' }}>{yieldVal ? `${yieldVal}%` : 'Non défini'}</strong></span>
          </div>

          {blocked ? (
            <div style={{ padding: '.25rem 0' }}>
              <p className="text-muted" style={{ fontSize: '.85rem' }}>
                {noYield ? 'Le rendement net n\'est pas défini.' : noInvestors ? 'Aucune part vendue.' : 'Aucun montant levé.'}{' '}
                Impossible de calculer les dividendes.
              </p>
              {noYield && (
                <button type="button" className="btn btn-sm btn-primary" style={{ marginTop: '.5rem' }} onClick={() => navigate(`/projects/${projectId}/edit`)}>
                  Définir le rendement
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Fréquence</label>
                  <select value={divFrequency} onChange={e => { setDivFrequency(e.target.value); setDivConfirm(false); }}>
                    {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {calc ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', margin: '.75rem 0', padding: '.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Période</div>
                      <div style={{ fontWeight: 550, fontSize: '.9rem' }}>{fmtDate(calc.periodStart)} → {fmtDate(calc.periodEnd)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Montant total</div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{fmt(calc.totalCents)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Par part</div>
                      <div style={{ fontWeight: 550, fontSize: '.9rem' }}>{fmt(calc.perShareCents)}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '0 0 .75rem' }}>
                    Calcul : {fmt(a.amount_raised_cents)} x {yieldVal}% x {FREQ_MONTHS[divFrequency]}/12 mois
                  </p>

                  {!divConfirm ? (
                    <button type="button" className="btn btn-primary" onClick={() => setDivConfirm(true)}>
                      Générer et distribuer
                    </button>
                  ) : (
                    <div style={{ padding: '.75rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: '.25rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>Confirmer la génération du dividende ?</p>
                      <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                        <div>Rendement : <strong>{yieldVal}%</strong> ({FREQ_LABELS[divFrequency]})</div>
                        <div>Période : {fmtDate(calc.periodStart)} → {fmtDate(calc.periodEnd)}</div>
                        <div>Montant total : <strong>{fmt(calc.totalCents)}</strong></div>
                        <div>Par part : <strong>{fmt(calc.perShareCents)}</strong></div>
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button type="button" className="btn btn-success" disabled={submitting} onClick={handleAutoCreateDividend}>
                          {submitting ? <><div className="spinner spinner-sm" /> En cours...</> : 'Confirmer'}
                        </button>
                        <button type="button" className="btn" disabled={submitting} onClick={() => setDivConfirm(false)}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted" style={{ padding: '.25rem 0', fontSize: '.85rem' }}>Données insuffisantes pour le calcul.</p>
              )}
            </>
          )}
        </div>
      )}
      {dividends.length === 0 ? (
        <div className="card"><div className="empty-state"><DollarSign size={48} /><p>Aucun dividende</p></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Date création</th><th>Période</th><th>Montant total</th><th>Par part</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {dividends.map(d => {
                const da = d.attributes || d;
                return (
                  <tr key={d.id}>
                    <td>{fmtDate(da.created_at)}</td>
                    <td>{fmtDate(da.period_start)} — {fmtDate(da.period_end)}</td>
                    <td>{fmt(da.total_amount_cents)}</td>
                    <td>{fmt(da.amount_per_share_cents)}</td>
                    <td><span className={`badge ${da.status === 'distribue' ? 'badge-success' : da.status === 'annule' ? 'badge-danger' : 'badge-warning'}`}>{DIV_STATUS[da.status] || da.status}</span></td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" title="Voir les détails" onClick={() => navigate(`/projects/${projectId}/dividends/${d.id}`)}>
                          <Eye size={16} />
                        </button>
                        {isAdmin && da.status === 'planifie' && (
                          <button className="btn-icon btn-success" title="Distribuer" onClick={() => handleDistributeDividend(d.id)}>
                            <Send size={16} />
                          </button>
                        )}
                        {isAdmin && (
                          <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDeleteDividend(d.id)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
