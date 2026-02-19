import { Users } from 'lucide-react';
import { formatCents as fmt, formatDate as fmtDate } from '../../utils';

export default function ProjectInvestorsTab({ investors, investorsMeta, canViewInvestors }) {
  return (
    <div>
      {canViewInvestors ? (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3>Résumé des investisseurs</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span>Nombre total d'investisseurs</span>
                <span style={{ fontWeight: 600 }}>{investorsMeta?.total_investors || 0}</span>
              </div>
              <div className="detail-row">
                <span>Montant total investi</span>
                <span style={{ fontWeight: 600 }}>{fmt(investorsMeta?.total_amount_cents || 0)}</span>
              </div>
            </div>
          </div>

          {investors.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Users size={48} />
                <p>Aucun investisseur pour le moment</p>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Investisseur</th>
                    <th>Email</th>
                    <th>Montant investi</th>
                    <th>Date d'investissement</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map(inv => {
                    const a = inv.attributes || inv;
                    return (
                      <tr key={inv.id}>
                        <td>{a.investor_name || '—'}</td>
                        <td>{a.investor_email || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(a.amount_cents)}</td>
                        <td>{fmtDate(a.created_at)}</td>
                        <td>
                          <span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                            {a.status === 'active' ? 'Actif' : a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Users size={64} style={{ color: '#DAA520' }} />
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
              {investorsMeta?.total_investors || 0} investisseur{(investorsMeta?.total_investors || 0) > 1 ? 's' : ''}
            </h3>
            <p style={{ color: '#6b7280' }}>
              {(investorsMeta?.total_investors || 0) > 0
                ? `${investorsMeta?.total_investors} personne${investorsMeta?.total_investors > 1 ? 's' : ''} ${investorsMeta?.total_investors > 1 ? 'ont' : 'a'} investi dans ce projet`
                : 'Aucun investisseur pour le moment'}
            </p>
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8f9fb', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Montant total investi
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                {fmt(investorsMeta?.total_amount_cents || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
