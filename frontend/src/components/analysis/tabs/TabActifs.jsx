import { useState } from 'react';
import { Shield, Paperclip, AlertCircle, CheckCircle } from 'lucide-react';

const GUARANTEE_TYPES = {
  hypotheque: 'Hypotheque', fiducie: 'Fiducie',
  garantie_premiere_demande: 'Garantie a premiere demande',
  caution_personnelle: 'Caution personnelle',
  garantie_corporate: 'Garantie corporate', aucune: 'Aucune',
};

const RISK_COLORS = {
  low: 'var(--success)', moderate: 'var(--warning)',
  high: '#ea580c', critical: 'var(--danger)',
};

const RISK_LABELS = {
  low: 'Faible risque', moderate: 'Risque modere',
  high: 'Risque eleve', critical: 'Risque tres eleve',
};

function Field({ label, value, full }) {
  return (
    <div className={`an-field${full ? ' full' : ''}`}>
      <span className="an-field-label">{label}</span>
      {value ? (
        <span className="an-field-value">{value}</span>
      ) : (
        <span className="an-field-value muted">Non renseigne</span>
      )}
    </div>
  );
}

function AssetSelector({ assets, selected, onSelect }) {
  if (assets.length <= 1) return null;
  return (
    <div className="an-asset-tabs">
      {assets.map((asset, idx) => (
        <button
          key={asset.id}
          className={`an-asset-tab${idx === selected ? ' active' : ''}`}
          onClick={() => onSelect(idx)}
        >
          {asset.label || `Actif ${idx + 1}`}
        </button>
      ))}
    </div>
  );
}

function Details({ asset }) {
  const d = asset.details || {};
  return (
    <div className="an-section">
      <div className="an-section-title">Details et calendrier</div>
      <div className="an-fields">
        <Field label="Adresse / Label" value={asset.label} />
        <Field label="Refinancement" value={d.isRefinancing ? 'Oui' : 'Non'} />
        <Field label="Date de signature" value={d.signatureDate ? new Date(d.signatureDate).toLocaleDateString('fr-FR') : null} />
        <Field label="Nombre de lots" value={d.lotCount} />
        <Field label="Travaux necessaires" value={d.worksNeeded ? 'Oui' : 'Non'} />
        <Field label="Duree des travaux" value={d.worksDuration ? `${d.worksDuration} mois` : null} />
      </div>
    </div>
  );
}

function Depenses({ asset, onOpenDocument }) {
  const costs = asset.costs || { items: [], total: 0 };
  if (costs.items.length === 0) {
    return <div className="an-empty">Aucune depense renseignee.</div>;
  }

  return (
    <div className="an-section">
      <div className="an-section-title">Plan de depenses</div>
      <table className="an-table">
        <thead>
          <tr>
            <th>Poste</th>
            <th>Categorie</th>
            <th style={{ textAlign: 'right' }}>Montant</th>
            <th>Justificatif</th>
          </tr>
        </thead>
        <tbody>
          {costs.items.map((item) => (
            <tr key={item.id}>
              <td>{item.label}</td>
              <td style={{ textTransform: 'capitalize' }}>{item.category}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                {item.amount ? `${parseFloat(item.amount).toLocaleString('fr-FR')} €` : '—'}
              </td>
              <td>
                {item.hasJustificatif ? (
                  <button
                    className="an-doc-attach"
                    onClick={() => onOpenDocument?.({ label: `Justificatif — ${item.label}`, fileName: item.justificatifName || 'justificatif.pdf' })}
                    title={item.justificatifName || 'Voir le justificatif'}
                  >
                    <CheckCircle size={11} />
                    {item.justificatifName ? item.justificatifName.substring(0, 18) : 'Voir'}
                  </button>
                ) : (
                  <span className="an-doc-missing">
                    <AlertCircle size={11} />
                    Non fourni
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>
        Total : {costs.total ? `${costs.total.toLocaleString('fr-FR')} €` : '—'}
      </div>
    </div>
  );
}

function Lots({ asset }) {
  const lots = asset.lots || [];
  if (lots.length === 0) {
    return <div className="an-empty">Aucun lot renseigne.</div>;
  }

  const total = asset.recettesTotal || lots.reduce((s, l) => s + (l.prix || 0), 0);

  return (
    <div className="an-section">
      <div className="an-section-title">Lots et revenus</div>
      <table className="an-table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Surface</th>
            <th>Pre-comm.</th>
            <th>Loue</th>
            <th style={{ textAlign: 'right' }}>Prix</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot, idx) => (
            <tr key={lot.id}>
              <td>Lot {idx + 1}</td>
              <td>{lot.surface ? `${lot.surface} m²` : '—'}</td>
              <td>{lot.preCommercialized === 'oui' ? 'Oui' : 'Non'}</td>
              <td>{lot.rented === 'oui' ? 'Oui' : 'Non'}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                {lot.prix ? `${lot.prix.toLocaleString('fr-FR')} €` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>
        Total recettes : {total ? `${total.toLocaleString('fr-FR')} €` : '—'}
      </div>
    </div>
  );
}

function Garanties({ asset }) {
  const g = asset.guarantee || {};
  if (!g.type) {
    return <div className="an-empty">Aucune garantie renseignee pour cet actif.</div>;
  }

  const scoreColor = RISK_COLORS[g.riskLevel] || 'var(--text-muted)';

  return (
    <>
      <div className="an-section">
        <div className="an-section-title">Garantie</div>
        <div className="an-fields">
          <Field label="Type" value={GUARANTEE_TYPES[g.type] || g.type} />
          {g.type === 'hypotheque' && <Field label="Rang" value={g.rank === '1er_rang' ? '1er rang' : '2eme rang'} />}
          <Field label="Valeur de l'actif" value={g.assetValue ? `${g.assetValue.toLocaleString('fr-FR')} €` : null} />
          <Field label="Montant de la dette" value={g.debtAmount ? `${g.debtAmount.toLocaleString('fr-FR')} €` : null} />
          <Field label="LTV" value={g.ltv != null ? `${g.ltv}%` : null} />
          <Field label="Garant" value={g.guarantor} />
          <Field label="Description" value={g.description} full />
        </div>
      </div>

      <div className="an-section">
        <div className="an-section-title">
          <Shield size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Score de protection
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: scoreColor }}>
            {g.protectionScore || 0}/100
          </span>
          <span style={{ fontSize: '0.8125rem', color: scoreColor, fontWeight: 500 }}>
            {RISK_LABELS[g.riskLevel] || '—'}
          </span>
        </div>
        <div className="an-score-bar">
          <div
            className="an-score-fill"
            style={{ width: `${g.protectionScore || 0}%`, background: scoreColor }}
          />
        </div>
      </div>
    </>
  );
}

export default function TabActifs({ subTab, project, onOpenDocument }) {
  const attrs = project?.attributes || project || {};
  const snapshot = attrs.form_snapshot || {};
  const assets = snapshot.assets || [];
  const [selectedAsset, setSelectedAsset] = useState(0);

  if (assets.length === 0) {
    return <div className="an-empty">Aucun actif renseigne dans le dossier.</div>;
  }

  const asset = assets[selectedAsset] || assets[0];

  return (
    <>
      <AssetSelector assets={assets} selected={selectedAsset} onSelect={setSelectedAsset} />
      {subTab === 0 && <Details asset={asset} />}
      {subTab === 1 && <Depenses asset={asset} onOpenDocument={onOpenDocument} />}
      {subTab === 2 && <Lots asset={asset} />}
      {subTab === 3 && <Garanties asset={asset} />}
    </>
  );
}
