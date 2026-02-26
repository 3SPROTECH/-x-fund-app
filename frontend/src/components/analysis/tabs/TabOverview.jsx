import { useState, useCallback } from 'react';
import { Image, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../../../api/client';

const PROPERTY_TYPES = {
  appartement: 'Appartement', maison: 'Maison', immeuble: 'Immeuble',
  commercial: 'Local commercial', terrain: 'Terrain', mixte: 'Autre',
};

const OPERATION_TYPES = {
  marchand_de_biens: 'Marchand de biens', immobilier_locatif: 'Investissement locatif',
  promotion_immobiliere: 'Promotion immobiliere', rehabilitation_lourde: 'Rehabilitation lourde',
  division_fonciere: 'Division fonciere', transformation_usage: "Transformation d'usage",
};

const STRATEGIES = {
  seasonal_rental: 'Location saisonniere (Airbnb)', classic_rental: 'Location classique',
  resale: 'Vente (Revente)', colocation: 'Colocation',
};

const REVENUE_PERIODS = { monthly: 'Mensuel', annual: 'Annuel' };

const ZONE_TYPES = {
  hypercentre: 'Hyper-centre', periphery: 'Peripherie', rural: 'Zone rurale',
  business_district: "Quartier d'affaires", tourist_zone: 'Zone touristique',
  student_quarter: 'Quartier etudiant',
};

const TRANSPORT_LABELS = {
  metro: 'Metro', tramway: 'Tramway', bus: 'Bus',
  gare_sncf: 'Gare SNCF', aeroport: 'Aeroport', autoroute: 'Axes autoroutiers',
};

const AMENITY_LABELS = {
  ecoles: 'Ecoles/Universites', commerces: 'Commerces', supermarches: 'Supermarches',
  hopitaux: 'Hopitaux/Cliniques', parcs: 'Parcs/Espaces verts',
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

function FicheProjet({ snapshot, attrs }) {
  const p = snapshot?.presentation || {};
  const valBefore = p.valBefore ? `${parseFloat(p.valBefore).toLocaleString('fr-FR')} €` : null;
  const valAfter = p.valAfter ? `${parseFloat(p.valAfter).toLocaleString('fr-FR')} €` : null;
  const revenue = p.projectedRevenue ? `${parseFloat(p.projectedRevenue).toLocaleString('fr-FR')} €` : null;

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Informations generales</div>
        <div className="an-fields">
          <Field label="Nom du projet" value={p.title || attrs.title} />
          <Field label="Type de bien" value={PROPERTY_TYPES[p.propertyType]} />
          <Field label="Type d'operation" value={OPERATION_TYPES[p.operationType] || OPERATION_TYPES[attrs.operation_type]} />
          <Field label="Duree estimee" value={p.durationMonths ? `${p.durationMonths} mois` : (attrs.duration_months ? `${attrs.duration_months} mois` : null)} />
          <Field label="Pitch" value={p.pitch || attrs.description} full pre />
        </div>
      </div>

      <div className="an-section">
        <div className="an-section-title">Valorisation et experts</div>
        <div className="an-fields">
          <Field label="Valeur avant travaux" value={valBefore} />
          <Field label="Valeur apres travaux" value={valAfter} />
          <Field label="Expert immobilier" value={p.expertName} />
          <Field label="Date de l'expertise" value={p.expertDate ? new Date(p.expertDate).toLocaleDateString('fr-FR') : null} />
        </div>
      </div>

      <div className="an-section">
        <div className="an-section-title">Strategie et marche</div>
        <div className="an-fields">
          <Field label="Strategie d'exploitation" value={STRATEGIES[p.exploitationStrategy] || STRATEGIES[attrs.exploitation_strategy]} />
          <Field label="Segment de marche" value={p.marketSegment || attrs.market_segment} />
          <Field label="Revenus projetes" value={revenue} />
          <Field label="Periode" value={REVENUE_PERIODS[p.revenuePeriod] || REVENUE_PERIODS[attrs.revenue_period]} />
          <Field label="Informations complementaires" value={p.additionalInfo || attrs.additional_info} full pre />
        </div>
      </div>
    </>
  );
}

function PhotoModal({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];
  if (!photo) return null;

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  return (
    <div className="an-photo-modal" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={0} ref={(el) => el?.focus()}>
      <div className="an-photo-modal-inner" onClick={(e) => e.stopPropagation()}>
        <button className="an-photo-modal-close" onClick={onClose}><X size={20} /></button>
        {photos.length > 1 && (
          <>
            <button className="an-photo-modal-nav an-photo-modal-prev" onClick={onPrev}><ChevronLeft size={24} /></button>
            <button className="an-photo-modal-nav an-photo-modal-next" onClick={onNext}><ChevronRight size={24} /></button>
          </>
        )}
        <img src={getImageUrl(photo.url)} alt={photo.filename || `Photo ${index + 1}`} className="an-photo-modal-img" />
        <div className="an-photo-modal-footer">
          <span>{photo.filename || `Photo ${index + 1}`}</span>
          {photos.length > 1 && <span>{index + 1} / {photos.length}</span>}
        </div>
      </div>
    </div>
  );
}

function Photos({ attrs }) {
  const photos = attrs.photos || [];
  const propertyPhotos = attrs.property_photos || [];
  const allPhotos = photos.length > 0 ? photos : propertyPhotos;
  const [modalIndex, setModalIndex] = useState(null);

  if (allPhotos.length === 0) {
    return <div className="an-empty">Aucune photo n'a ete ajoutee a ce projet.</div>;
  }

  const openModal = (idx) => setModalIndex(idx);
  const closeModal = () => setModalIndex(null);
  const prevPhoto = () => setModalIndex((i) => (i > 0 ? i - 1 : allPhotos.length - 1));
  const nextPhoto = () => setModalIndex((i) => (i < allPhotos.length - 1 ? i + 1 : 0));

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Photos du projet ({allPhotos.length})</div>
        <div className="an-photo-grid">
          {allPhotos.map((photo, idx) => (
            <button key={photo.id || idx} className="an-photo-thumb" onClick={() => openModal(idx)}>
              <img src={getImageUrl(photo.url)} alt={photo.filename || `Photo ${idx + 1}`} loading="lazy" />
              <div className="an-photo-thumb-overlay"><ZoomIn size={18} /></div>
            </button>
          ))}
        </div>
      </div>
      {modalIndex !== null && (
        <PhotoModal photos={allPhotos} index={modalIndex} onClose={closeModal} onPrev={prevPhoto} onNext={nextPhoto} />
      )}
    </>
  );
}

function Localisation({ snapshot, attrs }) {
  const loc = snapshot?.location || {};
  const transport = loc.transportAccess || [];
  const amenities = loc.nearbyAmenities || [];

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Adresse</div>
        <div className="an-fields">
          <Field label="Adresse" value={loc.address} full />
          <Field label="Code postal" value={loc.postalCode} />
          <Field label="Ville" value={loc.city || attrs.property_city} />
          <Field label="Quartier" value={loc.neighborhood} />
          <Field label="Typologie de zone" value={ZONE_TYPES[loc.zoneTypology]} />
        </div>
      </div>

      <div className="an-section">
        <div className="an-section-title">Acces aux transports</div>
        {transport.length > 0 ? (
          <div className="an-badge-list">
            {transport.map((t) => (
              <span key={t} className="an-badge">{TRANSPORT_LABELS[t] || t}</span>
            ))}
          </div>
        ) : (
          <span className="an-field-value muted">Non renseigne</span>
        )}
      </div>

      <div className="an-section">
        <div className="an-section-title">Commodites a proximite</div>
        {amenities.length > 0 ? (
          <div className="an-badge-list">
            {amenities.map((a) => (
              <span key={a} className="an-badge">{AMENITY_LABELS[a] || a}</span>
            ))}
          </div>
        ) : (
          <span className="an-field-value muted">Non renseigne</span>
        )}
      </div>

      {loc.strategicAdvantages && (
        <div className="an-section">
          <div className="an-section-title">Atouts strategiques</div>
          <span className="an-field-value pre">{loc.strategicAdvantages}</span>
        </div>
      )}
    </>
  );
}

export default function TabOverview({ subTab, project }) {
  const attrs = project?.attributes || project || {};
  const snapshot = attrs.form_snapshot || {};

  switch (subTab) {
    case 0: return <FicheProjet snapshot={snapshot} attrs={attrs} />;
    case 1: return <Photos attrs={attrs} />;
    case 2: return <Localisation snapshot={snapshot} attrs={attrs} />;
    default: return <FicheProjet snapshot={snapshot} attrs={attrs} />;
  }
}
