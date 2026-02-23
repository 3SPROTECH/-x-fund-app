import client from './client';

const notificationsApi = {
  list(params = {}) {
    return client.get('/notifications', { params });
  },
  unreadCount() {
    return client.get('/notifications/unread_count');
  },
  markAsRead(id) {
    return client.patch(`/notifications/${id}/mark_as_read`);
  },
  markAllAsRead() {
    return client.patch('/notifications/mark_all_as_read');
  },
  delete(id) {
    return client.delete(`/notifications/${id}`);
  },
  deleteAll() {
    return client.delete('/notifications/destroy_all');
  },
};

export default notificationsApi;
