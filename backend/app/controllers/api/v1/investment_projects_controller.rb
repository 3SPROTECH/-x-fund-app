module Api
  module V1
    class InvestmentProjectsController < ApplicationController
      before_action :set_investment_project, only: [:show, :update, :destroy]

      def index
        projects = policy_scope(InvestmentProject).includes(:property)
        projects = projects.where(status: params[:status]) if params[:status].present?
        projects = paginate(projects.order(created_at: :desc))

        render json: {
          data: projects.map { |p| InvestmentProjectSerializer.new(p).serializable_hash[:data] },
          meta: pagination_meta(projects)
        }
      end

      def show
        authorize @investment_project
        render json: { data: InvestmentProjectSerializer.new(@investment_project).serializable_hash[:data] }
      end

      def create
        property = Property.find(params[:property_id])
        authorize property, :create_project?

        if property.investment_project.present?
          return render json: { errors: ["Ce bien a déjà un projet d'investissement"] }, status: :unprocessable_entity
        end

        share_price = (project_params[:share_price_cents].presence || 0).to_i
        if share_price <= 0
          return render json: { errors: ["Le prix par part doit être supérieur à 0"] }, status: :unprocessable_entity
        end

        @investment_project = property.build_investment_project(project_params)
        @investment_project.management_fee_percent = (@investment_project.management_fee_percent || 0).to_d
        # Définition des parts : soit total_shares fourni, soit dérivé de total_amount / share_price
        if project_params[:total_shares].to_i.positive?
          @investment_project.total_shares = project_params[:total_shares].to_i
          @investment_project.share_price_cents = share_price
          @investment_project.total_amount_cents = @investment_project.total_shares * share_price
        else
          total_cents = (@investment_project.total_amount_cents || 0).to_i
          if total_cents <= 0
            return render json: { errors: ["Renseignez le montant total à lever ou le nombre de parts"] }, status: :unprocessable_entity
          end
          @investment_project.total_amount_cents = total_cents
          @investment_project.share_price_cents = share_price
          @investment_project.total_shares = total_cents / share_price
          if @investment_project.total_shares <= 0
            return render json: { errors: ["Le montant total doit être au moins égal au prix par part"] }, status: :unprocessable_entity
          end
        end

        if @investment_project.save
          property.update!(status: :en_financement) if property.brouillon?
          render json: { data: InvestmentProjectSerializer.new(@investment_project).serializable_hash[:data] }, status: :created
        else
          render json: { errors: @investment_project.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @investment_project

        if @investment_project.update(project_params)
          render json: { data: InvestmentProjectSerializer.new(@investment_project).serializable_hash[:data] }
        else
          render json: { errors: @investment_project.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @investment_project
        @investment_project.destroy!
        render json: { message: "Projet d'investissement supprime." }, status: :ok
      end

      private

      def set_investment_project
        @investment_project = InvestmentProject.find(params[:id])
      end

      def project_params
        params.require(:investment_project).permit(
          :title, :description, :total_amount_cents, :share_price_cents, :total_shares,
          :min_investment_cents, :max_investment_cents,
          :funding_start_date, :funding_end_date,
          :management_fee_percent, :gross_yield_percent, :net_yield_percent,
          :status, :contrat_obligataire, :fici_document, :pv_decision, :note_operation,
          additional_documents: []
        )
      end
    end
  end
end
