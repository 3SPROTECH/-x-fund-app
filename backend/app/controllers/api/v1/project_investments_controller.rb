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
          NotificationService.notify_project_owner!(project, actor: current_user, type: "new_investment", title: "Nouvel investissement", body: "#{current_user.full_name} a investi dans votre projet « #{project.title} ».")
          NotificationService.notify_admins!(actor: current_user, notifiable: project, type: "new_investment", title: "Nouvel investissement", body: "#{current_user.full_name} a investi dans le projet « #{project.title} ».")
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
