module Api
  module V1
    class FinancialStatementsController < ApplicationController
      before_action :set_investment_project

      def index
        statements = @investment_project.financial_statements.order(period_start: :desc)
        authorize FinancialStatement

        render json: { data: statements.map { |s| FinancialStatementSerializer.new(s).serializable_hash[:data] } }
      end

      def show
        statement = @investment_project.financial_statements.find(params[:id])
        authorize statement

        render json: { data: FinancialStatementSerializer.new(statement).serializable_hash[:data] }
      end

      def create
        authorize FinancialStatement
        verify_project_ownership!

        result = Financial::StatementGeneratorService.new(
          investment_project: @investment_project,
          statement_type: params[:statement_type],
          period_start: Date.parse(params[:period_start]),
          period_end: Date.parse(params[:period_end])
        ).call

        if result.success?
          render json: { data: FinancialStatementSerializer.new(result.statement).serializable_hash[:data] }, status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      private

      def set_investment_project
        @investment_project = InvestmentProject.find(params[:investment_project_id])
      end

      def verify_project_ownership!
        return if current_user.administrateur?
        unless @investment_project.owner == current_user
          render json: { error: "Vous ne pouvez creer des rapports que pour vos propres projets." }, status: :forbidden
        end
      end
    end
  end
end
