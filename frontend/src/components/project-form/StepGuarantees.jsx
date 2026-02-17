import useProjectFormStore from '../../stores/useProjectFormStore';

const SURETES = [
  { key: 'has_first_rank_mortgage', label: 'Hypothèque de 1er rang', hint: 'Inscription hypothécaire prioritaire sur l\'actif.' },
  { key: 'has_share_pledge', label: 'Nantissement de Titres (100% des parts)', hint: 'Mise en gage des parts de la société de projet au profit de la plateforme.' },
  { key: 'has_fiducie', label: 'Fiducie Sûreté', hint: 'Transfert de propriété temporaire à un tiers de confiance.' },
  { key: 'has_interest_escrow', label: 'Séquestre des Intérêts (Prepaid)', hint: 'Conservation de 6 à 12 mois d\'intérêts sur compte bloqué.' },
  { key: 'has_works_escrow', label: 'Séquestre du Budget Travaux', hint: 'Déblocage des fonds uniquement sur présentation de factures.' },
];

export default function StepGuarantees() {
  const { guarantees, errors, updateGuarantees } = useProjectFormStore();

  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.25rem' }}>Sécurités & Garanties</h3>
      <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Définition du profil de risque pour les obligataires.
      </p>

      {/* Sûretés Réelles & Séquestres */}
      <div className="form-section">
        <div className="form-section-title">Sûretés Réelles & Séquestres</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {SURETES.map(({ key, label, hint }) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px',
                cursor: 'pointer', background: guarantees[key] ? 'var(--bg-secondary)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={guarantees[key]}
                onChange={(e) => updateGuarantees(key, e.target.checked)}
                style={{ width: 'auto', marginTop: '2px' }}
              />
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{hint}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Garanties Personnelles & Financières */}
      <div className="form-section">
        <div className="form-section-title">Garanties Personnelles & Financières</div>
        <div className="form-row">
          <div className="form-group">
            <label>Caution Personnelle du Dirigeant ?</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="personal_guarantee"
                  checked={guarantees.has_personal_guarantee === true}
                  onChange={() => updateGuarantees('has_personal_guarantee', true)}
                  style={{ width: 'auto' }}
                />
                Oui
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="personal_guarantee"
                  checked={guarantees.has_personal_guarantee === false}
                  onChange={() => updateGuarantees('has_personal_guarantee', false)}
                  style={{ width: 'auto' }}
                />
                Non
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>GFA (Garantie Financière d'Achèvement) ?</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gfa"
                  checked={guarantees.has_gfa === true}
                  onChange={() => updateGuarantees('has_gfa', true)}
                  style={{ width: 'auto' }}
                />
                Oui (Bancaire)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gfa"
                  checked={guarantees.has_gfa === false}
                  onChange={() => updateGuarantees('has_gfa', false)}
                  style={{ width: 'auto' }}
                />
                Non (Intrinsèque)
              </label>
            </div>
          </div>
        </div>

        {/* Open Banking */}
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px',
            cursor: 'pointer', marginTop: '0.75rem',
            background: guarantees.has_open_banking ? 'var(--bg-secondary)' : 'transparent',
          }}
        >
          <input
            type="checkbox"
            checked={guarantees.has_open_banking}
            onChange={(e) => updateGuarantees('has_open_banking', e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Engagement Open Banking (Lecture seule)</span>
        </label>
      </div>

      <div className="divider" />

      {/* Risk Description */}
      <div className="form-group">
        <label>Description des risques spécifiques</label>
        <textarea
          value={guarantees.risk_description}
          onChange={(e) => updateGuarantees('risk_description', e.target.value)}
          placeholder="Détaillez ici les risques spécifiques liés à la zone, à la dépollution éventuelle, etc."
          rows={4}
        />
      </div>
    </div>
  );
}
