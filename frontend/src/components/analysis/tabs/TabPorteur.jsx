import { ExternalLink } from 'lucide-react';

const STRUCTURES = {
  independant: 'Independant / Personne physique', sas: 'SAS', sarl: 'SARL',
  sci: 'SCI', snc: 'SNC', sccv: 'SCCV',
};

const EXPERTISE = {
  marchand_biens: 'Marchand de biens', promoteur: 'Promoteur immobilier',
  renovation: "Renovation de l'ancien", gestion_locative: 'Gestion locative',
  autre_expertise: 'Autre',
};

const GEO_EXP = {
  first_operation: 'Premiere operation dans ce secteur',
  one_to_three: 'Deja realise 1 a 3 projets ici',
  expert_local: 'Expert local (plus de 3 projets)',
};

function Field({ label, value, full, pre }) {
  return (
    <div className={`an-field${full ? ' full' : ''}`}>
      <span className="an-field-label">{label}</span>
      {value ? (
        <span className={`an-field-value${pre ? ' pre' : ''}`}>{value}</span>
      ) : (
        <span className="an-field-value muted">Non renseigne</span>
      )}
    </div>
  );
}

function Identite({ owner, attrs }) {
  return (
    <div className="an-section">
      <div className="an-section-title">Identite et structure</div>
      <div className="an-fields">
        <Field label="Nom" value={owner.companyName || attrs.owner_name} />
        <Field label="Structure juridique" value={STRUCTURES[owner.structure]} />
        {owner.linkedinUrl && (
          <div className="an-field full">
            <span className="an-field-label">LinkedIn / Site web</span>
            <a href={owner.linkedinUrl} target="_blank" rel="noopener noreferrer" className="an-link">
              {owner.linkedinUrl} <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Experience({ owner }) {
  const volume = owner.businessVolume
    ? `${parseFloat(owner.businessVolume).toLocaleString('fr-FR')} €`
    : null;

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Experience et track record</div>
        <div className="an-fields">
          <Field label="Annees d'experience" value={owner.yearsExperience ? `${owner.yearsExperience} ans` : null} />
          <Field label="Coeur d'expertise" value={EXPERTISE[owner.coreExpertise]} />
          <Field label="Projets realises" value={owner.completedProjects} />
          <Field label="Volume d'affaires" value={volume} />
          <Field label="Experience geographique" value={GEO_EXP[owner.geoExperience]} full />
          <Field label="Certifications" value={owner.certifications} full />
        </div>
      </div>

      {(owner.teamDescription || owner.additionalInfo) && (
        <div className="an-section">
          <div className="an-section-title">Equipe et complements</div>
          <div className="an-fields">
            <Field label="Presentation de l'equipe" value={owner.teamDescription} full pre />
            <Field label="Informations complementaires" value={owner.additionalInfo} full pre />
          </div>
        </div>
      )}
    </>
  );
}

export default function TabPorteur({ subTab, project }) {
  const attrs = project?.attributes || project || {};
  const snapshot = attrs.form_snapshot || {};
  const owner = snapshot.projectOwner || {};

  switch (subTab) {
    case 0: return <Identite owner={owner} attrs={attrs} />;
    case 1: return <Experience owner={owner} />;
    default: return <Identite owner={owner} attrs={attrs} />;
  }
}
