module Api
  module V1
    module Admin
      class TransactionsController < ApplicationController
        before_action :require_admin!

        def index
          transactions = Transaction.includes(wallet: :user).all
          transactions = transactions.where(transaction_type: params[:transaction_type]) if params[:transaction_type].present?
          transactions = transactions.where(status: params[:status]) if params[:status].present?
          transactions = transactions.where(wallet_id: params[:wallet_id]) if params[:wallet_id].present?
          transactions = paginate(transactions.order(created_at: :desc))

          render json: {
            data: transactions.map { |t| AdminTransactionSerializer.new(t).serializable_hash[:data] },
            meta: pagination_meta(transactions)
          }
        end

        def show
          transaction = Transaction.find(params[:id])
          render json: { data: AdminTransactionSerializer.new(transaction).serializable_hash[:data] }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end
      end
    end
  end
end
