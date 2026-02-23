class NotificationSerializer
  include JSONAPI::Serializer

  attributes :id, :notification_type, :title, :body, :read_at, :created_at

  attribute :actor_name do |n|
    n.actor&.full_name
  end

  attribute :notifiable_type do |n|
    n.notifiable_type
  end

  attribute :notifiable_id do |n|
    n.notifiable_id
  end

  attribute :is_read do |n|
    n.read?
  end
end
