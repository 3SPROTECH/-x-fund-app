class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      ## Devise: Database authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Devise: Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Devise: Trackable
      t.integer  :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.inet     :current_sign_in_ip
      t.inet     :last_sign_in_ip

      ## Profile
      t.string :first_name, null: false
      t.string :last_name,  null: false
      t.string :phone

      ## Role
      t.integer :role, null: false, default: 0

      ## KYC
      t.integer  :kyc_status, null: false, default: 0
      t.datetime :kyc_submitted_at
      t.datetime :kyc_verified_at
      t.text     :kyc_rejection_reason

      ## Address
      t.string :address_line1
      t.string :address_line2
      t.string :city
      t.string :postal_code
      t.string :country, default: "FR"
      t.date   :date_of_birth

      ## JWT
      t.string :jti, null: false

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :jti,                  unique: true
    add_index :users, :role
    add_index :users, :kyc_status
  end
end
