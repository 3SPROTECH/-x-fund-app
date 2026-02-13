Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # === Authentication (Devise + JWT) ===
      devise_for :users,
        path: "auth",
        path_names: {
          sign_in: "sign_in",
          sign_out: "sign_out",
          registration: "sign_up"
        },
        controllers: {
          sessions: "api/v1/auth/sessions",
          registrations: "api/v1/auth/registrations",
          passwords: "api/v1/auth/passwords"
        }

      # === User Profile & KYC ===
      resource :profile, only: [:show, :update], controller: "profile"
      resource :kyc, only: [:show, :create, :update], controller: "kyc"

      # === Properties ===
      resources :properties do
        resources :investment_projects, only: [:create], controller: "investment_projects"
        # Images management
        member do
          post :upload_photos
          delete 'delete_photo/:photo_id', action: :delete_photo, as: :delete_photo
        end
      end

      # === Investment Projects ===
      resources :investment_projects, only: [:index, :show, :create, :update, :destroy] do
        resources :investments, only: [:create], controller: "project_investments"
        resources :dividends, only: [:index, :show, :create, :update, :destroy] do
          member do
            post :distribute
          end
          resources :payments, only: [:index], controller: "dividend_payments"
        end
        resources :financial_statements, only: [:index, :show, :create, :update, :destroy]
        resources :mvp_reports, only: [:index, :show, :create, :update, :destroy] do
          member do
            patch :submit
          end
        end
        resources :investors, only: [:index], controller: "project_investors"
        # Images management for projects
        member do
          post :upload_images
          delete 'delete_image/:image_id', action: :delete_image, as: :delete_image
        end
      end

      # === Investments (user's own) ===
      resources :investments, only: [:index, :show]

      # === Wallet & Transactions ===
      resource :wallet, only: [:show], controller: "wallet" do
        post :deposit
        post :withdraw
        get :transactions
      end

      # === Dashboards ===
      resource :dashboard, only: [:show], controller: "investor_dashboard"
      resource :porteur_dashboard, only: [:show], controller: "porteur_dashboard"

      # === Admin ===
      namespace :admin do
        resources :users, only: [:index, :show, :update, :destroy] do
          member do
            patch :verify_kyc
            patch :reject_kyc
          end
        end

        resources :properties, only: [:index, :show, :create, :update, :destroy]

        resources :investment_projects, only: [:index, :show, :create, :update, :destroy] do
          member do
            patch :approve
            patch :reject
          end
          resources :mvp_reports, only: [:index, :show, :create, :update, :destroy] do
            member do
              patch :validate_report
              patch :reject_report
            end
          end
        end

        resources :investments, only: [:index, :show]
        resources :transactions, only: [:index, :show]

        resources :audit_logs, only: [:index, :show]

        resource :dashboard, only: [:show], controller: "dashboard"

        # Platform wallet
        resource :platform_wallet, only: [:show], controller: "platform_wallet"

        # Settings
        get "settings", to: "settings#index"
        patch "settings", to: "settings#update"

        # Data exports
        get "exports/users", to: "exports#users"
        get "exports/investments", to: "exports#investments"
        get "exports/transactions", to: "exports#transactions"
      end
    end
  end
end
