module Api
  module V1
    class InvestmentProjectsController < ApplicationController
      before_action :set_investment_project, only: [:show, :update, :destroy, :upload_images, :delete_image]

      def index
        projects = policy_scope(InvestmentProject).includes(:properties)
        projects = projects.where(status: params[:status]) if params[:status].present?
        if params[:search].present?
          q = "%#{params[:search]}%"
          projects = projects.where("investment_projects.title ILIKE :q OR investment_projects.description ILIKE :q", q: q)
        end
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
        property_ids = Array(params[:property_ids]).presence || (params[:property_id].present? ? [params[:property_id]] : nil)
        if property_ids.blank?
          return render json: { errors: ["Veuillez sélectionner au moins un bien"] }, status: :unprocessable_entity
        end

        props = Property.where(id: property_ids)
        if props.count != property_ids.size
          return render json: { errors: ["Un ou plusieurs biens sont introuvables"] }, status: :unprocessable_entity
        end

        props.each do |property|
          authorize property, :create_project?
          if property.investment_project.present?
            return render json: { errors: ["Le bien « #{property.title} » a déjà un projet d'investissement"] }, status: :unprocessable_entity
          end
        end

        share_price = (project_params[:share_price_cents].presence || 0).to_i
        if share_price <= 0
          return render json: { errors: ["Le prix par part doit être supérieur à 0"] }, status: :unprocessable_entity
        end

        @investment_project = InvestmentProject.new(project_params)
        @investment_project.owner = current_user
        @investment_project.management_fee_percent = (@investment_project.management_fee_percent || 0).to_d
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
          property_ids.each do |pid|
            InvestmentProjectProperty.create!(investment_project_id: @investment_project.id, property_id: pid)
          end
          props.each { |p| p.update!(status: :en_financement) if p.brouillon? }
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

      def upload_images
        authorize @investment_project

        if params[:images].present?
          params[:images].each do |image|
            @investment_project.additional_documents.attach(image)
          end
          render json: {
            message: "Images ajoutees avec succes",
            data: InvestmentProjectSerializer.new(@investment_project).serializable_hash[:data]
          }, status: :ok
        else
          render json: { error: "Aucune image fournie" }, status: :unprocessable_entity
        end
      end

      def delete_image
        authorize @investment_project

        image = @investment_project.additional_documents.find(params[:image_id])
        image.purge

        render json: {
          message: "Image supprimee avec succes",
          data: InvestmentProjectSerializer.new(@investment_project).serializable_hash[:data]
        }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Image introuvable" }, status: :not_found
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
          :status, :operation_type,
          # Finance fields
          :notary_fees_cents, :works_budget_cents, :financial_fees_cents,
          :equity_cents, :bank_loan_cents, :projected_revenue_cents, :projected_margin_cents,
          :bank_name, :bank_loan_status, :duration_months, :payment_frequency,
          # Guarantee fields
          :has_first_rank_mortgage, :has_share_pledge, :has_fiducie,
          :has_interest_escrow, :has_works_escrow, :has_personal_guarantee,
          :has_gfa, :has_open_banking, :risk_description,
          # Commercialization fields
          :pre_commercialization_percent, :exit_price_per_sqm_cents, :exit_scenario,
          :planned_acquisition_date, :planned_delivery_date, :planned_repayment_date,
          # File attachments
          :contrat_obligataire, :fici_document, :pv_decision, :note_operation,
          :price_grid, :block_buyer_loi, :sale_agreement, :projected_balance_sheet,
          additional_documents: []
        )
      end
    end
  end
end
