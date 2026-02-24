module Api
  module V1
    class YousignWebhooksController < ApplicationController
      skip_before_action :authenticate_user!, raise: false

      # POST /api/v1/yousign_webhooks
      # Called by YouSign when a signature request status changes
      def create
        event_name = params[:event_name] || params.dig(:data, :event_name)
        signature_request_id = params.dig(:data, :signature_request, :id) || params[:signature_request_id]

        Rails.logger.info("[YousignWebhook] Received event: #{event_name} for SR: #{signature_request_id}")

        if signature_request_id.present?
          project = InvestmentProject.find_by(yousign_signature_request_id: signature_request_id)

          if project
            case event_name
            when "signature_request.done"
              project.update!(
                yousign_status: "done",
                status: :legal_structuring
              )
              Rails.logger.info("[YousignWebhook] Project #{project.id} signature completed, advanced to legal_structuring")
            when "signature_request.declined"
              project.update!(yousign_status: "declined")
              Rails.logger.info("[YousignWebhook] Project #{project.id} signature declined")
            when "signer.done"
              project.update!(yousign_status: "signer_done")
              Rails.logger.info("[YousignWebhook] Project #{project.id} signer has signed")
            else
              Rails.logger.info("[YousignWebhook] Unhandled event: #{event_name}")
            end
          else
            Rails.logger.warn("[YousignWebhook] No project found for signature_request_id: #{signature_request_id}")
          end
        end

        # Always return 200 to acknowledge the webhook
        head :ok
      end
    end
  end
end
