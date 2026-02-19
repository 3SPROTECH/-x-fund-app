import { useState } from 'react';
import { projectImagesApi } from '../../../api/images';
import { getImageUrl } from '../../../api/client';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectPhotosTab({ project, projectId, isAdmin, onRefresh }) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const a = project.attributes || project;

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      await projectImagesApi.uploadImages(projectId, files);
      toast.success(`${files.length} image(s) ajoutée(s) avec succès`);
      onRefresh();
      e.target.value = '';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette image ?')) return;

    try {
      await projectImagesApi.deleteImage(projectId, imageId);
      toast.success('Image supprimée');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '.25rem' }}>Galerie du projet</h3>
            <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {(a.images?.length || 0) + (a.property_photos?.length || 0)} photo(s)
            </p>
          </div>
          {isAdmin && (
            <div>
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleUploadImages}
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                {uploadingImages ? (
                  <><div className="spinner spinner-sm" /> Upload en cours...</>
                ) : (
                  <><Upload size={16} /> Ajouter des photos</>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Images du projet */}
        {a.images && a.images.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '.9rem', marginBottom: '.75rem', color: 'var(--text-secondary)' }}>
              Photos du projet ({a.images.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {a.images.map((img) => (
                <div key={img.id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={() => setSelectedImage({ url: getImageUrl(img.url), filename: img.filename })}>
                  <img
                    src={getImageUrl(img.url)}
                    alt={img.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                  />
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '.5rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    color: 'white',
                    fontSize: '.75rem',
                  }}>
                    {img.filename}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos du bien immobilier */}
        {a.property_photos && a.property_photos.length > 0 && (
          <div>
            <h4 style={{ fontSize: '.9rem', marginBottom: '.75rem', color: 'var(--text-secondary)' }}>
              Photos du bien immobilier ({a.property_photos.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {a.property_photos.map((photo) => (
                <div key={photo.id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => setSelectedImage({ url: getImageUrl(photo.url), filename: photo.filename })} onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}>
                  <img
                    src={getImageUrl(photo.url)}
                    alt={photo.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '.5rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    color: 'white',
                    fontSize: '.75rem',
                  }}>
                    {photo.filename}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {(!a.images || a.images.length === 0) && (!a.property_photos || a.property_photos.length === 0) && (
          <div style={{
            aspectRatio: '16/9',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
            border: '2px dashed rgba(79, 70, 229, 0.3)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.5rem',
            color: 'var(--text-secondary)',
          }}>
            <ImageIcon size={40} opacity={0.5} />
            <span style={{ fontSize: '.875rem' }}>Aucune photo pour le moment</span>
            {isAdmin && (
              <label htmlFor="image-upload" style={{ marginTop: '.5rem', cursor: 'pointer', color: 'var(--primary)', fontSize: '.875rem', textDecoration: 'underline' }}>
                Ajouter la première photo
              </label>
            )}
          </div>
        )}
      </div>

      {/* Modal pour visualiser l'image en grand */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={24} />
          </button>
          <div
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            />
            <div
              style={{
                color: 'white',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
            >
              {selectedImage.filename}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
