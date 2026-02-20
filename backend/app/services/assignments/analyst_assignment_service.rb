module Assignments
  class AnalystAssignmentService
    # Finds the next analyst using round-robin based on creation order.
    # The analyst with the fewest active projects gets the next one.
    # Ties are broken by creation date (earliest created first).
    def self.next_analyst
      analysts = User.analyste.order(:created_at)
      return nil if analysts.empty?

      analyst_ids = analysts.pluck(:id)

      counts = InvestmentProject
        .where(analyst_id: analyst_ids)
        .where.not(status: [:rejected, :repaid])
        .group(:analyst_id)
        .count

      analysts.min_by { |a| counts[a.id] || 0 }
    end

    # Auto-assigns the next analyst to a project (round-robin).
    # Does nothing if no analysts exist.
    def self.assign!(project)
      analyst = next_analyst
      return unless analyst

      project.update!(
        analyst_id: analyst.id,
        analyst_opinion: :opinion_pending,
        analyst_comment: nil,
        analyst_legal_check: false,
        analyst_financial_check: false,
        analyst_risk_check: false,
        analyst_reviewed_at: nil
      )
    end
  end
end
