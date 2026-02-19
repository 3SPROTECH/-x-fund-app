class ProjectDocument < ApplicationRecord
  belongs_to :documentable, polymorphic: true

  has_one_attached :file

  enum :document_type, {
    expertise_report: 0,
    pua: 1,
    admin_permit: 2,
    business_plan: 3,
    building_permit: 4
  }

  enum :status, { pending: 0, uploaded: 1, commented: 2 }

  validates :document_type, presence: true
  validates :status, presence: true
end
