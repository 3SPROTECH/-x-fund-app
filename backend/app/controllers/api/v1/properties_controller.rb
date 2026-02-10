module Api
  module V1
    class PropertiesController < ApplicationController
      before_action :set_property, only: [:show, :update, :destroy]

      def index
        properties = policy_scope(Property)
                       .by_city(params[:city])
                       .by_status(params[:status])
        properties = paginate(properties.order(created_at: :desc))

        render json: {
          data: properties.map { |p| PropertySerializer.new(p).serializable_hash[:data] },
          meta: pagination_meta(properties)
        }
      end

      def show
        authorize @property
        render json: { data: PropertySerializer.new(@property).serializable_hash[:data] }
      end

      def create
        authorize Property
        @property = current_user.properties.build(property_params)

        if @property.save
          render json: { data: PropertySerializer.new(@property).serializable_hash[:data] }, status: :created
        else
          render json: { errors: @property.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @property

        if @property.update(property_params)
          render json: { data: PropertySerializer.new(@property).serializable_hash[:data] }
        else
          render json: { errors: @property.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @property
        @property.destroy!
        render json: { message: "Bien immobilier supprime." }, status: :ok
      end

      private

      def set_property
        @property = Property.find(params[:id])
      end

      def property_params
        params.require(:property).permit(
          :title, :description, :property_type,
          :address_line1, :address_line2, :city, :postal_code, :country,
          :latitude, :longitude, :surface_area_sqm,
          :acquisition_price_cents, :estimated_value_cents,
          :estimated_annual_yield_percent, :investment_duration_months,
          :status, photos: [], documents: []
        )
      end
    end
  end
end
