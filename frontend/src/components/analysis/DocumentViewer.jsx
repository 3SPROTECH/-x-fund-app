import { ArrowLeft, Download, FileText } from 'lucide-react';

export default function DocumentViewer({ document, onBack }) {
  const fileName = document?.fileName || 'Document';

  return (
    <div className="an-docviewer">
      <div className="an-docviewer-header">
        <button className="an-docviewer-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Retour
        </button>
        <div className="an-docviewer-title">{fileName}</div>
        <button className="an-docviewer-download">
          <Download size={14} />
          Telecharger
        </button>
      </div>

      <div className="an-docviewer-body">
        <div className="an-docviewer-placeholder">
          <div className="an-docviewer-placeholder-icon">
            <FileText size={32} />
          </div>
          <h4>{fileName}</h4>
          <p>
            Le visualiseur de documents sera disponible dans une prochaine mise a jour.
          </p>
          <span className="an-docviewer-filetype">
            {document?.label || 'Document'}
          </span>
        </div>
      </div>
    </div>
  );
}
