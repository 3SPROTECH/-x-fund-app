class UnifyProjectStatuses < ActiveRecord::Migration[8.1]
  def up
    # Step 1: Remap status values based on old status + review_status
    # Old status:  brouillon(0), ouvert(1), finance(2), cloture(3), annule(4)
    # Old review:  en_attente(0), approuve(1), rejete(2)
    # New status:  draft(0), pending_analysis(1), info_requested(2), rejected(3),
    #              approved(4), legal_structuring(5), signing(6), funding_active(7),
    #              funded(8), under_construction(9), operating(10), repaid(11)

    # Use a temp column to avoid conflicts during remapping
    add_column :investment_projects, :new_status, :integer

    # Map based on old status + review_status combination
    execute <<-SQL
      UPDATE investment_projects SET new_status = CASE
        WHEN status = 0 AND review_status = 2 THEN 3   -- brouillon + rejete -> rejected
        WHEN status = 0 AND review_status = 1 THEN 4   -- brouillon + approuve -> approved
        WHEN status = 0 THEN 0                          -- brouillon + en_attente -> draft
        WHEN status = 1 THEN 7                          -- ouvert -> funding_active
        WHEN status = 2 THEN 8                          -- finance -> funded
        WHEN status = 3 THEN 11                         -- cloture -> repaid
        WHEN status = 4 THEN 3                          -- annule -> rejected
        ELSE 0                                          -- fallback to draft
      END
    SQL

    # Replace old status with new values
    execute "UPDATE investment_projects SET status = new_status"
    remove_column :investment_projects, :new_status

    # Step 2: Remove obsolete columns
    remove_column :investment_projects, :review_status
    remove_column :investment_projects, :progress_status
  end

  def down
    # Add back old columns
    add_column :investment_projects, :review_status, :integer, default: 0, null: false
    add_column :investment_projects, :progress_status, :integer

    # Reverse-map new statuses to old status + review_status
    execute <<-SQL
      UPDATE investment_projects SET
        review_status = CASE
          WHEN status IN (3) THEN 2                   -- rejected -> rejete
          WHEN status IN (4, 5, 6, 7, 8, 9, 10, 11) THEN 1  -- approved+ -> approuve
          ELSE 0                                      -- draft/pending_analysis -> en_attente
        END,
        status = CASE
          WHEN status = 0 THEN 0                      -- draft -> brouillon
          WHEN status = 1 THEN 0                      -- pending_analysis -> brouillon
          WHEN status = 2 THEN 0                      -- info_requested -> brouillon
          WHEN status = 3 THEN 4                      -- rejected -> annule
          WHEN status IN (4, 5, 6) THEN 0             -- approved/legal/signing -> brouillon
          WHEN status = 7 THEN 1                      -- funding_active -> ouvert
          WHEN status = 8 THEN 2                      -- funded -> finance
          WHEN status IN (9, 10) THEN 2               -- construction/operating -> finance
          WHEN status = 11 THEN 3                     -- repaid -> cloture
          ELSE 0
        END
    SQL

    add_index :investment_projects, :review_status
    add_index :investment_projects, :progress_status
  end
end
