import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Download, FileText, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import client from '../../api/client';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
const PDF_EXTENSIONS = ['pdf'];
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
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

function PdfViewer({ url, fileName }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  // Fetch the PDF as a blob via axios (sends JWT)
  useEffect(() => {
    let revoke = null;
    setLoading(true);
    setError(null);

    client.get(url, { responseType: 'blob', baseURL: '' })
      .then((res) => {
        const objectUrl = URL.createObjectURL(res.data);
        revoke = objectUrl;
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        setError('Impossible de charger le document.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [url]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setPageNumber(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_ZOOM, s + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_ZOOM, s - ZOOM_STEP));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setScale((s) => {
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s + delta));
      });
    }
  }, []);

  const prevPage = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - 1));
  }, []);

  const nextPage = useCallback(() => {
    setPageNumber((p) => Math.min(numPages || 1, p + 1));
  }, [numPages]);

  if (loading) {
    return (
      <div className="an-docviewer-pdf-loading">
        <Loader2 size={24} className="an-spin" />
        <span>Chargement du document...</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="an-docviewer-pdf-loading">
        <FileText size={24} />
        <span>{error || 'Document introuvable.'}</span>
      </div>
    );
  }

  return (
    <div className="an-docviewer-pdf-container" ref={containerRef} onWheel={handleWheel}>
      <Document
        file={blobUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="an-docviewer-pdf-loading">
            <Loader2 size={24} className="an-spin" />
            <span>Chargement...</span>
          </div>
        }
        error={
          <div className="an-docviewer-pdf-loading">
            <FileText size={24} />
            <span>Erreur de chargement du PDF.</span>
          </div>
        }
      >
        <div className="an-docviewer-pdf-page">
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </div>
      </Document>

      <div className="an-docviewer-zoom-controls">
        {numPages > 1 && (
          <>
            <button className="an-docviewer-zoom-btn" onClick={prevPage} disabled={pageNumber <= 1} title="Page précédente">
              <ChevronLeft size={16} />
            </button>
            <span className="an-docviewer-page-nav">{pageNumber} / {numPages}</span>
            <button className="an-docviewer-zoom-btn" onClick={nextPage} disabled={pageNumber >= numPages} title="Page suivante">
              <ChevronRight size={16} />
            </button>
            <span className="an-docviewer-controls-sep" />
          </>
        )}
        <button className="an-docviewer-zoom-btn" onClick={handleZoomOut} title="Dézoomer">
          <ZoomOut size={16} />
        </button>
        <span className="an-docviewer-zoom-level">{Math.round(scale * 100)}%</span>
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
          <PdfViewer url={url} fileName={fileName} />
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
