module Api
  module V1
    class ChatMessagesController < ApplicationController
      before_action :set_project
      before_action :authorize_participant!

      # GET /api/v1/investment_projects/:investment_project_id/chat_messages
      def index
        messages = @project.chat_messages.chronological

        if params[:since].present?
          since = Time.zone.parse(params[:since])
          messages = messages.where("created_at > ?", since)
        end

        messages = messages.includes(:sender)
        messages = paginate(messages)

        render json: {
          data: messages.map { |m|
            ChatMessageSerializer.new(m, params: { current_user_id: current_user.id })
              .serializable_hash[:data]
          },
          meta: pagination_meta(messages).merge(
            unread_count: @project.chat_messages.unread_for(current_user).count
          )
        }
      end

      # POST /api/v1/investment_projects/:investment_project_id/chat_messages
      def create
        message = @project.chat_messages.build(
          sender: current_user,
          body: params.require(:chat_message).require(:body)
        )

        if message.save
          notify_recipient!(message)

          render json: {
            data: ChatMessageSerializer.new(message, params: { current_user_id: current_user.id })
              .serializable_hash[:data]
          }, status: :created
        else
          render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/investment_projects/:investment_project_id/chat_messages/mark_as_read
      def mark_as_read
        count = @project.chat_messages.unread_for(current_user).update_all(read_at: Time.current)
        render json: { marked_count: count }
      end

      # GET /api/v1/investment_projects/:investment_project_id/chat_messages/unread_count
      def unread_count
        count = @project.chat_messages.unread_for(current_user).count
        render json: { unread_count: count }
      end

      private

      def set_project
        @project = InvestmentProject.find(params[:investment_project_id])
      end

      def authorize_participant!
        unless current_user.id == @project.owner_id || current_user.id == @project.analyst_id
          render json: { error: "Vous n'etes pas autorise a acceder a cette conversation" },
                 status: :forbidden
        end
      end

      def notify_recipient!(message)
        recipient = message.recipient
        return unless recipient

        NotificationService.notify!(
          user: recipient,
          actor: current_user,
          notifiable: @project,
          type: "chat_message",
          title: "Nouveau message - #{@project.title}",
          body: message.body.truncate(100)
        )
      end
    end
  end
end
