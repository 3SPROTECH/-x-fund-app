class ChatMessageSerializer
  include JSONAPI::Serializer

  attributes :id, :body, :read_at, :created_at

  attribute :sender_id do |msg|
    msg.sender_id
  end

  attribute :sender_name do |msg|
    msg.sender&.full_name
  end

  attribute :sender_role do |msg|
    msg.sender&.role
  end

  attribute :is_mine do |msg, params|
    msg.sender_id == params[:current_user_id]
  end

  attribute :is_read do |msg|
    msg.read?
  end

  attribute :project_id do |msg|
    msg.investment_project_id
  end

  attribute :project_title do |msg|
    msg.investment_project&.title
  end
end
