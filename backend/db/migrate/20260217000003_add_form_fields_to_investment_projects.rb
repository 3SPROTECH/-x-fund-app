class AddFormFieldsToInvestmentProjects < ActiveRecord::Migration[8.1]
  def change
    change_table :investment_projects do |t|
      ## Step 3: Financement - cost breakdown
      t.bigint  :notary_fees_cents                                  # Frais de Notaire
      t.bigint  :works_budget_cents                                 # Budget Travaux / Construction
      t.bigint  :financial_fees_cents                               # Frais Financiers & Honoraires
      t.bigint  :equity_cents                                       # Fonds Propres Operateur
      t.bigint  :bank_loan_cents                                    # Credit Bancaire Senior
      t.bigint  :projected_revenue_cents                            # CA Previsionnel (HT)
      t.bigint  :projected_margin_cents                             # Marge Operationnelle
      t.string  :bank_name                                          # Nom de la Banque
      t.integer :bank_loan_status                                   # enum: en_negociation, accord_principe, offre_editee, offre_signee
      t.integer :duration_months                                    # Duree en mois
      t.integer :payment_frequency                                  # enum: mensuel, trimestriel, annuel, in_fine

      ## Step 4: Garanties
      t.boolean :has_first_rank_mortgage, default: false, null: false
      t.boolean :has_share_pledge, default: false, null: false       # Nantissement de Titres
      t.boolean :has_fiducie, default: false, null: false            # Fiducie Surete
      t.boolean :has_interest_escrow, default: false, null: false    # Sequestre des Interets
      t.boolean :has_works_escrow, default: false, null: false       # Sequestre du Budget Travaux
      t.boolean :has_personal_guarantee, default: false, null: false # Caution Personnelle
      t.boolean :has_gfa, default: false, null: false                # Garantie Financiere d'Achevement
      t.boolean :has_open_banking, default: false, null: false       # Engagement Open Banking
      t.text    :risk_description                                    # Description des risques

      ## Step 5: Commercialisation
      t.decimal :pre_commercialization_percent, precision: 5, scale: 2  # Taux de pre-commercialisation
      t.bigint  :exit_price_per_sqm_cents                               # Prix de sortie (EUR/m2)
      t.integer :exit_scenario                                           # enum: unit_sale, block_sale, refinance
      t.date    :planned_acquisition_date
      t.date    :planned_delivery_date
      t.date    :planned_repayment_date
    end

    add_index :investment_projects, :exit_scenario
    add_index :investment_projects, :bank_loan_status
  end
end
