module Api
  module V1
    class InvestorDashboardController < ApplicationController
      def show
        dashboard = Dashboards::InvestorDashboardService.new(current_user).call
        render json: { data: dashboard }
      end
    end
  end
end
