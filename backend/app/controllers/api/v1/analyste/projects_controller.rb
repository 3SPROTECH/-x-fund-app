module Api
  module V1
    module Analyste
      class ProjectsController < ApplicationController
        before_action :require_analyste!
        before_action :set_project, only: [:show, :request_info, :submit_analysis, :report, :download_response_file]

        def index
          projects = InvestmentProject.where(analyst_id: current_user.id)
                                      .where(status: [:pending_analysis, :info_requested, :info_resubmitted, :analysis_submitted])
          projects = projects.where(analyst_opinion: params[:opinion]) if params[:opinion].present?
          if params[:search].present?
            q = "%#{params[:search]}%"
            projects = projects.where("investment_projects.title ILIKE :q OR investment_projects.description ILIKE :q", q: q)
          end
          projects = paginate(projects.includes(properties: :owner).order(created_at: :desc))

          render json: {
            data: projects.map { |p| InvestmentProjectSerializer.new(p).serializable_hash[:data] },
            meta: pagination_meta(projects).merge(stats: analyst_stats)
          }
        end

        def show
          redo_logs = AuditLog.where(auditable: @project, action: "request_redo")
                              .order(created_at: :desc)
                              .map { |log| { comment: log.changes_data["comment"], admin_name: log.user&.full_name, created_at: log.created_at } }

          render json: {
            data: InvestmentProjectSerializer.new(@project, params: { include_snapshot: true }).serializable_hash[:data],
            info_requests: @project.info_requests.order(created_at: :desc).map { |ir|
              InfoRequestSerializer.new(ir).serializable_hash[:data]
            },
            redo_history: redo_logs
          }
        end

        # POST /api/v1/analyste/projects/:id/request_info
        def request_info
          fields = params[:fields]
          unless fields.is_a?(Array) && fields.present?
            return render json: { errors: ["Au moins un champ est requis."] }, status: :unprocessable_entity
          end

          info_request = @project.info_requests.build(
            requested_by: current_user,
            fields: fields,
            status: :pending
          )

          if info_request.save
            @project.update!(
              status: :info_requested,
              analyst_opinion: :opinion_info_requested,
              analyst_comment: params[:comment],
              analyst_reviewed_at: Time.current
            )
            NotificationService.notify_project_owner!(@project, actor: current_user, type: "analyst_info_requested", title: "Complements demandes", body: "L'analyste a demande des complements d'information pour votre projet « #{@project.title} ».")

            render json: {
              message: "Demande de complements envoyee.",
              data: InfoRequestSerializer.new(info_request).serializable_hash[:data]
            }, status: :created
          else
            render json: { errors: info_request.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/analyste/projects/:id/submit_analysis
        def submit_analysis
          unless @project.pending_analysis? || @project.info_resubmitted?
            return render json: { errors: ["Le projet n'est pas en attente d'analyse."] }, status: :unprocessable_entity
          end

          analysis_data = params[:analysis_data]
          unless analysis_data.present?
            return render json: { errors: ["Les donnees d'analyse sont requises."] }, status: :unprocessable_entity
          end

          checks = {
            legal_check: params[:legal_check] || false,
            financial_check: params[:financial_check] || false,
            risk_check: params[:risk_check] || false
          }

          # Generate the analyst report
          generator = AnalystReportGenerator.new(@project, current_user, checks: checks)
          result = generator.generate

          report = @project.analyst_reports.create!(
            analyst: current_user,
            report_data: result[:report_data].merge(analysis: analysis_data.to_unsafe_h),
            risk_score: result[:risk_score],
            success_score: result[:success_score],
            financial_metrics: result[:financial_metrics],
            risk_factors: result[:risk_factors],
            recommendation: result[:recommendation],
            comment: params[:comment]
          )

          # Mark analysis as submitted — admin will decide on approval
          @project.update!(
            status: :analysis_submitted,
            analyst_opinion: :opinion_submitted,
            analyst_comment: params[:comment],
            analyst_legal_check: checks[:legal_check],
            analyst_financial_check: checks[:financial_check],
            analyst_risk_check: checks[:risk_check],
            analyst_reviewed_at: Time.current
          )

          @project.info_requests.where(status: :submitted).update_all(status: :reviewed)
          @project.analysis_drafts.destroy_all

          NotificationService.notify_admins!(
            actor: current_user,
            notifiable: @project,
            type: "analysis_submitted",
            title: "Analyse soumise",
            body: "L'analyste #{current_user.full_name} a soumis son analyse pour le projet « #{@project.title} »."
          )

          render json: {
            message: "Analyse soumise avec succes.",
            data: InvestmentProjectSerializer.new(@project.reload).serializable_hash[:data],
            report: AnalystReportSerializer.new(report).serializable_hash[:data]
          }, status: :created
        end

        # GET /api/v1/analyste/projects/:id/info_requests/:info_request_id/file/:field_index
        def download_response_file
          ir = @project.info_requests.find(params[:info_request_id])
          prefix = "field_#{params[:field_index]}_"
          attachment = ir.response_files.find { |f| f.filename.to_s.start_with?(prefix) }

          unless attachment
            return render json: { error: "Fichier non trouve." }, status: :not_found
          end

          redirect_to rails_blob_url(attachment, disposition: "attachment"), allow_other_host: true
        end

        # GET /api/v1/analyste/projects/:id/report
        def report
          report = @project.analyst_reports.order(created_at: :desc).first
          unless report
            return render json: { error: "Aucun rapport trouve." }, status: :not_found
          end

          render json: {
            report: AnalystReportSerializer.new(report).serializable_hash[:data]
          }
        end

        private

        def require_analyste!
          unless current_user.analyste?
            render json: { error: "Acces reserve aux analystes." }, status: :forbidden
          end
        end

        def set_project
          @project = InvestmentProject.where(analyst_id: current_user.id).find(params[:id])
        end

        def analyst_stats
          projects = InvestmentProject.where(analyst_id: current_user.id)
                                      .where(status: [:pending_analysis, :info_requested, :info_resubmitted, :analysis_submitted])
          {
            total: projects.count,
            pending: projects.where(analyst_opinion: :opinion_pending).count,
            submitted: projects.where(analyst_opinion: :opinion_submitted).count,
            info_requested: projects.where(analyst_opinion: :opinion_info_requested).count
          }
        end
      end
    end
  end
end
