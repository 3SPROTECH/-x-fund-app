module Api
  module V1
    module Analyste
      class ProjectsController < ApplicationController
        before_action :require_analyste!
        before_action :set_project, only: [:show, :submit_opinion, :request_info, :approve, :reject, :generate_report, :report]

        def index
          projects = InvestmentProject.where(analyst_id: current_user.id)
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
          render json: {
            data: InvestmentProjectSerializer.new(@project, params: { include_snapshot: true }).serializable_hash[:data],
            info_requests: @project.info_requests.order(created_at: :desc).map { |ir|
              InfoRequestSerializer.new(ir).serializable_hash[:data]
            }
          }
        end

        def submit_opinion
          opinion = params[:opinion]
          unless InvestmentProject.analyst_opinions.key?(opinion)
            return render json: { errors: ["Avis invalide: #{opinion}"] }, status: :unprocessable_entity
          end

          if opinion != "opinion_pending" && params[:comment].blank?
            return render json: { errors: ["Le commentaire est obligatoire"] }, status: :unprocessable_entity
          end

          @project.update!(
            analyst_opinion: opinion,
            analyst_comment: params[:comment],
            analyst_legal_check: params[:legal_check] || false,
            analyst_financial_check: params[:financial_check] || false,
            analyst_risk_check: params[:risk_check] || false,
            analyst_reviewed_at: Time.current
          )

          NotificationService.notify_admins!(actor: current_user, notifiable: @project, type: "analyst_opinion_submitted", title: "Avis analyste soumis", body: "L'analyste #{current_user.full_name} a soumis un avis sur le projet « #{@project.title} ».")
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "analyst_opinion_submitted", title: "Avis analyste soumis", body: "L'analyste a soumis un avis sur votre projet « #{@project.title} ».")

          render json: {
            message: "Avis soumis avec succes.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
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
              analyst_reviewed_at: Time.current,
              reviewed_by_id: current_user.id,
              reviewed_at: Time.current,
              review_comment: params[:comment]
            )
            NotificationService.notify_project_owner!(@project, actor: current_user, type: "analyst_info_requested", title: "Complements demandes", body: "L'analyste a demande des complements d'information pour votre projet « #{@project.title} ».")

            render json: {
              message: "Demande de compléments envoyée.",
              data: InfoRequestSerializer.new(info_request).serializable_hash[:data]
            }, status: :created
          else
            render json: { errors: info_request.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/analyste/projects/:id/approve
        def approve
          @project.update!(
            status: :analyst_approved,
            analyst_opinion: :opinion_approved,
            analyst_comment: params[:comment].presence || @project.analyst_comment,
            analyst_legal_check: params[:legal_check].nil? ? @project.analyst_legal_check : params[:legal_check],
            analyst_financial_check: params[:financial_check].nil? ? @project.analyst_financial_check : params[:financial_check],
            analyst_risk_check: params[:risk_check].nil? ? @project.analyst_risk_check : params[:risk_check],
            analyst_reviewed_at: Time.current,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          # Mark any submitted info requests as reviewed
          @project.info_requests.where(status: :submitted).update_all(status: :reviewed)
          NotificationService.notify_admins!(actor: current_user, notifiable: @project, type: "analyst_opinion_submitted", title: "Projet pre-approuve", body: "L'analyste #{current_user.full_name} a pre-approuve le projet « #{@project.title} ».")
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "project_approved", title: "Projet pre-approuve", body: "Votre projet « #{@project.title} » a ete pre-approuve par l'analyste.")

          render json: {
            message: "Projet pré-approuvé par l'analyste.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        # PATCH /api/v1/analyste/projects/:id/reject
        def reject
          if params[:comment].blank?
            return render json: { errors: ["Le commentaire est obligatoire pour un refus."] }, status: :unprocessable_entity
          end

          @project.update!(
            status: :rejected,
            analyst_opinion: :opinion_rejected,
            analyst_comment: params[:comment],
            analyst_legal_check: params[:legal_check].nil? ? @project.analyst_legal_check : params[:legal_check],
            analyst_financial_check: params[:financial_check].nil? ? @project.analyst_financial_check : params[:financial_check],
            analyst_risk_check: params[:risk_check].nil? ? @project.analyst_risk_check : params[:risk_check],
            analyst_reviewed_at: Time.current,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          NotificationService.notify_admins!(actor: current_user, notifiable: @project, type: "analyst_opinion_submitted", title: "Projet rejete par analyste", body: "L'analyste #{current_user.full_name} a rejete le projet « #{@project.title} ».")
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "project_rejected", title: "Projet rejete", body: "Votre projet « #{@project.title} » a ete rejete par l'analyste.#{params[:comment].present? ? " Motif : #{params[:comment]}" : ''}")

          render json: {
            message: "Projet rejeté.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        # POST /api/v1/analyste/projects/:id/generate_report
        def generate_report
          checks = {
            legal_check: params[:legal_check] || false,
            financial_check: params[:financial_check] || false,
            risk_check: params[:risk_check] || false
          }

          generator = AnalystReportGenerator.new(@project, current_user, checks: checks)
          result = generator.generate

          report = @project.analyst_reports.create!(
            analyst: current_user,
            report_data: result[:report_data],
            risk_score: result[:risk_score],
            success_score: result[:success_score],
            financial_metrics: result[:financial_metrics],
            risk_factors: result[:risk_factors],
            recommendation: result[:recommendation],
            comment: params[:comment]
          )

          # Pre-approve the project
          @project.update!(
            status: :analyst_approved,
            analyst_opinion: :opinion_approved,
            analyst_comment: params[:comment].presence || @project.analyst_comment,
            analyst_legal_check: checks[:legal_check],
            analyst_financial_check: checks[:financial_check],
            analyst_risk_check: checks[:risk_check],
            analyst_reviewed_at: Time.current,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          @project.info_requests.where(status: :submitted).update_all(status: :reviewed)
          NotificationService.notify_admins!(actor: current_user, notifiable: @project, type: "analyst_opinion_submitted", title: "Rapport analyste genere", body: "L'analyste #{current_user.full_name} a genere un rapport et pre-approuve le projet « #{@project.title} ».")
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "project_approved", title: "Projet pre-approuve", body: "Votre projet « #{@project.title} » a ete pre-approuve suite a l'analyse.")

          render json: {
            message: "Rapport généré et projet pré-approuvé.",
            data: InvestmentProjectSerializer.new(@project.reload).serializable_hash[:data],
            report: AnalystReportSerializer.new(report).serializable_hash[:data]
          }, status: :created
        end

        # GET /api/v1/analyste/projects/:id/report
        def report
          report = @project.analyst_reports.order(created_at: :desc).first
          unless report
            return render json: { error: "Aucun rapport trouvé." }, status: :not_found
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
          {
            total: projects.count,
            pending: projects.where(analyst_opinion: :opinion_pending).count,
            approved: projects.where(analyst_opinion: :opinion_approved).count,
            info_requested: projects.where(analyst_opinion: :opinion_info_requested).count,
            rejected: projects.where(analyst_opinion: :opinion_rejected).count
          }
        end
      end
    end
  end
end
