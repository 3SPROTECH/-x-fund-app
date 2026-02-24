module Api
  module V1
    class PlatformConfigController < ApplicationController
      def show
        render json: {
          data: {
            default_share_price_cents: Setting.get("default_share_price_cents") || 10000
          }
        }
      end
    end
  end
end
