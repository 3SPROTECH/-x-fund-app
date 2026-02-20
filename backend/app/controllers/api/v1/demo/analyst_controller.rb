module Api
  module V1
    module Demo
      class AnalystController < ApplicationController
        before_action :require_admin!
        before_action :set_project, only: [:show, :request_info, :approve, :reject]

        # GET /api/v1/demo/analyst/projects
        def index
          projects = InvestmentProject
            .includes(:owner, :properties, :info_requests)
            .where(status: [:pending_analysis, :info_requested, :info_resubmitted, :analyst_approved, :rejected])

          projects = projects.where(status: params[:status]) if params[:status].present?

          if params[:search].present?
            q = "%#{params[:search]}%"
            projects = projects.where("investment_projects.title ILIKE :q OR investment_projects.description ILIKE :q", q: q)
          end

          projects = projects.order(updated_at: :desc)

          # Summary metrics
          all_review = InvestmentProject.where(status: [:pending_analysis, :info_requested, :info_resubmitted, :analyst_approved, :rejected])
          metrics = {
            pending_analysis: all_review.where(status: :pending_analysis).count,
            info_requested: all_review.where(status: :info_requested).count,
            info_resubmitted: all_review.where(status: :info_resubmitted).count,
            analyst_approved: all_review.where(status: :analyst_approved).count,
            rejected: all_review.where(status: :rejected).count,
            total: all_review.count
          }

          render json: {
            data: projects.map { |p| serialize_project(p) },
            metrics: metrics
          }
        end

        # GET /api/v1/demo/analyst/projects/:id
        def show
          render json: {
            data: InvestmentProjectSerializer.new(@project, params: { include_snapshot: true }).serializable_hash[:data],
            info_requests: @project.info_requests.order(created_at: :desc).map { |ir|
              InfoRequestSerializer.new(ir).serializable_hash[:data]
            }
          }
        end

        # POST /api/v1/demo/analyst/projects/:id/request_info
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
              reviewed_by_id: current_user.id,
              reviewed_at: Time.current,
              review_comment: params[:comment]
            )

            render json: {
              message: "Demande de compléments envoyée.",
              data: InfoRequestSerializer.new(info_request).serializable_hash[:data]
            }, status: :created
          else
            render json: { errors: info_request.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/demo/analyst/projects/:id/approve
        def approve
          @project.update!(
            status: :analyst_approved,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          # Mark any pending info requests as reviewed
          @project.info_requests.where(status: :submitted).update_all(status: :reviewed)

          render json: {
            message: "Projet pré-approuvé par l'analyste.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        # PATCH /api/v1/demo/analyst/projects/:id/reject
        def reject
          @project.update!(
            status: :rejected,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )

          render json: {
            message: "Projet rejeté.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Accès réservé aux analystes." }, status: :forbidden
          end
        end

        def set_project
          @project = InvestmentProject.find(params[:id])
        end

        def serialize_project(project)
          {
            id: project.id,
            type: "investment_project",
            attributes: {
              title: project.title,
              description: project.description,
              status: project.status,
              operation_type: project.operation_type,
              total_amount_cents: project.total_amount_cents,
              gross_yield_percent: project.gross_yield_percent,
              net_yield_percent: project.net_yield_percent,
              duration_months: project.duration_months,
              owner_name: project.owner&.full_name,
              property_city: project.primary_property&.city,
              created_at: project.created_at,
              updated_at: project.updated_at,
              review_comment: project.review_comment,
              reviewed_at: project.reviewed_at,
              has_info_requests: project.info_requests.any?,
              latest_info_request_status: project.info_requests.order(created_at: :desc).first&.status
            }
          }
        end
      end
    end
  end
end
