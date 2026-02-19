class ProjectDraft < ApplicationRecord
  belongs_to :user

  validates :form_data, presence: true

  before_save :update_last_saved_at

  private

  def update_last_saved_at
    self.last_saved_at = Time.current
  end
end
