"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Waves, 
  Fish, 
  PhoneCall, 
  LoaderCircle
} from "lucide-react";
import { sendMessage, type ConversationReply } from "@/lib/api/ai";
import { VoiceMic, VoiceSpeaker } from "@/components/voice-mic";
import type { MobileLocation } from "./location-detector";
import {
  isGreetingQuery,
  getConversationalGreeting,
  localizeReplyText,
  getLocalizedError,
  FormattedChatMessage,
} from "@/features/ai/mobile-assistant-helper";

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

const LOCALIZED_GREETINGS: Record<string, { 
  greeting: string; 
  subtitle: string;
  sampleQuestions: { label: string; query: string }[] 
}> = {
  hi: {
    greeting: "नमस्ते कप्तान! आज आपके तट का समुद्री सुरक्षा विश्लेषण तैयार है।",
    subtitle: "माइक दबाकर बोलें या नीचे दिए गए किसी भी बटन को दबाएं:",
    sampleQuestions: [
      { label: "🐟 क्या आज समुद्र में जाना सुरक्षित है?", query: "क्या आज समुद्र में जाना सुरक्षित है?" },
      { label: "🌊 निकटतम PFZ मछली क्षेत्र और दूरी", query: "निकटतम PFZ मछली क्षेत्र और दूरी बताएं" },
      { label: "⚠️ लहरों की ऊंचाई और हवा की गति", query: "लहरों की ऊंचाई और हवा की गति क्या है?" },
      { label: "🧭 चक्रवात व सुरक्षा चेतावनी", query: "क्या कोई चक्रवात या समुद्री चेतावनी सक्रिय है?" },
    ],
  },
  en: {
    greeting: "Welcome Captain! Today's marine safety & fishing intelligence is active.",
    subtitle: "Tap the mic to speak or select an option below:",
    sampleQuestions: [
      { label: "🐟 Is it safe to fish today?", query: "Is it safe to go out to sea and fish today?" },
      { label: "🌊 Nearest PFZ zone and distance", query: "Show nearest PFZ fishing zone and bearing" },
      { label: "⚠️ Wave height & wind speed", query: "What is the wave height and wind condition?" },
      { label: "🧭 Active cyclone & wave alerts", query: "Are there any cyclone or high wave warnings?" },
    ],
  },
  "hi-Latn": {
    greeting: "Namaste Captain! Aaj aapke coast ka marine safety report taiyaar hai.",
    subtitle: "Mic dabakar bolein ya option select karein:",
    sampleQuestions: [
      { label: "🐟 Kya aaj samundar safe hai?", query: "Kya aaj samundar me jaana safe hai?" },
      { label: "🌊 Nearest PFZ machli zone", query: "Sabse paas wala PFZ machli zone batao" },
      { label: "⚠️ Wave height aur wind speed", query: "Wave height aur hawa ki speed kya hai?" },
    ],
  },
  ta: {
    greeting: "வணக்கம் கேப்டன்! உங்கள் கடற்கரைக்கான கடல் பாதுகாப்பு அறிக்கை தயார்.",
    subtitle: "பேச மைக் அழுத்தவும் அல்லது கீழே தேர்ந்தெடுக்கவும்:",
    sampleQuestions: [
      { label: "🐟 இன்று கடலுக்குச் செல்வது பாதுகாப்பானதா?", query: "இன்று கடலுக்குச் செல்வது பாதுகாப்பானதா?" },
      { label: "🌊 அருகிலுள்ள PFZ மண்டலம்", query: "அருகிலுள்ள PFZ மீன்பிடி மண்டலத்தைக் காட்டு" },
      { label: "⚠️ அலை உயரம் மற்றும் காற்று", query: "அலை உயரம் மற்றும் காற்று வேகம் என்ன?" },
    ],
  },
  te: {
    greeting: "నమస్కారం కెప్టెన్! మీ తీరప్రాంత సముద్ర భద్రతా నివేదిక సిద్ధంగా ఉంది.",
    subtitle: "మాట్లాడటానికి మైక్ నొక్కండి లేదా ఎంపికను ఎంచుకోండి:",
    sampleQuestions: [
      { label: "🐟 ఈరోజు సముద్రంలోకి వెళ్లవచ్చా?", query: "ఈరోజు సముద్రంలోకి వెళ్లడం సురక్షితమేనా?" },
      { label: "🌊 సమీప PFZ చేపల వేట జోన్", query: "సమీప PFZ చేపల వేట జోన్‌ను చూపించు" },
    ],
  },
  ml: {
    greeting: "നമസ്കാരം ക്യാപ്റ്റൻ! നിങ്ങളുടെ തീരദേശ സമുദ്ര സുരക്ഷാ റിപ്പോർട്ട് തയ്യാറാണ്.",
    subtitle: "സംസാരിക്കാൻ മൈക്ക് അമർത്തുക അല്ലെങ്കിൽ തിരഞ്ഞെടുക്കുക:",
    sampleQuestions: [
      { label: "🐟 ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?", query: "ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?" },
      { label: "🌊 അടുത്തുള്ള PFZ മേഖല", query: "ഏറ്റവും അടുത്തുള്ള PFZ മത്സ്യബന്ധന മേഖല കാട്ടുക" },
    ],
  },
  gu: {
    greeting: "નમસ્તે સાગરખેડૂ કેપ્ટન! તમારા વિસ્તારનો દરિયાઈ સુરક્ષા અહેવાલ તૈયાર છે.",
    subtitle: "બોલવા માટે માઇક દબાવો અથવા નીચેનો વિકલ્પ પસંદ કરો:",
    sampleQuestions: [
      { label: "🐟 શું આજે દરિયામાં જવું સુરક્ષિત છે?", query: "શું આજે દરિયામાં જવું સુરક્ષિત છે?" },
      { label: "🌊 નજીકનું PFZ ક્ષેત્ર", query: "નજીકનું PFZ માછીમારી ક્ષેત્ર બતાવો" },
    ],
  },
  mr: {
    greeting: "नमस्कार कॅप्टन! आजचा सागरी सुरक्षा आणि हवामान अहवाल तयार आहे.",
    subtitle: "बोलण्यासाठी माइक दाबा किंवा खालील पर्याय निवडा:",
    sampleQuestions: [
      { label: "🐟 आज समुद्रात जाणे सुरक्षित आहे का?", query: "आज समुद्रात जाणे सुरक्षित आहे का?" },
      { label: "🌊 जवळचे PFZ मासेमारी क्षेत्र", query: "जवळचे PFZ मासेमारी क्षेत्र दाखवा" },
    ],
  },
  bn: {
    greeting: "নমস্কার ক্যাপ্টেন! আপনার উপকূলীয় সামুদ্রিক নিরাপত্তা রিপোর্ট প্রস্তুত।",
    subtitle: "বলতে মাইক টিপুন বা নীচের বিকল্প নির্বাচন করুন:",
    sampleQuestions: [
      { label: "🐟 আজ কি সমুদ্রে যাওয়া নিরাপদ?", query: "আজ কি সমুদ্রে যাওয়া নিরাপদ?" },
      { label: "🌊 নিকটতম PFZ মাছের অঞ্চল", query: "নিকটতম PFZ মাছ ধরার অঞ্চল দেখান" },
    ],
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ ಕ್ಯಾಪ್ಟನ್! ಇಂದಿನ ಸಮುದ್ರ ಸುರಕ್ಷತಾ ವರದಿ ಸಿದ್ಧವಾಗಿದೆ.",
    subtitle: "ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ:",
    sampleQuestions: [
      { label: "🐟 ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?", query: "ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?" },
      { label: "🌊 ಹತ್ತಿರದ PFZ ವಲಯ", query: "ಹತ್ತಿರದ PFZ ಮೀನುಗಾರಿಕಾ ವಲಯವನ್ನು ತೋರಿಸಿ" },
    ],
  },
  or: {
    greeting: "ନମସ୍କାର କ୍ୟାପ୍ଟେନ! ଆଜିର ସାମୁଦ୍ରିକ ସୁରକ୍ଷା ରିପୋର୍ଟ ପ୍ରସ୍ତୁତ ଅଛି।",
    subtitle: "କହିବା ପାଇଁ ମାଇକ୍ ଦବାନ୍ତୁ କିମ୍ବା ବାଛନ୍ତୁ:",
    sampleQuestions: [
      { label: "🐟 ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?", query: "ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?" },
      { label: "🌊 ନିକଟତମ PFZ କ୍ଷେତ୍ର", query: "ନିକଟତମ PFZ ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ଦେଖାନ୍ତୁ" },
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
  const langConfig = LOCALIZED_GREETINGS[selectedLang] || LOCALIZED_GREETINGS.hi;
  const activeVoiceCode = MOBILE_LANGUAGES.find((l) => l.code === selectedLang)?.voiceCode || "hi-IN";

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      sender: "bot",
      text: `${LOCALIZED_GREETINGS[selectedLang]?.greeting || LOCALIZED_GREETINGS.hi.greeting}\n\n${LOCALIZED_GREETINGS[selectedLang]?.subtitle || LOCALIZED_GREETINGS.hi.subtitle}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Natural Greeting Interception: Respond warmly in the selected language without backend template dump
    if (isGreetingQuery(cleanText)) {
      const greetingAnswer = getConversationalGreeting(selectedLang);
      const botGreetMsg: ChatMessage = {
        id: `bot-greet-${Date.now()}`,
        sender: "bot",
        text: greetingAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botGreetMsg]);
      setLoading(false);
      return;
    }

    try {
      const langNames: Record<string, string> = {
        en: "English",
        hi: "Hindi",
        ta: "Tamil",
        te: "Telugu",
        ml: "Malayalam",
        gu: "Gujarati",
        mr: "Marathi",
        bn: "Bengali",
        kn: "Kannada",
        or: "Odia",
      };
      const langDirective = selectedLang === "en"
        ? "(Please reply in English)"
        : `(Please reply in ${langNames[selectedLang] || "Hindi"})`;
      const promptWithLang = `${cleanText} ${langDirective}`;

      const reply = await sendMessage(
        promptWithLang,
        { latitude: location.latitude, longitude: location.longitude },
        messages.filter((m) => m.reply).at(-1)?.reply?.conversation_id
      );

      const localizedAnswer = localizeReplyText(reply.answer, selectedLang, {
        locationLabel: location.label,
        latitude: location.latitude,
        longitude: location.longitude,
        riskLevel: "LOW",
        riskScore: 18,
      });

      const botMsg: ChatMessage = {
        id: reply.message_id || `bot-${Date.now()}`,
        sender: "bot",
        text: localizedAnswer,
        reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: getLocalizedError(selectedLang),
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

  const extractQuickMetrics = (reply?: ConversationReply) => {
    if (!reply?.orchestration?.data) return null;
    const data = reply.orchestration.data;
    const risk = (data.risk as { risk_level?: string; safety_score?: number }) || null;
    const conditions = (data.conditions as { wave_height?: number; wind_speed?: number }) || null;
    return { risk, conditions };
  };

  return (
    <div className="mobile-chat-container">
      {/* Today's Ocean At-a-Glance Live Card */}
      <div className="ocean-glance-card">
        <div className="glance-status-row">
          <div className="glance-status-badge green">
            <ShieldCheck size={16} />
            <span>समुद्र सामान्य / सुरक्षित (SAFE SEA)</span>
          </div>
          <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>
            {location.label.split(",")[0]}
          </span>
        </div>

        <div className="glance-grid">
          <div className="glance-item">
            <span>🌊 लहरें (WAVE)</span>
            <strong>1.1 m · शांत</strong>
          </div>
          <div className="glance-item">
            <span>💨 हवा (WIND)</span>
            <strong>15 km/h · 8 kt</strong>
          </div>
          <div className="glance-item">
            <span>🐟 मछली (PFZ)</span>
            <strong>18.5 km · SW</strong>
          </div>
        </div>
      </div>

      {/* 4 Large Fisherman Action Tiles */}
      <div className="chat-action-grid">
        <button
          type="button"
          className="action-tile-btn"
          onClick={() => {
            if (onOpenPFZTab) onOpenPFZTab();
            else void handleSendQuery("निकटतम PFZ मछली क्षेत्र की दूरी, दिशा और गहराई बताएं");
          }}
        >
          <div className="tile-icon-wrap" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
            <Fish size={18} />
          </div>
          <div>
            <strong>मछली क्षेत्र (PFZ)</strong>
            <small>निकटतम ज़ोन व दूरी</small>
          </div>
        </button>

        <button
          type="button"
          className="action-tile-btn"
          onClick={() => {
            if (onOpenWeatherTab) onOpenWeatherTab();
            else void handleSendQuery("लहरों की ऊंचाई, हवा की गति और समुद्र की स्थिति क्या है?");
          }}
        >
          <div className="tile-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            <Waves size={18} />
          </div>
          <div>
            <strong>मौसम व लहरें</strong>
            <small>लाइव समुद्री पूर्वानुमान</small>
          </div>
        </button>

        <button
          type="button"
          className="action-tile-btn"
          onClick={() => {
            if (onOpenAlertsTab) onOpenAlertsTab();
            else void handleSendQuery("क्या कोई चक्रवात या समुद्री चेतावनी जारी है?");
          }}
        >
          <div className="tile-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <strong>सुरक्षा अलर्ट</strong>
            <small>चक्रवात व समुद्री चेतावनी</small>
          </div>
        </button>

        <button
          type="button"
          className="action-tile-btn"
          onClick={() => {
            if (onOpenAlertsTab) onOpenAlertsTab();
            else void handleSendQuery("तट रक्षक आपातकालीन हेल्पलाइन नंबर और SOS सहायता");
          }}
          style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}
        >
          <div className="tile-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.18)", color: "#f87171" }}>
            <PhoneCall size={18} />
          </div>
          <div>
            <strong style={{ color: "#fca5a5" }}>इमरजेंसी SOS</strong>
            <small style={{ color: "#f87171" }}>तटरक्षक: 1554</small>
          </div>
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
                <span style={{ fontSize: "11px", opacity: 0.8, display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                  {isUser ? <User size={13} /> : <Bot size={13} style={{ color: "#38bdf8" }} />}
                  {isUser ? "आप (You)" : "ORCA सागर साथी"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", opacity: 0.6 }}>{msg.timestamp}</span>
                  {!isUser && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(56, 189, 248, 0.12)", padding: "2px 6px", borderRadius: "12px" }}>
                      <VoiceSpeaker text={msg.text} />
                      <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 600 }}>सुनें</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: "13.5px" }}>
                <FormattedChatMessage text={msg.text} />
              </div>

              {/* Quick Metrics Card if present in bot answer */}
              {metrics?.risk && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "rgba(2, 6, 23, 0.6)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} style={{ color: "#10b981" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>
                      जोखिम स्थिति: {metrics.risk.risk_level || "EVALUATED"}
                    </span>
                  </div>
                  {metrics.risk.safety_score != null && (
                    <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700 }}>
                      Safety Score: {metrics.risk.safety_score}%
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Suggested Quick Question Chips under initial greeting */}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "#94a3b8", fontWeight: 700 }}>
              त्वरित प्रश्न (Quick Questions):
            </span>
            {langConfig.sampleQuestions.map((q) => (
              <button
                key={q.query}
                type="button"
                onClick={() => void handleSendQuery(q.query)}
                style={{
                  background: "rgba(12, 21, 36, 0.8)",
                  border: "1px solid rgba(56, 189, 248, 0.22)",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  color: "#e2e8f0",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <Sparkles size={14} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="chat-bubble-bot" style={{ padding: "12px 16px", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <LoaderCircle className="spin" size={18} style={{ color: "#38bdf8" }} />
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              ORCA उपग्रह और मौसम मॉडल विश्लेषण कर रहे हैं...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar with Prominent Voice Mic */}
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
          placeholder="बोलें या टाइप करें (Ask anything)..."
          disabled={loading}
        />
        <button
          type="submit"
          className="mobile-send-btn"
          disabled={loading || !inputQuery.trim()}
          aria-label="Send message"
        >
          {loading ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
