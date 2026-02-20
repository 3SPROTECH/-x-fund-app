import client from './client';

export const porteurInfoApi = {
  getInfoRequest(projectId) {
    return client.get(`/porteur/projects/${projectId}/info_request`);
  },

  submitInfoResponse(projectId, responses) {
    return client.patch(`/porteur/projects/${projectId}/info_request/submit`, { responses });
  },
};
