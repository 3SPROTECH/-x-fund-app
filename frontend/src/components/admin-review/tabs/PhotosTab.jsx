import { useState } from 'react';
import { Image, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../../../api/client';

export default function PhotosTab({ project }) {
  const a = project?.attributes || project || {};
  const photos = a.photos || a.property_photos || a.images || [];
  const [modalIndex, setModalIndex] = useState(null);

  const openModal = (idx) => setModalIndex(idx);
  const closeModal = () => setModalIndex(null);
  const prev = () => setModalIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  const next = () => setModalIndex((i) => (i < photos.length - 1 ? i + 1 : 0));

  return (
    <div className="apr-panel active">
      <div className="apr-card">
        <div className="apr-card-h">
          <div className="apr-card-h-left">
            <div className="apr-card-icon"><Image size={14} /></div>
            <span className="apr-card-t">Photos du projet</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--apr-text-tertiary)' }}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="apr-card-b">
          {photos.length > 0 ? (
            <div className="apr-photo-grid">
              {photos.map((photo, idx) => (
                <div key={photo.id || idx} className="apr-photo-thumb" onClick={() => openModal(idx)}>
                  {photo.url ? (
                    <img
                      src={getImageUrl ? getImageUrl(photo.url) : photo.url}
                      alt={photo.filename || `Photo ${idx + 1}`}
                      loading="lazy"
                    />
                  ) : (
                    <Image size={20} style={{ opacity: 0.3 }} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="apr-empty">
              <Image size={28} style={{ opacity: 0.25, marginBottom: 6 }} /><br />
              Aucune photo disponible pour ce projet.
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {modalIndex != null && photos[modalIndex] && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl ? getImageUrl(photos[modalIndex].url) : photos[modalIndex].url}
              alt={photos[modalIndex].filename || `Photo ${modalIndex + 1}`}
              style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }}
            />
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: -12, right: -12, background: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
            {photos.length > 1 && (
              <>
                <button onClick={prev} style={{ position: 'absolute', left: -48, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={next} style={{ position: 'absolute', right: -48, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <div style={{ textAlign: 'center', color: '#fff', fontSize: 13, marginTop: 8, opacity: 0.7 }}>
              {modalIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
