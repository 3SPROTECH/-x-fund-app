module Api
  module V1
    class KycController < ApplicationController
      def show
        render json: {
          data: {
            kyc_status: current_user.kyc_status,
            kyc_submitted_at: current_user.kyc_submitted_at,
            kyc_verified_at: current_user.kyc_verified_at,
            kyc_rejection_reason: current_user.kyc_rejection_reason,
            has_identity_document: current_user.kyc_identity_document.attached?,
            has_proof_of_address: current_user.kyc_proof_of_address.attached?
          }
        }
      end

      def create
        current_user.kyc_identity_document.attach(params[:kyc_identity_document]) if params[:kyc_identity_document]
        current_user.kyc_proof_of_address.attach(params[:kyc_proof_of_address]) if params[:kyc_proof_of_address]
        current_user.update!(kyc_status: :submitted, kyc_submitted_at: Time.current, kyc_rejection_reason: nil)

        render json: { message: "Documents KYC soumis avec succes.", data: { kyc_status: current_user.kyc_status } }, status: :created
      end

      def update
        current_user.kyc_identity_document.attach(params[:kyc_identity_document]) if params[:kyc_identity_document]
        current_user.kyc_proof_of_address.attach(params[:kyc_proof_of_address]) if params[:kyc_proof_of_address]
        current_user.update!(kyc_status: :submitted, kyc_submitted_at: Time.current, kyc_rejection_reason: nil)

        render json: { message: "Documents KYC mis a jour.", data: { kyc_status: current_user.kyc_status } }
      end
    end
  end
end
