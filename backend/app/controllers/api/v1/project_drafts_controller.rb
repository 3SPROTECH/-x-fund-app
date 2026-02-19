module Api
  module V1
    class ProjectDraftsController < ApplicationController
      before_action :set_draft, only: [:show, :update, :destroy, :submit]

      def index
        drafts = current_user.project_drafts.order(updated_at: :desc)
        render json: { data: drafts.map { |d| draft_json(d) } }
      end

      def show
        render json: { data: draft_json(@draft) }
      end

      def create
        draft = current_user.project_drafts.new(draft_params)
        if draft.save
          render json: { data: draft_json(draft) }, status: :created
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
        render json: { message: "Brouillon supprime." }, status: :ok
      end

      def submit
        render json: { data: draft_json(@draft), message: "Brouillon pret pour soumission." }
      end

      private

      def set_draft
        @draft = current_user.project_drafts.find(params[:id])
      end

      def draft_params
        params.require(:project_draft).permit(:current_step, form_data: {})
      end

      def draft_json(draft)
        {
          id: draft.id,
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
