module Api
  module V1
    module Admin
      class PropertiesController < ApplicationController
        before_action :require_admin!
        before_action :set_property, only: [:show, :update, :destroy]

        def index
          properties = Property.includes(:owner, :investment_project).all
          properties = properties.where(status: params[:status]) if params[:status].present?
          properties = properties.where(property_type: params[:property_type]) if params[:property_type].present?
          properties = properties.where(owner_id: params[:owner_id]) if params[:owner_id].present?
          properties = paginate(properties.order(created_at: :desc))

          render json: {
            data: properties.map { |p| PropertySerializer.new(p).serializable_hash[:data] },
            meta: pagination_meta(properties)
          }
        end

        def show
          render json: { data: PropertySerializer.new(@property).serializable_hash[:data] }
        end

        def create
          owner = User.find(params[:owner_id] || current_user.id)
          @property = owner.properties.build(admin_property_params)

          if @property.save
            render json: { data: PropertySerializer.new(@property).serializable_hash[:data] }, status: :created
          else
            render json: { errors: @property.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @property.update(admin_property_params)
            render json: { data: PropertySerializer.new(@property).serializable_hash[:data] }
          else
            render json: { errors: @property.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @property.destroy!
          render json: { message: "Bien immobilier supprime." }
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end

        def set_property
          @property = Property.find(params[:id])
        end

        def admin_property_params
          params.require(:property).permit(
            :title, :description, :property_type, :status,
            :address_line1, :address_line2, :city, :postal_code, :country,
            :latitude, :longitude,
            :acquisition_price_cents, :estimated_value_cents,
            :estimated_annual_yield_percent, :investment_duration_months,
            :surface_area_sqm,
            photos: [], documents: []
          )
        end
      end
    end
  end
end
