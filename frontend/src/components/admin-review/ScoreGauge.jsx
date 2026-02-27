import { useEffect, useRef } from 'react';
import { CRITERIA, getGradeInfo } from '../analysis/steps/StepScoring';

const SCORE_COLOR_MAP = {
  green: 'var(--apr-green)',
  orange: 'var(--apr-orange)',
  red: 'var(--apr-red)',
};

export default function ScoreGauge({ scoring }) {
  const arcRef = useRef(null);
  const score = scoring?.finalScore;
  const gradeInfo = score != null ? getGradeInfo(score) : null;
  const criteria = scoring?.criteria || [];

  const circumference = 2 * Math.PI * 48; // ~301.6
  const percentage = score != null ? score / 100 : 0;
  const targetOffset = circumference * (1 - percentage);
  const scoreColor = SCORE_COLOR_MAP[gradeInfo?.color] || 'var(--apr-text-primary)';

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc || score == null) return;
    arc.style.transition = 'none';
    arc.setAttribute('stroke-dashoffset', String(circumference));
    requestAnimationFrame(() => {
      arc.style.transition = 'stroke-dashoffset 1s ease-out 0.3s';
      arc.setAttribute('stroke-dashoffset', String(targetOffset));
    });
  }, [score, circumference, targetOffset]);

  const gradeColorClass = gradeInfo?.color === 'orange' ? 'orange' : gradeInfo?.color === 'red' ? 'red' : '';

  return (
    <>
      <div className="apr-score-ring">
        <div className="apr-gauge-wrap">
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="55" cy="55" r="48" fill="none" stroke="#F0EFEC" strokeWidth="7" />
            {score != null && (
              <circle
                ref={arcRef}
                cx="55" cy="55" r="48" fill="none"
                stroke={scoreColor} strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
              />
            )}
          </svg>
          <span className="apr-gauge-num" style={{ color: scoreColor }}>{score != null ? Math.round(score) : '—'}</span>
        </div>
        <span className="apr-gauge-sub">Score final</span>
        {gradeInfo && (
          <span className={`apr-gauge-grade ${gradeColorClass}`}>Grade {gradeInfo.grade}</span>
        )}
      </div>

      {criteria.length > 0 && CRITERIA.map((c, i) => {
        const grade = criteria[i]?.grade;
        const pct = grade != null ? (grade / 10) * 100 : 0;
        const barColor = grade == null ? 'var(--apr-text-hint)' : grade >= 7 ? 'var(--apr-green)' : grade >= 4 ? 'var(--apr-orange)' : 'var(--apr-red)';
        return (
          <div className="apr-crit" key={i}>
            <span className="apr-crit-name">{c.name}</span>
            <div className="apr-crit-bar">
              <div className="apr-crit-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="apr-crit-score" style={{ color: barColor }}>{grade != null ? grade.toFixed(1) : '—'}</span>
          </div>
        );
      })}
    </>
  );
}
