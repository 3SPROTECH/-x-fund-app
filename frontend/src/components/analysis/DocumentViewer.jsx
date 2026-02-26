import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Download, FileText, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
const PDF_EXTENSIONS = ['pdf'];
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function getFileType(fileName) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (PDF_EXTENSIONS.includes(ext)) return 'pdf';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  return 'unknown';
}

function Placeholder({ fileName, label }) {
  return (
    <div className="an-docviewer-placeholder">
      <div className="an-docviewer-placeholder-icon">
        <FileText size={32} />
      </div>
      <h4>{fileName}</h4>
      <p>Aucun aperçu disponible pour ce document.</p>
      <span className="an-docviewer-filetype">{label || 'Document'}</span>
    </div>
  );
}

function ImageViewer({ url, fileName }) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta));
    });
  }, []);

  return (
    <div className="an-docviewer-image-container" ref={containerRef} onWheel={handleWheel}>
      <img
        src={url}
        alt={fileName}
        className="an-docviewer-image"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
      />
      <div className="an-docviewer-zoom-controls">
        <button className="an-docviewer-zoom-btn" onClick={handleZoomOut} title="Dézoomer">
          <ZoomOut size={16} />
        </button>
        <span className="an-docviewer-zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="an-docviewer-zoom-btn" onClick={handleZoomIn} title="Zoomer">
          <ZoomIn size={16} />
        </button>
        <button className="an-docviewer-zoom-btn" onClick={handleReset} title="Réinitialiser">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

export default function DocumentViewer({ document, onBack }) {
  const fileName = document?.fileName || 'Document';
  const url = document?.url;
  const fileType = getFileType(fileName);
  const hasPreview = url && fileType !== 'unknown';

  return (
    <div className="an-docviewer">
      <div className="an-docviewer-header">
        <button className="an-docviewer-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Retour
        </button>
        <div className="an-docviewer-title">{fileName}</div>
        {url ? (
          <a className="an-docviewer-download" href={url} download={fileName} target="_blank" rel="noopener noreferrer">
            <Download size={14} />
            Télécharger
          </a>
        ) : (
          <button className="an-docviewer-download" disabled>
            <Download size={14} />
            Télécharger
          </button>
        )}
      </div>

      <div className={`an-docviewer-body${hasPreview ? ' an-docviewer-body--active' : ''}`}>
        {!url && <Placeholder fileName={fileName} label={document?.label} />}
        {url && fileType === 'pdf' && (
          <iframe src={url} className="an-docviewer-iframe" title={fileName} />
        )}
        {url && fileType === 'image' && (
          <ImageViewer url={url} fileName={fileName} />
        )}
        {url && fileType === 'unknown' && (
          <Placeholder fileName={fileName} label={document?.label} />
        )}
      </div>
    </div>
  );
}
