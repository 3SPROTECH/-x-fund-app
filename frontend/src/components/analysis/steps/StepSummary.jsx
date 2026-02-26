import { useState, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown } from 'lucide-react';
import IconifyIcon from '../IconifyIcon';
import { CRITERIA, getGradeInfo } from './StepScoring';

const PRESENTATION_FIELDS = [
  { field: 'investissement', label: "Opportunite & Strategie d'Investissement" },
  { field: 'porteur_du_projet', label: 'Presentation du Porteur de Projet' },
  { field: 'localisation', label: 'Localisation et Analyse du Marche' },
  { field: 'structure_financiere', label: 'Montage Financier et Rentabilite' },
  { field: 'garanties', label: 'Suretes et Garanties' },
];

const ANALYSIS_QUADRANTS = [
  { field: 'forces', label: 'Forces' },
  { field: 'faiblesses', label: 'Faiblesses' },
  { field: 'opportunites', label: 'Opportunites' },
  { field: 'menaces', label: 'Menaces' },
];

function isHtmlEmpty(html) {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
}

function pad(n) {
  return String(n + 1).padStart(2, '0');
}

const StepSummary = forwardRef(function StepSummary({ formData = {} }, ref) {
  const [expandedPres, setExpandedPres] = useState({});

  useImperativeHandle(ref, () => ({
    validate() {
      return true;
    },
  }));

  const scoring = formData.scoring || {};
  const gradeInfo = scoring.finalScore != null ? getGradeInfo(scoring.finalScore) : null;
  const highlights = Array.isArray(formData.highlights) ? formData.highlights : [];
  const elementsCles = Array.isArray(formData.elements_cles) ? formData.elements_cles : [];

  const togglePres = (field) => {
    setExpandedPres((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="an-sum">
      {/* Score Hero */}
      <div className={`an-sum-score-hero ${gradeInfo?.color || ''}`}>
        {gradeInfo ? (
          <>
            <span className={`an-sum-score-grade ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
            <div className="an-sum-score-info">
              <span className="an-sum-score-value">
                {scoring.finalScore.toFixed(1)} / 100
              </span>
              <span className="an-sum-score-label">{gradeInfo.label}</span>
            </div>
          </>
        ) : (
          <span className="an-sum-score-label">Score non calcule</span>
        )}
      </div>
      {gradeInfo && (
        <div className="an-sum-score-bar">
          <div
            className={`an-sum-score-fill ${gradeInfo.color}`}
            style={{ width: `${scoring.finalScore}%` }}
          />
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="an-sum-section">
          <div className="an-sum-section-title">Points Cles du Projet</div>
          <div className="an-sum-hl-grid">
            {highlights.map((h, i) => (
              <div key={i} className="an-sum-hl-card">
                <div className="an-sum-hl-icon">
                  {h.icon ? <IconifyIcon icon={h.icon} size={18} /> : null}
                </div>
                <div className="an-sum-hl-body">
                  <div className="an-sum-hl-title">{h.title}</div>
                  {h.description && (
                    <div className="an-sum-hl-desc">{h.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyse de l'actif */}
      <div className="an-sum-section">
        <div className="an-sum-section-title">Analyse de l&apos;actif</div>
        <div className="an-sum-swot-list">
          {ANALYSIS_QUADRANTS.map((q) => {
            const items = Array.isArray(formData[q.field]) ? formData[q.field] : [];
            return (
              <div key={q.field} className="an-sum-swot-group">
                <div className="an-sum-swot-group-header">
                  <span className="an-sum-swot-label">{q.label}</span>
                  <span className="an-sum-swot-count">{items.length}</span>
                </div>
                {items.length > 0 && (
                  <div className="an-sum-swot-items">
                    {items.map((item, i) => (
                      <div key={i} className="an-sum-swot-item">
                        <div className="an-sum-swot-item-title">{item.title}</div>
                        {item.description && (
                          <div className="an-sum-swot-item-desc">{item.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {items.length === 0 && (
                  <div className="an-sum-swot-empty">Aucun element renseigne</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Elements Cles */}
      {elementsCles.length > 0 && (
        <div className="an-sum-section">
          <div className="an-sum-section-title">Elements Cles de l&apos;Analyse</div>
          <div className="an-sum-kl-list">
            {elementsCles.map((el, i) => (
              <div key={i} className="an-sum-kl-item">
                <span className="an-sum-kl-num">{pad(i)}</span>
                <div className="an-sum-kl-body">
                  <div className="an-sum-kl-title">{el.title}</div>
                  {el.description && (
                    <div className="an-sum-kl-desc">{el.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presentation (collapsible) */}
      <div className="an-sum-section">
        <div className="an-sum-section-title">Presentation</div>
        <div className="an-sum-pres-list">
          {PRESENTATION_FIELDS.map((pf) => {
            const html = formData[pf.field];
            const empty = isHtmlEmpty(html);
            const isOpen = !!expandedPres[pf.field];

            return (
              <div key={pf.field} className="an-sum-pres-item">
                <div
                  className="an-sum-pres-header"
                  onClick={() => !empty && togglePres(pf.field)}
                  role={empty ? undefined : 'button'}
                  tabIndex={empty ? undefined : 0}
                  onKeyDown={(e) => {
                    if (!empty && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      togglePres(pf.field);
                    }
                  }}
                >
                  <span className="an-sum-pres-label">{pf.label}</span>
                  {empty ? (
                    <span className="an-sum-pres-empty">Non renseigne</span>
                  ) : (
                    <ChevronDown
                      size={14}
                      className={`an-sum-pres-chevron${isOpen ? ' open' : ''}`}
                    />
                  )}
                </div>
                {isOpen && !empty && (
                  <div
                    className="an-sum-pres-body"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Detail */}
      {scoring.criteria && (
        <div className="an-sum-section">
          <div className="an-sum-section-title">Detail du Scoring</div>
          <div className="an-sum-sc-list">
            {CRITERIA.map((c, i) => {
              const item = scoring.criteria[i];
              const hasGrade = item?.grade != null;
              return (
                <div key={i} className="an-sum-sc-row">
                  <span className="an-sum-sc-num">{i + 1}</span>
                  <span className="an-sum-sc-name">{c.name}</span>
                  <span className="an-sum-sc-coeff">x{c.coeff}</span>
                  <span className={`an-sum-sc-grade-val${hasGrade ? '' : ' empty'}`}>
                    {hasGrade ? item.grade.toFixed(1) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default StepSummary;
