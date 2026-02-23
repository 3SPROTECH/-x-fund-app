module Api
  module V1
    class NotificationsController < ApplicationController
      def index
        notifications = current_user.notifications.recent
        notifications = notifications.unread if params[:unread] == "true"
        notifications = paginate(notifications)

        render json: {
          data: notifications.map { |n| NotificationSerializer.new(n).serializable_hash[:data] },
          meta: pagination_meta(notifications).merge(unread_count: current_user.notifications.unread.count)
        }
      end

      def unread_count
        render json: { unread_count: current_user.notifications.unread.count }
      end

      def mark_as_read
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!
        render json: { data: NotificationSerializer.new(notification).serializable_hash[:data] }
      end

      def mark_all_as_read
        current_user.notifications.unread.update_all(read_at: Time.current)
        render json: { message: "Toutes les notifications ont ete lues." }
      end

      def destroy
        notification = current_user.notifications.find(params[:id])
        notification.destroy!
        render json: { message: "Notification supprimee." }
      end

      def destroy_all
        current_user.notifications.destroy_all
        render json: { message: "Toutes les notifications ont ete supprimees." }
      end
    end
  end
end
