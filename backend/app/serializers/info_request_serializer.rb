class InfoRequestSerializer
  include JSONAPI::Serializer

  attributes :id, :fields, :status, :responses, :submitted_at, :created_at, :updated_at

  attribute :requested_by_name do |record|
    record.requested_by&.full_name
  end
end
