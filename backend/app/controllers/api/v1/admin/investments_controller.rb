module Api
  module V1
    module Admin
      class InvestmentsController < ApplicationController
        before_action :require_admin!

        def index
          investments = Investment.includes(:user, :investment_project).all
          investments = investments.where(status: params[:status]) if params[:status].present?
          investments = investments.where(investment_project_id: params[:project_id]) if params[:project_id].present?
          investments = investments.where(user_id: params[:user_id]) if params[:user_id].present?
          if params[:search].present?
            q = "%#{params[:search]}%"
            investments = investments.joins(:user, :investment_project)
              .where("users.first_name ILIKE :q OR users.last_name ILIKE :q OR users.email ILIKE :q OR investment_projects.title ILIKE :q", q: q)
          end
          investments = paginate(investments.order(created_at: :desc))

          render json: {
            data: investments.map { |i| AdminInvestmentSerializer.new(i).serializable_hash[:data] },
            meta: pagination_meta(investments)
          }
        end

        def show
          investment = Investment.find(params[:id])
          render json: { data: AdminInvestmentSerializer.new(investment).serializable_hash[:data] }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end
      end
    end
  end
end
