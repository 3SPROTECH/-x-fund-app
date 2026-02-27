import { FileText, Grid2x2, TrendingUp, AlertTriangle, Info, Zap, BarChart3 } from 'lucide-react';
import { formatCents } from '../../../utils/formatters';
import ScoreGauge from '../ScoreGauge';

const OPERATION_LABELS = {
  marchand_de_biens: 'Marchand de biens',
  immobilier_locatif: 'Locatif',
  promotion_immobiliere: 'Promotion',
  rehabilitation_lourde: 'Rehabilitation',
  division_fonciere: 'Division fonciere',
  transformation_usage: "Transformation d'usage",
};

const STRATEGY_LABELS = {
  seasonal_rental: 'Location saisonniere',
  classic_rental: 'Location classique',
  resale: 'Revente',
  colocation: 'Colocation',
};

function SwotQuadrant({ className, title, items }) {
  return (
    <div className={`apr-sq ${className}`}>
      <div className="apr-sq-title">{title}</div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item.title || item}</li>
        ))}
      </ul>
    </div>
  );
}

function RiskBar({ score }) {
  const segments = 10;
  const filledCount = score != null ? Math.round((score / 100) * segments) : 0;
  return (
    <div className="apr-risk-bar">
      {Array.from({ length: segments }, (_, i) => {
        const on = i < filledCount;
        const level = i < 3 ? 'low' : i < 6 ? 'med' : 'high';
        return <div key={i} className={`apr-risk-seg${on ? ` on ${level}` : ''}`} />;
      })}
    </div>
  );
}

function getRiskLevel(score) {
  if (score == null) return null;
  // Invert: higher analysis score = lower risk
  const riskScore = 100 - score;
  if (riskScore <= 30) return { label: 'Faible', color: 'green' };
  if (riskScore <= 50) return { label: 'Modere', color: 'orange' };
  return { label: 'Eleve', color: 'red' };
}

export default function OverviewTab({ project, reportData }) {
  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const pres = snapshot.presentation || {};

  const rd = reportData?.attributes || reportData || {};
  const analysis = rd.report_data?.analysis || rd.report_data || {};
  const scoring = analysis.scoring || {};
  const hasReport = !!reportData;

  const forces = analysis.forces || [];
  const faiblesses = analysis.faiblesses || [];
  const opportunites = analysis.opportunites || [];
  const menaces = analysis.menaces || [];
  const hasSWOT = forces.length > 0 || faiblesses.length > 0 || opportunites.length > 0 || menaces.length > 0;

  const highlights = analysis.highlights || [];
  const elementsCles = analysis.elements_cles || [];

  const riskInfo = scoring.finalScore != null ? getRiskLevel(scoring.finalScore) : null;

  const operationType = pres.operationType || a.operation_type;
  const strategy = pres.exploitationStrategy || a.exploitation_strategy;

  return (
    <div className="apr-panel active">
      <div className="apr-g-main">
        {/* LEFT COLUMN */}
        <div>
          {/* Description */}
          <div className="apr-card apr-mb20">
            <div className="apr-card-h">
              <div className="apr-card-h-left">
                <div className="apr-card-icon"><FileText size={14} /></div>
                <span className="apr-card-t">Description du projet</span>
              </div>
              <span className="apr-source-tag apr-source-owner">Donnees porteur</span>
            </div>
            <div className="apr-card-b">
              <p className="apr-narr-text">{a.description || pres.pitch || 'Aucune description disponible.'}</p>
              <div style={{ marginTop: 14 }} className="apr-chips">
                {operationType && OPERATION_LABELS[operationType] && (
                  <span className="apr-chip">{OPERATION_LABELS[operationType]}</span>
                )}
                {a.property_city && <span className="apr-chip">{a.property_city}</span>}
                {strategy && STRATEGY_LABELS[strategy] && (
                  <span className="apr-chip">Strategie: {STRATEGY_LABELS[strategy]}</span>
                )}
                {(a.duration_months || pres.durationMonths) && (
                  <span className="apr-chip">Duree: {a.duration_months || pres.durationMonths} mois</span>
                )}
              </div>
            </div>
          </div>

          {/* Key Financial Data */}
          <div className="apr-card apr-mb20">
            <div className="apr-card-h">
              <div className="apr-card-h-left">
                <div className="apr-card-icon"><BarChart3 size={14} /></div>
                <span className="apr-card-t">Donnees financieres cles</span>
              </div>
              <span className="apr-source-tag apr-source-owner">Donnees porteur</span>
            </div>
            <div className="apr-card-b">
              <div className="apr-drow"><span className="apr-dl">Montant total</span><span className="apr-dv">{formatCents(a.total_amount_cents)}</span></div>
              <div className="apr-drow"><span className="apr-dl">Prix par part</span><span className="apr-dv">{formatCents(a.price_per_share_cents)}</span></div>
              <div className="apr-drow"><span className="apr-dl">Nombre de parts</span><span className="apr-dv">{a.total_shares || '—'}</span></div>
              <div className="apr-drow"><span className="apr-dl">Rendement net</span><span className="apr-dv">{a.net_yield != null ? `${a.net_yield}%` : '—'}</span></div>
              <div className="apr-drow">
                <span className="apr-dl">Duree</span>
                <span className="apr-dv">{a.duration_months || pres.durationMonths ? `${a.duration_months || pres.durationMonths} mois` : '—'}</span>
              </div>
            </div>
          </div>

          {/* Analyst Highlights */}
          {highlights.length > 0 && (
            <div className="apr-card apr-mb20">
              <div className="apr-card-h">
                <div className="apr-card-h-left">
                  <div className="apr-card-icon"><Zap size={14} /></div>
                  <span className="apr-card-t">Points cles</span>
                </div>
                <span className="apr-source-tag apr-source-analyst">Analyste</span>
              </div>
              <div className="apr-card-b">
                <ul className="apr-highlights-list">
                  {highlights.map((h, i) => (
                    <li key={i}>{typeof h === 'string' ? h : h.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Key Elements */}
          {elementsCles.length > 0 && (
            <div className="apr-card apr-mb20">
              <div className="apr-card-h">
                <div className="apr-card-h-left">
                  <div className="apr-card-icon"><Info size={14} /></div>
                  <span className="apr-card-t">Elements cles</span>
                </div>
                <span className="apr-source-tag apr-source-analyst">Analyste</span>
              </div>
              <div className="apr-card-b">
                <div className="apr-chips">
                  {elementsCles.map((el, i) => (
                    <span key={i} className="apr-chip">{typeof el === 'string' ? el : el.title}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SWOT */}
          {hasSWOT && (
            <div className="apr-card">
              <div className="apr-card-h">
                <div className="apr-card-h-left">
                  <div className="apr-card-icon"><Grid2x2 size={14} /></div>
                  <span className="apr-card-t">Analyse SWOT</span>
                </div>
                <span className="apr-source-tag apr-source-analyst">Analyste</span>
              </div>
              <div className="apr-card-b">
                <div className="apr-swot">
                  {forces.length > 0 && <SwotQuadrant className="s" title="Forces" items={forces} />}
                  {faiblesses.length > 0 && <SwotQuadrant className="w" title="Faiblesses" items={faiblesses} />}
                  {opportunites.length > 0 && <SwotQuadrant className="o" title="Opportunites" items={opportunites} />}
                  {menaces.length > 0 && <SwotQuadrant className="t" title="Menaces" items={menaces} />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          {/* Score */}
          {hasReport && scoring.finalScore != null && (
            <div className="apr-card apr-mb16">
              <div className="apr-card-h">
                <div className="apr-card-h-left">
                  <div className="apr-card-icon"><TrendingUp size={14} /></div>
                  <span className="apr-card-t">Score global</span>
                </div>
                <span className="apr-source-tag apr-source-analyst">Analyste</span>
              </div>
              <div className="apr-card-b">
                <ScoreGauge scoring={scoring} />
              </div>
            </div>
          )}

          {/* Risk Synthesis */}
          {hasReport && scoring.finalScore != null && (
            <div className="apr-card">
              <div className="apr-card-h">
                <div className="apr-card-h-left">
                  <div className="apr-card-icon" style={{ background: 'var(--apr-orange-bg)', color: 'var(--apr-orange)' }}>
                    <AlertTriangle size={14} />
                  </div>
                  <span className="apr-card-t">Synthese des risques</span>
                </div>
                <span className="apr-source-tag apr-source-analyst">Analyste</span>
              </div>
              <div className="apr-card-b">
                <RiskBar score={scoring.finalScore} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--apr-text-hint)', marginBottom: 14 }}>
                  <span>Faible</span><span>Eleve</span>
                </div>
                {riskInfo && (
                  <div className="apr-drow">
                    <span className="apr-dl">Niveau global</span>
                    <span className={`apr-dv ${riskInfo.color}`}>{riskInfo.label}</span>
                  </div>
                )}
                <div className="apr-admin-note">
                  <Info size={14} />
                  <span>Les risques sont evalues par l'analyste sur la base de l'analyse financiere, la visite du site, et l'etude de marche locale.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
