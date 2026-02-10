module Api
  module V1
    class PorteurDashboardController < ApplicationController
      before_action :require_porteur!

      def show
        dashboard = Dashboards::PorteurDashboardService.new(current_user).call
        render json: { data: dashboard }
      end

      private

      def require_porteur!
        unless current_user.porteur_de_projet?
          render json: { error: "Acces reserve aux porteurs de projet." }, status: :forbidden
        end
      end
    end
  end
end
