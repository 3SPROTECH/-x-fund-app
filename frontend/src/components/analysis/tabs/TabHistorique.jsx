const FIELD_TYPES = {
  text: 'Texte', textarea: 'Texte long', number: 'Nombre', file: 'Fichier',
};

const STATUS_CONFIG = {
  pending: { label: 'En attente', badge: 'badge-warning' },
  submitted: { label: 'Soumis', badge: 'badge-success' },
  reviewed: { label: 'Examine', badge: 'badge-info' },
};

function Demandes({ infoRequests }) {
  if (!infoRequests || infoRequests.length === 0) {
    return <div className="an-empty">Aucune demande de complements n'a ete envoyee.</div>;
  }

  return (
    <div className="an-section">
      <div className="an-section-title">Demandes de complements ({infoRequests.length})</div>
      {infoRequests.map((ir) => {
        const irAttr = ir.attributes || ir;
        const fields = irAttr.fields || [];
        const config = STATUS_CONFIG[irAttr.status] || STATUS_CONFIG.pending;

        return (
          <div className="an-ir-card" key={ir.id}>
            <div className="an-ir-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${config.badge}`}>{config.label}</span>
                {irAttr.requested_by_name && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    par {irAttr.requested_by_name}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {irAttr.created_at ? new Date(irAttr.created_at).toLocaleDateString('fr-FR') : ''}
              </span>
            </div>

            {fields.map((field, idx) => (
              <div className="an-ir-field" key={idx}>
                <div className="an-ir-field-header">
                  <span className="an-ir-field-label">
                    {field.label}
                    {field.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                  </span>
                  <span className="an-ir-field-type">{FIELD_TYPES[field.field_type] || field.field_type}</span>
                </div>
                {field.comment && (
                  <div className="an-ir-field-comment">{field.comment}</div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Reponses({ infoRequests }) {
  const withResponses = (infoRequests || []).filter((ir) => {
    const irAttr = ir.attributes || ir;
    return irAttr.responses && Object.keys(irAttr.responses).length > 0;
  });

  if (withResponses.length === 0) {
    return <div className="an-empty">Aucune reponse recue pour le moment.</div>;
  }

  return (
    <div className="an-section">
      <div className="an-section-title">Reponses recues ({withResponses.length})</div>
      {withResponses.map((ir) => {
        const irAttr = ir.attributes || ir;
        const fields = irAttr.fields || [];
        const responses = irAttr.responses || {};

        return (
          <div className="an-ir-card" key={ir.id}>
            <div className="an-ir-header">
              <span className="badge badge-success">Repondu</span>
              {irAttr.submitted_at && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  le {new Date(irAttr.submitted_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>

            {fields.map((field, idx) => {
              const response = responses[String(idx)];
              return (
                <div className="an-ir-field" key={idx}>
                  <div className="an-ir-field-header">
                    <span className="an-ir-field-label">{field.label}</span>
                    <span className="an-ir-field-type">{FIELD_TYPES[field.field_type] || field.field_type}</span>
                  </div>
                  {response ? (
                    <div className="an-ir-response">{response}</div>
                  ) : (
                    <div className="an-ir-response empty">Non renseigne</div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function TabHistorique({ subTab, infoRequests }) {
  switch (subTab) {
    case 0: return <Demandes infoRequests={infoRequests} />;
    case 1: return <Reponses infoRequests={infoRequests} />;
    default: return <Demandes infoRequests={infoRequests} />;
  }
}
