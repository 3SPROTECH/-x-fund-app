import { useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Calculator, MessageSquare, ChevronDown } from 'lucide-react';

export const CRITERIA = [
  { name: 'Couverture de la garantie', coeff: 1.5, desc: 'Ratio entre la garantie et le montant emprunté — plus il est élevé, plus le capital est protégé.' },
  { name: 'Type de garantie', coeff: 1, desc: 'Nature juridique de la sûreté (hypothèque, fiducie, caution…) et son niveau de protection effectif.' },
  { name: "Niveau d'apport", coeff: 1, desc: "Part des fonds propres injectés par le porteur, reflet de son engagement financier dans l'opération." },
  { name: 'Montant séquestré pour intérêts', coeff: 0.5, desc: 'Réserve bloquée couvrant le service de la dette en cas de retard ou de décalage du projet.' },
  { name: 'Taux de pré-commercialisation', coeff: 1, desc: 'Part du projet déjà vendue ou réservée, sécurisant les flux de trésorerie futurs.' },
  { name: 'Couverture loyers / annuité', coeff: 0.5, desc: "Capacité des revenus locatifs à couvrir les échéances de remboursement de l'emprunt." },
  { name: 'Prix au m² vs marché', coeff: 1, desc: "Positionnement du prix d'acquisition par rapport aux références locales pour évaluer le risque de survalorisation." },
  { name: 'Expérience / Track record du PDP', coeff: 1, desc: 'Historique du porteur : nombre et qualité des opérations réalisées, expertise sectorielle.' },
  { name: 'Marge brute prévisionnelle', coeff: 1.5, desc: "Écart entre les recettes attendues et le coût total, mesurant la rentabilité et la marge de sécurité de l'opération." },
  { name: "Durée de l'emprunt", coeff: 1, desc: "Horizon de remboursement — une durée courte limite l'exposition aux aléas de marché." },
];

export const GRADE_SCALE = [
  { grade: 'A+', min: 91, max: 100, label: 'Excellent — Projet très sécurisé avec de solides garanties', color: 'green' },
  { grade: 'A', min: 81, max: 90, label: 'Très bon — Projet solide avec un risque modéré', color: 'green' },
  { grade: 'A-', min: 71, max: 80, label: 'Bon — Projet intéressant avec points de vigilance mineurs', color: 'green' },
  { grade: 'B+', min: 61, max: 70, label: 'Correct — Projet nécessitant plusieurs points de vigilance', color: 'orange' },
  { grade: 'B', min: 51, max: 60, label: 'Moyen — Projet présentant des zones de risques identifiées', color: 'orange' },
  { grade: 'B-', min: 41, max: 50, label: "Risque significatif — L'analyse présente des risques majeurs", color: 'orange' },
  { grade: 'C+', min: 31, max: 40, label: 'Risque élevé — Réservé aux investisseurs avertis', color: 'red' },
  { grade: 'C', min: 0, max: 30, label: 'Risque critique — Projet très spéculatif', color: 'red' },
];

export function getGradeInfo(score) {
  for (const g of GRADE_SCALE) {
    if (score >= g.min) return g;
  }
  return GRADE_SCALE[GRADE_SCALE.length - 1];
}

function buildDefault() {
  return {
    criteria: CRITERIA.map(() => ({ grade: null, comment: '' })),
    finalScore: null,
    grade: null,
  };
}

const TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const StepScoring = forwardRef(function StepScoring({ value, onChange }, ref) {
  const data = value && value.criteria ? value : buildDefault();
  const [attempted, setAttempted] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const resultRef = useRef(null);

  useImperativeHandle(ref, () => ({
    validate() {
      setAttempted(true);
      const allGraded = data.criteria.every((c) => c.grade !== null);
      if (!allGraded) return false;
      if (data.finalScore === null) return false;
      return true;
    },
  }));

  const update = (next) => {
    onChange?.({ ...data, ...next, finalScore: null, grade: null });
  };

  const updateCriteria = (index, field, val) => {
    const next = data.criteria.map((c, i) =>
      i === index ? { ...c, [field]: val } : c,
    );
    update({ criteria: next });
  };

  const toggleComment = (index) => {
    setOpenComments((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const allGraded = data.criteria.every((c) => c.grade !== null);

  const calculate = () => {
    setAttempted(true);
    if (!allGraded) return;

    const weightedSum = data.criteria.reduce(
      (sum, c, i) => sum + (c.grade ?? 0) * CRITERIA[i].coeff,
      0,
    );
    const score = Math.round(weightedSum * 10) / 10;
    const gradeInfo = getGradeInfo(score);

    onChange?.({
      ...data,
      finalScore: score,
      grade: gradeInfo.grade,
    });

    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  const gradeInfo = data.finalScore !== null ? getGradeInfo(data.finalScore) : null;

  const filledCount = useMemo(
    () => data.criteria.filter((c) => c.grade !== null).length,
    [data.criteria],
  );

  return (
    <div>
      {/* Progress indicator */}
      <div className="an-sc-progress">
        {filledCount} / {CRITERIA.length} critères notés
      </div>

      {/* Criteria list */}
      <div className="an-sc-list">
        {CRITERIA.map((criterion, i) => {
          const item = data.criteria[i];
          const hasGrade = item.grade !== null;
          const showError = attempted && !hasGrade;
          const commentOpen = openComments[i];

          return (
            <div
              key={i}
              className={`an-sc-card${showError ? ' error' : ''}${hasGrade ? ' graded' : ''}`}
            >
              <div className="an-sc-card-header">
                <span className="an-sc-card-num">{i + 1}</span>
                <div className="an-sc-card-label">
                  <span className="an-sc-card-name">{criterion.name}</span>
                  <span className="an-sc-card-desc">{criterion.desc}</span>
                </div>
                <span className="an-sc-coeff">x{criterion.coeff}</span>
              </div>

              <div className="an-sc-slider-row">
                <input
                  type="range"
                  className="an-sc-slider"
                  min={0}
                  max={10}
                  step={0.5}
                  value={hasGrade ? item.grade : 5}
                  onChange={(e) =>
                    updateCriteria(i, 'grade', parseFloat(e.target.value))
                  }
                  style={
                    hasGrade
                      ? { '--pct': `${(item.grade / 10) * 100}%` }
                      : { '--pct': '50%', opacity: 0.35 }
                  }
                />
                <span className={`an-sc-slider-value${hasGrade ? '' : ' empty'}`}>
                  {hasGrade ? item.grade.toFixed(1) : '—'}
                </span>
              </div>

              <div className="an-sc-ticks">
                {TICKS.map((t) => (
                  <span key={t} className="an-sc-tick">{t}</span>
                ))}
              </div>

              <div className="an-sc-card-footer">
                <button
                  type="button"
                  className={`an-sc-comment-toggle${commentOpen ? ' open' : ''}`}
                  onClick={() => toggleComment(i)}
                >
                  <MessageSquare size={12} />
                  {item.comment ? 'Modifier le commentaire' : 'Ajouter un commentaire'}
                  <ChevronDown size={12} className="an-sc-chevron" />
                </button>
              </div>

              {commentOpen && (
                <textarea
                  className="an-sc-comment"
                  value={item.comment}
                  onChange={(e) => updateCriteria(i, 'comment', e.target.value)}
                  placeholder="Commentaire optionnel sur ce critère..."
                  rows={2}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Validation error */}
      {attempted && !allGraded && (
        <div className="an-sc-error">
          Veuillez attribuer une note à chaque critère avant de calculer.
        </div>
      )}

      {/* Calculate button */}
      <button
        type="button"
        className="an-sc-calculate"
        onClick={calculate}
      >
        <Calculator size={16} />
        Calculer le score
      </button>

      {/* Result card */}
      {data.finalScore !== null && gradeInfo && (
        <div ref={resultRef} className={`an-sc-result ${gradeInfo.color}`}>
          <div className="an-sc-result-top">
            <span className={`an-sc-result-grade ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
            <div className="an-sc-result-info">
              <span className="an-sc-result-score">
                {data.finalScore.toFixed(1)} / 100
              </span>
              <span className="an-sc-result-label">{gradeInfo.label}</span>
            </div>
          </div>
          <div className="an-sc-result-bar">
            <div
              className={`an-sc-result-fill ${gradeInfo.color}`}
              style={{ width: `${data.finalScore}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default StepScoring;
