import client from './client';

export const demoAnalystApi = {
    listProjects(params = {}) {
        return client.get('/demo/analyst/projects', { params });
    },

    getProject(id) {
        return client.get(`/demo/analyst/projects/${id}`);
    },

    requestInfo(id, fields, comment = '') {
        return client.post(`/demo/analyst/projects/${id}/request_info`, { fields, comment });
    },

    approveProject(id, comment = '') {
        return client.patch(`/demo/analyst/projects/${id}/approve`, { comment });
    },

    rejectProject(id, comment = '') {
        return client.patch(`/demo/analyst/projects/${id}/reject`, { comment });
    },
};
