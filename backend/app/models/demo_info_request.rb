class DemoInfoRequest < ApplicationRecord
  belongs_to :investment_project
  belongs_to :requested_by, class_name: "User"

  enum :status, { pending: 0, submitted: 1, reviewed: 2 }, prefix: :demo

  validates :fields, presence: true
  validates :investment_project, presence: true
  validates :requested_by, presence: true

  scope :latest_for_project, ->(project_id) {
    where(investment_project_id: project_id).order(created_at: :desc).limit(1)
  }

  def requested_by_name
    requested_by&.full_name
  end
end
