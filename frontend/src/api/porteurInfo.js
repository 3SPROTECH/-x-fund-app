import client from './client';

export const porteurInfoApi = {
  getInfoRequest(projectId) {
    return client.get(`/porteur/projects/${projectId}/info_request`);
  },

  /**
   * Submit info request responses, including file uploads.
   * @param {string} projectId
   * @param {Object} submissions - { [irId]: { "0": "text", "1": "text", ... } }
   * @param {Object} fileMap - { [irId]: { "2": File, ... } } — actual File objects keyed by field index
   */
  submitInfoResponse(projectId, submissions, fileMap = {}) {
    const formData = new FormData();

    // Append text responses
    for (const [irId, responses] of Object.entries(submissions)) {
      for (const [fieldIdx, value] of Object.entries(responses)) {
        formData.append(`submissions[${irId}][${fieldIdx}]`, value);
      }
    }

    // Append file uploads
    for (const [irId, files] of Object.entries(fileMap)) {
      for (const [fieldIdx, file] of Object.entries(files)) {
        if (file instanceof File) {
          formData.append(`files[${irId}][${fieldIdx}]`, file);
        }
      }
    }

    return client.patch(`/porteur/projects/${projectId}/info_request/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
