import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import analystAvatar from '../assets/analyst.jpg';
import './FloatingChat.css';

const ANALYST = {
    name: 'Delmar Renaud',
    role: 'Analyste',
    avatar: analystAvatar,
};

const INITIAL_MESSAGES = [
    {
        id: 1,
        from: 'analyst',
        text: 'Bonjour ! Je suis Delmar, votre analyste dédié. N\'hésitez pas à me poser vos questions concernant votre dossier ou le processus de financement.',
        time: '10:30',
    },
];

export default function FloatingChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState(1);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (open) {
            setUnread(0);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [open, messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;

        const now = new Date();
        const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        setMessages((prev) => [
            ...prev,
            { id: Date.now(), from: 'user', text, time },
        ]);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* ── Chat Panel ── */}
            <div className={`fc-panel${open ? ' fc-panel--open' : ''}`}>
                {/* Header */}
                <div className="fc-header">
                    <div className="fc-header-info">
                        <img src={ANALYST.avatar} alt={ANALYST.name} className="fc-header-avatar" />
                        <div>
                            <span className="fc-header-name">{ANALYST.name}</span>
                            <span className="fc-header-role">{ANALYST.role}</span>
                        </div>
                    </div>
                    <div className="fc-header-actions">
                        <button className="fc-header-btn" onClick={() => setOpen(false)} title="Réduire">
                            <Minimize2 size={16} />
                        </button>
                        <button className="fc-header-btn" onClick={() => setOpen(false)} title="Fermer">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="fc-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`fc-msg ${msg.from === 'analyst' ? 'fc-msg--analyst' : 'fc-msg--user'}`}>
                            {msg.from === 'analyst' && (
                                <img src={ANALYST.avatar} alt="" className="fc-msg-avatar" />
                            )}
                            <div className="fc-msg-bubble">
                                <p>{msg.text}</p>
                                <span className="fc-msg-time">{msg.time}</span>
                            </div>
                        </div>
                    ))}
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
                        placeholder="Écrivez votre message..."
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
            </div>

            {/* ── Floating Button ── */}
            <button
                className={`fc-fab${open ? ' fc-fab--hidden' : ''}`}
                onClick={() => setOpen(true)}
                title="Ouvrir le chat"
            >
                <MessageCircle size={24} />
                {unread > 0 && <span className="fc-fab-badge">{unread}</span>}
            </button>
        </>
    );
}
