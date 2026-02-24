module Api
  module V1
    class YousignWebhooksController < ApplicationController
      skip_before_action :authenticate_user!, raise: false

      # POST /api/v1/yousign_webhooks
      # Called by YouSign when a signature request status changes
      def create
        event_name = params[:event_name] || params.dig(:data, :event_name)
        signature_request_id = params.dig(:data, :signature_request, :id) || params[:signature_request_id]
        signer_id = params.dig(:data, :signer, :id)

        Rails.logger.info("[YousignWebhook] Received event: #{event_name} for SR: #{signature_request_id}, signer: #{signer_id}")

        if signature_request_id.present?
          project = InvestmentProject.find_by(yousign_signature_request_id: signature_request_id)

          if project
            case event_name
            when "signature_request.done"
              project.update!(
                yousign_status: "done",
                status: :legal_structuring
              )
              Rails.logger.info("[YousignWebhook] Project #{project.id} all signatures completed, advanced to legal_structuring")
            when "signature_request.declined"
              project.update!(yousign_status: "declined")
              Rails.logger.info("[YousignWebhook] Project #{project.id} signature declined")
            when "signer.done"
              # Determine which signer completed
              if signer_id == project.yousign_signer_id
                # Owner signed
                if project.yousign_status == "admin_signed"
                  project.update!(yousign_status: "done", status: :legal_structuring)
                  Rails.logger.info("[YousignWebhook] Project #{project.id} owner signed (admin already signed) → done")
                else
                  project.update!(yousign_status: "owner_signed")
                  Rails.logger.info("[YousignWebhook] Project #{project.id} owner signed, waiting for admin")
                end
              elsif signer_id == project.yousign_admin_signer_id
                # Admin signed
                if project.yousign_status == "owner_signed"
                  project.update!(yousign_status: "done", status: :legal_structuring)
                  Rails.logger.info("[YousignWebhook] Project #{project.id} admin signed (owner already signed) → done")
                else
                  project.update!(yousign_status: "admin_signed")
                  Rails.logger.info("[YousignWebhook] Project #{project.id} admin signed, waiting for owner")
                end
              else
                project.update!(yousign_status: "signer_done")
                Rails.logger.info("[YousignWebhook] Project #{project.id} unknown signer #{signer_id} signed")
              end
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
