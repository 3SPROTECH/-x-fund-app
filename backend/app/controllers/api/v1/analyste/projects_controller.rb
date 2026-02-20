module Api
  module V1
    module Analyste
      class ProjectsController < ApplicationController
        before_action :require_analyste!
        before_action :set_project, only: [:show, :submit_opinion]

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
          render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }
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

          render json: {
            message: "Avis soumis avec succes.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
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
