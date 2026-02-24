module Api
  module V1
    class ChatConversationsController < ApplicationController
      # GET /api/v1/chat_conversations
      def index
        projects = InvestmentProject
          .where("owner_id = :uid OR analyst_id = :uid", uid: current_user.id)
          .where.not(analyst_id: nil)
          .includes(:owner, :analyst)

        conversations = projects.map do |project|
          last_message = project.chat_messages.recent_first.first
          unread = project.chat_messages.unread_for(current_user).count
          other_user = current_user.id == project.analyst_id ? project.owner : project.analyst

          {
            project_id: project.id,
            project_title: project.title,
            other_user_name: other_user&.full_name,
            other_user_role: other_user&.role,
            unread_count: unread,
            last_message_body: last_message&.body&.truncate(80),
            last_message_at: last_message&.created_at,
            last_message_sender_name: last_message&.sender&.full_name
          }
        end

        conversations.sort_by! { |c| c[:last_message_at] || Time.at(0) }.reverse!

        total_unread = conversations.sum { |c| c[:unread_count] }

        render json: {
          data: conversations,
          meta: { total_unread_count: total_unread }
        }
      end

      # POST /api/v1/chat_conversations/request_agent
      def request_agent
        projects_without_analyst = InvestmentProject
          .where(owner_id: current_user.id, analyst_id: nil)
          .where.not(status: [:draft, :rejected, :repaid])

        if projects_without_analyst.empty?
          return render json: { message: "Tous vos projets ont deja un analyste assigne." }, status: :ok
        end

        projects_without_analyst.each do |project|
          NotificationService.notify_admins!(
            actor: current_user,
            notifiable: project,
            type: "agent_request",
            title: "Demande d'agent - #{project.title}",
            body: "#{current_user.full_name} demande qu'un analyste soit assigne au projet « #{project.title} »."
          )
        end

        render json: {
          message: "Votre demande a ete envoyee. Un analyste sera assigne prochainement.",
          projects_count: projects_without_analyst.count
        }, status: :ok
      end
    end
  end
end
