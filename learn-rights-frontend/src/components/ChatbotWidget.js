import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../api/axios';
import { t } from '../utils/translation';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Chatbot.css';

const MIN_W = 340, MIN_H = 420, MAX_W = 700, MAX_H = 800;

/* ─── Helper: pick a good voice ─── */
const pickVoice = () => {
  const voices = window.speechSynthesis?.getVoices() || [];
  const preferred = voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang))
    || voices.find(v => /Google.*US/i.test(v.name))
    || voices.find(v => /Samantha|Zira|Fiona|Karen|Victoria/i.test(v.name))
    || voices.find(v => v.lang.startsWith('en'));
  return preferred || voices[0] || null;
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speakingId, setSpeakingId] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('chatbot_autospeak') !== 'false');
  const [size, setSize] = useState({ w: 390, h: 530 });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const resizing = useRef(false);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
    setMessages(history);
  }, []);

  const saveHistory = (msgs) => localStorage.setItem('chatbotHistory', JSON.stringify(msgs));

  const dataUrlToBase64 = (dataUrl) => {
    if (!dataUrl || !dataUrl.includes(',')) return { base64: null, mime: 'image/jpeg' };
    const [header, b64] = dataUrl.split(',');
    const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    return { base64: b64.trim(), mime };
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !attachment) return;
    const userMessage = {
      text: text || (attachment ? '[Image]' : ''), sender: 'user',
      timestamp: new Date(), id: Date.now(), imageUrl: attachment?.dataUrl || null,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); saveHistory(newMessages);
    setInput('');
    const imageToSend = attachment;
    setAttachment(null); setIsTyping(true);

    try {
      const historyForAI = newMessages.slice(-12).map(m => ({ sender: m.sender, text: m.text }));
      const payload = { message: text || '(no text, see image)', context: 'human rights education', history: historyForAI };
      if (imageToSend?.base64) { payload.imageBase64 = imageToSend.base64; payload.imageMimeType = imageToSend.mimeType; }
      const response = await axios.post('/ai/chatbot', payload);
      const botMessage = { text: response.data.response, sender: 'bot', timestamp: new Date(), id: Date.now() + 1 };
      const updated = [...newMessages, botMessage];
      setMessages(updated); saveHistory(updated);
      if (autoSpeak) speakText(response.data.response, botMessage.id);
    } catch {
      const errMsg = { text: t('chatbot.error', { defaultValue: "Sorry, I couldn't process your request." }), sender: 'bot', timestamp: new Date(), id: Date.now() + 1, isError: true };
      const updated = [...newMessages, errMsg];
      setMessages(updated); saveHistory(updated);
    } finally { setIsTyping(false); }
  };

  /* ─── Text-to-Speech ─── */
  const speakText = useCallback((text, msgId) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/---+/g, '').replace(/\*\*/g, '').replace(/#{1,3}\s*/g, '')
      .replace(/Legal Disclaimer:.*$/ms, '').replace(/Women's Helpline:.*$/m, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; utterance.pitch = 1.05; utterance.volume = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeakingId(msgId || 'auto');
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const toggleAutoSpeak = () => {
    setAutoSpeak(prev => { const next = !prev; localStorage.setItem('chatbot_autospeak', next ? 'true' : 'false'); return next; });
  };

  useEffect(() => {
    if (window.speechSynthesis) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); }
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  /* ─── Enhanced Voice Input ─── */
  const startVoiceInput = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser. Use Chrome.'); return; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); return; }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      alert('Microphone access denied. Please allow microphone permission and try again.');
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setInterimText(''); };
    recognition.onresult = (e) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) { finalText += e.results[i][0].transcript + ' '; }
        else { interim += e.results[i][0].transcript; }
      }
      setInterimText(interim);
      if (finalText.trim()) { setInput(prev => (prev ? prev + ' ' : '') + finalText.trim()); }
    };
    recognition.onend = () => { setIsListening(false); setInterimText(''); recognitionRef.current = null; inputRef.current?.focus(); };
    recognition.onerror = (e) => {
      console.warn('Voice error:', e.error);
      setIsListening(false); setInterimText(''); recognitionRef.current = null;
      if (e.error === 'not-allowed') alert('Microphone access denied. Please allow mic permission.');
    };
    try { recognition.start(); } catch (err) { console.warn('Recognition start failed:', err); setIsListening(false); recognitionRef.current = null; }
  };

  const stopVoiceInput = () => { if (recognitionRef.current) recognitionRef.current.stop(); };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => { const d = reader.result; const { base64, mime } = dataUrlToBase64(d); setAttachment({ dataUrl: d, base64, mimeType: mime }); };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const clearHistory = () => { setMessages([]); localStorage.removeItem('chatbotHistory'); };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  /* ─── Resize logic ─── */
  const onResizeStart = useCallback((e) => {
    e.preventDefault(); resizing.current = true;
    const startX = e.clientX, startY = e.clientY, startW = size.w, startH = size.h;
    const onMove = (ev) => {
      if (!resizing.current) return;
      setSize({ w: Math.min(MAX_W, Math.max(MIN_W, startW - (ev.clientX - startX))), h: Math.min(MAX_H, Math.max(MIN_H, startH - (ev.clientY - startY))) });
    };
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  const canSend = (input.trim() || attachment) && !isTyping;

  const suggestedQuestions = [
    t('chatbot.suggestion1', { defaultValue: 'What are my basic rights?' }),
    t('chatbot.suggestion2', { defaultValue: 'How to file a complaint?' }),
    t('chatbot.suggestion3', { defaultValue: 'Legal aid services?' }),
    t('chatbot.suggestion4', { defaultValue: 'Domestic violence help?' }),
  ];

  return (
    <>
      {/* ── Floating Toggle Button ── */}
      <button type="button" className="cw-toggle" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Close chat' : 'Open chat'}>
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </button>

      {/* ── Widget Panel ── */}
      {isOpen && (
        <div className="cw-panel cb-dark" style={{ width: size.w, height: size.h }}>

          {/* Resize handle (top-left corner) */}
          <div className="cw-resize-handle" onMouseDown={onResizeStart} title="Drag to resize">
            <i className="bi bi-arrows-angle-contract"></i>
          </div>

          {/* Header */}
          <header className="cb-header cw-header">
            <div className="cb-header-left">
              <div className="cb-logo"><i className="bi bi-robot"></i></div>
              <div>
                <h1 className="cb-title">{t('chatbot.title', { defaultValue: 'Bot' })}</h1>
                <p className="cb-subtitle"><span className="cb-status-dot" /> Online</p>
              </div>
            </div>
            <div className="cb-header-actions">
              <button type="button" className={`cb-header-btn ${autoSpeak ? 'cb-active-voice' : ''}`} onClick={toggleAutoSpeak} title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}>
                <i className={`bi ${autoSpeak ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'}`}></i>
              </button>
              {speakingId && (
                <button type="button" className="cb-header-btn cb-stop-speak" onClick={stopSpeaking} title="Stop speaking">
                  <i className="bi bi-stop-circle-fill"></i>
                </button>
              )}
              <button type="button" className="cb-header-btn" onClick={clearHistory} title="New chat">
                <i className="bi bi-trash3"></i>
              </button>
              <button type="button" className="cb-header-btn" onClick={() => setIsOpen(false)} title="Close">
                <i className="bi bi-dash-lg"></i>
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="cb-messages cw-messages">
            {messages.length === 0 && (
              <div className="cb-empty">
                <div className="cb-empty-icon"><i className="bi bi-chat-square-text"></i></div>
                <h3 className="cb-empty-title" style={{ fontSize: '1rem' }}>Ask me anything about your legal rights</h3>
                <p className="cb-empty-sub">{t('chatbot.tryAsking', { defaultValue: 'Try asking:' })}</p>
                <div className="cb-suggestions">
                  {suggestedQuestions.map((q, i) => (
                    <button key={i} type="button" className="cb-chip" onClick={() => { setInput(q); inputRef.current?.focus(); }}>
                      <i className="bi bi-chat-dots cb-chip-icon"></i>{q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`cb-msg ${msg.sender}`}>
                <div className="cb-msg-avatar">
                  {msg.sender === 'user' ? <i className="bi bi-person-fill"></i> : <i className="bi bi-robot"></i>}
                </div>
                <div>
                  <div className={`cb-bubble ${msg.isError ? 'error' : ''}`}>
                    {msg.imageUrl && <img src={msg.imageUrl} alt="" className="cb-msg-image" />}
                    <span className="cb-msg-text">{msg.text}</span>
                  </div>
                  <div className="cb-msg-meta">
                    <span className="cb-msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.sender === 'bot' && !msg.isError && (
                      <button type="button" className={`cb-speak-btn ${speakingId === msg.id ? 'speaking' : ''}`}
                        onClick={() => speakingId === msg.id ? stopSpeaking() : speakText(msg.text, msg.id)}
                        title={speakingId === msg.id ? 'Stop' : 'Listen'}>
                        <i className={`bi ${speakingId === msg.id ? 'bi-stop-fill' : 'bi-volume-up-fill'}`}></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="cb-msg bot">
                <div className="cb-msg-avatar"><i className="bi bi-robot"></i></div>
                <div className="cb-typing"><span className="cb-typing-dot" /><span className="cb-typing-dot" /><span className="cb-typing-dot" /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="cb-input-area cw-input-area">
            {attachment && (
              <div className="cb-preview">
                <img src={attachment.dataUrl} alt="" className="cb-preview-img" />
                <span className="cb-preview-label">Image attached</span>
                <button type="button" className="cb-preview-remove" onClick={() => setAttachment(null)} aria-label="Remove">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            )}
            <div className="cb-input-row">
              <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={onFileChange} aria-hidden />
              <button type="button" className="cb-action-btn cb-btn-attach" onClick={() => fileInputRef.current?.click()} title="Attach image">
                <i className="bi bi-image"></i>
              </button>
              <textarea ref={inputRef} className="cb-textarea" rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyPress}
                placeholder={t('chatbot.placeholder', { defaultValue: 'Type your message...' })} />
              <button type="button" className={`cb-action-btn cb-btn-voice ${isListening ? 'active' : ''}`} onClick={startVoiceInput} disabled={isTyping} title="Voice input">
                <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
              </button>
              <button type="button" className={`cb-send-btn ${canSend ? 'active' : ''}`} onClick={sendMessage} disabled={!canSend} title="Send">
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice overlay */}
      {isListening && (
        <div className="cb-voice-overlay">
          <div className="cb-voice-modal" style={{ background: '#1e293b' }}>
            <div className="cb-voice-pulse"><i className="bi bi-mic-fill cb-voice-icon"></i></div>
            <p className="cb-voice-title" style={{ color: '#e2e8f0' }}>Listening...</p>
            {interimText && <p className="cb-voice-interim" style={{ color: '#a78bfa', fontSize: '0.9rem', fontStyle: 'italic', margin: '0.5rem 0' }}>"{interimText}"</p>}
            <p className="cb-voice-sub">Speak your question clearly</p>
            <button type="button" className="cb-voice-stop" onClick={stopVoiceInput}>
              <i className="bi bi-stop-circle-fill"></i> Stop listening
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
