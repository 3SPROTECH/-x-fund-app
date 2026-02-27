const TRANSPORT_LABELS = {
  metro: 'Metro', tramway: 'Tramway', bus: 'Bus',
  gare_sncf: 'Gare SNCF', aeroport: 'Aeroport', autoroute: 'Axes autoroutiers',
};
const AMENITY_LABELS = {
  ecoles: 'Ecoles/Universites', commerces: 'Commerces', supermarches: 'Supermarches',
  hopitaux: 'Hopitaux/Cliniques', parcs: 'Parcs/Espaces verts',
};
const ZONE_LABELS = {
  hypercentre: 'Hyper-centre', periphery: 'Peripherie', rural: 'Zone rurale',
  business_district: "Quartier d'affaires", tourist_zone: 'Zone touristique',
  student_quarter: 'Quartier etudiant',
};
const PROPERTY_TYPE_LABELS = {
  appartement: 'Appartement', maison: 'Maison', immeuble: 'Immeuble',
  commercial: 'Local commercial', terrain: 'Terrain',
};

function AssetCard({ asset, location, pres }) {
  const d = asset.details || {};
  const g = asset.guarantee || {};
  const transport = location?.transportAccess || [];
  const amenities = location?.nearbyAmenities || [];
  const allTags = [
    ...transport.map((t) => TRANSPORT_LABELS[t] || t),
    ...amenities.map((a) => AMENITY_LABELS[a] || a),
  ];

  const lotCount = d.lotCount || (asset.lots || []).length || null;
  const costsTotal = asset.costs?.total;

  return (
    <div className="apr-prop">
      <div className="apr-prop-head">
        <div>
          <div className="apr-prop-name">{asset.label || pres?.title || 'Actif'}</div>
          <div className="apr-prop-addr">
            {[location?.address, location?.postalCode, location?.city].filter(Boolean).join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="apr-source-tag apr-source-owner">Porteur</span>
          {pres?.propertyType && (
            <span className="apr-prop-badge">{PROPERTY_TYPE_LABELS[pres.propertyType] || pres.propertyType}</span>
          )}
        </div>
      </div>

      <div className="apr-prop-grid">
        {pres?.valBefore && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Prix d'acquisition</div>
            <div className="apr-prop-stat-val">{parseFloat(pres.valBefore).toLocaleString('fr-FR')} €</div>
          </div>
        )}
        {pres?.valAfter && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Valeur estimee</div>
            <div className="apr-prop-stat-val">{parseFloat(pres.valAfter).toLocaleString('fr-FR')} €</div>
          </div>
        )}
        {lotCount && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Nombre de lots</div>
            <div className="apr-prop-stat-val">{lotCount}</div>
          </div>
        )}
        {location?.neighborhood && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Quartier</div>
            <div className="apr-prop-stat-val">{location.neighborhood}</div>
          </div>
        )}
        {location?.zoneTypology && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Zone</div>
            <div className="apr-prop-stat-val">{ZONE_LABELS[location.zoneTypology] || location.zoneTypology}</div>
          </div>
        )}
        {d.worksNeeded && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Travaux</div>
            <div className="apr-prop-stat-val" style={{ color: 'var(--apr-orange)' }}>
              Oui{d.worksDuration ? ` — ${d.worksDuration} mois` : ''}
            </div>
          </div>
        )}
        {costsTotal && (
          <div className="apr-prop-stat">
            <div className="apr-prop-stat-label">Budget travaux</div>
            <div className="apr-prop-stat-val">{costsTotal.toLocaleString('fr-FR')} €</div>
          </div>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="apr-prop-tags">
          {allTags.map((tag) => <span className="apr-prop-tag" key={tag}>{tag}</span>)}
        </div>
      )}

      {location?.strategicAdvantages && (
        <div style={{ padding: '0 20px 16px' }}>
          <div className="apr-narr-label">Avantages strategiques</div>
          <p style={{ fontSize: 13, color: 'var(--apr-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {location.strategicAdvantages}
          </p>
        </div>
      )}

      {(pres?.expertName || d.signatureDate || d.isRefinancing != null) && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--apr-border)', paddingTop: 14, display: 'flex', gap: 20, fontSize: 12.5, flexWrap: 'wrap' }}>
          {pres?.expertName && (
            <div><span style={{ color: 'var(--apr-text-tertiary)' }}>Expert: </span><span style={{ fontWeight: 500 }}>{pres.expertName}</span></div>
          )}
          {pres?.expertDate && (
            <div><span style={{ color: 'var(--apr-text-tertiary)' }}>Date: </span><span style={{ fontWeight: 500 }}>{new Date(pres.expertDate).toLocaleDateString('fr-FR')}</span></div>
          )}
          {d.isRefinancing != null && (
            <div><span style={{ color: 'var(--apr-text-tertiary)' }}>Refinancement: </span><span style={{ fontWeight: 500 }}>{d.isRefinancing ? 'Oui' : 'Non'}</span></div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssetsTab({ project }) {
  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const assets = snapshot.assets || [];
  const location = snapshot.location || {};
  const pres = snapshot.presentation || {};

  if (assets.length === 0) {
    return (
      <div className="apr-panel active">
        <div className="apr-card">
          <div className="apr-card-b apr-empty">Aucun actif renseigne dans le dossier.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="apr-panel active">
      {assets.map((asset, i) => (
        <div key={asset.id || i} style={i > 0 ? { marginTop: 16 } : undefined}>
          <AssetCard asset={asset} location={location} pres={pres} />
        </div>
      ))}
    </div>
  );
}
