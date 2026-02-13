module Api
  module V1
    module Admin
      class MvpReportsController < ApplicationController
        before_action :require_admin!
        before_action :set_project
        before_action :set_report, only: [:show, :update, :destroy, :validate_report, :reject_report]

        def index
          reports = @project.mvp_reports.latest_first
          reports = reports.where(review_status: params[:review_status]) if params[:review_status].present?
          reports = paginate(reports)

          render json: {
            data: reports.map { |r| MvpReportSerializer.new(r).serializable_hash[:data] },
            meta: pagination_meta(reports)
          }
        end

        def show
          render json: { data: MvpReportSerializer.new(@report).serializable_hash[:data] }
        end

        def create
          @report = @project.mvp_reports.new(report_params)
          @report.author = current_user
          @report.review_status = :valide

          if @report.save
            render json: { data: MvpReportSerializer.new(@report).serializable_hash[:data] }, status: :created
          else
            render json: { errors: @report.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @report.update(report_params)
            render json: { data: MvpReportSerializer.new(@report).serializable_hash[:data] }
          else
            render json: { errors: @report.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @report.destroy!
          render json: { message: "Rapport supprime." }
        end

        # PATCH /admin/investment_projects/:id/mvp_reports/:report_id/validate_report
        def validate_report
          @report.update!(
            review_status: :valide,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          # Approve and publish the project
          project = @report.investment_project
          if project.review_en_attente? || project.review_rejete?
            project.update!(
              review_status: :approuve,
              reviewed_by_id: current_user.id,
              reviewed_at: Time.current,
              review_comment: "Rapport valide - projet approuve.",
              status: :ouvert
            )
          end

          render json: {
            message: "Rapport valide. Le projet a ete approuve et publie.",
            data: MvpReportSerializer.new(@report).serializable_hash[:data]
          }
        end

        # PATCH /admin/investment_projects/:id/mvp_reports/:report_id/reject_report
        def reject_report
          if params[:comment].blank?
            return render json: { error: "Un commentaire est requis pour le rejet." }, status: :unprocessable_entity
          end

          @report.update!(
            review_status: :rejete,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          render json: {
            message: "Rapport rejete.",
            data: MvpReportSerializer.new(@report).serializable_hash[:data]
          }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end

        def set_project
          @project = InvestmentProject.find(params[:investment_project_id])
        end

        def set_report
          @report = @project.mvp_reports.find(params[:id])
        end

        def report_params
          params.require(:mvp_report).permit(
            :operation_status, :expected_repayment_date, :summary,
            :purchase_price_previsionnel_cents, :purchase_price_realise_cents,
            :works_previsionnel_cents, :works_realise_cents,
            :total_cost_previsionnel_cents, :total_cost_realise_cents,
            :target_sale_price_previsionnel_cents, :target_sale_price_realise_cents,
            :best_offer_previsionnel_cents, :best_offer_realise_cents,
            :works_progress_percent, :budget_variance_percent,
            :sale_start_date, :visits_count, :offers_count, :listed_price_cents,
            :risk_identified, :risk_impact, :corrective_action,
            :estimated_compromise_date, :estimated_deed_date,
            :estimated_repayment_date, :exit_confirmed
          )
        end
      end
    end
  end
end
