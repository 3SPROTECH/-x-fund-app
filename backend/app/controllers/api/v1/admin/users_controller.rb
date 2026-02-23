module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        before_action :require_admin!
        before_action :set_user, only: [:show, :update, :destroy, :verify_kyc, :reject_kyc]

        def create
          user = User.new(create_user_params)
          if user.save
            render json: { data: UserSerializer.new(user).serializable_hash[:data] }, status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def index
          users = User.all
          users = users.where(role: params[:role]) if params[:role].present?
          users = users.where(kyc_status: params[:kyc_status]) if params[:kyc_status].present?
          if params[:search].present?
            q = "%#{params[:search]}%"
            users = users.where("first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q", q: q)
          end
          users = paginate(users.order(created_at: :desc))

          render json: {
            data: users.map { |u| UserSerializer.new(u).serializable_hash[:data] },
            meta: pagination_meta(users)
          }
        end

        def show
          render json: { data: UserSerializer.new(@user).serializable_hash[:data] }
        end

        def update
          if @user.update(admin_user_params)
            render json: { data: UserSerializer.new(@user).serializable_hash[:data] }
          else
            render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @user.destroy!
          render json: { message: "Utilisateur supprime." }
        end

        def verify_kyc
          @user.update!(kyc_status: :verified, kyc_verified_at: Time.current, kyc_rejection_reason: nil)
          log_admin_action("verify_kyc", @user, { user_name: @user.full_name })
          NotificationService.notify!(user: @user, actor: current_user, notifiable: @user, type: "kyc_verified", title: "KYC verifie", body: "Votre dossier KYC a ete verifie et approuve.")
          render json: { message: "KYC verifie.", data: { kyc_status: @user.kyc_status } }
        end

        def reject_kyc
          @user.update!(kyc_status: :rejected, kyc_rejection_reason: params[:reason])
          log_admin_action("reject_kyc", @user, { user_name: @user.full_name, reason: params[:reason] })
          NotificationService.notify!(user: @user, actor: current_user, notifiable: @user, type: "kyc_rejected", title: "KYC rejete", body: "Votre dossier KYC a ete rejete.#{params[:reason].present? ? " Motif : #{params[:reason]}" : ''}")
          render json: { message: "KYC rejete.", data: { kyc_status: @user.kyc_status, reason: params[:reason] } }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end

        def log_admin_action(action, resource, data = {})
          AuditLog.create!(
            user: current_user,
            auditable: resource,
            action: action,
            changes_data: data,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )
        rescue => e
          Rails.logger.error("Admin audit log failed: #{e.message}")
        end

        def set_user
          @user = User.find(params[:id])
        end

        def admin_user_params
          params.require(:user).permit(:first_name, :last_name, :phone, :role, :kyc_status)
        end

        def create_user_params
          params.require(:user).permit(:first_name, :last_name, :email, :password, :password_confirmation, :phone, :role)
        end
      end
    end
  end
end
