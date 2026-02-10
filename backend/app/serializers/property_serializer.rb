class PropertySerializer
  include JSONAPI::Serializer

  attributes :id, :title, :description, :property_type, :status,
             :address_line1, :address_line2, :city, :postal_code, :country,
             :latitude, :longitude, :surface_area_sqm,
             :acquisition_price_cents, :estimated_value_cents,
             :estimated_annual_yield_percent, :investment_duration_months,
             :created_at, :updated_at

  attribute :owner_name do |property|
    property.owner.full_name
  end

  attribute :has_investment_project do |property|
    property.investment_project.present?
  end
end
