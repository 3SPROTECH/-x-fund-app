class RenameAnalystApprovedToAnalysisSubmitted < ActiveRecord::Migration[8.1]
  def up
    # Status enum: analyst_approved (13) -> analysis_submitted (13)
    # The integer value stays the same, only the Ruby enum key changes.
    # No data migration needed since the DB stores integers.

    # Analyst opinion enum: opinion_approved (1) -> opinion_submitted (1)
    # Same approach - integer stays the same.

    # However, if any text references exist (e.g. in review_comment or audit logs),
    # we leave those as-is since they're historical records.

    # This migration is a no-op at the database level since Rails integer enums
    # only change the application-layer mapping. We include it for documentation
    # and to update the schema version timestamp.
  end

  def down
    # Reversible: the enum key names are only in the Rails model, not in the DB.
  end
end
