module Api
  module V1
    module Auth
      class RegistrationsController < Devise::RegistrationsController
        skip_before_action :authenticate_user!, only: [ :create ]
        respond_to :json

        private

        # Sign in without session storage (API-only app uses JWT)
        def sign_up(resource_name, resource)
          sign_in(resource_name, resource, store: false)
        end

        def sign_up_params
          params.require(:user).permit(
            :email, :password, :password_confirmation,
            :first_name, :last_name, :phone, :role
          )
        end

        def respond_with(resource, _opts = {})
          if resource.persisted?
            render json: {
              message: "Inscription reussie.",
              data: UserSerializer.new(resource).serializable_hash
            }, status: :created
          else
            render json: {
              errors: resource.errors.full_messages
            }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
