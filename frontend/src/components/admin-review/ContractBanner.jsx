import { FileText, RefreshCw, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContractBanner({ project, onGenerateContract, onShowContract, onCheckSignature, checkingSignature }) {
  const a = project?.attributes || project || {};

  // Contract generation banner (approved, no yousign)
  if (a.status === 'approved' && !a.yousign_status) {
    return (
      <div className="apr-contract-banner apr-anim apr-d1">
        <div className="apr-contract-banner-top">
          <div>
            <h3>Contrat d'investissement</h3>
            <p>Le projet est approuve. Generez le contrat, signez-le, puis il sera envoye au porteur.</p>
          </div>
          <div className="apr-contract-actions">
            <button className="apr-btn apr-btn-approve" onClick={onGenerateContract}>
              <FileText size={14} /> Generer le contrat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signing progress banner
  if ((a.status === 'approved' && a.yousign_status) || a.status === 'signing') {
    const adminSigned = ['admin_signed', 'owner_signed', 'done'].includes(a.yousign_status);
    const ownerSigned = ['owner_signed', 'done'].includes(a.yousign_status);
    const allDone = a.yousign_status === 'done';
    const awaitingAdmin = ['awaiting_admin', 'ongoing'].includes(a.yousign_status);
    const adminSignLink = a.yousign_admin_signature_link;

    return (
      <div className="apr-contract-banner apr-anim apr-d1" style={allDone ? { borderColor: 'var(--apr-green)' } : undefined}>
        <div className="apr-contract-banner-top">
          <div>
            <h3>
              {allDone
                ? 'Contrat signe par les deux parties'
                : awaitingAdmin
                  ? 'Votre signature est requise'
                  : 'En attente de la signature du porteur'}
            </h3>
            <p>
              {allDone
                ? 'Le contrat a ete signe par le porteur et la plateforme.'
                : awaitingAdmin
                  ? 'Signez le contrat en premier. Le porteur recevra le contrat apres votre signature.'
                  : 'Vous avez signe. Le porteur de projet doit maintenant signer le contrat.'}
            </p>
          </div>
          <div className="apr-contract-actions">
            <button className="apr-btn apr-btn-secondary" onClick={onShowContract}>
              <FileText size={14} /> Voir le contrat
            </button>
            <button className="apr-btn apr-btn-secondary" onClick={onCheckSignature} disabled={checkingSignature}>
              <RefreshCw size={14} style={checkingSignature ? { animation: 'spin 1s linear infinite' } : undefined} />
              {checkingSignature ? 'Verification...' : 'Verifier le statut'}
            </button>
          </div>
        </div>

        <div className="apr-signing-progress">
          <div
            className="apr-signing-step"
            style={{
              background: adminSigned ? 'var(--apr-green-bg)' : 'var(--apr-orange-bg)',
              border: `1px solid ${adminSigned ? 'var(--apr-green-border)' : 'var(--apr-orange-border)'}`,
            }}
          >
            <div className="apr-signing-step-info">
              {adminSigned
                ? <CheckCircle size={20} color="var(--apr-green)" />
                : <AlertCircle size={20} color="var(--apr-orange)" />
              }
              <div>
                <div className="apr-signing-step-label">Etape 1 — Plateforme (Admin)</div>
                <div className="apr-signing-step-status">{adminSigned ? 'Signe' : 'En attente de votre signature'}</div>
              </div>
            </div>
            {!adminSigned && adminSignLink && (
              <button
                className="apr-btn apr-btn-approve"
                onClick={() => window.open(adminSignLink, '_blank', 'noopener,noreferrer')}
              >
                <Send size={14} /> Signer le contrat
              </button>
            )}
          </div>

          <div
            className="apr-signing-step"
            style={{
              background: ownerSigned ? 'var(--apr-green-bg)' : '#EFF6FF',
              border: `1px solid ${ownerSigned ? 'var(--apr-green-border)' : '#C8DDF5'}`,
              opacity: adminSigned ? 1 : 0.5,
            }}
          >
            <div className="apr-signing-step-info">
              {ownerSigned
                ? <CheckCircle size={20} color="var(--apr-green)" />
                : <AlertCircle size={20} color="#3b82f6" />
              }
              <div>
                <div className="apr-signing-step-label">Etape 2 — Porteur de projet</div>
                <div className="apr-signing-step-status">
                  {ownerSigned
                    ? 'Signe'
                    : adminSigned
                      ? 'En attente de signature'
                      : 'En attente de la signature admin'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
