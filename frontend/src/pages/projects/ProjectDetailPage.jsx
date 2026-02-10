import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, investmentsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, TrendingUp, FileText, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABELS = { brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé', cloture: 'Clôturé', annule: 'Annulé' };
const STATUS_BADGE = { ouvert: 'badge-success', finance: 'badge-info', cloture: '', annule: 'badge-danger', brouillon: 'badge-warning' };
const DIV_STATUS = { planifie: 'Planifié', distribue: 'Distribué', annule: 'Annulé' };
const STMT_TYPE = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel' };

const fmt = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Admin: create dividend
  const [divForm, setDivForm] = useState({ total_amount_cents: '', period_start: '', period_end: '' });
  // Admin: create statement
  const [stmtForm, setStmtForm] = useState({ statement_type: 'trimestriel', period_start: '', period_end: '' });

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projRes, divRes, stmtRes] = await Promise.allSettled([
        investmentProjectsApi.get(id),
        dividendsApi.list(id),
        financialStatementsApi.list(id),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data.data || projRes.value.data);
      if (divRes.status === 'fulfilled') setDividends(divRes.value.data.data || []);
      if (stmtRes.status === 'fulfilled') setStatements(stmtRes.value.data.data || []);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(investAmount) * 100);
    if (!cents || cents <= 0) { toast.error('Montant invalide'); return; }
    setSubmitting(true);
    try {
      await investmentsApi.create(id, cents);
      toast.success('Investissement effectué !');
      setInvestAmount('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDividend = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dividendsApi.create(id, {
        total_amount_cents: Math.round(parseFloat(divForm.total_amount_cents) * 100),
        period_start: divForm.period_start,
        period_end: divForm.period_end,
      });
      toast.success('Dividende distribué');
      setDivForm({ total_amount_cents: '', period_start: '', period_end: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStatement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financialStatementsApi.create(id, stmtForm);
      toast.success('Rapport financier créé');
      setStmtForm({ statement_type: 'trimestriel', period_start: '', period_end: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!project) return <div className="page"><div className="card"><p>Projet introuvable</p></div></div>;

  const a = project.attributes || project;
  const isAdmin = user?.role === 'administrateur';
  const canInvest = (user?.role === 'investisseur' || isAdmin) && a.status === 'ouvert';

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Retour aux projets
      </button>

      <div className="page-header">
        <div>
          <h1>{a.title}</h1>
          {a.property_city && <p className="text-muted">{a.property_title} — {a.property_city}</p>}
        </div>
        <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Détails</button>
        <button className={`tab${tab === 'dividends' ? ' active' : ''}`} onClick={() => setTab('dividends')}>Dividendes ({dividends.length})</button>
        <button className={`tab${tab === 'statements' ? ' active' : ''}`} onClick={() => setTab('statements')}>Rapports ({statements.length})</button>
      </div>

      {tab === 'details' && (
        <div className="two-col">
          <div className="two-col-main">
            <div className="card">
              <h3>Informations du projet</h3>
              <div className="detail-grid">
                <div className="detail-row"><span>Montant total</span><span>{fmt(a.total_amount_cents)}</span></div>
                <div className="detail-row"><span>Montant levé</span><span>{fmt(a.amount_raised_cents)}</span></div>
                <div className="detail-row"><span>Prix par part</span><span>{fmt(a.share_price_cents)}</span></div>
                <div className="detail-row"><span>Total parts</span><span>{a.total_shares}</span></div>
                <div className="detail-row"><span>Parts vendues</span><span>{a.shares_sold}</span></div>
                <div className="detail-row"><span>Parts disponibles</span><span>{a.available_shares}</span></div>
                <div className="detail-row"><span>Investissement min.</span><span>{fmt(a.min_investment_cents)}</span></div>
                {a.max_investment_cents && <div className="detail-row"><span>Investissement max.</span><span>{fmt(a.max_investment_cents)}</span></div>}
                <div className="detail-row"><span>Frais de gestion</span><span>{a.management_fee_percent}%</span></div>
                <div className="detail-row"><span>Rendement brut</span><span className="text-success">{a.gross_yield_percent ?? '—'}%</span></div>
                <div className="detail-row"><span>Rendement net</span><span className="text-success">{a.net_yield_percent ?? '—'}%</span></div>
                <div className="detail-row"><span>Début financement</span><span>{fmtDate(a.funding_start_date)}</span></div>
                <div className="detail-row"><span>Fin financement</span><span>{fmtDate(a.funding_end_date)}</span></div>
              </div>
              {a.description && <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '.9rem' }}>{a.description}</p>}
            </div>
          </div>

          <div className="two-col-side">
            <div className="card">
              <h3>Progression</h3>
              <div className="progress-bar-container" style={{ marginBottom: '.5rem' }}>
                <div className="progress-bar" style={{ width: `${Math.min(a.funding_progress_percent || 0, 100)}%` }} />
              </div>
              <div className="progress-info">
                <span>{fmt(a.amount_raised_cents)}</span>
                <span>{Math.round(a.funding_progress_percent || 0)}%</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span className="stat-value">{a.available_shares}</span>
                <span className="stat-label">parts disponibles</span>
              </div>
            </div>

            {canInvest && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Investir</h3>
                <div className="invest-constraints">
                  <span>Min: {fmt(a.min_investment_cents)}</span>
                  {a.max_investment_cents && <span>Max: {fmt(a.max_investment_cents)}</span>}
                  <span>Prix/part: {fmt(a.share_price_cents)}</span>
                </div>
                <form onSubmit={handleInvest}>
                  <div className="form-group">
                    <label>Montant (EUR)</label>
                    <input type="number" step="0.01" min="0.01" value={investAmount} onChange={e => setInvestAmount(e.target.value)} placeholder="1000.00" required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: '.75rem' }}>
                    {submitting ? 'Traitement...' : 'Confirmer l\'investissement'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'dividends' && (
        <div>
          {isAdmin && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3>Distribuer un dividende</h3>
              <form onSubmit={handleCreateDividend}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Montant total (EUR)</label>
                    <input type="number" step="0.01" min="0.01" required value={divForm.total_amount_cents} onChange={e => setDivForm({ ...divForm, total_amount_cents: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Début période</label>
                    <input type="date" required value={divForm.period_start} onChange={e => setDivForm({ ...divForm, period_start: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Fin période</label>
                    <input type="date" required value={divForm.period_end} onChange={e => setDivForm({ ...divForm, period_end: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-success" disabled={submitting}>{submitting ? '...' : 'Distribuer'}</button>
              </form>
            </div>
          )}
          {dividends.length === 0 ? (
            <div className="card"><div className="empty-state"><DollarSign size={48} /><p>Aucun dividende distribué</p></div></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Date distribution</th><th>Période</th><th>Montant total</th><th>Par part</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {dividends.map(d => {
                    const da = d.attributes || d;
                    return (
                      <tr key={d.id}>
                        <td>{fmtDate(da.distribution_date)}</td>
                        <td>{fmtDate(da.period_start)} — {fmtDate(da.period_end)}</td>
                        <td>{fmt(da.total_amount_cents)}</td>
                        <td>{fmt(da.amount_per_share_cents)}</td>
                        <td><span className={`badge ${da.status === 'distribue' ? 'badge-success' : da.status === 'annule' ? 'badge-danger' : 'badge-warning'}`}>{DIV_STATUS[da.status] || da.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'statements' && (
        <div>
          {isAdmin && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3>Générer un rapport financier</h3>
              <form onSubmit={handleCreateStatement}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={stmtForm.statement_type} onChange={e => setStmtForm({ ...stmtForm, statement_type: e.target.value })}>
                      <option value="trimestriel">Trimestriel</option>
                      <option value="semestriel">Semestriel</option>
                      <option value="annuel">Annuel</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Début période</label>
                    <input type="date" required value={stmtForm.period_start} onChange={e => setStmtForm({ ...stmtForm, period_start: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Fin période</label>
                    <input type="date" required value={stmtForm.period_end} onChange={e => setStmtForm({ ...stmtForm, period_end: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '...' : 'Générer'}</button>
              </form>
            </div>
          )}
          {statements.length === 0 ? (
            <div className="card"><div className="empty-state"><FileText size={48} /><p>Aucun rapport financier</p></div></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Type</th><th>Période</th><th>Revenus</th><th>Dépenses</th><th>Résultat net</th><th>Rend. net</th></tr>
                </thead>
                <tbody>
                  {statements.map(s => {
                    const sa = s.attributes || s;
                    return (
                      <tr key={s.id}>
                        <td><span className="badge badge-info">{STMT_TYPE[sa.statement_type] || sa.statement_type}</span></td>
                        <td>{fmtDate(sa.period_start)} — {fmtDate(sa.period_end)}</td>
                        <td className="amount-positive">{fmt(sa.total_revenue_cents)}</td>
                        <td className="amount-negative">{fmt(sa.total_expenses_cents)}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(sa.net_income_cents)}</td>
                        <td>{sa.net_yield_percent ?? '—'}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
