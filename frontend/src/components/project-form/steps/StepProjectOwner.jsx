import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';
import FormSelect from '../../FormSelect';

const STRUCTURE_OPTIONS = [
  { value: 'independant', label: 'Indépendant / Personne physique' },
  { value: 'sas', label: 'SAS' },
  { value: 'sarl', label: 'SARL' },
  { value: 'sci', label: 'SCI' },
  { value: 'snc', label: 'SNC' },
  { value: 'sccv', label: 'SCCV' },
];

const EXPERTISE_OPTIONS = [
  { value: 'marchand_biens', label: 'Marchand de biens' },
  { value: 'promoteur', label: 'Promoteur immobilier' },
  { value: 'renovation', label: 'Rénovation de l\'ancien' },
  { value: 'gestion_locative', label: 'Gestion locative' },
  { value: 'autre_expertise', label: 'Autre' },
];

const GEO_OPTIONS = [
  { value: 'first_operation', label: 'Première opération dans ce secteur' },
  { value: 'one_to_three', label: 'Déjà réalisé 1 à 3 projets ici' },
  { value: 'expert_local', label: 'Expert local (plus de 3 projets)' },
];

export default function StepProjectOwner() {
  const owner = useProjectFormStore((s) => s.projectOwner);
  const update = useProjectFormStore((s) => s.updateProjectOwner);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  return (
    <div>
      <h3 className="pf-section-title">Identité et Structure</h3>
      <FormGrid>
        <FormField label="Structure du porteur" error={flags['projectOwner.structure']}>
          <FormSelect value={owner.structure} options={STRUCTURE_OPTIONS} onChange={(e) => update('structure', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
        <FormField label="Nom de la société / Nom du porteur" error={flags['projectOwner.companyName']}>
          <input type="text" value={owner.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Ex: Jean Dupont ou SCI Horizon" />
        </FormField>
      </FormGrid>
      <FormGrid full>
        <FormField label="Lien vers le profil LinkedIn ou site web">
          <input type="url" value={owner.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} placeholder="https://www.linkedin.com/in/... ou https://votresite.com" />
        </FormField>
      </FormGrid>

      <h3 className="pf-section-title">Expérience et Track Record</h3>
      <FormGrid>
        <FormField label="Années d'expérience en immobilier">
          <input type="number" min="0" value={owner.yearsExperience} onChange={(e) => update('yearsExperience', e.target.value)} placeholder="Ex: 5" />
        </FormField>
        <FormField label="Cœur d'expertise">
          <FormSelect value={owner.coreExpertise} options={EXPERTISE_OPTIONS} onChange={(e) => update('coreExpertise', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
        <FormField label="Nombre de projets immobiliers réalisés">
          <input type="number" min="0" value={owner.completedProjects} onChange={(e) => update('completedProjects', e.target.value)} placeholder="Ex: 10" />
        </FormField>
        <FormField label="Volume d'affaires historique (€)">
          <input type="number" min="0" value={owner.businessVolume} onChange={(e) => update('businessVolume', e.target.value)} placeholder="Ex: 2000000" />
        </FormField>
        <FormField label="Expérience dans la zone géographique">
          <FormSelect value={owner.geoExperience} options={GEO_OPTIONS} onChange={(e) => update('geoExperience', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
        <FormField label="Agréments, diplômes ou certifications">
          <input type="text" value={owner.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="Ex: Carte T, Diplôme d'Architecte..." />
        </FormField>
      </FormGrid>

      <h3 className="pf-section-title">Vision et Compléments</h3>
      <FormGrid full>
        <FormField label="Présentation synthétique de l'équipe">
          <textarea rows={2} maxLength={300} value={owner.teamDescription} onChange={(e) => update('teamDescription', e.target.value)} placeholder="Décrivez brièvement votre équipe..." />
          <span className="pf-char-count">{(owner.teamDescription || '').length}/300</span>
        </FormField>
        <FormField label="Informations complémentaires">
          <textarea rows={3} value={owner.additionalInfo} onChange={(e) => update('additionalInfo', e.target.value)} placeholder="Tout détail utile..." />
        </FormField>
      </FormGrid>
    </div>
  );
}
