class CreateCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }

      ## Identity (KYB)
      t.string  :company_name, null: false
      t.string  :siret, limit: 14
      t.date    :company_creation_date
      t.integer :legal_form                        # enum: SAS, SARL, SCI, SNC, SCCV
      t.string  :legal_representative_name
      t.string  :headquarters_address

      ## Track Record
      t.integer :completed_operations_count, default: 0
      t.bigint  :managed_volume_cents, default: 0
      t.decimal :default_rate_percent, precision: 5, scale: 2, default: 0.0

      t.timestamps
    end

    add_index :companies, :siret, unique: true, where: "siret IS NOT NULL"
  end
end
