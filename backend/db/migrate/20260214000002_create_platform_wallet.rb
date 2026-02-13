class CreatePlatformWallet < ActiveRecord::Migration[8.1]
  def change
    add_column :wallets, :is_platform, :boolean, default: false, null: false
    add_index :wallets, :is_platform, where: "is_platform = true", unique: true

    reversible do |dir|
      dir.up do
        now = Time.current.to_fs(:db)

        # Create a system user to own the platform wallet
        execute <<~SQL
          INSERT INTO users (email, encrypted_password, first_name, last_name, role, kyc_status, kyc_verified_at, jti, created_at, updated_at)
          VALUES ('platform@x-fund.system', '#{SecureRandom.hex(30)}', 'X-Fund', 'Platform', 2, 2, '#{now}', '#{SecureRandom.uuid}', '#{now}', '#{now}')
        SQL

        # Create platform wallet
        execute <<~SQL
          INSERT INTO wallets (user_id, balance_cents, total_deposited_cents, total_withdrawn_cents, currency, is_platform, created_at, updated_at)
          VALUES (
            (SELECT id FROM users WHERE email = 'platform@x-fund.system'),
            0, 0, 0, 'EUR', true, '#{now}', '#{now}'
          )
        SQL
      end

      dir.down do
        execute "DELETE FROM wallets WHERE is_platform = true"
        execute "DELETE FROM users WHERE email = 'platform@x-fund.system'"
      end
    end
  end
end
