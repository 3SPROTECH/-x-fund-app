import { useEffect, useRef } from 'react';
import { CRITERIA, getGradeInfo } from '../analysis/steps/StepScoring';

export default function ScoreGauge({ scoring }) {
  const arcRef = useRef(null);
  const score = scoring?.finalScore;
  const gradeInfo = score != null ? getGradeInfo(score) : null;
  const criteria = scoring?.criteria || [];

  const circumference = 2 * Math.PI * 48; // ~301.6
  const percentage = score != null ? score / 100 : 0;
  const targetOffset = circumference * (1 - percentage);

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
                stroke="var(--apr-text-primary)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
              />
            )}
          </svg>
          <span className="apr-gauge-num">{score != null ? Math.round(score) : '—'}</span>
        </div>
        <span className="apr-gauge-sub">Score final</span>
        {gradeInfo && (
          <span className={`apr-gauge-grade ${gradeColorClass}`}>Grade {gradeInfo.grade}</span>
        )}
      </div>

      {criteria.length > 0 && CRITERIA.map((c, i) => {
        const grade = criteria[i]?.grade;
        const pct = grade != null ? (grade / 10) * 100 : 0;
        return (
          <div className="apr-crit" key={i}>
            <span className="apr-crit-name">{c.name}</span>
            <div className="apr-crit-bar">
              <div className="apr-crit-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="apr-crit-score">{grade != null ? grade.toFixed(1) : '—'}</span>
          </div>
        );
      })}
    </>
  );
}
