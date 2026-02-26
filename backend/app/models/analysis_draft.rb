class AnalysisDraft < ApplicationRecord
  belongs_to :user
  belongs_to :investment_project

  validates :form_data, presence: true
  validates :user_id, uniqueness: { scope: :investment_project_id, message: "a deja un brouillon pour ce projet" }

  before_save :update_last_saved_at

  private

  def update_last_saved_at
    self.last_saved_at = Time.current
  end
end
