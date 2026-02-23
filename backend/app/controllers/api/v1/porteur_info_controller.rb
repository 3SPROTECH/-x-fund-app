module Api
  module V1
    class PorteurInfoController < ApplicationController
      before_action :require_porteur!
      before_action :set_project
      # GET /api/v1/porteur/projects/:project_id/info_request
      def show
        all_requests = @project.info_requests.order(created_at: :desc)
        render json: {
          data: all_requests.map { |ir| InfoRequestSerializer.new(ir).serializable_hash[:data] }
        }
      end

      # PATCH /api/v1/porteur/projects/:project_id/info_request/submit
      # Accepts { submissions: { "ir_id": { "0": "val", ... }, ... } }
      def submit
        submissions = params[:submissions]
        unless submissions.present?
          return render json: { errors: ["Les réponses sont requises."] }, status: :unprocessable_entity
        end

        pending = @project.info_requests.where(status: :pending)
        if pending.empty?
          return render json: { errors: ["Aucune demande de compléments en attente."] }, status: :not_found
        end

        submitted_requests = []
        pending.each do |ir|
          ir_responses = submissions[ir.id.to_s]
          next unless ir_responses.present?

          ir.update!(
            responses: ir_responses,
            status: :submitted,
            submitted_at: Time.current
          )
          submitted_requests << ir
        end

        if submitted_requests.empty?
          return render json: { errors: ["Aucune réponse fournie pour les demandes en attente."] }, status: :unprocessable_entity
        end

        @project.update!(
          status: :info_resubmitted,
          reviewed_at: Time.current
        )
        NotificationService.notify_admins!(actor: current_user, notifiable: @project, type: "info_resubmitted", title: "Complements soumis", body: "#{current_user.full_name} a soumis les complements d'information pour le projet « #{@project.title} ».")
        NotificationService.notify_project_analyst!(@project, actor: current_user, type: "info_resubmitted", title: "Complements soumis", body: "#{current_user.full_name} a soumis les complements d'information pour le projet « #{@project.title} ».")

        render json: {
          message: "Compléments d'information soumis avec succès.",
          data: submitted_requests.map { |ir| InfoRequestSerializer.new(ir).serializable_hash[:data] }
        }
      end

      private

      def require_porteur!
        unless current_user.porteur_de_projet?
          render json: { error: "Accès réservé aux porteurs de projet." }, status: :forbidden
        end
      end

      def set_project
        @project = InvestmentProject.find(params[:project_id])
        unless @project.owner_id == current_user.id
          render json: { error: "Vous n'êtes pas le propriétaire de ce projet." }, status: :forbidden
        end
      end
    end
  end
end
