import { useState, useEffect } from 'react';
import { analysteApi } from '../../api/analyste';
import { getImageUrl } from '../../api/client';
import {
  ShieldCheck, ShieldX, Eye, Search, FileText, Download, X,
  Users, UserCheck, UserX, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import FormSelect from '../../components/FormSelect';
import { LoadingSpinner, Pagination, EmptyState } from '../../components/ui';
import { ROLE_LABELS, KYC_STATUS_LABELS, KYC_STATUS_BADGES } from '../../utils';

export default function AnalysteKycPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'submitted', role: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [stats, setStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadUsers(); }, [page, filters, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      if (search) params.search = search;
      const res = await analysteApi.getKycList(params);
      setUsers(res.data.data || []);
      setMeta(res.data.meta || {});
      setStats(res.data.meta?.stats || {});
    } catch {
      toast.error('Erreur lors du chargement des demandes KYC');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetail = async (userId) => {
    try {
      const res = await analysteApi.getKycUser(userId);
      setSelectedUser(res.data.data || null);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  const handleVerify = async (userId) => {
    try {
      await analysteApi.verifyKyc(userId);
      toast.success('KYC verifie avec succes');
      loadUsers();
      if (selectedUser?.id === String(userId)) loadUserDetail(userId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la verification');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Veuillez fournir une raison'); return; }
    try {
      await analysteApi.rejectKyc(rejectUserId, rejectReason);
      toast.success('KYC rejete');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectUserId(null);
      loadUsers();
      if (selectedUser?.id === String(rejectUserId)) loadUserDetail(rejectUserId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du rejet');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Verification KYC</h1>
          <p className="text-muted">Verifiez les documents d'identite des utilisateurs</p>
        </div>
        <span className="badge"><Clock size={12} /> {stats.submitted || 0} en attente</span>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" onClick={() => { setFilters({ ...filters, status: 'submitted' }); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Soumis</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.submitted || 0}</div>
        </div>
        <div className="stat-card" onClick={() => { setFilters({ ...filters, status: 'verified' }); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Verifies</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.verified || 0}</div>
        </div>
        <div className="stat-card" onClick={() => { setFilters({ ...filters, status: 'rejected' }); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Rejetes</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.rejected || 0}</div>
        </div>
        <div className="stat-card" onClick={() => { setFilters({ ...filters, status: '' }); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total</div>
          <div className="stat-value">{(stats.submitted || 0) + (stats.verified || 0) + (stats.rejected || 0) + (stats.pending || 0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
          <label>Statut KYC</label>
          <FormSelect
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            placeholder="Tous les statuts"
            options={[
              { value: 'submitted', label: 'Soumis' },
              { value: 'verified', label: 'Verifie' },
              { value: 'rejected', label: 'Rejete' },
            ]}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
          <label>Role</label>
          <FormSelect
            value={filters.role}
            onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(1); }}
            placeholder="Tous les roles"
            options={[
              { value: 'investisseur', label: 'Investisseur' },
              { value: 'porteur_de_projet', label: 'Porteur de projet' },
            ]}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: '2 1 250px' }}>
          <label>Recherche</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par nom ou email..."
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>
      </div>

      {/* Table + Detail Panel */}
      <div className="admin-layout">
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : users.length === 0 ? (
            <div className="card">
              <EmptyState icon={Search} message="Aucune demande KYC trouvee" />
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Statut KYC</th>
                      <th>Date soumission</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const a = u.attributes || u;
                      return (
                        <tr key={u.id} className={selectedUser?.id === u.id ? 'row-selected' : ''}>
                          <td data-label="Utilisateur" style={{ fontWeight: 550 }}>
                            {a.first_name} {a.last_name}
                          </td>
                          <td data-label="Email">{a.email}</td>
                          <td data-label="Role">
                            <span className="badge badge-primary">{ROLE_LABELS[a.role] || a.role}</span>
                          </td>
                          <td data-label="Statut KYC">
                            <span className={`badge ${KYC_STATUS_BADGES[a.kyc_status] || ''}`}>
                              {KYC_STATUS_LABELS[a.kyc_status] || a.kyc_status}
                            </span>
                          </td>
                          <td data-label="Date soumission">
                            {a.kyc_submitted_at ? new Date(a.kyc_submitted_at).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td data-label="Actions">
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir les documents" onClick={() => loadUserDetail(u.id)}>
                                <Eye size={16} />
                              </button>
                              {a.kyc_status === 'submitted' && (
                                <>
                                  <button className="btn-icon btn-success" title="Verifier KYC" onClick={() => handleVerify(u.id)}>
                                    <ShieldCheck size={16} />
                                  </button>
                                  <button className="btn-icon btn-danger" title="Rejeter KYC" onClick={() => { setRejectUserId(u.id); setShowRejectModal(true); }}>
                                    <ShieldX size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selectedUser && (() => {
          const a = selectedUser.attributes || selectedUser;
          return (
            <div className="card user-detail-panel">
              <button className="detail-panel-close" onClick={() => setSelectedUser(null)}><X size={20} /></button>

              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div className="avatar avatar-lg" style={{ margin: '0 auto .5rem' }}>
                  {a.first_name?.[0]}{a.last_name?.[0]}
                </div>
                <h3 style={{ marginBottom: '.15rem' }}>{a.first_name} {a.last_name}</h3>
                <span className="badge badge-primary">{ROLE_LABELS[a.role] || a.role}</span>
              </div>

              <div className="divider" />

              <div className="detail-grid">
                <div className="detail-row"><span>Email</span><span>{a.email}</span></div>
                <div className="detail-row"><span>Telephone</span><span>{a.phone || '—'}</span></div>
                <div className="detail-row">
                  <span>Statut KYC</span>
                  <span className={`badge ${KYC_STATUS_BADGES[a.kyc_status] || ''}`}>{KYC_STATUS_LABELS[a.kyc_status]}</span>
                </div>
                {a.kyc_submitted_at && (
                  <div className="detail-row"><span>Soumis le</span><span>{new Date(a.kyc_submitted_at).toLocaleDateString('fr-FR')}</span></div>
                )}
                {a.kyc_verified_at && (
                  <div className="detail-row"><span>Verifie le</span><span>{new Date(a.kyc_verified_at).toLocaleDateString('fr-FR')}</span></div>
                )}
                {a.kyc_rejection_reason && (
                  <div className="detail-row"><span>Raison rejet</span><span style={{ color: 'var(--danger)' }}>{a.kyc_rejection_reason}</span></div>
                )}
                <div className="detail-row">
                  <span>Adresse</span>
                  <span>{[a.address_line1, a.city, a.postal_code, a.country].filter(Boolean).join(', ') || '—'}</span>
                </div>
                {a.date_of_birth && (
                  <div className="detail-row"><span>Date de naissance</span><span>{new Date(a.date_of_birth).toLocaleDateString('fr-FR')}</span></div>
                )}
              </div>

              {/* Documents KYC */}
              {(a.kyc_identity_document || a.kyc_proof_of_address) && (
                <>
                  <div className="divider" />
                  <div>
                    <h4 style={{ fontSize: '.9rem', marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <FileText size={16} />
                      Documents KYC
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                      {a.kyc_identity_document && (
                        <div style={{
                          padding: '.75rem',
                          background: 'rgba(79, 70, 229, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(79, 70, 229, 0.2)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '.875rem', fontWeight: 600, marginBottom: '.25rem' }}>
                                Piece d'identite
                              </div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                                {a.kyc_identity_document.filename}
                              </div>
                            </div>
                            <a
                              href={getImageUrl(a.kyc_identity_document.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                              style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}
                            >
                              <Download size={14} /> Voir
                            </a>
                          </div>
                        </div>
                      )}
                      {a.kyc_proof_of_address && (
                        <div style={{
                          padding: '.75rem',
                          background: 'rgba(79, 70, 229, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(79, 70, 229, 0.2)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '.875rem', fontWeight: 600, marginBottom: '.25rem' }}>
                                Justificatif de domicile
                              </div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                                {a.kyc_proof_of_address.filename}
                              </div>
                            </div>
                            <a
                              href={getImageUrl(a.kyc_proof_of_address.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                              style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}
                            >
                              <Download size={14} /> Voir
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              {a.kyc_status === 'submitted' && (
                <div className="detail-actions">
                  <button className="btn btn-success btn-sm" onClick={() => handleVerify(selectedUser.id)}>
                    <UserCheck size={14} /> Valider KYC
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setRejectUserId(selectedUser.id); setShowRejectModal(true); }}>
                    <UserX size={14} /> Rejeter KYC
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rejeter la verification KYC</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Indiquez la raison du rejet. L'utilisateur pourra re-soumettre ses documents.
            </p>
            <div className="form-group">
              <label>Raison du rejet *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Document illisible, informations non correspondantes..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>Annuler</button>
              <button className="btn btn-danger" onClick={handleReject}>Rejeter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
