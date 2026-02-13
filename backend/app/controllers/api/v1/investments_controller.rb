module Api
  module V1
    class InvestmentsController < ApplicationController
      def index
        investments = policy_scope(Investment).includes(:investment_project)
        investments = investments.where(status: params[:status]) if params[:status].present?
        if params[:search].present?
          q = "%#{params[:search]}%"
          investments = investments.joins(:investment_project).where("investment_projects.title ILIKE :q", q: q)
        end
        investments = paginate(investments.order(created_at: :desc))

        render json: {
          data: investments.map { |i| InvestmentSerializer.new(i).serializable_hash[:data] },
          meta: pagination_meta(investments)
        }
      end

      def show
        investment = Investment.find(params[:id])
        authorize investment

        render json: { data: InvestmentSerializer.new(investment).serializable_hash[:data] }
      end
    end
  end
end
