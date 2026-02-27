import { FileText, Download } from 'lucide-react';
import { getImageUrl } from '../../../api/client';

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function collectDocuments(project) {
  const a = project?.attributes || project || {};
  const snapshot = a.form_snapshot || {};
  const docs = [];

  // Documents from attachments
  if (a.documents && Array.isArray(a.documents)) {
    a.documents.forEach((doc) => {
      docs.push({
        name: doc.filename || doc.name || 'Document',
        url: doc.url,
        size: doc.byte_size || doc.size,
        date: doc.created_at,
        type: doc.content_type || 'application/pdf',
      });
    });
  }

  // Documents from proof files in assets
  const assets = snapshot.assets || [];
  assets.forEach((asset) => {
    if (asset.costs?.items) {
      asset.costs.items.forEach((item) => {
        if (item.hasJustificatif && item.justificatifName) {
          docs.push({
            name: item.justificatifName,
            url: item.justificatifUrl,
            type: 'application/pdf',
          });
        }
      });
    }
  });

  // Proof of equity
  const proj = snapshot.projections || {};
  if (proj.proofFileName) {
    docs.push({
      name: proj.proofFileName,
      url: proj.proofFileUrl,
      type: 'application/pdf',
    });
  }

  return docs;
}

export default function DocumentsTab({ project }) {
  const docs = collectDocuments(project);

  return (
    <div className="apr-panel active">
      <div className="apr-card">
        <div className="apr-card-h">
          <div className="apr-card-h-left">
            <div className="apr-card-icon"><FileText size={14} /></div>
            <span className="apr-card-t">Documents du projet</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--apr-text-tertiary)' }}>{docs.length} fichier{docs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="apr-card-b">
          {docs.length > 0 ? docs.map((doc, i) => (
            <div className="apr-doc" key={i}>
              <div className="apr-doc-ico">
                <FileText size={14} />
              </div>
              <div className="apr-doc-info">
                <div className="apr-doc-name">{doc.name}</div>
                <div className="apr-doc-meta">
                  {[
                    doc.type?.includes('pdf') ? 'PDF' : doc.type?.split('/')[1]?.toUpperCase(),
                    formatFileSize(doc.size),
                    doc.date ? new Date(doc.date).toLocaleDateString('fr-FR') : null,
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
              {doc.url && (
                <a
                  href={getImageUrl ? getImageUrl(doc.url) : doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apr-doc-dl"
                >
                  Telecharger
                </a>
              )}
            </div>
          )) : (
            <div className="apr-empty">
              <FileText size={28} style={{ opacity: 0.25, marginBottom: 6 }} /><br />
              Aucun document disponible pour ce projet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
