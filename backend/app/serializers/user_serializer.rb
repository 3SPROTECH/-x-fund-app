class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :first_name, :last_name, :phone, :role,
             :kyc_status, :kyc_submitted_at, :kyc_verified_at,
             :address_line1, :address_line2, :city, :postal_code, :country,
             :date_of_birth, :created_at

  attribute :full_name do |user|
    user.full_name
  end
end
