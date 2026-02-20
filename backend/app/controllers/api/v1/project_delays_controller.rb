module Api
  module V1
    class ProjectDelaysController < ApplicationController
      before_action :set_delay, only: [:show, :update, :destroy]

      # GET /investment_projects/:investment_project_id/project_delays
      # GET /project_delays (all delays for current user's projects)
      def index
        if params[:investment_project_id].present?
          project = current_user_projects.find(params[:investment_project_id])
          delays = project.project_delays.order(created_at: :desc)
        else
          delays = ProjectDelay.where(investment_project_id: current_user_projects.pluck(:id))
                               .order(created_at: :desc)
        end

        delays = delays.where(status: params[:status]) if params[:status].present?
        delays = delays.where(delay_type: params[:delay_type]) if params[:delay_type].present?
        delays = paginate(delays)

        render json: {
          data: delays.map { |d| ProjectDelaySerializer.new(d).serializable_hash[:data] },
          meta: pagination_meta(delays)
        }
      end

      # GET /project_delays/:id
      def show
        render json: { data: ProjectDelaySerializer.new(@delay).serializable_hash[:data] }
      end

      # POST /investment_projects/:investment_project_id/project_delays
      def create
        project = current_user_projects.find(params[:investment_project_id])

        @delay = project.project_delays.new(delay_params)
        @delay.user = current_user

        if params[:supporting_documents].present?
          params[:supporting_documents].each { |doc| @delay.supporting_documents.attach(doc) }
        end

        if @delay.save
          render json: { data: ProjectDelaySerializer.new(@delay).serializable_hash[:data] }, status: :created
        else
          render json: { errors: @delay.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /project_delays/:id
      def update
        unless @delay.declared?
          return render json: { error: "Seuls les retards declares peuvent etre modifies." }, status: :forbidden
        end

        if params[:supporting_documents].present?
          params[:supporting_documents].each { |doc| @delay.supporting_documents.attach(doc) }
        end

        if @delay.update(delay_params)
          render json: { data: ProjectDelaySerializer.new(@delay).serializable_hash[:data] }
        else
          render json: { errors: @delay.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /project_delays/:id
      def destroy
        unless @delay.declared?
          return render json: { error: "Seuls les retards declares peuvent etre supprimes." }, status: :forbidden
        end

        @delay.destroy!
        render json: { message: "Retard supprime." }
      end

      private

      def current_user_projects
        InvestmentProject.where(owner_id: current_user.id)
      end

      def set_delay
        @delay = ProjectDelay.joins(:investment_project)
                             .where(investment_projects: { owner_id: current_user.id })
                             .find(params[:id])
      end

      def delay_params
        params.require(:project_delay).permit(
          :title, :description, :justification, :delay_type,
          :original_date, :new_estimated_date, :status
        )
      end
    end
  end
end
