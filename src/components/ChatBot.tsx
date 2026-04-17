import { useState, useRef, useEffect, useCallback } from 'react';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  lang: 'ta' | 'en'; // detected language
};

// ── Detect if text contains Tamil script ─────────────────────────────────────
const isTamil = (text: string) => /[\u0B80-\u0BFF]/.test(text);

// ── Get best available voice for a language ──────────────────────────────────
const getVoice = (lang: 'ta' | 'en'): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'ta') {
    return (
      voices.find(v => v.lang.startsWith('ta')) ||
      voices.find(v => v.lang.startsWith('en-IN')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  }
  return (
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
};

// ── Speak text using Web Speech API ─────────────────────────────────────────
const speak = (text: string, lang: 'ta' | 'en') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = getVoice(lang);
  if (voice) utter.voice = voice;
  utter.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
};

// ── Predefined responses (English + Tamil) ───────────────────────────────────
const getBotReply = (input: string): { text: string; lang: 'ta' | 'en' } => {
  const lower = input.toLowerCase();
  const tamil = isTamil(input);

  // Tamil responses
  if (tamil) {
    if (lower.includes('நன்') || input.includes('நன்றி')) return { text: 'நன்றி! உங்கள் உதவிக்கு மிக்க நன்றி! 🙏', lang: 'ta' };
    if (input.includes('உணவு') || input.includes('donate')) return { text: 'நீங்கள் உணவை பகிர விரும்புகிறீர்களா? Donor Dashboard ல் சென்று "Post Food" கிளிக் செய்யுங்கள்.', lang: 'ta' };
    if (input.includes('volunteer') || input.includes('விரும்')) return { text: 'Volunteer ஆக login செய்து Pending Pickups பக்கம் செல்லுங்கள். நீங்கள் அருகில் உள்ள உணவை எடுத்துச் செல்லலாம்.', lang: 'ta' };
    if (input.includes('NGO') || input.includes('உணவு வேண்')) return { text: 'Receiver Dashboard ல் உள்ள அனைத்து கிடைக்கும் உணவையும் பார்க்கலாம். "Claim Food" கிளிக் செய்யுங்கள்.', lang: 'ta' };
    return { text: 'வணக்கம்! RePlate உதவியாளர் இங்கே இருக்கிறேன். உதவிக்கு கேளுங்கள்! 😊', lang: 'ta' };
  }

  // English responses
  if (lower.includes('how to donate') || lower.includes('post food')) {
    return { text: '🍱 Go to Donor Dashboard → tap the green "+" button → fill in food details → submit. Your listing goes live instantly!', lang: 'en' };
  }
  if (lower.includes('volunteer') || lower.includes('pickup')) {
    return { text: '🚚 Log in as a Volunteer → go to "Pending" tab → filter by your area → tap "Accept Pickup" to start delivery!', lang: 'en' };
  }
  if (lower.includes('ngo') || lower.includes('receiver') || lower.includes('claim')) {
    return { text: '🏢 Log in as a Receiver/NGO → browse available food → use location filter → tap "Claim Food". A volunteer will deliver!', lang: 'en' };
  }
  if (lower.includes('status') || lower.includes('track')) {
    return { text: '📦 Status flow: available → pending_receiver → in_delivery → completed. Check your dashboard for real-time updates!', lang: 'en' };
  }
  if (lower.includes('location') || lower.includes('nearby')) {
    return { text: '📍 Use the location filter on Receiver and Volunteer dashboards to find food near you. GPS auto-detect is supported!', lang: 'en' };
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return { text: 'Hello! 👋 I am the RePlate AI Assistant. Ask me anything about donating, volunteering, or claiming food!', lang: 'en' };
  }
  if (lower.includes('thank')) {
    return { text: 'You\'re welcome! 🙏 Together we can reduce food waste and feed more people. Keep it up!', lang: 'en' };
  }
  return { text: 'I can help with: donating food, volunteer pickups, NGO claims, and tracking status. What would you like to know?', lang: 'en' };
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1', sender: 'bot', lang: 'en',
      text: 'Hi! I am the RePlate Assistant. Ask me anything — in English or Tamil (தமிழ்)! 🙏'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load voices (Chrome requires waiting for voiceschanged event)
  useEffect(() => {
    const load = () => setVoicesReady(true);
    window.speechSynthesis.getVoices(); // trigger load
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Track speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis?.speaking ?? false);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const speakMessage = useCallback((text: string, lang: 'ta' | 'en') => {
    if (!ttsEnabled) return;
    speak(text, lang);
  }, [ttsEnabled]);

  // Auto-speak the welcome message when opened
  useEffect(() => {
    if (isOpen && voicesReady && messages.length === 1) {
      speakMessage(messages[0].text, messages[0].lang);
    }
  }, [isOpen, voicesReady]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      lang: isTamil(input) ? 'ta' : 'en',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    window.speechSynthesis.cancel(); // stop any ongoing speech

    setTimeout(() => {
      const { text, lang } = getBotReply(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text,
        lang,
      };
      setMessages(prev => [...prev, botMessage]);
      speakMessage(text, lang);
    }, 400);
  };

  const handleSpeakMsg = (msg: Message) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    } else {
      speak(msg.text, msg.lang);
    }
  };

  const toggleTts = () => {
    if (ttsEnabled) window.speechSynthesis.cancel();
    setTtsEnabled(prev => !prev);
  };

  return (
    <div className="fixed bottom-24 right-5 z-50">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300" style={{ maxHeight: '520px' }}>

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#4ADE80] p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-bold tracking-wide text-sm">RePlate Assistant</h3>
                <p className="text-[10px] text-white/80">English · தமிழ் supported</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 🔊 TTS Toggle */}
              <button
                onClick={toggleTts}
                title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm ${ttsEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-black/20 hover:bg-black/30'}`}
              >
                {isSpeaking ? '🔊' : ttsEnabled ? '🔉' : '🔇'}
              </button>
              <button
                onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Messages Area ── */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--color-bg)]" style={{ maxHeight: '340px' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${
                  msg.sender === 'user'
                    ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-bl-sm'
                }`}>
                  {msg.text}
                  {/* Per-message speak button (bot only) */}
                  {msg.sender === 'bot' && (
                    <button
                      onClick={() => handleSpeakMsg(msg)}
                      title="Read aloud"
                      className="absolute -bottom-2 -right-2 w-5 h-5 bg-[var(--color-primary)] text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      🔊
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] mt-1 px-1 flex items-center gap-1">
                  {msg.sender === 'user' ? 'You' : '🤖 Bot'}
                  {msg.lang === 'ta' && <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1 rounded">தமிழ்</span>}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Prompts ── */}
          <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto hide-scrollbar shrink-0 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
            {['How to donate?', 'Volunteer pickup', 'NGO claim', 'Track status'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="shrink-0 text-[10px] font-bold text-[var(--color-primary)] border border-[rgba(34,197,94,0.3)] px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-[rgba(34,197,94,0.1)] transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* ── Input Area ── */}
          <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in English or தமிழ்..."
                className="flex-1 input-field h-10 text-sm rounded-xl px-3"
              />
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center bg-[var(--color-primary)] hover:bg-[#16A34A] text-white rounded-xl transition-colors shadow-sm"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Trigger Button ── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-14 h-14 bg-[var(--color-primary)] hover:bg-[#16A34A] text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(34,197,94,0.4)] transition-transform hover:scale-110 active:scale-95 relative"
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] animate-pulse">
            🔊
          </span>
        )}
      </button>
    </div>
  );
};
