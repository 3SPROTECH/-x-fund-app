module Financial
  class StatementGeneratorService
    Result = Struct.new(:success, :statement, :errors, keyword_init: true) do
      def success? = success
    end

    def initialize(investment_project:, statement_type:, period_start:, period_end:)
      @project = investment_project
      @statement_type = statement_type
      @period_start = period_start
      @period_end = period_end
    end

    def call
      errors = validate
      return Result.new(success: false, errors: errors) if errors.any?

      yield_calculator = YieldCalculatorService.new(@project)

      # Calculate financials for the period
      dividends_in_period = @project.dividends.distributed
                                    .where(period_start: @period_start..@period_end)
      total_revenue = dividends_in_period.sum(:total_amount_cents)
      management_fees = (total_revenue * @project.management_fee_percent / 100.0).round
      total_expenses = management_fees
      net_income = total_revenue - total_expenses

      statement = FinancialStatement.create!(
        investment_project: @project,
        statement_type: @statement_type,
        period_start: @period_start,
        period_end: @period_end,
        total_revenue_cents: total_revenue,
        total_expenses_cents: total_expenses,
        management_fees_cents: management_fees,
        net_income_cents: net_income,
        gross_yield_percent: yield_calculator.gross_yield_percent,
        net_yield_percent: yield_calculator.net_yield_percent
      )

      Result.new(success: true, statement: statement, errors: [])
    rescue ActiveRecord::RecordInvalid => e
      Result.new(success: false, errors: [e.message])
    end

    private

    def validate
      errors = []
      errors << "La periode de debut doit preceder la fin" if @period_start >= @period_end
      errors << "Type de releve invalide" unless %w[trimestriel semestriel annuel].include?(@statement_type)
      errors
    end
  end
end
