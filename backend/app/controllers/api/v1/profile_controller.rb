module Api
  module V1
    class ProfileController < ApplicationController
      def show
        render json: { data: UserSerializer.new(current_user).serializable_hash[:data] }
      end

      def update
        if current_user.update(profile_params)
          render json: { data: UserSerializer.new(current_user).serializable_hash[:data] }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def profile_params
        params.require(:user).permit(
          :first_name, :last_name, :phone,
          :address_line1, :address_line2, :city, :postal_code, :country,
          :date_of_birth
        )
      end
    end
  end
end
