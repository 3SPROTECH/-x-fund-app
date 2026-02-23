module Api
  module V1
    class MvpReportsController < ApplicationController
      before_action :set_project, except: [:global_index]
      before_action :authorize_owner!, except: [:global_index]
      before_action :set_report, only: [:show, :update, :destroy, :submit]

      # GET /mvp_reports — all reports across porteur's projects
      def global_index
        project_ids = InvestmentProject.where(owner_id: current_user.id).pluck(:id)
        reports = MvpReport.where(investment_project_id: project_ids).latest_first
        reports = reports.where(review_status: params[:review_status]) if params[:review_status].present?
        reports = reports.where(investment_project_id: params[:project_id]) if params[:project_id].present?
        reports = paginate(reports)

        render json: {
          data: reports.map { |r| MvpReportSerializer.new(r).serializable_hash[:data] },
          meta: pagination_meta(reports)
        }
      end

      # GET /investment_projects/:id/mvp_reports — reports for a specific project
      def index
        reports = @project.mvp_reports.where(author: current_user).latest_first
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
        @report.review_status = :brouillon

        if @report.save
          render json: { data: MvpReportSerializer.new(@report).serializable_hash[:data] }, status: :created
        else
          render json: { errors: @report.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        unless @report.review_brouillon? || @report.review_rejete?
          return render json: { error: "Vous ne pouvez modifier qu'un rapport en brouillon ou rejete." }, status: :forbidden
        end

        if @report.update(report_params)
          # Reset to brouillon if it was rejected and now edited
          @report.update!(review_status: :brouillon) if @report.review_rejete?
          render json: { data: MvpReportSerializer.new(@report).serializable_hash[:data] }
        else
          render json: { errors: @report.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        unless @report.review_brouillon?
          return render json: { error: "Vous ne pouvez supprimer qu'un rapport en brouillon." }, status: :forbidden
        end

        @report.destroy!
        render json: { message: "Rapport  supprime." }
      end

      # POST /investment_projects/:id/mvp_reports/:report_id/submit
      def submit
        unless @report.review_brouillon?
          return render json: { error: "Ce rapport a deja ete soumis." }, status: :unprocessable_entity
        end

        @report.update!(review_status: :soumis)
        NotificationService.notify_admins!(actor: current_user, notifiable: @report, type: "report_submitted", title: "Rapport soumis", body: "#{current_user.full_name} a soumis un rapport de suivi pour le projet « #{@project.title} ».")
        render json: {
          message: "Rapport soumis pour validation.",
          data: MvpReportSerializer.new(@report).serializable_hash[:data]
        }
      end

      private

      def set_project
        @project = InvestmentProject.find(params[:investment_project_id])
      end

      def authorize_owner!
        unless current_user.administrateur? || @project.owner_id == current_user.id
          render json: { error: "Acces non autorise." }, status: :forbidden
        end
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
