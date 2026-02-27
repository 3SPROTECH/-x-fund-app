import { formatCents } from '../../utils/formatters';
import { getGradeInfo } from '../analysis/steps/StepScoring';

function getRiskLabel(score) {
  if (score >= 71) return 'Faible';
  if (score >= 51) return 'Modere';
  if (score >= 31) return 'Eleve';
  return 'Critique';
}

function getRiskColor(score) {
  if (score >= 71) return 'var(--apr-green)';
  if (score >= 51) return 'var(--apr-orange)';
  return 'var(--apr-red)';
}

export default function KpiStrip({ project, reportData }) {
  const a = project?.attributes || project || {};
  const rd = reportData?.attributes || reportData || {};
  const analysis = rd.report_data?.analysis || rd.report_data || {};
  const scoring = analysis.scoring || {};
  const gradeInfo = scoring.finalScore != null ? getGradeInfo(scoring.finalScore) : null;

  return (
    <div className="apr-kpi-strip apr-anim apr-d2">
      <div className="apr-kpi">
        <div className="apr-kpi-label">Montant total</div>
        <div className="apr-kpi-value">{formatCents(a.total_amount_cents)}</div>
        <div className="apr-kpi-sub">Objectif de levee</div>
      </div>

      <div className="apr-kpi">
        <div className="apr-kpi-label">Rendement net annuel</div>
        <div className="apr-kpi-value" style={{ color: 'var(--apr-green)' }}>
          {a.net_yield_percent != null ? `${a.net_yield_percent}%` : '—'}
        </div>
        <div className="apr-kpi-sub">
          Brut: {a.gross_yield_percent != null ? `${a.gross_yield_percent}%` : '—'}
          <span className="apr-source-tag apr-source-owner">Porteur</span>
        </div>
      </div>

      <div className="apr-kpi">
        <div className="apr-kpi-label">Prix par part</div>
        <div className="apr-kpi-value">{formatCents(a.share_price_cents)}</div>
        <div className="apr-kpi-sub">{a.total_shares || '—'} parts disponibles</div>
      </div>

      <div className="apr-kpi">
        <div className="apr-kpi-label">Score analyste</div>
        <div className="apr-kpi-value">
          {scoring.finalScore != null ? Math.round(scoring.finalScore) : '—'}
          <span className="apr-kpi-value-suffix">/100</span>
        </div>
        <div className="apr-kpi-sub">
          {gradeInfo ? `Grade ${gradeInfo.grade}` : 'Non disponible'}
          {scoring.finalScore != null && <span className="apr-source-tag apr-source-analyst">Analyste</span>}
        </div>
      </div>

      <div className="apr-kpi">
        <div className="apr-kpi-label">Niveau de risque</div>
        <div className="apr-kpi-value" style={{ color: scoring.finalScore != null ? getRiskColor(scoring.finalScore) : undefined }}>
          {scoring.finalScore != null ? getRiskLabel(scoring.finalScore) : '—'}
        </div>
        <div className="apr-kpi-sub">
          {scoring.finalScore != null ? `Score: ${Math.round(scoring.finalScore)}/100` : 'Non disponible'}
          {scoring.finalScore != null && <span className="apr-source-tag apr-source-analyst">Analyste</span>}
        </div>
      </div>
    </div>
  );
}
