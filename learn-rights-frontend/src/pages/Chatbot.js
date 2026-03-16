import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../api/axios';
import { t } from '../utils/translation';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Chatbot.css';

/* ─── Helper: pick a good voice ─── */
const pickVoice = () => {
  const voices = window.speechSynthesis?.getVoices() || [];
  // Prefer female English voices (common for assistants)
  const preferred = voices.find(v => /female/i.test(v.name) && /en/i.test(v.lang))
    || voices.find(v => /Google.*US/i.test(v.name))
    || voices.find(v => /Samantha|Zira|Fiona|Karen|Victoria/i.test(v.name))
    || voices.find(v => v.lang.startsWith('en'));
  return preferred || voices[0] || null;
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('chatbot_theme') === 'dark');
  const [speakingId, setSpeakingId] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('chatbot_autospeak') !== 'false');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('chatbot_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
    setMessages(history);
  }, []);

  const saveHistory = (newMessages) => {
    localStorage.setItem('chatbotHistory', JSON.stringify(newMessages));
  };

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
      text: text || (attachment ? t('chatbot.imageSent', { defaultValue: '[Image]' }) : ''),
      sender: 'user',
      timestamp: new Date(),
      id: Date.now(),
      imageUrl: attachment?.dataUrl || null,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveHistory(newMessages);
    setInput('');
    const imageToSend = attachment;
    setAttachment(null);
    setIsTyping(true);

    try {
      const historyForAI = newMessages
        .slice(-12)
        .map((m) => ({ sender: m.sender, text: m.text }));
      const payload = {
        message: text || '(no text, see image)',
        context: 'human rights education',
        history: historyForAI,
      };
      if (imageToSend?.base64) {
        payload.imageBase64 = imageToSend.base64;
        payload.imageMimeType = imageToSend.mimeType;
      }
      const response = await axios.post('/ai/chatbot', payload);
      const botMessage = {
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        id: Date.now() + 1,
      };
      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
      // Auto-speak bot reply if enabled
      if (autoSpeak) speakText(response.data.response, botMessage.id);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: t('chatbot.error', { defaultValue: "Sorry, I couldn't process your request. Please try again." }),
        sender: 'bot',
        timestamp: new Date(),
        id: Date.now() + 1,
        isError: true,
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } finally {
      setIsTyping(false);
    }
  };

  /* ─── Text-to-Speech ─── */
  const speakText = useCallback((text, msgId) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop any current speech
    // Clean text for speech: remove markdown, disclaimers, etc.
    const cleanText = text
      .replace(/---+/g, '')
      .replace(/\*\*/g, '')
      .replace(/#{1,3}\s*/g, '')
      .replace(/Legal Disclaimer:.*$/ms, '')
      .replace(/Women's Helpline:.*$/m, '')
      .trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;
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
    setAutoSpeak(prev => {
      const next = !prev;
      localStorage.setItem('chatbot_autospeak', next ? 'true' : 'false');
      return next;
    });
  };

  // Load voices (may need event listener)
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices(); // trigger load
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  /* ─── Enhanced Voice Input ─── */
  const startVoiceInput = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('chatbot.voiceNotSupported', { defaultValue: 'Voice input not supported in this browser. Use Chrome for best results.' }));
      return;
    }
    // Stop any ongoing speech before listening
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      alert('Microphone access denied. Please allow microphone permission in your browser settings and try again.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      if (finalText.trim()) {
        setInput(prev => (prev ? prev + ' ' : '') + finalText.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
      inputRef.current?.focus();
    };

    recognition.onerror = (e) => {
      console.warn('Voice recognition error:', e.error);
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
      // Only show alert for permission issues
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission and try again.');
      }
      // Silently ignore: no-speech, aborted, network, audio-capture
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('Failed to start recognition:', err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const { base64, mime } = dataUrlToBase64(dataUrl);
      setAttachment({ dataUrl, base64, mimeType: mime });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chatbotHistory');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    t('chatbot.suggestion1', { defaultValue: 'What are my basic rights?' }),
    t('chatbot.suggestion2', { defaultValue: 'How to file a complaint?' }),
    t('chatbot.suggestion3', { defaultValue: 'Legal aid services?' }),
    t('chatbot.suggestion4', { defaultValue: 'Domestic violence help?' }),
  ];

  const canSend = (input.trim() || attachment) && !isTyping;

  /* Hide footer & remove bottom padding when chatbot page is active */
  useEffect(() => {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    if (main) { main.style.paddingBottom = '0'; main.style.display = 'flex'; main.style.flexDirection = 'column'; main.style.overflow = 'hidden'; }
    if (footer) footer.style.display = 'none';
    return () => {
      if (main) { main.style.paddingBottom = '2rem'; main.style.display = ''; main.style.flexDirection = ''; main.style.overflow = ''; }
      if (footer) footer.style.display = '';
    };
  }, []);

  return (
    <div className={`cb-container ${darkMode ? 'cb-dark' : ''}`}>
      <div className="cb-chat">
        {/* Header */}
        <header className="cb-header">
          <div className="cb-header-left">
            <div className="cb-logo">
              <i className="bi bi-robot"></i>
            </div>
            <div>
              <h1 className="cb-title">{t('chatbot.title', { defaultValue: 'Bot' })}</h1>
              <p className="cb-subtitle">
                <span className="cb-status-dot" />
                {t('chatbot.subtitle', { defaultValue: 'Online · Ready to help' })}
              </p>
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
            <button type="button" className="cb-header-btn" onClick={toggleTheme} title={darkMode ? 'Light mode' : 'Dark mode'}>
              <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
            </button>
            <button type="button" className="cb-header-btn" onClick={clearHistory} title={t('chatbot.clearChat', { defaultValue: 'New chat' })}>
              <i className="bi bi-trash3"></i>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="cb-messages">
          {messages.length === 0 && (
            <div className="cb-empty">
              <div className="cb-empty-icon">
                <i className="bi bi-chat-square-text"></i>
              </div>
              <h3 className="cb-empty-title">{t('chatbot.welcome', { defaultValue: 'Ask me anything about your legal rights' })}</h3>
              <p className="cb-empty-sub">{t('chatbot.tryAsking', { defaultValue: 'Try asking:' })}</p>
              <div className="cb-suggestions">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} type="button" className="cb-chip" onClick={() => { setInput(q); inputRef.current?.focus(); }}>
                    <i className="bi bi-chat-dots cb-chip-icon"></i>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`cb-msg ${msg.sender}`}>
              <div className="cb-msg-avatar">
                {msg.sender === 'user' ? <i className="bi bi-person-fill"></i> : (
                  <i className="bi bi-robot"></i>
                )}
              </div>
              <div>
                <div className={`cb-bubble ${msg.isError ? 'error' : ''}`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="" className="cb-msg-image" />
                  )}
                  <span className="cb-msg-text">{msg.text}</span>
                </div>
                <div className="cb-msg-meta">
                  <span className="cb-msg-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
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
              <div className="cb-msg-avatar">
                <i className="bi bi-robot"></i>
              </div>
              <div className="cb-typing">
                <span className="cb-typing-dot" />
                <span className="cb-typing-dot" />
                <span className="cb-typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="cb-input-area">
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

            {/* Image upload button */}
            <button
              type="button"
              className="cb-action-btn cb-btn-attach"
              onClick={() => fileInputRef.current?.click()}
              title={t('chatbot.attachImage', { defaultValue: 'Attach image' })}
            >
              <i className="bi bi-image"></i>
            </button>

            {/* Text input */}
            <textarea
              ref={inputRef}
              className="cb-textarea"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('chatbot.placeholder', { defaultValue: 'Type your message...' })}
            />

            {/* Voice button */}
            <button
              type="button"
              className={`cb-action-btn cb-btn-voice ${isListening ? 'active' : ''}`}
              onClick={startVoiceInput}
              disabled={isTyping}
              title={t('chatbot.voice', { defaultValue: 'Voice input' })}
            >
              <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
            </button>

            {/* Send button */}
            <button
              type="button"
              className={`cb-send-btn ${canSend ? 'active' : ''}`}
              onClick={sendMessage}
              disabled={!canSend}
              title={t('chatbot.send', { defaultValue: 'Send' })}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Voice listening overlay */}
      {isListening && (
        <div className="cb-voice-overlay">
          <div className="cb-voice-modal">
            <div className="cb-voice-pulse">
              <i className="bi bi-mic-fill cb-voice-icon"></i>
            </div>
            <p className="cb-voice-title">{t('chatbot.listening', { defaultValue: 'Listening...' })}</p>
            {interimText && <p className="cb-voice-interim">"{interimText}"</p>}
            <p className="cb-voice-sub">{t('chatbot.speakClearly', { defaultValue: 'Speak your question clearly' })}</p>
            <button type="button" className="cb-voice-stop" onClick={stopVoiceInput}>
              <i className="bi bi-stop-circle-fill"></i> Stop listening
            </button>
          </div>
        </div>
      )}

      <p className="cb-disclaimer">
        {t('chatbot.disclaimer', { defaultValue: 'This AI provides general information only. For legal advice, consult a qualified attorney.' })}
      </p>
    </div>
  );
};

export default Chatbot;
