module Api
  module V1
    module Admin
      class ExportsController < ApplicationController
        before_action :require_admin!

        def users
          format = params[:format] || "json"
          data = Exports::DataExportService.new.export_users(format: format)

          if format == "csv"
            send_data data, filename: "users_#{Date.current}.csv", type: "text/csv"
          else
            render json: data
          end
        end

        def investments
          format = params[:format] || "json"
          data = Exports::DataExportService.new.export_investments(format: format)

          if format == "csv"
            send_data data, filename: "investments_#{Date.current}.csv", type: "text/csv"
          else
            render json: data
          end
        end

        def transactions
          format = params[:format] || "json"
          data = Exports::DataExportService.new.export_transactions(format: format)

          if format == "csv"
            send_data data, filename: "transactions_#{Date.current}.csv", type: "text/csv"
          else
            render json: data
          end
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
