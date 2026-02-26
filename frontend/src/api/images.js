import client from './client';

export const propertyImagesApi = {
  uploadPhotos(propertyId, photos) {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append('photos[]', photo);
    });
    return client.post(`/properties/${propertyId}/upload_photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePhoto(propertyId, photoId) {
    return client.delete(`/properties/${propertyId}/delete_photo/${photoId}`);
  },
};

export const projectPhotosApi = {
  uploadPhotos(projectId, photos) {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append('photos[]', photo);
    });
    return client.post(`/investment_projects/${projectId}/upload_photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePhoto(projectId, photoId) {
    return client.delete(`/investment_projects/${projectId}/delete_photo/${photoId}`);
  },
};

export const projectImagesApi = {
  uploadImages(projectId, images) {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images[]', image);
    });
    return client.post(`/investment_projects/${projectId}/upload_images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage(projectId, imageId) {
    return client.delete(`/investment_projects/${projectId}/delete_image/${imageId}`);
  },
};

export const projectDocumentsApi = {
  uploadDocuments(projectId, documents) {
    const formData = new FormData();
    documents.forEach((doc) => {
      formData.append('documents[]', doc);
    });
    return client.post(`/investment_projects/${projectId}/upload_documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
