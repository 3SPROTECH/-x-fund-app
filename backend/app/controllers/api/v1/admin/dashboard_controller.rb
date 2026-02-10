module Api
  module V1
    module Admin
      class DashboardController < ApplicationController
        before_action :require_admin!

        def show
          dashboard = Dashboards::AdminDashboardService.new.call
          render json: { data: dashboard }
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
