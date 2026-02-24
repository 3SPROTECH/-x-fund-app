import client from './client';

const chatApi = {
  getConversations() {
    return client.get('/chat_conversations');
  },

  getMessages(projectId, params = {}) {
    return client.get(`/investment_projects/${projectId}/chat_messages`, { params });
  },

  sendMessage(projectId, body) {
    return client.post(`/investment_projects/${projectId}/chat_messages`, {
      chat_message: { body },
    });
  },

  markAsRead(projectId) {
    return client.patch(`/investment_projects/${projectId}/chat_messages/mark_as_read`);
  },

  unreadCount(projectId) {
    return client.get(`/investment_projects/${projectId}/chat_messages/unread_count`);
  },

  requestAgent() {
    return client.post('/chat_conversations/request_agent');
  },
};

export default chatApi;
