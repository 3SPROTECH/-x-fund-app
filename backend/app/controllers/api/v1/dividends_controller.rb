module Api
  module V1
    class DividendsController < ApplicationController
      before_action :set_investment_project

      def index
        dividends = @investment_project.dividends.order(distribution_date: :desc)
        authorize Dividend

        render json: { data: dividends.map { |d| DividendSerializer.new(d).serializable_hash[:data] } }
      end

      def show
        dividend = @investment_project.dividends.find(params[:id])
        authorize dividend

        render json: { data: DividendSerializer.new(dividend).serializable_hash[:data] }
      end

      def create
        authorize Dividend

        result = Dividends::DistributeDividendService.new(
          investment_project: @investment_project,
          total_amount_cents: params[:total_amount_cents].to_i,
          period_start: Date.parse(params[:period_start]),
          period_end: Date.parse(params[:period_end])
        ).call

        if result.success?
          render json: { data: DividendSerializer.new(result.dividend).serializable_hash[:data] }, status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      private

      def set_investment_project
        @investment_project = InvestmentProject.find(params[:investment_project_id])
      end
    end
  end
end
