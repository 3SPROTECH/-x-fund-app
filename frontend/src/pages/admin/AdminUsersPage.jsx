import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import {
  ShieldCheck, ShieldX, Trash2, Eye, UserPlus,
  Users, UserCheck, UserX, Search, FileText, Download, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../api/client';
import TableFilters from '../../components/TableFilters';
import FormSelect from '../../components/FormSelect';
import { ROLE_LABELS, KYC_STATUS_LABELS as KYC_LABELS } from '../../utils';
import { LoadingSpinner, Pagination, EmptyState } from '../../components/ui';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', password: '', password_confirmation: '', role: 'analyste' });
  const [creating, setCreating] = useState(false);

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

  const handleCreateUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (newUser.password !== newUser.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setCreating(true);
    try {
      await adminApi.createUser(newUser);
      toast.success('Utilisateur cree avec succes');
      setShowCreateModal(false);
      setNewUser({ first_name: '', last_name: '', email: '', password: '', password_confirmation: '', role: 'analyste' });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur lors de la creation');
    } finally {
      setCreating(false);
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
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <span className="badge"><Users size={12} /> {meta.total_count ?? users.length} utilisateur(s)</span>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={14} /> Creer un utilisateur
          </button>
        </div>
      </div>

      <TableFilters
        filters={[
          { key: 'role', label: 'Rôle', value: filters.role, options: [
            { value: '', label: 'Tous les rôles' },
            { value: 'investisseur', label: 'Investisseur' },
            { value: 'porteur_de_projet', label: 'Porteur de projet' },
            { value: 'administrateur', label: 'Administrateur' },
            { value: 'analyste', label: 'Analyste' },
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
            <LoadingSpinner />
          ) : users.length === 0 ? (
            <div className="card">
              <EmptyState icon={Search} message="Aucun utilisateur trouvé" />
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
                          <td data-label="Nom">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                              <span>{attrs.first_name} {attrs.last_name}</span>
                            </div>
                          </td>
                          <td data-label="Email">{attrs.email}</td>
                          <td data-label="Rôle"><span className="badge badge-primary">{ROLE_LABELS[attrs.role] || attrs.role}</span></td>
                          <td data-label="KYC"><span className={`badge kyc-${attrs.kyc_status}`}>{KYC_LABELS[attrs.kyc_status] || attrs.kyc_status}</span></td>
                          <td data-label="Inscrit le">{attrs.created_at ? new Date(attrs.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                          <td data-label="Actions">
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

              <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
            </>
          )}
        </div>

        {selectedUser && (
          <div className="card user-detail-panel">
            <button className="detail-panel-close" onClick={() => setSelectedUser(null)}><X size={20} /></button>
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

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Creer un utilisateur</h3>
            <div className="form-group">
              <label>Role</label>
              <FormSelect
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                options={[
                  { value: 'analyste', label: 'Analyste' },
                  { value: 'administrateur', label: 'Administrateur' },
                  { value: 'investisseur', label: 'Investisseur' },
                  { value: 'porteur_de_projet', label: 'Porteur de projet' },
                ]}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div className="form-group">
                <label>Prenom *</label>
                <input type="text" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} placeholder="Prenom" />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input type="text" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} placeholder="Nom" />
              </div>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@exemple.com" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div className="form-group">
                <label>Mot de passe *</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mot de passe" />
              </div>
              <div className="form-group">
                <label>Confirmer *</label>
                <input type="password" value={newUser.password_confirmation} onChange={(e) => setNewUser({ ...newUser, password_confirmation: e.target.value })} placeholder="Confirmer" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowCreateModal(false)} disabled={creating}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreateUser} disabled={creating}>
                {creating ? 'Creation...' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
