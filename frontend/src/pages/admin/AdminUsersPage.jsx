import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  ShieldCheck, ShieldX, Trash2, Eye, ChevronLeft,
  ChevronRight, Users, UserCheck, UserX, Search, FileText, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../api/client';
import TableFilters from '../../components/TableFilters';

const KYC_LABELS = { pending: 'En attente', submitted: 'Soumis', verified: 'Vérifié', rejected: 'Rejeté' };
const ROLE_LABELS = { investisseur: 'Investisseur', porteur_de_projet: 'Porteur de projet', administrateur: 'Administrateur' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', kyc_status: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState(null);

  useEffect(() => { loadUsers(); }, [page, filters, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.role) params.role = filters.role;
      if (filters.kyc_status) params.kyc_status = filters.kyc_status;
      if (search) params.search = search;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKyc = async (userId) => {
    try {
      await adminApi.verifyKyc(userId);
      toast.success('KYC vérifié avec succès');
      loadUsers();
      if (selectedUser?.id === String(userId)) loadUserDetail(userId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la vérification');
    }
  };

  const handleRejectKyc = async () => {
    if (!rejectReason.trim()) { toast.error('Veuillez fournir une raison'); return; }
    try {
      await adminApi.rejectKyc(rejectUserId, rejectReason);
      toast.success('KYC rejeté');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectUserId(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du rejet');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('Utilisateur supprimé');
      loadUsers();
      if (selectedUser?.id === String(userId)) setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const loadUserDetail = async (userId) => {
    try {
      const res = await adminApi.getUser(userId);
      setSelectedUser(res.data.data || null);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p className="text-muted">Gérez les comptes et les vérifications KYC</p>
        </div>
        <span className="badge"><Users size={12} /> {meta.total_count ?? users.length} utilisateur(s)</span>
      </div>

      <TableFilters
        filters={[
          { key: 'role', label: 'Rôle', value: filters.role, options: [
            { value: '', label: 'Tous les rôles' },
            { value: 'investisseur', label: 'Investisseur' },
            { value: 'porteur_de_projet', label: 'Porteur de projet' },
            { value: 'administrateur', label: 'Administrateur' },
          ]},
          { key: 'kyc_status', label: 'Statut KYC', value: filters.kyc_status, options: [
            { value: '', label: 'Tous les statuts' },
            { value: 'pending', label: 'En attente' },
            { value: 'submitted', label: 'Soumis' },
            { value: 'verified', label: 'Vérifié' },
            { value: 'rejected', label: 'Rejeté' },
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un utilisateur..."
      />

      <div className="admin-layout">
        <div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <Search size={48} />
                <p>Aucun utilisateur trouvé</p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>KYC</th><th>Inscrit le</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const attrs = u.attributes || u;
                      return (
                        <tr key={u.id} className={selectedUser?.id === u.id ? 'row-selected' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                              <div className="avatar avatar-sm">{attrs.first_name?.[0]}{attrs.last_name?.[0]}</div>
                              <span>{attrs.first_name} {attrs.last_name}</span>
                            </div>
                          </td>
                          <td>{attrs.email}</td>
                          <td><span className="badge badge-primary">{ROLE_LABELS[attrs.role] || attrs.role}</span></td>
                          <td><span className={`badge kyc-${attrs.kyc_status}`}>{KYC_LABELS[attrs.kyc_status] || attrs.kyc_status}</span></td>
                          <td>{attrs.created_at ? new Date(attrs.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon" title="Voir" onClick={() => loadUserDetail(u.id)}><Eye size={16} /></button>
                              {attrs.kyc_status === 'submitted' && (
                                <>
                                  <button className="btn-icon btn-success" title="Vérifier KYC" onClick={() => handleVerifyKyc(u.id)}><ShieldCheck size={16} /></button>
                                  <button className="btn-icon btn-danger" title="Rejeter KYC" onClick={() => { setRejectUserId(u.id); setShowRejectModal(true); }}><ShieldX size={16} /></button>
                                </>
                              )}
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDelete(u.id)}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {meta.total_pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm"><ChevronLeft size={16} /></button>
                  <span>Page {page} / {meta.total_pages}</span>
                  <button disabled={page >= meta.total_pages} onClick={() => setPage(page + 1)} className="btn btn-sm"><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedUser && (
          <div className="card user-detail-panel">
            {(() => {
              const a = selectedUser.attributes || selectedUser;
              return (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div className="avatar avatar-lg" style={{ margin: '0 auto .5rem' }}>
                      {a.first_name?.[0]}{a.last_name?.[0]}
                    </div>
                    <h3 style={{ marginBottom: '.15rem' }}>{a.first_name} {a.last_name}</h3>
                    <span className="badge badge-primary">{ROLE_LABELS[a.role] || a.role}</span>
                  </div>
                  <div className="divider" />
                  <div className="detail-grid">
                    <div className="detail-row"><span>ID</span><span className="font-mono" style={{ fontSize: '.8rem' }}>{selectedUser.id}</span></div>
                    <div className="detail-row"><span>Email</span><span>{a.email}</span></div>
                    <div className="detail-row"><span>Téléphone</span><span>{a.phone || '—'}</span></div>
                    <div className="detail-row"><span>KYC</span><span className={`badge kyc-${a.kyc_status}`}>{KYC_LABELS[a.kyc_status]}</span></div>
                    {a.kyc_submitted_at && <div className="detail-row"><span>KYC soumis le</span><span>{new Date(a.kyc_submitted_at).toLocaleDateString('fr-FR')}</span></div>}
                    {a.kyc_verified_at && <div className="detail-row"><span>KYC vérifié le</span><span>{new Date(a.kyc_verified_at).toLocaleDateString('fr-FR')}</span></div>}
                    {a.kyc_rejection_reason && <div className="detail-row"><span>Raison rejet</span><span style={{ color: 'var(--danger)' }}>{a.kyc_rejection_reason}</span></div>}
                    <div className="detail-row"><span>Adresse</span><span>{[a.address_line1, a.city, a.postal_code, a.country].filter(Boolean).join(', ') || '—'}</span></div>
                    <div className="detail-row"><span>Inscrit le</span><span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span></div>
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
                                    Pièce d'identité
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

                  {a.kyc_status === 'submitted' && (
                    <div className="detail-actions">
                      <button className="btn btn-success btn-sm" onClick={() => handleVerifyKyc(selectedUser.id)}>
                        <UserCheck size={14} /> Valider KYC
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setRejectUserId(selectedUser.id); setShowRejectModal(true); }}>
                        <UserX size={14} /> Rejeter KYC
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rejeter la vérification KYC</h3>
            <div className="form-group">
              <label>Raison du rejet</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indiquez la raison du rejet..." rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowRejectModal(false)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleRejectKyc}>Rejeter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
