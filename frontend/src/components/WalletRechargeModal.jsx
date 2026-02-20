import { useState } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../api/wallet';
import useWalletStore from '../stores/useWalletStore';

export default function WalletRechargeModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    if (amountNum < 10) {
      toast.error('Le montant minimum est de 10 €');
      return;
    }

    setLoading(true);
    try {
      const amountCents = Math.round(amountNum * 100);
      await walletApi.deposit(amountCents);
      toast.success(`${amountNum.toFixed(2)} € ajoutés à votre portefeuille`);
      setAmount('');
      useWalletStore.getState().fetchWallet();
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur dépôt:', err);
      toast.error(err.response?.data?.error || 'Erreur lors du dépôt');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wallet-recharge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">
              <Wallet size={24} />
            </div>
            <div>
              <h2>Recharger mon portefeuille</h2>
              <p>Ajoutez des fonds pour investir dans les projets</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleDeposit} className="modal-body">
          <div className="form-group">
            <label htmlFor="custom-amount" className="form-label">
              Montant personnalisé
            </label>
            <div className="input-with-icon">
              <input
                id="custom-amount"
                type="number"
                step="0.01"
                min="10"
                placeholder="Entrez un montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-control"
              />
              <span className="input-suffix">€</span>
            </div>
            <small className="form-hint">Montant minimum : 10 €</small>
          </div>

          <div className="recharge-summary">
            <div className="summary-row">
              <span>Montant à déposer</span>
              <strong>{amount ? parseFloat(amount).toFixed(2) : '0,00'} €</strong>
            </div>
            <div className="summary-row">
              <span>Frais</span>
              <strong>0,00 €</strong>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{amount ? parseFloat(amount).toFixed(2) : '0,00'} €</strong>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !amount || parseFloat(amount) < 10}
            >
              <CreditCard size={18} />
              {loading ? 'Traitement...' : 'Recharger mon portefeuille'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
