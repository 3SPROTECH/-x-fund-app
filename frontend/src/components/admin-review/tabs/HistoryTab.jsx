import { Clock, MessageSquare } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

function buildTimeline(project) {
  const a = project?.attributes || project || {};
  const events = [];

  // Current status event (most recent)
  if (a.status === 'analysis_submitted') {
    events.push({
      label: 'Analyse soumise — en attente de decision',
      date: a.analyst_reviewed_at || a.updated_at,
      state: 'active',
    });
  } else if (a.status === 'approved') {
    events.push({ label: 'Projet approuve', date: a.updated_at, state: 'active' });
  } else if (a.status === 'rejected') {
    events.push({ label: 'Projet rejete', date: a.updated_at, state: 'active' });
  } else if (a.status === 'signing') {
    events.push({ label: 'En signature', date: a.updated_at, state: 'active' });
  } else if (a.status === 'funding_active') {
    events.push({ label: 'Collecte en cours', date: a.updated_at, state: 'active' });
  } else if (a.status) {
    events.push({ label: `Statut: ${a.status}`, date: a.updated_at, state: 'active' });
  }

  // Analyst assigned
  if (a.analyst_name) {
    events.push({
      label: `Analyste assigne — ${a.analyst_name}`,
      date: a.analyst_assigned_at || a.created_at,
      state: 'done',
    });
  }

  // Project submitted
  if (a.created_at) {
    events.push({
      label: 'Projet soumis',
      date: a.created_at,
      state: 'done',
    });
  }

  return events;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('fr-FR')} a ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function HistoryTab({ project }) {
  const a = project?.attributes || project || {};
  const timeline = buildTimeline(project);
  const infoRequests = a.info_requests || [];

  return (
    <div className="apr-panel active">
      {/* Timeline */}
      <div className="apr-card apr-mb20">
        <div className="apr-card-h">
          <div className="apr-card-h-left">
            <div className="apr-card-icon"><Clock size={14} /></div>
            <span className="apr-card-t">Historique du projet</span>
          </div>
        </div>
        <div className="apr-card-b">
          {timeline.length > 0 ? (
            <div className="apr-timeline">
              {timeline.map((event, i) => (
                <div className="apr-tl-item" key={i}>
                  <div className={`apr-tl-dot ${event.state}`} />
                  <div className="apr-tl-event">{event.label}</div>
                  {event.date && <div className="apr-tl-date">{formatDateTime(event.date)}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="apr-empty">Aucun evenement enregistre.</div>
          )}
        </div>
      </div>

      {/* Info Requests */}
      <div className="apr-card">
        <div className="apr-card-h">
          <div className="apr-card-h-left">
            <div className="apr-card-icon"><MessageSquare size={14} /></div>
            <span className="apr-card-t">Demandes d'informations</span>
          </div>
        </div>
        <div className="apr-card-b">
          {infoRequests.length > 0 ? (
            infoRequests.map((req, i) => (
              <div className="apr-narr" key={i}>
                <div className="apr-narr-label">{req.author || 'Analyste'} — {formatDate(req.created_at)}</div>
                <p className="apr-narr-text">{req.comment || req.message}</p>
              </div>
            ))
          ) : (
            <div className="apr-empty">
              <MessageSquare size={28} style={{ opacity: 0.25, marginBottom: 6 }} /><br />
              Aucune demande de complement pour ce projet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
