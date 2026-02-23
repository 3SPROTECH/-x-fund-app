module Api
  module V1
    module Analyste
      class KycController < ApplicationController
        before_action :require_analyste!
        before_action :set_user, only: [:show, :verify, :reject]

        # GET /api/v1/analyste/kyc
        def index
          users = User.where.not(role: [:administrateur, :analyste])

          if params[:status].present?
            users = users.where(kyc_status: params[:status])
          else
            users = users.where(kyc_status: [:submitted, :verified, :rejected])
          end

          if params[:search].present?
            q = "%#{params[:search]}%"
            users = users.where(
              "first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q", q: q
            )
          end

          if params[:role].present?
            users = users.where(role: params[:role])
          end

          users = paginate(users.order(kyc_submitted_at: :desc))

          render json: {
            data: users.map { |u| UserSerializer.new(u).serializable_hash[:data] },
            meta: pagination_meta(users).merge(stats: kyc_stats)
          }
        end

        # GET /api/v1/analyste/kyc/:id
        def show
          render json: { data: UserSerializer.new(@user).serializable_hash[:data] }
        end

        # PATCH /api/v1/analyste/kyc/:id/verify
        def verify
          unless @user.kyc_submitted?
            return render json: { error: "Seuls les KYC soumis peuvent etre verifies." }, status: :unprocessable_entity
          end

          @user.update!(
            kyc_status: :verified,
            kyc_verified_at: Time.current,
            kyc_rejection_reason: nil
          )

          render json: {
            message: "KYC verifie avec succes.",
            data: UserSerializer.new(@user).serializable_hash[:data]
          }
        end

        # PATCH /api/v1/analyste/kyc/:id/reject
        def reject
          unless @user.kyc_submitted?
            return render json: { error: "Seuls les KYC soumis peuvent etre rejetes." }, status: :unprocessable_entity
          end

          reason = params[:reason]
          if reason.blank?
            return render json: { error: "La raison du rejet est obligatoire." }, status: :unprocessable_entity
          end

          @user.update!(
            kyc_status: :rejected,
            kyc_rejection_reason: reason
          )

          render json: {
            message: "KYC rejete.",
            data: UserSerializer.new(@user).serializable_hash[:data]
          }
        end

        private

        def require_analyste!
          unless current_user.analyste?
            render json: { error: "Acces reserve aux analystes." }, status: :forbidden
          end
        end

        def set_user
          @user = User.where.not(role: [:administrateur, :analyste]).find(params[:id])
        end

        def kyc_stats
          base = User.where.not(role: [:administrateur, :analyste])
          {
            submitted: base.where(kyc_status: :submitted).count,
            verified: base.where(kyc_status: :verified).count,
            rejected: base.where(kyc_status: :rejected).count,
            pending: base.where(kyc_status: :pending).count
          }
        end
      end
    end
  end
end
