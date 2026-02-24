class ChatMessage < ApplicationRecord
  belongs_to :investment_project
  belongs_to :sender, class_name: "User"

  validates :body, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :chronological, -> { order(created_at: :asc) }
  scope :recent_first, -> { order(created_at: :desc) }
  scope :unread_for, ->(user) { unread.where.not(sender_id: user.id) }

  def read?
    read_at.present?
  end

  def mark_as_read!
    update!(read_at: Time.current) unless read?
  end

  def recipient
    if sender_id == investment_project.analyst_id
      investment_project.owner
    else
      investment_project.analyst
    end
  end
end
