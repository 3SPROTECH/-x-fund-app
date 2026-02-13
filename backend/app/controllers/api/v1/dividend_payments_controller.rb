module Api
  module V1
    class DividendPaymentsController < ApplicationController
      def index
        project = InvestmentProject.find(params[:investment_project_id])
        dividend = project.dividends.find(params[:dividend_id])
        authorize dividend, :show?

        if dividend.distribue?
          # Return actual payment records
          payments = dividend.dividend_payments.includes(investment: :user).order(created_at: :desc)
          payments = paginate(payments)

          render json: {
            data: payments.map { |p| serialize_payment(p) },
            meta: pagination_meta(payments)
          }
        else
          # Return projected payments from active investments
          investments = project.investments.active.includes(:user).order(created_at: :desc)
          investments = paginate(investments)

          render json: {
            data: investments.map { |inv| serialize_projected_payment(inv, dividend) },
            meta: pagination_meta(investments)
          }
        end
      end

      private

      def serialize_payment(payment)
        {
          id: payment.id,
          type: "dividend_payment",
          attributes: {
            investor_name: payment.user.full_name,
            investor_email: payment.user.email,
            shares_count: payment.shares_count,
            amount_cents: payment.amount_cents,
            status: payment.status,
            paid_at: payment.paid_at
          }
        }
      end

      def serialize_projected_payment(investment, dividend)
        {
          id: "projected-#{investment.id}",
          type: "projected_payment",
          attributes: {
            investor_name: investment.user.full_name,
            investor_email: investment.user.email,
            shares_count: investment.shares_count,
            amount_cents: investment.shares_count * dividend.amount_per_share_cents,
            status: "en_attente",
            paid_at: nil
          }
        }
      end
    end
  end
end
