module Api
  module V1
    module Admin
      class PlatformWalletController < ApplicationController
        before_action :require_admin!

        def show
          wallet = Wallet.platform_wallet

          # Revenue breakdown by fee type
          revenue_by_type = wallet.transactions
            .where(transaction_type: :frais, status: :complete)
            .group("metadata->>'fee_type'")
            .sum(:amount_cents)

          # Total invested across all projects
          total_invested_cents = Transaction.where(transaction_type: :investissement, status: :complete).sum(:amount_cents).abs

          render json: {
            data: {
              balance_cents: wallet.balance_cents,
              total_collected_cents: wallet.total_deposited_cents,
              total_invested_cents: total_invested_cents,
              currency: wallet.currency,
              revenue_by_type: revenue_by_type
            }
          }
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
