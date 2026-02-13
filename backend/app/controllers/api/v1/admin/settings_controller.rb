module Api
  module V1
    module Admin
      class SettingsController < ApplicationController
        before_action :require_admin!

        def index
          settings = Setting.all.order(:category, :key)

          grouped = settings.group_by(&:category).transform_values do |items|
            items.map { |s| serialize_setting(s) }
          end

          render json: { data: grouped }
        end

        def update
          updated = []

          settings_params.each do |setting_param|
            setting = Setting.find_by!(key: setting_param[:key])
            setting.update!(value: setting_param[:value].to_s)
            updated << serialize_setting(setting)
          end

          render json: { data: updated, message: "Parametres mis a jour avec succes." }
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: "Parametre introuvable: #{e.message}" }, status: :not_found
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end

        def settings_params
          params.require(:settings).map do |s|
            s.permit(:key, :value)
          end
        end

        def serialize_setting(setting)
          {
            id: setting.id,
            key: setting.key,
            value: setting.value,
            typed_value: setting.typed_value,
            value_type: setting.value_type,
            category: setting.category,
            description: setting.description
          }
        end
      end
    end
  end
end
