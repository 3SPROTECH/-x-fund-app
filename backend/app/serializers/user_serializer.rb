class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :first_name, :last_name, :phone, :role,
             :kyc_status, :kyc_submitted_at, :kyc_verified_at, :kyc_rejection_reason,
             :address_line1, :address_line2, :city, :postal_code, :country,
             :date_of_birth, :created_at

  attribute :full_name do |user|
    user.full_name
  end

  attribute :kyc_identity_document do |user|
    next nil unless user.kyc_identity_document.attached?

    begin
      {
        id: user.kyc_identity_document.id,
        url: Rails.application.routes.url_helpers.rails_blob_path(user.kyc_identity_document, only_path: true),
        filename: user.kyc_identity_document.filename.to_s,
        content_type: user.kyc_identity_document.content_type,
        byte_size: user.kyc_identity_document.byte_size
      }
    rescue => e
      Rails.logger.error("Error generating identity document URL: #{e.message}")
      nil
    end
  end

  attribute :kyc_proof_of_address do |user|
    next nil unless user.kyc_proof_of_address.attached?

    begin
      {
        id: user.kyc_proof_of_address.id,
        url: Rails.application.routes.url_helpers.rails_blob_path(user.kyc_proof_of_address, only_path: true),
        filename: user.kyc_proof_of_address.filename.to_s,
        content_type: user.kyc_proof_of_address.content_type,
        byte_size: user.kyc_proof_of_address.byte_size
      }
    rescue => e
      Rails.logger.error("Error generating proof of address URL: #{e.message}")
      nil
    end
  end
end
