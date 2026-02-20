class ProjectDelay < ApplicationRecord
  belongs_to :investment_project
  belongs_to :user
  has_many_attached :supporting_documents

  enum :delay_type, {
    livraison: 0,
    travaux: 1,
    financement: 2,
    administratif: 3,
    autre: 4
  }

  enum :status, {
    declared: 0,
    acknowledged: 1,
    resolved: 2
  }

  validates :title, presence: true
  validates :description, presence: true
  validates :original_date, presence: true
  validates :new_estimated_date, presence: true
  validate :new_date_after_original

  before_save :calculate_delay_days

  private

  def calculate_delay_days
    self.delay_days = (new_estimated_date - original_date).to_i if original_date && new_estimated_date
  end

  def new_date_after_original
    return unless original_date && new_estimated_date
    if new_estimated_date <= original_date
      errors.add(:new_estimated_date, "doit etre posterieure a la date prevue")
    end
  end
end
