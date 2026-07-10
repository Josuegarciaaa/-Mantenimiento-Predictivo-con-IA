import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './CopilotChat.css';
import { useTranslation } from 'react-i18next';

export default function CopilotChat({ engineContext }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState(null); // null, 'en', 'es'
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const formatMarkdown = (text) => {
        // Un parseador muy simple para negritas y saltos de línea para simular Markdown
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
        return { __html: html };
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:3001/api/chat/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message: userMsg.text,
                    context: engineContext,
                    language: lang
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: data.response }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: lang === 'en' ? 'Connection error with Copilot.' : 'Error de conexión con el Copilot.' }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: 'El servidor de IA no está disponible en este momento.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Widget — montado via React Portal directamente en document.body
    // Esto garantiza que position:fixed no sea roto por ningun ancestro
    // con overflow:hidden, transform o perspective.
    const widget = (
        <div className={`copilot-container ${isOpen ? 'open' : ''}`}>
            {!isOpen && (
                <button className="copilot-fab" onClick={() => setIsOpen(true)}>
                    <span className="fab-icon">ai</span>
                    <span className="fab-text">AI Copilot</span>
                </button>
            )}

            {isOpen && (
                <div className="copilot-window">
                    <div className="copilot-header">
                        <div className="copilot-title">
                            <span className="ai-icon">ai</span>
                            maintenance ai copilot
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    
                    {!lang ? (
                        <div className="copilot-messages" style={{ justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Select Language</div>
                                <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Elige tu idioma</div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button 
                                    className="copilot-send" 
                                    style={{ borderRadius: '8px', padding: '10px 24px', width: 'auto' }}
                                    onClick={() => {
                                        setLang('en');
                                        setMessages([{ id: 1, sender: 'ai', text: 'Hello, I am your **AI Maintenance Copilot**. Ask me about the current status, risk factors, or maintenance recommendations for this engine.' }]);
                                    }}
                                >
                                    English
                                </button>
                                <button 
                                    className="copilot-send" 
                                    style={{ borderRadius: '8px', padding: '10px 24px', width: 'auto' }}
                                    onClick={() => {
                                        setLang('es');
                                        setMessages([{ id: 1, sender: 'ai', text: 'Hola, soy tu **AI Maintenance Copilot**. Pregúntame sobre el estado actual, factores de riesgo o recomendaciones de mantenimiento para este motor.' }]);
                                    }}
                                >
                                    Español
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="copilot-messages">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`message ${msg.sender}`}>
                                        <div className="message-bubble" dangerouslySetInnerHTML={formatMarkdown(msg.text)}></div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="message ai">
                                        <div className="message-bubble typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="copilot-input-area" onSubmit={handleSend}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={lang === 'en' ? "Ask something about the engine..." : "Pregunta algo sobre el motor..."}
                                    className="copilot-input"
                                />
                                <button type="submit" className="copilot-send" style={{ width: '40px', padding: 0 }} disabled={!input.trim() || isTyping}>
                                    ▶
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    return ReactDOM.createPortal(widget, document.body);
}
