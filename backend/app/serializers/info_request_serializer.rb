class InfoRequestSerializer
  include JSONAPI::Serializer

  attributes :id, :fields, :status, :responses, :submitted_at, :created_at, :updated_at

  attribute :requested_by_name do |record|
    record.requested_by&.full_name
  end

  # Map of field_index => original_filename for attached response files
  attribute :response_file_fields do |record|
    result = {}
    record.response_files.each do |attachment|
      fname = attachment.filename.to_s
      if fname.match?(/\Afield_(\d+)_/)
        field_index = fname.match(/\Afield_(\d+)_/)[1]
        original_name = fname.sub(/\Afield_\d+_/, "")
        result[field_index] = original_name
      end
    end
    result
  end
end
