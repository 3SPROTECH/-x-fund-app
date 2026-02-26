module Api
  module V1
    module Analyste
      class AnalysisDraftsController < ApplicationController
        before_action :require_analyste!
        before_action :set_project
        before_action :set_draft, only: [:update, :destroy]

        def show
          draft = @project.analysis_drafts.find_by(user: current_user)
          render json: { data: draft ? draft_json(draft) : nil }
        end

        def create
          draft = @project.analysis_drafts.find_or_initialize_by(user: current_user)
          draft.assign_attributes(draft_params)
          if draft.save
            render json: { data: draft_json(draft) }, status: draft.previously_new_record? ? :created : :ok
          else
            render json: { errors: draft.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @draft.update(draft_params)
            render json: { data: draft_json(@draft) }
          else
            render json: { errors: @draft.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @draft.destroy!
          render json: { message: "Brouillon d'analyse supprime." }, status: :ok
        end

        private

        def require_analyste!
          unless current_user.analyste?
            render json: { error: "Acces reserve aux analystes." }, status: :forbidden
          end
        end

        def set_project
          @project = InvestmentProject.where(analyst_id: current_user.id).find(params[:project_id])
        end

        def set_draft
          @draft = @project.analysis_drafts.find_by!(user: current_user)
        end

        def draft_params
          params.require(:analysis_draft).permit(:current_step, form_data: {})
        end

        def draft_json(draft)
          {
            id: draft.id,
            project_id: draft.investment_project_id,
            form_data: draft.form_data,
            current_step: draft.current_step,
            last_saved_at: draft.last_saved_at,
            created_at: draft.created_at,
            updated_at: draft.updated_at
          }
        end
      end
    end
  end
end
