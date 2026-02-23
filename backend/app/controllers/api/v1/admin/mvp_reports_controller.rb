module Api
  module V1
    module Admin
      class MvpReportsController < ApplicationController
        before_action :require_admin!
        before_action :set_project
        before_action :set_report, only: [:show, :validate_report, :reject_report]

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

        # PATCH /admin/investment_projects/:id/mvp_reports/:report_id/validate_report
        def validate_report
          @report.update!(
            review_status: :valide,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )
          log_admin_action("validate_report", @report, { project_title: @report.investment_project.title })
          NotificationService.notify_project_owner!(@report.investment_project, actor: current_user, type: "report_validated", title: "Rapport valide", body: "Votre rapport de suivi pour le projet « #{@report.investment_project.title} » a ete valide.")

          # Approve the project if still pending
          project = @report.investment_project
          if project.pending_analysis? || project.info_requested?
            project.update!(
              reviewed_by_id: current_user.id,
              reviewed_at: Time.current,
              review_comment: "Rapport valide - projet approuve.",
              status: :approved
            )
            log_admin_action("approve_project", project, { via: "report_validation" })
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
          log_admin_action("reject_report", @report, { project_title: @report.investment_project.title, comment: params[:comment] })
          NotificationService.notify_project_owner!(@report.investment_project, actor: current_user, type: "report_rejected", title: "Rapport rejete", body: "Votre rapport de suivi pour le projet « #{@report.investment_project.title} » a ete rejete.#{params[:comment].present? ? " Motif : #{params[:comment]}" : ''}")

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

        def log_admin_action(action, resource, data = {})
          AuditLog.create!(
            user: current_user,
            auditable: resource,
            action: action,
            changes_data: data,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )
        rescue => e
          Rails.logger.error("Admin audit log failed: #{e.message}")
        end

        def set_project
          @project = InvestmentProject.find(params[:investment_project_id])
        end

        def set_report
          @report = @project.mvp_reports.find(params[:id])
        end
      end
    end
  end
end
