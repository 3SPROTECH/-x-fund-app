import { useState } from 'react';
import {
    X, Download, TrendingUp, Shield, AlertTriangle, FileText,
    CheckCircle, XCircle, BarChart3, Target, DollarSign,
} from 'lucide-react';
import { generatePdfReport } from '../utils/reportGenerator';
import '../styles/report-viewer.css';

const fmt = (v) => v != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v) : '—';
const pct = (v) => v != null ? `${Number(v).toFixed(1)}%` : '—';

export default function ReportViewerModal({ report, projectAttrs, onClose }) {
    const [downloading, setDownloading] = useState(false);

    if (!report) return null;

    const rd = report.attributes || report;
    const reportData = rd.report_data || {};
    const scores = reportData.scores || {};
    const fin = rd.financial_metrics || {};
    const risks = rd.risk_factors || {};
    const guar = reportData.guarantee_analysis || {};
    const summary = reportData.project_summary || {};

    const successScore = Number(rd.success_score || 0);
    const riskScore = Number(rd.risk_score || 0);

    const handleDownloadPdf = () => {
        setDownloading(true);
        try {
            generatePdfReport(rd, projectAttrs);
        } catch (e) {
            console.error('PDF generation error:', e);
        } finally {
            setDownloading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 75) return 'var(--rv-emerald)';
        if (score >= 55) return 'var(--rv-amber)';
        if (score >= 35) return 'var(--rv-orange)';
        return 'var(--rv-red)';
    };

    const getRiskColor = (value) => {
        if (value > 70) return 'var(--rv-red)';
        if (value > 40) return 'var(--rv-amber)';
        return 'var(--rv-emerald)';
    };

    return (
        <div className="rv-overlay" onClick={onClose}>
            <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="rv-header">
                    <div className="rv-header-left">
                        <FileText size={20} />
                        <div>
                            <h2 className="rv-title">Rapport d'analyse</h2>
                            <p className="rv-subtitle">{summary.title || projectAttrs?.title || 'Projet'}</p>
                        </div>
                    </div>
                    <div className="rv-header-actions">
                        <button className="rv-btn rv-btn-gold" onClick={handleDownloadPdf} disabled={downloading}>
                            <Download size={16} />
                            {downloading ? 'Génération...' : 'Télécharger PDF'}
                        </button>
                        <button className="rv-btn-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="rv-content">
                    {/* Score Gauges */}
                    <div className="rv-scores-row">
                        <div className="rv-score-card rv-score-success">
                            <div className="rv-gauge" style={{ '--gauge-pct': `${successScore}%`, '--gauge-color': getScoreColor(successScore) }}>
                                <svg viewBox="0 0 120 120" className="rv-gauge-svg">
                                    <circle cx="60" cy="60" r="52" className="rv-gauge-bg" />
                                    <circle cx="60" cy="60" r="52" className="rv-gauge-fill"
                                        style={{ strokeDasharray: `${successScore * 3.267} 326.7` }} />
                                </svg>
                                <div className="rv-gauge-value">
                                    <span className="rv-gauge-number">{successScore.toFixed(0)}</span>
                                    <span className="rv-gauge-pct">%</span>
                                </div>
                            </div>
                            <div className="rv-score-label">Score de succès</div>
                        </div>

                        <div className="rv-recommendation-card">
                            <Target size={20} />
                            <span className="rv-recommendation-label">Recommandation</span>
                            <span className={`rv-recommendation-value rv-rec-${successScore >= 75 ? 'good' : successScore >= 55 ? 'ok' : 'bad'}`}>
                                {rd.recommendation || '—'}
                            </span>
                            {reportData.analyst_name && (
                                <span className="rv-analyst-name">Par {reportData.analyst_name}</span>
                            )}
                            {reportData.generated_at && (
                                <span className="rv-report-date">
                                    {new Date(reportData.generated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            )}
                        </div>

                        <div className="rv-score-card rv-score-risk">
                            <div className="rv-gauge" style={{ '--gauge-pct': `${riskScore}%`, '--gauge-color': 'var(--rv-red)' }}>
                                <svg viewBox="0 0 120 120" className="rv-gauge-svg">
                                    <circle cx="60" cy="60" r="52" className="rv-gauge-bg" />
                                    <circle cx="60" cy="60" r="52" className="rv-gauge-fill"
                                        style={{ strokeDasharray: `${riskScore * 3.267} 326.7` }} />
                                </svg>
                                <div className="rv-gauge-value">
                                    <span className="rv-gauge-number">{riskScore.toFixed(0)}</span>
                                    <span className="rv-gauge-pct">%</span>
                                </div>
                            </div>
                            <div className="rv-score-label">Score de risque</div>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="rv-section">
                        <h3 className="rv-section-title"><BarChart3 size={18} /> Détail des scores</h3>
                        <div className="rv-scores-breakdown">
                            {[
                                { label: 'Garanties', value: scores.guarantee || 0, weight: '20%', icon: Shield },
                                { label: 'Financier', value: scores.financial || 0, weight: '25%', icon: DollarSign },
                                { label: 'Documentation', value: scores.documentation || 0, weight: '15%', icon: FileText },
                                { label: 'Marché', value: scores.market || 0, weight: '15%', icon: TrendingUp },
                                { label: 'Résilience', value: scores.risk_resilience || 0, weight: '25%', icon: AlertTriangle },
                            ].map((cat) => (
                                <div key={cat.label} className="rv-score-bar-item">
                                    <div className="rv-score-bar-header">
                                        <div className="rv-score-bar-label">
                                            <cat.icon size={14} />
                                            <span>{cat.label}</span>
                                            <span className="rv-score-weight">({cat.weight})</span>
                                        </div>
                                        <span className="rv-score-bar-value" style={{ color: getScoreColor(cat.value) }}>
                                            {cat.value.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="rv-progress-bar">
                                        <div className="rv-progress-fill" style={{ width: `${cat.value}%`, background: getScoreColor(cat.value) }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="rv-section">
                        <h3 className="rv-section-title"><DollarSign size={18} /> Analyse financière</h3>
                        <div className="rv-metrics-grid">
                            {[
                                { label: 'Montant total', value: fmt(fin.total_amount) },
                                { label: 'Rendement brut', value: pct(fin.gross_yield) },
                                { label: 'Rendement net', value: pct(fin.net_yield) },
                                { label: 'Fonds propres', value: fmt(fin.equity_amount) },
                                { label: 'Prêt bancaire', value: fmt(fin.bank_loan_amount) },
                                { label: 'Ratio d\'equity', value: pct(fin.equity_ratio) },
                                { label: 'Couverture bancaire', value: pct(fin.bank_coverage_percent) },
                                { label: 'Marge projetée', value: pct(fin.margin_ratio) },
                            ].map((m) => (
                                <div key={m.label} className="rv-metric-card">
                                    <span className="rv-metric-label">{m.label}</span>
                                    <span className="rv-metric-value">{m.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Cost breakdown */}
                        {fin.cost_breakdown && (
                            <div className="rv-cost-breakdown">
                                <h4>Répartition des coûts</h4>
                                <div className="rv-cost-bars">
                                    {Object.entries(fin.cost_breakdown)
                                        .filter(([, v]) => v > 0)
                                        .map(([key, value]) => {
                                            const total = Object.values(fin.cost_breakdown).reduce((s, v) => s + (v || 0), 0) || 1;
                                            const widthPct = (value / total) * 100;
                                            return (
                                                <div key={key} className="rv-cost-bar-item">
                                                    <div className="rv-cost-bar-header">
                                                        <span>{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</span>
                                                        <span>{fmt(value)}</span>
                                                    </div>
                                                    <div className="rv-progress-bar">
                                                        <div className="rv-progress-fill rv-progress-gold" style={{ width: `${widthPct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Risk Factors */}
                    <div className="rv-section">
                        <h3 className="rv-section-title"><AlertTriangle size={18} /> Facteurs de risque</h3>
                        <div className="rv-risk-factors">
                            {(risks.factors || []).map((factor, idx) => (
                                <div key={idx} className="rv-risk-item">
                                    <div className="rv-risk-header">
                                        <span className="rv-risk-name">{factor.name}</span>
                                        <span className="rv-risk-value" style={{ color: getRiskColor(factor.value) }}>
                                            {pct(factor.value)}
                                        </span>
                                    </div>
                                    <div className="rv-progress-bar">
                                        <div className="rv-progress-fill" style={{ width: `${factor.value}%`, background: getRiskColor(factor.value) }} />
                                    </div>
                                    <span className="rv-risk-detail">{factor.detail}</span>
                                </div>
                            ))}

                            <div className="rv-risk-summary">
                                <div className="rv-risk-summary-item">
                                    <span>Risque moyen</span>
                                    <span className="rv-risk-summary-value" style={{ color: 'var(--rv-red)' }}>{pct(risks.average_risk)}</span>
                                </div>
                                <div className="rv-risk-summary-item">
                                    <span>Résilience</span>
                                    <span className="rv-risk-summary-value" style={{ color: 'var(--rv-emerald)' }}>{pct(risks.resilience_score)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guarantees */}
                    {guar.details && (
                        <div className="rv-section">
                            <h3 className="rv-section-title"><Shield size={18} /> Garanties ({guar.count}/{guar.total})</h3>
                            <div className="rv-guarantees-grid">
                                {guar.details.map((g, idx) => (
                                    <div key={idx} className={`rv-guarantee-item ${g.present ? 'rv-guarantee-yes' : 'rv-guarantee-no'}`}>
                                        {g.present ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        <span>{g.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comment */}
                    {rd.comment && (
                        <div className="rv-section">
                            <h3 className="rv-section-title"><FileText size={18} /> Commentaire de l'analyste</h3>
                            <div className="rv-comment-box">
                                {rd.comment}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
