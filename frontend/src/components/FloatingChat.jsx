import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ArrowLeft, Headphones } from 'lucide-react';
import chatApi from '../api/chat';
import './FloatingChat.css';

const CONV_POLL = 30000; // 30s
const MSG_POLL = 10000;  // 10s

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'a l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function FloatingChat() {
    const [open, setOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list'); // 'list' | 'thread'
    const [agentRequested, setAgentRequested] = useState(false);
    const [agentRequesting, setAgentRequesting] = useState(false);
    const bottomRef = useRef(null);
    const panelRef = useRef(null);
    const lastMsgTsRef = useRef(null);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const res = await chatApi.getConversations();
            const data = res.data.data || [];
            setConversations(data);
            setTotalUnread(res.data.meta?.total_unread_count || 0);
            return data;
        } catch { return []; }
    }, []);

    // Fetch once on mount for unread badge
    useEffect(() => { fetchConversations(); }, []);

    // Poll only when chat is open
    useEffect(() => {
        if (!open) return;
        fetchConversations();
        const interval = setInterval(fetchConversations, CONV_POLL);
        return () => clearInterval(interval);
    }, [open, fetchConversations]);

    // When opening, auto-select if only 1 conversation
    useEffect(() => {
        if (open && conversations.length === 1 && !selectedProjectId) {
            selectConversation(conversations[0]);
        } else if (open && conversations.length > 1 && !selectedProjectId) {
            setView('list');
        }
    }, [open, conversations.length]);

    // Fetch messages for selected project (polling every 10s when open)
    useEffect(() => {
        if (!open || !selectedProjectId) return;

        lastMsgTsRef.current = null;
        let cancelled = false;

        const fetchMessages = async (initial) => {
            try {
                const params = initial ? { per_page: 50 } : {};
                if (!initial && lastMsgTsRef.current) {
                    params.since = lastMsgTsRef.current;
                }
                const res = await chatApi.getMessages(selectedProjectId, params);
                const raw = res.data.data || [];
                const newMsgs = raw.map((d) => d.attributes || d);

                // Update the last timestamp ref
                if (newMsgs.length > 0) {
                    const lastTs = newMsgs[newMsgs.length - 1].created_at;
                    if (lastTs) lastMsgTsRef.current = lastTs;
                }

                if (initial) {
                    setMessages(newMsgs);
                } else if (newMsgs.length > 0) {
                    // Deduplicate by ID before appending
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const unique = newMsgs.filter((m) => !existingIds.has(m.id));
                        return unique.length > 0 ? [...prev, ...unique] : prev;
                    });
                }

                // Mark as read
                if (newMsgs.length > 0 || initial) {
                    chatApi.markAsRead(selectedProjectId).catch(() => {});
                    fetchConversations();
                }
            } catch { /* silent */ }
            if (initial && !cancelled) setLoading(false);
        };

        setLoading(true);
        fetchMessages(true);
        const interval = setInterval(() => fetchMessages(false), MSG_POLL);
        return () => { cancelled = true; clearInterval(interval); };
    }, [open, selectedProjectId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (open && view === 'thread') {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open, view]);

    const selectConversation = (conv) => {
        setSelectedProjectId(conv.project_id);
        setSelectedConv(conv);
        setMessages([]);
        lastMsgTsRef.current = null;
        setView('thread');
    };

    const goBackToList = () => {
        setSelectedProjectId(null);
        setSelectedConv(null);
        setMessages([]);
        setView('list');
        setInput('');
    };

    const handleOpen = () => {
        setOpen(true);
        if (conversations.length === 0) {
            fetchConversations();
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedProjectId(null);
        setSelectedConv(null);
        setMessages([]);
        setView('list');
        setInput('');
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !selectedProjectId) return;
        setInput('');

        const tempId = `temp-${Date.now()}`;
        const tempMsg = {
            id: tempId,
            body: text,
            is_mine: true,
            sender_name: 'Vous',
            created_at: new Date().toISOString(),
            _sending: true,
        };
        setMessages((prev) => [...prev, tempMsg]);

        try {
            const res = await chatApi.sendMessage(selectedProjectId, text);
            const real = res.data.data?.attributes || res.data.data;
            setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...real, is_mine: true } : m)));
            if (real.created_at) lastMsgTsRef.current = real.created_at;
            fetchConversations();
        } catch {
            setMessages((prev) => prev.map((m) =>
                m.id === tempId ? { ...m, _sending: false, _failed: true } : m
            ));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRequestAgent = async () => {
        if (agentRequesting || agentRequested) return;
        setAgentRequesting(true);
        try {
            await chatApi.requestAgent();
            setAgentRequested(true);
        } catch { /* silent */ }
        setAgentRequesting(false);
    };

    const hasConversations = conversations.length > 0;
    const multiConv = conversations.length > 1;

    // Build the welcome greeting for the thread view
    const getWelcomeMessage = () => {
        if (!selectedConv) return null;
        const name = selectedConv.other_user_name;
        const firstName = name ? name.split(' ')[0] : null;
        return {
            id: 'welcome',
            body: firstName
                ? `Bonjour ! Je suis ${firstName}, votre analyste dedie pour ce projet. N'hesitez pas a me poser vos questions concernant votre dossier ou le processus de financement.`
                : `Bonjour ! Je suis votre analyste dedie. N'hesitez pas a me poser vos questions.`,
            is_mine: false,
            sender_name: name || 'Analyste',
            created_at: null,
            _welcome: true,
        };
    };

    // Determine header info based on state
    const getHeaderInfo = () => {
        if (view === 'thread' && selectedConv) {
            return {
                name: selectedConv.other_user_name || 'Analyste',
                sub: selectedConv.project_title,
            };
        }
        if (hasConversations) {
            return { name: 'Conversations', sub: `${conversations.length} projet(s)` };
        }
        return { name: 'X-Fund Chat', sub: 'Assistance projet' };
    };

    const headerInfo = getHeaderInfo();

    // All messages to display = welcome + real messages
    const displayMessages = view === 'thread'
        ? [getWelcomeMessage(), ...messages].filter(Boolean)
        : [];

    return (
        <>
            {/* ── Chat Panel ── */}
            <div className={`fc-panel${open ? ' fc-panel--open' : ''}`} ref={panelRef}>
                {/* Header */}
                <div className="fc-header">
                    <div className="fc-header-info">
                        {view === 'thread' && multiConv && (
                            <button className="fc-header-back" onClick={goBackToList} title="Retour">
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        {view === 'thread' && selectedConv && (
                            <div className="fc-header-avatar-circle">
                                {(selectedConv.other_user_name || '?').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <span className="fc-header-name">{headerInfo.name}</span>
                            <span className="fc-header-role">{headerInfo.sub}</span>
                        </div>
                    </div>
                    <div className="fc-header-actions">
                        <button className="fc-header-btn" onClick={handleClose} title="Fermer">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                {view === 'list' ? (
                    <div className="fc-conv-list">
                        {!hasConversations ? (
                            /* No analyst assigned — request agent CTA */
                            <div className="fc-empty-state">
                                <div className="fc-empty-icon">
                                    <Headphones size={36} />
                                </div>
                                <p className="fc-empty-title">Besoin d'assistance ?</p>
                                <p className="fc-empty-desc">
                                    Demandez a etre mis en contact avec un analyste dedie qui vous accompagnera dans votre projet.
                                </p>
                                {agentRequested ? (
                                    <div className="fc-agent-confirmed">
                                        <span>Demande envoyee !</span>
                                        <small>Un analyste sera assigne prochainement.</small>
                                    </div>
                                ) : (
                                    <button
                                        className="fc-request-agent-btn"
                                        onClick={handleRequestAgent}
                                        disabled={agentRequesting}
                                    >
                                        {agentRequesting ? 'Envoi en cours...' : 'Demander un agent'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.project_id}
                                    className={`fc-conv-item${conv.unread_count > 0 ? ' fc-conv-item--unread' : ''}`}
                                    onClick={() => selectConversation(conv)}
                                >
                                    <div className="fc-conv-avatar">
                                        {(conv.other_user_name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="fc-conv-info">
                                        <div className="fc-conv-name">{conv.other_user_name}</div>
                                        <div className="fc-conv-project">{conv.project_title}</div>
                                        {conv.last_message_body && (
                                            <div className="fc-conv-preview">{conv.last_message_body}</div>
                                        )}
                                    </div>
                                    <div className="fc-conv-meta">
                                        {conv.last_message_at && (
                                            <span className="fc-conv-time">{timeAgo(conv.last_message_at)}</span>
                                        )}
                                        {conv.unread_count > 0 && (
                                            <span className="fc-conv-badge">{conv.unread_count}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="fc-messages">
                            {loading ? (
                                <div className="fc-loading">Chargement...</div>
                            ) : (
                                displayMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`fc-msg ${msg.is_mine ? 'fc-msg--user' : 'fc-msg--analyst'}`}
                                    >
                                        {!msg.is_mine && (
                                            <div className="fc-msg-initials">
                                                {(msg.sender_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className={`fc-msg-bubble${msg._sending ? ' fc-msg--sending' : ''}${msg._failed ? ' fc-msg--failed' : ''}`}>
                                            <p>{msg.body}</p>
                                            {!msg._welcome && (
                                                <span className="fc-msg-time">
                                                    {msg._failed ? 'Echec' : timeAgo(msg.created_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="fc-input-bar">
                            <textarea
                                className="fc-input"
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ecrivez votre message..."
                            />
                            <button
                                className="fc-send-btn"
                                onClick={handleSend}
                                disabled={!input.trim()}
                                title="Envoyer"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Floating Button ── */}
            <button
                className={`fc-fab${open ? ' fc-fab--hidden' : ''}`}
                onClick={handleOpen}
                title="Ouvrir le chat"
            >
                <MessageCircle size={24} />
                {totalUnread > 0 && (
                    <span className="fc-fab-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
                )}
            </button>
        </>
    );
}
