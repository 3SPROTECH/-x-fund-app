import { Building2, Users } from 'lucide-react';

const LEGAL_FORM_LABELS = {
  sas: 'SAS — Societe par Actions Simplifiee',
  sarl: 'SARL — Societe a Responsabilite Limitee',
  sci: 'SCI — Societe Civile Immobiliere',
  sa: 'SA — Societe Anonyme',
  eurl: 'EURL — Entreprise Unipersonnelle a Responsabilite Limitee',
  sasu: 'SASU — Societe par Actions Simplifiee Unipersonnelle',
  auto_entrepreneur: 'Auto-entrepreneur',
};

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function OwnerTab({ project }) {
  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const rawOwner = snapshot.projectOwner || snapshot.porteur || {};
  const owner = { ...rawOwner, certifications: Array.isArray(rawOwner.certifications) ? rawOwner.certifications : rawOwner.certifications ? [rawOwner.certifications] : [] };
  const pres = snapshot.presentation || {};

  const companyName = owner.companyName || a.owner_name || a.title || 'N/A';
  const legalForm = owner.legalForm || owner.legal_form;
  const initials = getInitials(companyName);

  return (
    <div className="apr-panel active">
      <div className="apr-g2">
        {/* Company */}
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><Building2 size={14} /></div>
              <span className="apr-card-t">Entreprise</span>
            </div>
            <span className="apr-source-tag apr-source-owner">Porteur</span>
          </div>
          <div className="apr-card-b">
            <div className="apr-co-head">
              <div className="apr-co-avatar">{initials}</div>
              <div>
                <div className="apr-co-name">{companyName}</div>
                {legalForm && <div className="apr-co-form">{LEGAL_FORM_LABELS[legalForm] || legalForm}</div>}
              </div>
            </div>
            {owner.website && (
              <div className="apr-drow">
                <span className="apr-dl">Site web</span>
                <span className="apr-dv">
                  <a href={owner.website.startsWith('http') ? owner.website : `https://${owner.website}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--apr-accent-warm)', textDecoration: 'none' }}>
                    {owner.website}
                  </a>
                </span>
              </div>
            )}
            {owner.yearsExperience && (
              <div className="apr-drow">
                <span className="apr-dl">Annees d'experience</span>
                <span className="apr-dv">{owner.yearsExperience} ans</span>
              </div>
            )}
            {owner.operationsCompleted && (
              <div className="apr-drow">
                <span className="apr-dl">Operations realisees</span>
                <span className="apr-dv">{owner.operationsCompleted}</span>
              </div>
            )}
            {owner.volumeManaged && (
              <div className="apr-drow">
                <span className="apr-dl">Volume gere</span>
                <span className="apr-dv mono">{parseFloat(owner.volumeManaged).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {owner.mainExpertise && (
              <div className="apr-drow">
                <span className="apr-dl">Expertise principale</span>
                <span className="apr-dv">{owner.mainExpertise}</span>
              </div>
            )}
            {owner.geographicZones && (
              <div className="apr-drow">
                <span className="apr-dl">Zones geographiques</span>
                <span className="apr-dv">{owner.geographicZones}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team & Certifications */}
        <div className="apr-card">
          <div className="apr-card-h">
            <div className="apr-card-h-left">
              <div className="apr-card-icon"><Users size={14} /></div>
              <span className="apr-card-t">Equipe & Certifications</span>
            </div>
          </div>
          <div className="apr-card-b">
            {owner.teamDescription && (
              <div className="apr-narr">
                <div className="apr-narr-label">Equipe</div>
                <p className="apr-narr-text">{owner.teamDescription}</p>
              </div>
            )}
            {owner.certifications.length > 0 && (
              <div className="apr-narr">
                <div className="apr-narr-label">Certifications</div>
                <div className="apr-chips" style={{ marginTop: 4 }}>
                  {owner.certifications.map((cert) => (
                    <span className="apr-chip success" key={cert}>{cert}</span>
                  ))}
                </div>
              </div>
            )}
            {owner.additionalInfo && (
              <div className="apr-narr">
                <div className="apr-narr-label">Informations complementaires</div>
                <p className="apr-narr-text">{owner.additionalInfo}</p>
              </div>
            )}
            {!owner.teamDescription && !owner.certifications?.length && !owner.additionalInfo && (
              <div className="apr-empty">Aucune information complementaire renseignee par le porteur.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
