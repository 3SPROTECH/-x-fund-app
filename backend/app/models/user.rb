class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  include Auditable

  devise :database_authenticatable, :registerable,
         :recoverable, :validatable, :trackable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  enum :role, { investisseur: 0, porteur_de_projet: 1, administrateur: 2, analyste: 3 }
  enum :kyc_status, { pending: 0, submitted: 1, verified: 2, rejected: 3 }, prefix: :kyc

  has_one :wallet, dependent: :destroy
  has_one :company, dependent: :destroy
  has_many :properties, foreign_key: :owner_id, dependent: :restrict_with_error, inverse_of: :owner
  has_many :investments, dependent: :restrict_with_error
  has_many :invested_projects, through: :investments, source: :investment_project
  has_many :dividend_payments, dependent: :restrict_with_error
  has_many :performed_audit_logs, class_name: "AuditLog", foreign_key: :user_id, dependent: :nullify
  has_many :notifications, dependent: :destroy
  has_many :project_drafts, dependent: :destroy
  has_many :sent_chat_messages, class_name: "ChatMessage", foreign_key: :sender_id, dependent: :destroy

  has_one_attached :kyc_identity_document
  has_one_attached :kyc_proof_of_address

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true

  before_save :auto_verify_kyc_for_admin
  after_create :create_wallet!

  def full_name
    "#{first_name} #{last_name}"
  end

  def jwt_payload
    super.merge("role" => role)
  end

  private

  def audit_excluded_fields
    super + %w[encrypted_password reset_password_token reset_password_sent_at
               sign_in_count current_sign_in_at last_sign_in_at
               current_sign_in_ip last_sign_in_ip jti]
  end

  def auto_verify_kyc_for_admin
    if (administrateur? || analyste?) && !kyc_verified?
      self.kyc_status = :verified
      self.kyc_verified_at = Time.current
    end
  end

  def create_wallet!
    Wallet.create!(user: self)
  end
end
