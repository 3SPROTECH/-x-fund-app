import client from './client';

export const demoPorteurApi = {
    getInfoRequest(projectId) {
        return client.get(`/demo/porteur/projects/${projectId}/info_request`);
    },

    submitInfoResponse(projectId, responses) {
        return client.patch(`/demo/porteur/projects/${projectId}/info_request/submit`, { responses });
    },
};
