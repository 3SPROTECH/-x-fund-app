module Api
  module V1
    class PorteurInfoController < ApplicationController
      before_action :require_porteur!
      before_action :set_project
      before_action :set_info_request, only: [:show, :submit]

      # GET /api/v1/porteur/projects/:project_id/info_request
      def show
        if @info_request
          render json: {
            data: InfoRequestSerializer.new(@info_request).serializable_hash[:data]
          }
        else
          render json: { data: nil }
        end
      end

      # PATCH /api/v1/porteur/projects/:project_id/info_request/submit
      def submit
        unless @info_request
          return render json: { errors: ["Aucune demande de compléments trouvée."] }, status: :not_found
        end

        unless @info_request.ir_pending?
          return render json: { errors: ["Cette demande a déjà été soumise."] }, status: :unprocessable_entity
        end

        responses = params[:responses]
        unless responses.present?
          return render json: { errors: ["Les réponses sont requises."] }, status: :unprocessable_entity
        end

        @info_request.update!(
          responses: responses,
          status: :submitted,
          submitted_at: Time.current
        )

        @project.update!(
          status: :info_resubmitted,
          reviewed_at: Time.current
        )

        render json: {
          message: "Compléments d'information soumis avec succès.",
          data: InfoRequestSerializer.new(@info_request).serializable_hash[:data]
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

      def set_info_request
        @info_request = @project.info_requests.order(created_at: :desc).first
      end
    end
  end
end
