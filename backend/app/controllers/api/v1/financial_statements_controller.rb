module Api
  module V1
    class FinancialStatementsController < ApplicationController
      before_action :set_investment_project
      before_action :set_financial_statement, only: [:show, :update, :destroy]

      def index
        statements = @investment_project.financial_statements.order(period_start: :desc)
        authorize FinancialStatement

        render json: { data: statements.map { |s| FinancialStatementSerializer.new(s).serializable_hash[:data] } }
      end

      def show
        authorize @financial_statement
        render json: { data: FinancialStatementSerializer.new(@financial_statement).serializable_hash[:data] }
      end

      def create
        authorize FinancialStatement
        verify_project_ownership!

        result = Financial::StatementGeneratorService.new(
          investment_project: @investment_project,
          statement_type: params[:statement_type],
          period_start: Date.parse(params[:period_start]),
          period_end: Date.parse(params[:period_end]),
          total_revenue_cents: params[:total_revenue_cents],
          total_expenses_cents: params[:total_expenses_cents]
        ).call

        if result.success?
          render json: { data: FinancialStatementSerializer.new(result.statement).serializable_hash[:data] }, status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      def update
        authorize @financial_statement

        if @financial_statement.update(statement_params)
          render json: { data: FinancialStatementSerializer.new(@financial_statement).serializable_hash[:data] }
        else
          render json: { errors: @financial_statement.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        authorize @financial_statement
        @financial_statement.destroy!
        render json: { message: "Rapport financier supprime avec succes." }, status: :ok
      end

      private

      def set_investment_project
        @investment_project = InvestmentProject.find(params[:investment_project_id])
      end

      def set_financial_statement
        @financial_statement = @investment_project.financial_statements.find(params[:id])
      end

      def verify_project_ownership!
        return if current_user.administrateur?

        unless @investment_project.owner == current_user
          return render json: { error: "Vous ne pouvez creer des rapports que pour vos propres projets." }, status: :forbidden
        end

        unless @investment_project.finance?
          return render json: { error: "Vous ne pouvez creer des rapports que pour des projets finances." }, status: :forbidden
        end
      end

      def statement_params
        params.require(:financial_statement).permit(
          :statement_type, :period_start, :period_end,
          :total_revenue_cents, :total_expenses_cents, :net_income_cents, :net_yield_percent
        )
      end
    end
  end
end
