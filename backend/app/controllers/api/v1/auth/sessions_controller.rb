module Api
  module V1
    module Auth
      class SessionsController < Devise::SessionsController
        skip_before_action :authenticate_user!, only: [ :create ]
        respond_to :json

        def create
          user = User.find_for_database_authentication(email: sign_in_params[:email])
          if user&.valid_password?(sign_in_params[:password])
            sign_in(resource_name, user, store: false)
            render json: {
              message: "Connexion reussie.",
              data: UserSerializer.new(user).serializable_hash
            }, status: :ok
          else
            render json: { error: "Email ou mot de passe incorrect." }, status: :unauthorized
          end
        end

        private

        def sign_in_params
          params.require(:user).permit(:email, :password)
        end

        def respond_to_on_destroy
          if current_user
            render json: { message: "Deconnexion reussie." }, status: :ok
          else
            render json: { error: "Session introuvable." }, status: :unauthorized
          end
        end
      end
    end
  end
end
