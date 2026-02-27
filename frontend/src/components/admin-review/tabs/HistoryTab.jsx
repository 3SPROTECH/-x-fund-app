import { Clock, MessageSquare } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { PROJECT_STATUS_LABELS } from '../../../utils/constants';

function buildTimeline(project) {
  const a = project?.attributes || project || {};
  const events = [];

  // Helper to add an event with a date for sorting; order is used as tiebreaker
  let seq = 0;
  const add = (label, date, state = 'done', detail = null) => {
    if (date) events.push({ label, date, state, detail, order: seq++ });
  };

  // 1. Project created
  add('Projet soumis par le porteur', a.created_at);

  // 2. Analyst assigned (only if we have a real assignment timestamp)
  if (a.analyst_name && a.analyst_assigned_at) {
    add(`Analyste assigne — ${a.analyst_name}`, a.analyst_assigned_at);
  }

  // 3. Analysis submitted (analyst reviewed)
  if (a.analyst_reviewed_at) {
    add('Analyse soumise par l\'analyste', a.analyst_reviewed_at);
  }

  // 4. Admin decision (approve / reject / redo)
  if (a.reviewed_at) {
    const reviewer = a.reviewer_name || 'Administrateur';
    if (a.status === 'rejected') {
      add(`Projet rejete par ${reviewer}`, a.reviewed_at, 'done', a.review_comment);
    } else if (a.review_comment && (a.status === 'pending_analysis' || a.status === 'info_requested' || a.status === 'info_resubmitted')) {
      // Redo requested — status went back to pending_analysis with a review_comment
      add(`Reprise d'analyse demandee par ${reviewer}`, a.reviewed_at, 'done', a.review_comment);
    } else if (a.status === 'approved' || a.status === 'signing' || a.status === 'funding_active' || a.status === 'funded') {
      add(`Projet approuve par ${reviewer}`, a.reviewed_at);
    }
  }

  // 5. Contract sent
  if (a.yousign_sent_at) {
    add('Contrat envoye via YouSign', a.yousign_sent_at);
  }

  // 6. Funding started
  if (a.funding_start_date && (a.status === 'funding_active' || a.status === 'funded')) {
    add('Debut de la collecte', a.funding_start_date);
  }

  // Sort chronologically (most recent first); use insertion order as tiebreaker
  events.sort((x, y) => new Date(y.date) - new Date(x.date) || y.order - x.order);

  // Mark the first event (most recent) as active
  if (events.length > 0) {
    events[0].state = 'active';
  }

  // Append current status label at the top if it differs from the most recent event
  const statusLabel = PROJECT_STATUS_LABELS[a.status];
  if (statusLabel && events.length > 0) {
    events[0].statusBadge = statusLabel;
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
                  <div style={{ flex: 1 }}>
                    <div className="apr-tl-event">{event.label}</div>
                    {event.detail && (
                      <div style={{ fontSize: 12, color: 'var(--apr-text-tertiary)', marginTop: 2, fontStyle: 'italic' }}>
                        &laquo; {event.detail} &raquo;
                      </div>
                    )}
                  </div>
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
