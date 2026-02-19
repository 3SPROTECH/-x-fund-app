import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  Settings, Save, Globe, TrendingUp, ShieldCheck, Wallet,
  Briefcase, Percent, Bell, Lock, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBalance as fmtCents } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

const CATEGORY_META = {
  platform:      { label: 'Plateforme',          icon: Globe,       color: 'var(--primary)' },
  investment:    { label: 'Investissement',       icon: TrendingUp,  color: 'var(--success)' },
  kyc:           { label: 'KYC',                  icon: ShieldCheck, color: 'var(--warning)' },
  wallet:        { label: 'Portefeuille',         icon: Wallet,      color: 'var(--info)' },
  project:       { label: 'Projets',              icon: Briefcase,   color: 'var(--text-secondary)' },
  commissions:   { label: 'Commissions & Frais',  icon: Percent,     color: 'var(--danger)' },
  notifications: { label: 'Notifications',        icon: Bell,        color: '#8b5cf6' },
  security:      { label: 'Securite',             icon: Lock,        color: '#ec4899' },
};

const CATEGORY_ORDER = ['platform', 'investment', 'kyc', 'wallet', 'project', 'commissions', 'notifications', 'security'];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await adminApi.getSettings();
      const data = res.data.data || {};
      setSettings(structuredClone(data));
      setOriginal(structuredClone(data));
    } catch {
      toast.error('Erreur lors du chargement des parametres');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category, key, value) => {
    setSettings(prev => {
      const updated = { ...prev };
      updated[category] = updated[category].map(s =>
        s.key === key ? { ...s, value: value } : s
      );
      return updated;
    });
  };

  const getChangedSettings = () => {
    const changes = [];
    for (const category of Object.keys(settings)) {
      for (const setting of settings[category]) {
        const orig = original[category]?.find(s => s.key === setting.key);
        if (orig && orig.value !== setting.value) {
          changes.push({ key: setting.key, value: setting.value });
        }
      }
    }
    return changes;
  };

  const handleSave = async () => {
    const changes = getChangedSettings();
    if (changes.length === 0) {
      toast('Aucune modification detectee', { icon: '!' });
      return;
    }

    setSaving(true);
    try {
      await adminApi.updateSettings(changes);
      toast.success(`${changes.length} parametre(s) mis a jour`);
      await loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(structuredClone(original));
    toast('Modifications annulees', { icon: '!' });
  };

  const hasChanges = () => getChangedSettings().length > 0;

  const renderInput = (setting, category) => {
    const { key, value, value_type, description } = setting;
    const isCents = key.includes('_cents');

    if (value_type === 'boolean') {
      return (
        <div key={key} className="setting-row">
          <div className="setting-info">
            <label className="setting-label">{description}</label>
            <span className="setting-key">{key}</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handleChange(category, key, e.target.checked ? 'true' : 'false')}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      );
    }

    if (value_type === 'integer' || value_type === 'decimal') {
      return (
        <div key={key} className="setting-row">
          <div className="setting-info">
            <label className="setting-label">{description}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span className="setting-key">{key}</span>
              {isCents && value && (
                <span className="setting-preview">{fmtCents(value)}</span>
              )}
              {value_type === 'decimal' && key.includes('percent') && value && (
                <span className="setting-preview">{value}%</span>
              )}
            </div>
          </div>
          <input
            type="number"
            className="form-input setting-input"
            value={value}
            step={value_type === 'decimal' ? '0.1' : '1'}
            onChange={(e) => handleChange(category, key, e.target.value)}
          />
        </div>
      );
    }

    return (
      <div key={key} className="setting-row">
        <div className="setting-info">
          <label className="setting-label">{description}</label>
          <span className="setting-key">{key}</span>
        </div>
        <input
          type="text"
          className="form-input setting-input"
          value={value}
          onChange={(e) => handleChange(category, key, e.target.value)}
        />
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  const changed = hasChanges();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Parametres</h1>
          <p className="text-muted">Configuration generale de la plateforme</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {changed && (
            <button className="btn" onClick={handleReset} disabled={saving}>
              <RotateCcw size={16} /> Annuler
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !changed}
          >
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="settings-tabs">
        {CATEGORY_ORDER.map(cat => {
          const meta = CATEGORY_META[cat];
          if (!meta || !settings[cat]) return null;
          const Icon = meta.icon;
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              className={`settings-tab${isActive ? ' active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              <Icon size={16} style={{ color: isActive ? meta.color : undefined }} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      {CATEGORY_ORDER.map(cat => {
        if (cat !== activeTab || !settings[cat]) return null;
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;
        return (
          <div key={cat} className="card settings-card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '.75rem', marginBottom: '.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} style={{ color: meta.color }} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{meta.label}</h3>
                  <span className="text-muted" style={{ fontSize: '.8rem' }}>{settings[cat].length} parametre(s)</span>
                </div>
              </div>
            </div>
            <div className="settings-list">
              {settings[cat].map(s => renderInput(s, cat))}
            </div>
          </div>
        );
      })}

      {/* Floating save bar when changes exist */}
      {changed && (
        <div className="settings-save-bar">
          <span>Vous avez des modifications non enregistrees</span>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-sm" onClick={handleReset} disabled={saving}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <Save size={14} /> Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
