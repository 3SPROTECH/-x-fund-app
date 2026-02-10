module Api
  module V1
    class WalletController < ApplicationController
      def show
        wallet = current_user.wallet
        authorize wallet

        render json: { data: WalletSerializer.new(wallet).serializable_hash[:data] }
      end

      def deposit
        wallet = current_user.wallet
        authorize wallet

        service = Wallets::WalletService.new(wallet)
        transaction = service.deposit(
          amount_cents: params[:amount_cents].to_i,
          reference: "DEP-#{SecureRandom.hex(8).upcase}"
        )

        render json: {
          message: "Depot effectue avec succes.",
          data: TransactionSerializer.new(transaction).serializable_hash[:data]
        }, status: :created
      rescue Wallets::WalletService::InvalidAmountError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def withdraw
        wallet = current_user.wallet
        authorize wallet

        service = Wallets::WalletService.new(wallet)
        transaction = service.withdraw(
          amount_cents: params[:amount_cents].to_i,
          reference: "WIT-#{SecureRandom.hex(8).upcase}"
        )

        render json: {
          message: "Retrait effectue avec succes.",
          data: TransactionSerializer.new(transaction).serializable_hash[:data]
        }, status: :created
      rescue Wallets::WalletService::InsufficientFundsError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue Wallets::WalletService::InvalidAmountError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def transactions
        wallet = current_user.wallet
        authorize wallet, :show?

        txns = wallet.transactions.recent
        txns = txns.where(transaction_type: params[:type]) if params[:type].present?
        txns = paginate(txns)

        render json: {
          data: txns.map { |t| TransactionSerializer.new(t).serializable_hash[:data] },
          meta: pagination_meta(txns)
        }
      end
    end
  end
end
