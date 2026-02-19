import useProjectFormStore from '../../../stores/useProjectFormStore';
import FormGrid from '../shared/FormGrid';
import FormField from '../shared/FormField';
import FormSelect from '../../FormSelect';
import CheckboxGrid from '../shared/CheckboxGrid';

const ZONE_TYPES = [
  { value: 'hypercentre', label: 'Hyper-centre' },
  { value: 'periphery', label: 'Périphérie' },
  { value: 'rural', label: 'Zone rurale' },
  { value: 'business_district', label: 'Quartier d\'affaires' },
  { value: 'tourist_zone', label: 'Zone touristique' },
  { value: 'student_quarter', label: 'Quartier étudiant' },
];

const TRANSPORT_OPTIONS = [
  { value: 'metro', label: 'Métro' },
  { value: 'tramway', label: 'Tramway' },
  { value: 'bus', label: 'Bus' },
  { value: 'gare_sncf', label: 'Gare SNCF' },
  { value: 'aeroport', label: 'Aéroport' },
  { value: 'autoroute', label: 'Axes autoroutiers' },
];

const AMENITY_OPTIONS = [
  { value: 'ecoles', label: 'Écoles/Universités' },
  { value: 'commerces', label: 'Commerces de proximité' },
  { value: 'supermarches', label: 'Supermarchés' },
  { value: 'hopitaux', label: 'Hôpitaux/Cliniques' },
  { value: 'parcs', label: 'Parcs/Espaces verts' },
];

export default function StepLocation() {
  const location = useProjectFormStore((s) => s.location);
  const update = useProjectFormStore((s) => s.updateLocation);
  const flags = useProjectFormStore((s) => s.flaggedFields);

  return (
    <div>
      <h3 className="pf-section-title">Adresse et Coordonnées</h3>
      <FormGrid>
        <FormField label="Adresse exacte du bien" error={flags['location.address']} full>
          <input type="text" value={location.address} onChange={(e) => update('address', e.target.value)} placeholder="Recherche d'adresse automatisée..." />
        </FormField>
      </FormGrid>
      <FormGrid>
        <FormField label="Code Postal" error={flags['location.postalCode']}>
          <input type="text" maxLength={5} value={location.postalCode} onChange={(e) => update('postalCode', e.target.value)} placeholder="Ex: 75001" />
        </FormField>
        <FormField label="Ville" error={flags['location.city']}>
          <input type="text" value={location.city} onChange={(e) => update('city', e.target.value)} placeholder="Ex: Paris" />
        </FormField>
        <FormField label="Quartier / Secteur">
          <input type="text" value={location.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} placeholder="Ex: Marais" />
        </FormField>
        <FormField label="Typologie de la zone">
          <FormSelect value={location.zoneTypology} options={ZONE_TYPES} onChange={(e) => update('zoneTypology', e.target.value)} placeholder="Sélectionnez..." />
        </FormField>
      </FormGrid>

      <h3 className="pf-section-title">Environnement et Atouts</h3>
      <FormGrid>
        <FormField label="Accès aux transports">
          <CheckboxGrid
            options={TRANSPORT_OPTIONS}
            selected={location.transportAccess}
            onChange={(vals) => update('transportAccess', vals)}
            name="transport"
          />
        </FormField>
        <FormField label="Commodités à proximité">
          <CheckboxGrid
            options={AMENITY_OPTIONS}
            selected={location.nearbyAmenities}
            onChange={(vals) => update('nearbyAmenities', vals)}
            name="amenities"
          />
        </FormField>
      </FormGrid>

      <FormGrid full>
        <FormField label="Atouts stratégiques de l'emplacement">
          <textarea rows={3} maxLength={300} value={location.strategicAdvantages} onChange={(e) => update('strategicAdvantages', e.target.value)} placeholder="Pourquoi cet emplacement est-il idéal pour votre projet ?" />
          <span className="pf-char-count">{(location.strategicAdvantages || '').length}/300</span>
        </FormField>
      </FormGrid>
    </div>
  );
}
