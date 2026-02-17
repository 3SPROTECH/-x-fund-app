module Api
  module V1
    class CompaniesController < ApplicationController
      def show
        company = current_user.company
        if company
          render json: { data: company_json(company) }
        else
          render json: { data: nil }
        end
      end

      def create_or_update
        company = current_user.company || current_user.build_company

        if company.update(company_params)
          render json: { data: company_json(company) }
        else
          render json: { errors: company.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def company_params
        params.require(:company).permit(
          :company_name, :siret, :company_creation_date, :legal_form,
          :legal_representative_name, :headquarters_address,
          :completed_operations_count, :managed_volume_cents, :default_rate_percent,
          :kbis, :presentation_deck
        )
      end

      def company_json(company)
        {
          id: company.id,
          company_name: company.company_name,
          siret: company.siret,
          company_creation_date: company.company_creation_date,
          legal_form: company.legal_form,
          legal_representative_name: company.legal_representative_name,
          headquarters_address: company.headquarters_address,
          completed_operations_count: company.completed_operations_count,
          managed_volume_cents: company.managed_volume_cents,
          default_rate_percent: company.default_rate_percent,
          kbis_attached: company.kbis.attached?,
          presentation_deck_attached: company.presentation_deck.attached?,
        }
      end
    end
  end
end
