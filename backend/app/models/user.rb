class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :validatable, :trackable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  enum :role, { investisseur: 0, porteur_de_projet: 1, administrateur: 2 }
  enum :kyc_status, { pending: 0, submitted: 1, verified: 2, rejected: 3 }, prefix: :kyc

  has_one :wallet, dependent: :destroy
  has_many :properties, foreign_key: :owner_id, dependent: :restrict_with_error, inverse_of: :owner
  has_many :investments, dependent: :restrict_with_error
  has_many :invested_projects, through: :investments, source: :investment_project
  has_many :dividend_payments, dependent: :restrict_with_error
  has_many :audit_logs, dependent: :nullify

  has_one_attached :kyc_identity_document
  has_one_attached :kyc_proof_of_address

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true

  after_create :create_wallet!

  def full_name
    "#{first_name} #{last_name}"
  end

  def jwt_payload
    super.merge("role" => role)
  end

  private

  def create_wallet!
    Wallet.create!(user: self)
  end
end
