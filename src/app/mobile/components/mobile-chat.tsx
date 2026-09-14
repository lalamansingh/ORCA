"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, Sparkles, AlertTriangle, ShieldCheck, Waves, Fish, Navigation, PhoneCall, LoaderCircle } from "lucide-react";
import { sendMessage, type ConversationReply } from "@/lib/api/ai";
import { VoiceMic, VoiceSpeaker } from "@/components/voice-mic";
import type { MobileLocation } from "./location-detector";

export const MOBILE_LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी", voiceCode: "hi-IN" },
  { code: "en", name: "English", native: "English", voiceCode: "en-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", voiceCode: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", voiceCode: "te-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", voiceCode: "ml-IN" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", voiceCode: "gu-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", voiceCode: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", voiceCode: "bn-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", voiceCode: "kn-IN" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", voiceCode: "hi-IN" },
  { code: "hi-Latn", name: "Hinglish", native: "Hinglish", voiceCode: "hi-IN" },
];

const LOCALIZED_GREETINGS: Record<string, { greeting: string; sampleQuestions: { label: string; query: string; icon: string }[] }> = {
  hi: {
    greeting: "नमस्ते मछुआरे साथी! आज आपके क्षेत्र के समुद्र और मछली पालन की स्थिति कैसी है?",
    sampleQuestions: [
      { label: "🐟 क्या आज समुद्र में जाना सुरक्षित है?", query: "क्या आज समुद्र में जाना सुरक्षित है?", icon: "fish" },
      { label: "🌊 निकटतम PFZ मछली क्षेत्र और दूरी", query: "निकटतम PFZ मछली क्षेत्र और दूरी बताएं", icon: "wave" },
      { label: "⚠️ लहरों की ऊंचाई और हवा की गति", query: "लहरों की ऊंचाई और हवा की गति क्या है?", icon: "alert" },
      { label: "🧭 सुरक्षित मार्ग और चक्रवात अलर्ट", query: "क्या कोई चक्रवात या समुद्री चेतावनी सक्रिय है?", icon: "nav" },
    ],
  },
  en: {
    greeting: "Hello Captain! Ready to check marine safety, fishing zones, or wave hazards today?",
    sampleQuestions: [
      { label: "🐟 Is it safe to fish today?", query: "Is it safe to go out to sea and fish today?", icon: "fish" },
      { label: "🌊 Nearest PFZ zone and distance", query: "Show nearest PFZ fishing zone and bearing", icon: "wave" },
      { label: "⚠️ Wave height & wind advisory", query: "What is the wave height and wind condition?", icon: "alert" },
      { label: "🧭 Cyclone and safety alerts", query: "Are there any cyclone or high wave warnings?", icon: "nav" },
    ],
  },
  "hi-Latn": {
    greeting: "Namaste! Samundar me jaana safe hai ya nahi, aur PFZ machli zone kahan hai, yahan puchen.",
    sampleQuestions: [
      { label: "🐟 Kya aaj samundar safe hai?", query: "Kya aaj samundar me jaana safe hai?", icon: "fish" },
      { label: "🌊 Nearest PFZ machli zone", query: "Sabse paas wala PFZ machli zone batao", icon: "wave" },
      { label: "⚠️ Wave height aur hawa ki speed", query: "Wave height aur hawa ki speed kya hai?", icon: "alert" },
    ],
  },
  ta: {
    greeting: "வணக்கம்! இன்று கடலுக்குச் செல்லலாமா? மீன்பிடி மண்டலங்கள் மற்றும் வானிலை நிலவரம் அறிக.",
    sampleQuestions: [
      { label: "🐟 இன்று கடலுக்குச் செல்வது பாதுகாப்பானதா?", query: "இன்று கடலுக்குச் செல்வது பாதுகாப்பானதா?", icon: "fish" },
      { label: "🌊 அருகிலுள்ள PFZ மண்டலம்", query: "அருகிலுள்ள PFZ மீன்பிடி மண்டலத்தைக் காட்டு", icon: "wave" },
      { label: "⚠️ அலை உயரம் மற்றும் காற்று", query: "அலை உயரம் மற்றும் காற்று வேகம் என்ன?", icon: "alert" },
    ],
  },
  te: {
    greeting: "నమస్కారం! ఈరోజు సముద్రంలోకి వెళ్లడం సురక్షితమేనా? చేపల వేట జోన్లు తెలుసుకోండి.",
    sampleQuestions: [
      { label: "🐟 ఈరోజు సముద్రంలోకి వెళ్లవచ్చా?", query: "ఈరోజు సముద్రంలోకి వెళ్లడం సురక్షితమేనా?", icon: "fish" },
      { label: "🌊 సమీప PFZ చేపల వేట జోన్", query: "సమీప PFZ చేపల వేట జోన్‌ను చూపించు", icon: "wave" },
    ],
  },
  ml: {
    greeting: "നമസ്കാരം! ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ? മത്സ്യബന്ധന മേഖലകളും കാലാവസ്ഥയും അറിയുക.",
    sampleQuestions: [
      { label: "🐟 ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?", query: "ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?", icon: "fish" },
      { label: "🌊 അടുത്തുള്ള PFZ മേഖല", query: "ഏറ്റവും അടുത്തുള്ള PFZ മത്സ്യബന്ധന മേഖല കാട്ടുക", icon: "wave" },
    ],
  },
  gu: {
    greeting: "નમસ્તે સાગરખેડૂ ભાઈઓ! આજે દરિયામાં જવું સુરક્ષિત છે કે નહીં અને માછીમારી ઝોન જાણો.",
    sampleQuestions: [
      { label: "🐟 શું આજે દરિયામાં જવું સુરક્ષિત છે?", query: "શું આજે દરિયામાં જવું સુરક્ષિત છે?", icon: "fish" },
      { label: "🌊 નજીકનું PFZ ક્ષેત્ર", query: "નજીકનું PFZ માછીમારી ક્ષેત્ર બતાવો", icon: "wave" },
    ],
  },
  mr: {
    greeting: "नमस्कार! आज समुद्रात जाणे सुरक्षित आहे का? मासेमारी क्षेत्रे आणि लाटांची माहिती विचारा.",
    sampleQuestions: [
      { label: "🐟 आज समुद्रात जाणे सुरक्षित आहे का?", query: "आज समुद्रात जाणे सुरक्षित आहे का?", icon: "fish" },
      { label: "🌊 जवळचे PFZ मासेमारी क्षेत्र", query: "जवळचे PFZ मासेमारी क्षेत्र दाखवा", icon: "wave" },
    ],
  },
  bn: {
    greeting: "নমস্কার! আজ কি সমুদ্রে মাছ ধরতে যাওয়া নিরাপদ? আবহাওয়া ও মাছের অঞ্চল জানুন।",
    sampleQuestions: [
      { label: "🐟 আজ কি সমুদ্রে যাওয়া নিরাপদ?", query: "আজ কি সমুদ্রে যাওয়া নিরাপদ?", icon: "fish" },
      { label: "🌊 নিকটতম PFZ মাছের অঞ্চল", query: "নিকটতম PFZ মাছ ধরার অঞ্চল দেখান", icon: "wave" },
    ],
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ! ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ? ಮೀನುಗಾರಿಕಾ ವಲಯಗಳು ಮತ್ತು ಅಲೆಗಳ ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ.",
    sampleQuestions: [
      { label: "🐟 ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?", query: "ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?", icon: "fish" },
      { label: "🌊 ಹತ್ತಿರದ PFZ ವಲಯ", query: "ಹತ್ತಿರದ PFZ ಮೀನುಗಾರಿಕಾ ವಲಯವನ್ನು ತೋರಿಸಿ", icon: "wave" },
    ],
  },
  or: {
    greeting: "ନମସ୍କାର! ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି? ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ଓ ପାଣିପାଗ ସ୍ଥିତି ଜାଣନ୍ତୁ।",
    sampleQuestions: [
      { label: "🐟 ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?", query: "ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?", icon: "fish" },
      { label: "🌊 ନିକଟତମ PFZ କ୍ଷେତ୍ର", query: "ନିକଟତମ PFZ ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ଦେଖାନ୍ତୁ", icon: "wave" },
    ],
  },
};

interface MobileChatProps {
  location: MobileLocation;
  selectedLang: string;
  onSelectLang: (lang: string) => void;
  onOpenPFZTab?: () => void;
  onOpenWeatherTab?: () => void;
  onOpenAlertsTab?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  reply?: ConversationReply;
  timestamp: string;
}

export function MobileChat({
  location,
  selectedLang,
  onOpenPFZTab,
  onOpenWeatherTab,
  onOpenAlertsTab,
}: MobileChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeVoiceCode, setActiveVoiceCode] = useState("hi-IN");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const langConfig = LOCALIZED_GREETINGS[selectedLang] || LOCALIZED_GREETINGS.hi;

  useEffect(() => {
    const langObj = MOBILE_LANGUAGES.find((l) => l.code === selectedLang);
    if (langObj) setActiveVoiceCode(langObj.voiceCode);
  }, [selectedLang]);

  // Initial welcome bot message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "bot",
          text: langConfig.greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [selectedLang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    const cleanText = queryText.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const reply = await sendMessage(
        cleanText,
        { latitude: location.latitude, longitude: location.longitude },
        messages.filter((m) => m.reply).at(-1)?.reply?.conversation_id
      );

      const botMsg: ChatMessage = {
        id: reply.message_id || `bot-${Date.now()}`,
        sender: "bot",
        text: reply.answer,
        reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "समुद्री सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें। (Could not reach marine assistant API. Retrying...)",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSendQuery(inputQuery);
  };

  // Helper to extract critical summary facts
  const extractQuickMetrics = (reply?: ConversationReply) => {
    if (!reply?.orchestration?.data) return null;
    const data = reply.orchestration.data;
    const risk = (data.risk as { risk_level?: string; safety_score?: number }) || null;
    const conditions = (data.conditions as { wave_height?: number; wind_speed?: number }) || null;
    return { risk, conditions };
  };

  return (
    <div className="mobile-chat-container">
      {/* 1-Tap Quick Action Feature Pills */}
      <div className="chat-feature-chips">
        <button
          type="button"
          className="feature-chip-btn"
          onClick={() => void handleSendQuery("निकटतम PFZ मछली क्षेत्र की दूरी, दिशा और गहराई बताएं")}
        >
          <Fish size={14} /> 🐟 PFZ मछली क्षेत्र
        </button>
        <button
          type="button"
          className="feature-chip-btn"
          onClick={() => void handleSendQuery("लहरों की ऊंचाई, हवा की गति और समुद्र की स्थिति क्या है?")}
        >
          <Waves size={14} /> 🌊 लहरें और मौसम
        </button>
        <button
          type="button"
          className="feature-chip-btn"
          onClick={() => void handleSendQuery("क्या कोई चक्रवात या समुद्री चेतावनी जारी है?")}
        >
          <AlertTriangle size={14} /> ⚠️ सुरक्षा चेतावनी
        </button>
        <button
          type="button"
          className="feature-chip-btn"
          onClick={() => void handleSendQuery("बंदरगाह से सुरक्षित नेविगेशन मार्ग और खतरे")}
        >
          <Navigation size={14} /> 🧭 सुरक्षित मार्ग
        </button>
        <button
          type="button"
          className="feature-chip-btn"
          style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "#f87171" }}
          onClick={() => void handleSendQuery("तट रक्षक आपातकालीन हेल्पलाइन नंबर और SOS")}
        >
          <PhoneCall size={14} /> 🚨 SOS सहायता
        </button>
      </div>

      {/* Chat Messages */}
      <div className="mobile-chat-messages">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const metrics = !isUser ? extractQuickMetrics(msg.reply) : null;

          return (
            <div
              key={msg.id}
              className={isUser ? "chat-bubble-user" : "chat-bubble-bot"}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", opacity: 0.75, display: "flex", alignItems: "center", gap: "4px" }}>
                  {isUser ? <User size={12} /> : <Bot size={12} style={{ color: "#38bdf8" }} />}
                  {isUser ? "आप (You)" : "ORCA सागर साथी"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", opacity: 0.6 }}>{msg.timestamp}</span>
                  {!isUser && <VoiceSpeaker text={msg.text} />}
                </div>
              </div>

              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {msg.text}
              </div>

              {/* Quick Metrics Card if present */}
              {metrics?.risk && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    background: "rgba(2, 6, 23, 0.5)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={16} style={{ color: "#10b981" }} />
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>
                      समुद्री जोखिम: {metrics.risk.risk_level || "EVALUATED"}
                    </span>
                  </div>
                  {metrics.risk.safety_score != null && (
                    <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 700 }}>
                      Safety: {metrics.risk.safety_score}%
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Suggested Quick Questions under initial greeting */}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
              त्वरित प्रश्न (Tap to ask):
            </span>
            {langConfig.sampleQuestions.map((q) => (
              <button
                key={q.query}
                type="button"
                onClick={() => void handleSendQuery(q.query)}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.18)",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  color: "#e2e8f0",
                  fontSize: "12.5px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <Sparkles size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="chat-bubble-bot" style={{ padding: "10px 14px", display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
            <LoaderCircle className="spin" size={16} style={{ color: "#38bdf8" }} />
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              ORCA उपग्रह और मौसम एजेंट विश्लेषण कर रहे हैं...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form className="mobile-chat-input-bar" onSubmit={onSubmit}>
        <VoiceMic
          onTranscript={(text) => handleSendQuery(text)}
          disabled={loading}
          selectedLang={activeVoiceCode}
        />
        <input
          type="text"
          className="mobile-input-field"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="बोलें या प्रश्न टाइप करें (Ask anything)..."
          disabled={loading}
        />
        <button
          type="submit"
          className="mobile-send-btn"
          disabled={loading || !inputQuery.trim()}
          aria-label="Send message"
        >
          {loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
        </button>
      </form>
    </div>
  );
}
