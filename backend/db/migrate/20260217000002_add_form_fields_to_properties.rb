class AddFormFieldsToProperties < ActiveRecord::Migration[8.1]
  def change
    change_table :properties do |t|
      ## Step 2: Le Projet - new columns
      t.decimal :floor_area_sqm, precision: 10, scale: 2           # Surface de Plancher (SDP)
      t.boolean :is_land_division, default: false, null: false      # Division Parcellaire
      t.integer :dpe_current                                        # enum: A(0)..G(6)
      t.integer :dpe_target                                         # enum: A(0)..G(6)
      t.integer :permit_status                                      # enum: obtenu_purge, obtenu_non_purge, depose
      t.date    :permit_date                                        # Date d'obtention du permis
      t.string  :permit_number                                      # Numero de PC
    end

    add_index :properties, :permit_status
  end
end
