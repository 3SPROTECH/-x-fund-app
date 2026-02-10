import { useState, useEffect } from 'react';
import { kycApi } from '../../api/kyc';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ShieldAlert, Clock, FileUp, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: { icon: Clock, label: 'En attente', color: 'status-pending', badge: 'badge-warning', description: 'Veuillez soumettre vos documents KYC pour vérification.' },
  submitted: { icon: FileUp, label: 'Soumis', color: 'status-submitted', badge: 'badge-info', description: 'Vos documents sont en cours de vérification par notre équipe.' },
  verified: { icon: ShieldCheck, label: 'Vérifié', color: 'status-verified', badge: 'badge-success', description: 'Votre identité a été vérifiée. Vous pouvez investir.' },
  rejected: { icon: ShieldAlert, label: 'Rejeté', color: 'status-rejected', badge: 'badge-danger', description: 'Votre vérification a été rejetée. Veuillez soumettre à nouveau.' },
};

export default function KycPage() {
  const { user, refreshProfile } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [identityDoc, setIdentityDoc] = useState(null);
  const [proofOfAddress, setProofOfAddress] = useState(null);

  useEffect(() => { loadKyc(); }, []);

  const loadKyc = async () => {
    try {
      const res = await kycApi.getStatus();
      setKycData(res.data.data?.attributes || res.data);
    } catch { /* KYC not yet submitted */ }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identityDoc || !proofOfAddress) {
      toast.error('Veuillez fournir les deux documents');
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append('kyc_identity_document', identityDoc);
    formData.append('kyc_proof_of_address', proofOfAddress);
    try {
      const status = user?.kyc_status;
      if (status === 'pending' || !status) {
        await kycApi.submit(formData);
      } else {
        await kycApi.update(formData);
      }
      toast.success('Documents KYC soumis avec succès');
      await refreshProfile();
      await loadKyc();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const status = kycData?.kyc_status || user?.kyc_status || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const canSubmit = status === 'pending' || status === 'rejected';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Vérification KYC</h1>
          <p className="text-muted">Vérifiez votre identité pour accéder à toutes les fonctionnalités</p>
        </div>
        <span className={`badge ${config.badge}`}>{config.label}</span>
      </div>

      <div className="two-col">
        <div className="two-col-main">
          <div className="card">
            <div className={`kyc-status-banner ${config.color}`}>
              <Icon size={28} />
              <div>
                <strong>Statut : {config.label}</strong>
                <p>{config.description}</p>
                {status === 'rejected' && kycData?.kyc_rejection_reason && (
                  <p className="rejection-reason">Raison : {kycData.kyc_rejection_reason}</p>
                )}
              </div>
            </div>
          </div>

          {canSubmit && (
            <div className="card">
              <h3>Soumettre vos documents</h3>
              <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
                Veuillez fournir une pièce d'identité et un justificatif de domicile pour compléter la vérification.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <div className="form-group">
                    <label>Pièce d'identité (CNI, passeport)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setIdentityDoc(e.target.files[0])} />
                    <span className="form-hint">Formats acceptés : JPEG, PNG, PDF</span>
                  </div>
                  <div className="form-group" style={{ marginTop: '.75rem' }}>
                    <label>Justificatif de domicile</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setProofOfAddress(e.target.files[0])} />
                    <span className="form-hint">Facture de moins de 3 mois, avis d'imposition</span>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Upload size={16} />
                  {submitting ? 'Envoi en cours...' : 'Soumettre les documents'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="two-col-side">
          <div className="card">
            <h3>Informations</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span>Statut</span>
                <span className={`badge ${config.badge}`}>{config.label}</span>
              </div>
              {kycData?.kyc_submitted_at && (
                <div className="detail-row">
                  <span>Soumis le</span>
                  <span>{new Date(kycData.kyc_submitted_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {kycData?.kyc_verified_at && (
                <div className="detail-row">
                  <span>Vérifié le</span>
                  <span>{new Date(kycData.kyc_verified_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '3px solid var(--info)' }}>
            <h3>Pourquoi le KYC ?</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              La vérification KYC (Know Your Customer) est une obligation légale pour les plateformes d'investissement.
              Elle nous permet de vérifier votre identité et de protéger votre compte contre la fraude.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
