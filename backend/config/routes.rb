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

      # === Company (operator info) ===
      resource :company, only: [:show], controller: "companies" do
        put :create_or_update, on: :collection, path: "/"
      end

      # === Properties ===
      resources :properties do
        resources :investment_projects, only: [:create], controller: "investment_projects"
        # Images management
        member do
          post :upload_photos
          delete 'delete_photo/:photo_id', action: :delete_photo, as: :delete_photo
        end
      end

      # === Project Drafts ===
      resources :project_drafts, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :submit
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
        resources :project_delays, only: [:index, :create]
        resources :investors, only: [:index], controller: "project_investors"
        # Images management for projects
        member do
          post :upload_images
          delete 'delete_image/:image_id', action: :delete_image, as: :delete_image
          get :analyst_report
        end
      end

      # === Project Delays (standalone for show/update/destroy + global index) ===
      resources :project_delays, only: [:index, :show, :update, :destroy]

      # === MVP Reports (global index for porteur) ===
      get :mvp_reports, to: "mvp_reports#global_index"

      # === Notifications ===
      resources :notifications, only: [:index, :destroy] do
        collection do
          get :unread_count
          patch :mark_all_as_read
          delete :destroy_all
        end
        member do
          patch :mark_as_read
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

      # === Platform Config (authenticated users) ===
      resource :platform_config, only: [:show], controller: "platform_config"

      # === Dashboards ===
      resource :dashboard, only: [:show], controller: "investor_dashboard"
      resource :porteur_dashboard, only: [:show], controller: "porteur_dashboard"

      # === Demo (temporary analyst feature) ===
      namespace :demo do
        resources :analyst_projects, only: [:index, :show], controller: 'analyst', path: 'analyst/projects' do
          member do
            post :request_info
            patch :approve
            patch :reject
          end
        end
        # Porteur info request endpoints
        scope 'porteur/projects/:project_id' do
          resource :info_request, only: [:show], controller: 'porteur_info' do
            patch :submit
          end
        end
      end

      # === Analyste ===
      namespace :analyste do
        resources :projects, only: [:index, :show], controller: "projects" do
          member do
            patch :submit_opinion
            post :request_info
            patch :approve
            patch :reject
            post :generate_report
            get :report
          end
        end

        # KYC verification by analyst
        resources :kyc, only: [:index, :show], controller: "kyc" do
          member do
            patch :verify
            patch :reject
          end
        end
      end

      # === Porteur info requests ===
      scope 'porteur/projects/:project_id' do
        resource :info_request, only: [:show], controller: 'porteur_info' do
          patch :submit
        end
      end

      # === Yousign Webhooks ===
      post "yousign_webhooks", to: "yousign_webhooks#create"

      # === Admin ===
      namespace :admin do
        resources :users, only: [:index, :show, :create, :update, :destroy] do
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
            patch :request_info
            patch :advance_status
            patch :assign_analyst
            get :report
            post :send_contract
            post :check_signature_status
          end
          resources :mvp_reports, only: [:index, :show] do
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
