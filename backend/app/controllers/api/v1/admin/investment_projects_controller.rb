module Api
  module V1
    module Admin
      class InvestmentProjectsController < ApplicationController
        before_action :require_admin!
        before_action :set_project, only: [:show, :update, :destroy, :approve, :reject]

        def index
          projects = InvestmentProject.includes(properties: :owner).all
          projects = projects.where(status: params[:status]) if params[:status].present?
          projects = projects.where(review_status: params[:review_status]) if params[:review_status].present?
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
          render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }
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
            if property.investment_project.present?
              return render json: { errors: ["Le bien « #{property.title} » a déjà un projet"] }, status: :unprocessable_entity
            end
          end

          @project = InvestmentProject.new(admin_project_params)
          if admin_project_params[:total_shares].to_i.positive?
            @project.total_shares = admin_project_params[:total_shares].to_i
            @project.total_amount_cents = @project.total_shares * @project.share_price_cents
          else
            @project.total_shares = @project.total_amount_cents / @project.share_price_cents
          end

          if @project.save
            property_ids.each { |pid| InvestmentProjectProperty.create!(investment_project_id: @project.id, property_id: pid) }
            props.each { |p| p.update!(status: :en_financement) if p.brouillon? }
            render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }, status: :created
          else
            render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @project.update(admin_project_params)
            render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }
          else
            render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @project.destroy!
          render json: { message: "Projet d'investissement supprime." }
        end

        def approve
          @project.update!(
            review_status: :approuve,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment],
            status: :ouvert
          )
          render json: {
            message: "Projet approuve avec succes.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        def reject
          @project.update!(
            review_status: :rejete,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )
          render json: {
            message: "Projet rejete.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end

        def set_project
          @project = InvestmentProject.find(params[:id])
        end

        def admin_project_params
          params.require(:investment_project).permit(
            :title, :description, :status, :operation_type, :total_amount_cents, :share_price_cents,
            :total_shares, :min_investment_cents, :max_investment_cents,
            :funding_start_date, :funding_end_date, :management_fee_percent,
            :gross_yield_percent, :net_yield_percent,
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
end
