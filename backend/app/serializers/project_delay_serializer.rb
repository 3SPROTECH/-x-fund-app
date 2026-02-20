class ProjectDelaySerializer
  include JSONAPI::Serializer

  attributes :id, :title, :description, :justification,
             :delay_type, :original_date, :new_estimated_date,
             :delay_days, :status, :resolved_at,
             :created_at, :updated_at

  attribute :project_title do |delay|
    delay.investment_project.title
  end

  attribute :project_id do |delay|
    delay.investment_project_id
  end

  attribute :declared_by do |delay|
    delay.user.full_name
  end

  attribute :supporting_documents do |delay|
    delay.supporting_documents.map do |doc|
      {
        id: doc.id,
        filename: doc.filename.to_s,
        content_type: doc.content_type,
        byte_size: doc.byte_size,
        url: Rails.application.routes.url_helpers.rails_blob_url(doc, only_path: true)
      }
    end
  end
end
