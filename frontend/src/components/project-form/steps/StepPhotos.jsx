import { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import useProjectFormStore from '../../../stores/useProjectFormStore';
import { getImageUrl } from '../../../api/client';

const MIN_PHOTOS = 3;

export default function StepPhotos() {
  const photos = useProjectFormStore((s) => s.photos);
  const addPhotos = useProjectFormStore((s) => s.addPhotos);
  const removePhoto = useProjectFormStore((s) => s.removePhoto);
  const flags = useProjectFormStore((s) => s.flaggedFields);
  const submitted = useProjectFormStore((s) => s.submitted);
  const projectAttributes = useProjectFormStore((s) => s.projectAttributes);

  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // In read-only mode, show photos from the backend
  const pa = projectAttributes?.attributes || projectAttributes || {};
  const serverPhotos = pa.photos || [];
  const isReadOnly = submitted;

  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) addPhotos(imageFiles);
  }, [addPhotos]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragover(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragover(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragover(false);
  }, []);

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  // ── Read-only mode: show server photos ──
  if (isReadOnly) {
    return (
      <div>
        <h3 className="pf-section-title">Galerie photos</h3>

        {serverPhotos.length > 0 ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {serverPhotos.length} photo{serverPhotos.length > 1 ? 's' : ''} ajoutée{serverPhotos.length > 1 ? 's' : ''}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {serverPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedImage({ url: getImageUrl(photo.url), filename: photo.filename })}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <img
                    src={getImageUrl(photo.url)}
                    alt={photo.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 8px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                    color: 'white',
                    fontSize: '0.7rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {photo.filename}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '14px',
            border: '2px dashed var(--border)',
            background: 'rgba(0, 0, 0, 0.015)',
          }}>
            <ImageIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Aucune photo soumise avec ce projet
            </p>
          </div>
        )}

        {/* Lightbox */}
        {selectedImage && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '2rem',
            }}
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white', transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >
              <X size={24} />
            </button>
            <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
              <div style={{ color: 'white', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                {selectedImage.filename}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Edit mode: upload interface ──
  const meetsMinimum = photos.length >= MIN_PHOTOS;

  return (
    <div>
      <h3 className="pf-section-title">Galerie photos</h3>

      {/* Counter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        background: meetsMinimum
          ? 'rgba(16, 185, 129, 0.08)'
          : 'rgba(245, 158, 11, 0.08)',
        border: `1px solid ${meetsMinimum ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
      }}>
        {meetsMinimum
          ? <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          : <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
        }
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          {photos.length} / {MIN_PHOTOS} photo{MIN_PHOTOS > 1 ? 's' : ''} minimum
        </span>
        {meetsMinimum && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
            — Vous pouvez en ajouter davantage
          </span>
        )}
      </div>

      {/* Validation error */}
      {flags['photos.minimum'] && (
        <div style={{
          color: '#ef4444',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          fontWeight: 500,
        }}>
          {flags['photos.minimum']}
        </div>
      )}

      {/* Gallery grid */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {photos.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              style={{
                position: 'relative',
                aspectRatio: '4/3',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#f9fafb',
              }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onLoad={(e) => {
                  URL.revokeObjectURL(e.target.src);
                }}
              />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)')}
              >
                <X size={14} />
              </button>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '4px 8px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
                color: 'white',
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragover ? 'var(--gold-color, #DAA520)' : 'var(--border)'}`,
          borderRadius: '14px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragover
            ? 'rgba(218, 165, 32, 0.06)'
            : 'rgba(0, 0, 0, 0.015)',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        <ImagePlus
          size={40}
          style={{
            color: dragover ? 'var(--gold-color, #DAA520)' : 'var(--text-muted)',
            marginBottom: '0.75rem',
          }}
        />
        <p style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: 500,
          color: 'var(--text-primary)',
        }}>
          {dragover ? 'Déposez vos photos ici' : 'Glissez vos photos ici ou cliquez pour parcourir'}
        </p>
        <p style={{
          margin: '0.35rem 0 0',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}>
          JPG, PNG, WebP — Plusieurs fichiers acceptés
        </p>
      </div>
    </div>
  );
}
