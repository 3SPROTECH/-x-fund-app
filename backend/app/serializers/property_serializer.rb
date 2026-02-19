class PropertySerializer
  include JSONAPI::Serializer

  attributes :id, :title, :description, :property_type, :status,
             :address_line1, :address_line2, :city, :postal_code, :country,
             :latitude, :longitude, :surface_area_sqm,
             :acquisition_price_cents, :estimated_value_cents,
             :number_of_lots, :is_land_division, :floor_area_sqm,
             :dpe_current, :dpe_target, :permit_status, :permit_date, :permit_number,
             # Advanced form fields
             :neighborhood, :zone_typology, :transport_access, :nearby_amenities,
             :strategic_advantages, :expert_name, :expert_date,
             :is_refinancing, :works_needed, :works_duration_months, :agency_fees_cents,
             :created_at, :updated_at

  attribute :lots do |property|
    property.lots.order(:lot_number).map do |lot|
      {
        id: lot.id,
        lot_number: lot.lot_number,
        surface_area_sqm: lot.surface_area_sqm,
        description: lot.description,
        pre_commercialized: lot.pre_commercialized,
        is_rented: lot.is_rented,
        projected_sale_price_cents: lot.projected_sale_price_cents,
        sale_promise_ref: lot.sale_promise_ref,
        lease_ref: lot.lease_ref
      }
    end
  end

  attribute :owner_name do |property|
    property.owner.full_name
  end

  attribute :has_investment_project do |property|
    property.investment_project.present?
  end

  attribute :photos do |property|
    next [] unless property.photos.attached?

    property.photos.map { |photo|
      begin
        {
          id: photo.id,
          url: Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true),
          filename: photo.filename.to_s,
          content_type: photo.content_type,
          byte_size: photo.byte_size
        }
      rescue => e
        Rails.logger.error("Error generating photo URL: #{e.message}")
        nil
      end
    }.compact
  end

  attribute :documents do |property|
    next [] unless property.documents.attached?

    property.documents.map { |doc|
      begin
        {
          id: doc.id,
          url: Rails.application.routes.url_helpers.rails_blob_path(doc, only_path: true),
          filename: doc.filename.to_s,
          content_type: doc.content_type,
          byte_size: doc.byte_size
        }
      rescue => e
        Rails.logger.error("Error generating document URL: #{e.message}")
        nil
      end
    }.compact
  end
end
