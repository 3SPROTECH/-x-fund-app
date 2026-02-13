module Api
  module V1
    module Admin
      class AuditLogsController < ApplicationController
        before_action :require_admin!

        def index
          logs = AuditLog.includes(:user).recent
          logs = logs.where(auditable_type: params[:resource_type]) if params[:resource_type].present?
          logs = logs.where(action: params[:action_type]) if params[:action_type].present?
          logs = logs.by_user(User.find(params[:user_id])) if params[:user_id].present?
          if params[:search].present?
            q = "%#{params[:search]}%"
            logs = logs.joins(:user).where("users.first_name ILIKE :q OR users.last_name ILIKE :q OR audit_logs.action ILIKE :q", q: q)
          end
          logs = paginate(logs)

          render json: {
            data: logs.map { |l| AuditLogSerializer.new(l).serializable_hash[:data] },
            meta: pagination_meta(logs)
          }
        end

        def show
          log = AuditLog.find(params[:id])
          render json: { data: AuditLogSerializer.new(log).serializable_hash[:data] }
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
