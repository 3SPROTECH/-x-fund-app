import { DollarSign, TrendingUp, Calendar, Shield, Info } from 'lucide-react';
import { formatCents, formatDate } from '../../../utils/formatters';

const GUARANTEE_LABELS = {
  hypotheque: 'Hypotheque',
  fiducie: 'Fiducie',
  garantie_premiere_demande: 'Garantie a premiere demande (GAPD)',
  caution_personnelle: 'Caution personnelle',
  garantie_corporate: 'Garantie corporate',
  aucune: 'Aucune',
};

export default function FinancialsTab({ project }) {
  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const fin = snapshot.financialStructure || {};
  const proj = snapshot.projections || {};
  const assets = snapshot.assets || [];

  const guarantees = assets
    .map((asset) => asset.guarantee)
    .filter((g) => g && g.type && g.type !== 'aucune');

  const totalGuaranteeValue = guarantees.reduce((sum, g) => sum + (g.assetValue || 0), 0);
  const totalAmountEur = a.total_amount_cents ? a.total_amount_cents / 100 : 0;
  const coverageRatio = totalAmountEur > 0 ? ((totalGuaranteeValue / totalAmountEur) * 100).toFixed(1) : 0;

  const strategy = a.exploitation_strategy || fin.exploitationStrategy;
  const STRATEGY_LABELS = {
    seasonal_rental: 'Location saisonniere',
    classic_rental: 'Location classique',
    resale: 'Revente',
    colocation: 'Colocation',
  };

  return (
    <div className="apr-panel active">
      <div className="apr-g2 apr-mb20">
        {/* Financial Details */}
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><DollarSign size={14} /></div>
              <span className="apr-card-t">Details financiers</span>
            </div>
            <span className="apr-source-tag apr-source-owner">Donnees porteur</span>
          </div>
          <div className="apr-card-b">
            <div className="apr-drow"><span className="apr-dl">Montant total (objectif)</span><span className="apr-dv mono">{formatCents(a.total_amount_cents)}</span></div>
            <div className="apr-drow"><span className="apr-dl">Montant leve</span><span className="apr-dv mono green">{formatCents(a.amount_raised_cents || 0)}</span></div>
            <div className="apr-drow"><span className="apr-dl">Parts totales</span><span className="apr-dv mono">{a.total_shares || '—'}</span></div>
            <div className="apr-drow"><span className="apr-dl">Parts vendues</span><span className="apr-dv mono">{a.shares_sold || 0}</span></div>
            <div className="apr-drow"><span className="apr-dl">Parts disponibles</span><span className="apr-dv mono">{a.available_shares ?? a.total_shares ?? '—'}</span></div>
            <div className="apr-drow"><span className="apr-dl">Prix par part</span><span className="apr-dv mono">{formatCents(a.share_price_cents)}</span></div>
            <div className="apr-drow"><span className="apr-dl">Investissement minimum</span><span className="apr-dv mono">{formatCents(a.min_investment_cents)}</span></div>
            <div className="apr-drow"><span className="apr-dl">Investissement maximum</span><span className="apr-dv">{a.max_investment_cents ? formatCents(a.max_investment_cents) : 'Aucune limite'}</span></div>
          </div>
        </div>

        {/* Yield & Fees */}
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><TrendingUp size={14} /></div>
              <span className="apr-card-t">Rendement & Frais</span>
            </div>
            <span className="apr-source-tag apr-source-owner">Donnees porteur</span>
          </div>
          <div className="apr-card-b">
            <div className="apr-drow"><span className="apr-dl">Rendement brut</span><span className="apr-dv mono green">{a.gross_yield_percent != null ? `${a.gross_yield_percent}%` : '—'}</span></div>
            <div className="apr-drow"><span className="apr-dl">Rendement net</span><span className="apr-dv mono green">{a.net_yield_percent != null ? `${a.net_yield_percent}%` : '—'}</span></div>
            <div className="apr-drow"><span className="apr-dl">Frais de gestion</span><span className="apr-dv mono">{a.management_fee_percent != null ? `${a.management_fee_percent}%` : '—'}</span></div>
            <div className="apr-drow"><span className="apr-dl">Strategie</span><span className="apr-dv">{STRATEGY_LABELS[strategy] || strategy || '—'}</span></div>
            <div className="apr-drow"><span className="apr-dl">Duree du projet</span><span className="apr-dv">{a.duration_months ? `${a.duration_months} mois` : '—'}</span></div>
            <div className="apr-admin-note">
              <Info size={14} />
              <span>Le rendement est declare par le porteur et justifie dans son dossier. L'analyste l'evalue dans son scoring. En cas de desaccord, utilisez "Reprendre" pour demander un ajustement.</span>
            </div>
          </div>
        </div>

        {/* Funding Period */}
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><Calendar size={14} /></div>
              <span className="apr-card-t">Periode de levee</span>
            </div>
          </div>
          <div className="apr-card-b">
            <div className="apr-drow"><span className="apr-dl">Date de debut</span><span className="apr-dv">{formatDate(a.funding_start_date)}</span></div>
            <div className="apr-drow"><span className="apr-dl">Date de fin</span><span className="apr-dv">{formatDate(a.funding_end_date)}</span></div>
            <div className="apr-drow">
              <span className="apr-dl">Duree restante</span>
              <span className="apr-dv green">
                {a.funding_end_date && new Date(a.funding_end_date) > new Date()
                  ? `${Math.ceil((new Date(a.funding_end_date) - new Date()) / (1000 * 60 * 60 * 24))} jours`
                  : 'Terminee'}
              </span>
            </div>
            {(proj.contributionPct != null) && (
              <div className="apr-drow"><span className="apr-dl">Apport porteur</span><span className="apr-dv">{proj.contributionPct}%</span></div>
            )}
          </div>
        </div>

        {/* Guarantees */}
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><Shield size={14} /></div>
              <span className="apr-card-t">Garanties</span>
            </div>
            <span className="apr-source-tag apr-source-system">Calcule</span>
          </div>
          <div className="apr-card-b">
            {guarantees.length > 0 ? (
              <>
                {guarantees.map((g, i) => {
                  const pct = totalAmountEur > 0 ? ((g.assetValue || 0) / totalAmountEur * 100).toFixed(1) : '0';
                  return (
                    <div className="apr-guar" key={i}>
                      <span className="apr-guar-type">{GUARANTEE_LABELS[g.type] || g.type}</span>
                      <span className="apr-guar-amount">
                        {g.assetValue ? `${g.assetValue.toLocaleString('fr-FR')} €` : '—'}
                      </span>
                      <span className="apr-guar-pct">{pct}%</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--apr-border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--apr-text-tertiary)' }}>Couverture totale</span>
                  <span style={{ color: 'var(--apr-green)', fontWeight: 600, fontFamily: 'var(--apr-font-mono)' }}>
                    {totalGuaranteeValue.toLocaleString('fr-FR')} € ({coverageRatio}%)
                  </span>
                </div>
              </>
            ) : (
              <div className="apr-empty">Aucune garantie renseignee.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
