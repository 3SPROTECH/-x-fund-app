class CreateAssetGuaranteesAndAddProjectScores < ActiveRecord::Migration[8.1]
  def change
    create_table :asset_guarantees do |t|
      t.references :investment_project, null: false, foreign_key: true
      t.integer    :asset_index, null: false
      t.string     :asset_label
      t.string     :guarantee_type, null: false
      t.string     :rank
      t.bigint     :asset_value_cents, default: 0
      t.bigint     :debt_amount_cents, default: 0
      t.decimal    :ltv, precision: 5, scale: 2, default: 0
      t.decimal    :protection_score, precision: 5, scale: 2, default: 0
      t.string     :risk_level
      t.text       :description
      t.string     :guarantor_name
      t.timestamps
    end

    add_column :investment_projects, :overall_protection_score, :decimal, precision: 5, scale: 2
    add_column :investment_projects, :overall_risk_level, :string
    add_column :investment_projects, :guarantee_type_summary, :jsonb, default: []
  end
end
