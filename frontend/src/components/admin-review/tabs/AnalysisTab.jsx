import { BookOpen, User, MapPin, Shield, BarChart3, Star, ThumbsUp } from 'lucide-react';

const SECTIONS = [
  { field: 'investissement', label: "Analyse de l'investissement", Icon: BookOpen },
  { field: 'porteur_du_projet', label: 'Porteur du projet', Icon: User },
  { field: 'localisation', label: 'Localisation', Icon: MapPin },
  { field: 'garanties', label: 'Garanties', Icon: Shield },
];

function isHtmlEmpty(html) {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, '').trim().length === 0;
}

export default function AnalysisTab({ project, reportData }) {
  const a = project?.attributes || project || {};
  const rd = reportData?.attributes || reportData || {};
  const analysis = rd.report_data?.analysis || rd.report_data || {};

  const highlights = analysis.highlights || [];
  const elementsCles = analysis.elements_cles || [];
  const structureFin = analysis.structure_financiere;

  const hasNarratives = SECTIONS.some((s) => !isHtmlEmpty(analysis[s.field]));

  if (!reportData) {
    return (
      <div className="apr-panel active">
        <div className="apr-card">
          <div className="apr-card-b apr-empty">Aucun rapport d'analyse disponible pour ce projet.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="apr-panel active">
      {/* Narrative Cards Grid */}
      {hasNarratives && (
        <div className="apr-g2 apr-mb20">
          {SECTIONS.map(({ field, label, Icon }) => {
            const html = analysis[field];
            if (isHtmlEmpty(html)) return null;
            return (
              <div className="apr-card" key={field}>
                <div className="apr-card-h">
                  <div className="apr-card-h-left">
                    <div className="apr-card-icon"><Icon size={14} /></div>
                    <span className="apr-card-t">{label}</span>
                  </div>
                </div>
                <div className="apr-card-b">
                  <div className="apr-narr-text" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </div>
            );
          })}

          {/* Full-width financial structure */}
          {!isHtmlEmpty(structureFin) && (
            <div className="apr-card apr-full">
              <div className="apr-card-h">
                <div className="apr-card-h-left">
                  <div className="apr-card-icon"><BarChart3 size={14} /></div>
                  <span className="apr-card-t">Structure financiere</span>
                </div>
              </div>
              <div className="apr-card-b">
                <div className="apr-narr-text" dangerouslySetInnerHTML={{ __html: structureFin }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Elements */}
      {(highlights.length > 0 || elementsCles.length > 0) && (
        <div className="apr-card apr-mb20">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><Star size={14} /></div>
              <span className="apr-card-t">Elements cles</span>
            </div>
          </div>
          <div className="apr-card-b">
            <div className="apr-chips">
              {highlights.map((h, i) => (
                <span className="apr-chip" key={`h-${i}`}>{h.title}</span>
              ))}
              {elementsCles.map((el, i) => (
                <span className="apr-chip" key={`e-${i}`}>{el.title}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analyst Recommendation */}
      {a.analyst_comment && (
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon" style={{ background: 'var(--apr-green-bg)', color: 'var(--apr-green)' }}>
                <ThumbsUp size={14} />
              </div>
              <span className="apr-card-t">Recommandation de l'analyste</span>
            </div>
            {a.analyst_opinion === 'opinion_submitted' && (
              <span className="apr-rec-badge favorable">
                <span className="apr-badge-dot" /> Soumise
              </span>
            )}
          </div>
          <div className="apr-card-b">
            <p className="apr-narr-text" style={{ whiteSpace: 'pre-wrap' }}>{a.analyst_comment}</p>
          </div>
        </div>
      )}
    </div>
  );
}
