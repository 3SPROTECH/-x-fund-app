class NotificationService
  def self.notify!(user:, actor:, notifiable: nil, type:, title:, body: nil)
    return if user == actor
    Notification.create!(
      user: user,
      actor: actor,
      notifiable: notifiable,
      notification_type: type,
      title: title,
      body: body
    )
  rescue => e
    Rails.logger.error("NotificationService error: #{e.message}")
  end

  def self.notify_admins!(actor:, notifiable: nil, type:, title:, body: nil)
    User.where(role: :administrateur).where.not(id: actor.id).find_each do |admin|
      notify!(user: admin, actor: actor, notifiable: notifiable, type: type, title: title, body: body)
    end
  end

  def self.notify_project_owner!(project, actor:, type:, title:, body: nil)
    owner = project.owner
    return unless owner
    notify!(user: owner, actor: actor, notifiable: project, type: type, title: title, body: body)
  end

  def self.notify_project_analyst!(project, actor:, type:, title:, body: nil)
    analyst = project.analyst
    return unless analyst
    notify!(user: analyst, actor: actor, notifiable: project, type: type, title: title, body: body)
  end
end
