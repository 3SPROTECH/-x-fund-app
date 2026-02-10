module Api
  module V1
    class ProjectInvestmentsController < ApplicationController
      def create
        project = InvestmentProject.find(params[:investment_project_id])
        authorize project, :invest?

        result = Investments::CreateInvestmentService.new(
          user: current_user,
          investment_project: project,
          amount_cents: investment_params[:amount_cents].to_i
        ).call

        if result.success?
          render json: { data: InvestmentSerializer.new(result.investment).serializable_hash[:data] }, status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      private

      def investment_params
        params.require(:investment).permit(:amount_cents)
      end
    end
  end
end
