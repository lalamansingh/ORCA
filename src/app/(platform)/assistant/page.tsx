"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Languages, LoaderCircle, MapPin, Send, Sparkles } from "lucide-react";
import { MarineMap } from "@/components/marine-map";
import { PageHeader } from "@/components/ui";
import { EvidenceFacts, ServiceFacts } from "@/components/evidence-facts";
import { sendMessage, type ConversationReply } from "@/lib/api/ai";
import { classifyIntent } from "@/features/ai/intent-router";
import { publishSelectedLocation, useSharedSelectedLocation } from "@/features/map/location-store";
import { VoiceMic, VoiceSpeaker } from "@/components/voice-mic";
import "../demo-polish.css";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", native: "English", voiceCode: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", voiceCode: "hi-IN" },
  { code: "hi-Latn", name: "Hinglish", native: "Hinglish", voiceCode: "hi-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", voiceCode: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", voiceCode: "te-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", voiceCode: "ml-IN" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", voiceCode: "gu-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", voiceCode: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", voiceCode: "bn-IN" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", voiceCode: "hi-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", voiceCode: "kn-IN" },
];

const LOCALIZED_PROMPTS: Record<string, { welcome: string; placeholder: string; prompts: string[] }> = {
  en: {
    welcome: "Ask in English or any coastal Indian language about potential fishing zones, wave hazards, weather forecasts, or maritime restrictions.",
    placeholder: "Ask in English or click the Mic to speak...",
    prompts: [
      "Is it safe to go out to sea today?",
      "Show nearest PFZ and check safety",
      "Assess current marine risk & wave height in Mumbai",
      "Check coastal weather and IMD alerts for Chennai",
    ],
  },
  hi: {
    welcome: "मछली पकड़ने के क्षेत्र (PFZ), लहरों की ऊंचाई, समुद्री जोखिम और मौसम पूर्वानुमान के बारे में अपनी भाषा में पूछें।",
    placeholder: "हिन्दी में पूछें (या माइक बटन दबाकर बोलें)...",
    prompts: [
      "क्या आज समुद्र में जाना सुरक्षित है?",
      "मुंबई तट पर लहरों और हवा की स्थिति क्या है?",
      "निकटतम PFZ मछली क्षेत्र दिखाएं",
      "क्या कोई चक्रवात या समुद्री चेतावनी सक्रिय है?",
    ],
  },
  "hi-Latn": {
    welcome: "PFZ machli zone, wave height, samundar ka risk aur weather forecast ke baare me Hinglish me puchen.",
    placeholder: "Hinglish me puchen ya Mic click karein...",
    prompts: [
      "Kya samundar me jaana safe hai?",
      "Mumbai me wave height aur hawa ki speed batao",
      "Nearest PFZ machli zone dikhao",
      "Koi cyclone ya rough sea warning hai kya?",
    ],
  },
  ta: {
    welcome: "PFZ மீன்பிடி மண்டலங்கள், அலை உயரங்கள், கடல் அபாயம் மற்றும் வானிலை பற்றி தமிழில் கேட்கவும்.",
    placeholder: "தமிழில் கேட்கவும் (அல்லது மைக் அழுத்தவும்)...",
    prompts: [
      "இன்று கடலுக்குச் செல்வது பாதுகாப்பானதா?",
      "சென்னை கடற்கரையில் அலை உயரம் மற்றும் காற்று வேகம்",
      "அருகிலுள்ள PFZ மீன்பிடி மண்டலத்தைக் காட்டு",
      "புயல் அல்லது தீவிர அலை எச்சரிக்கைகள் உள்ளதா?",
    ],
  },
  te: {
    welcome: "చేపల వేట జోన్లు (PFZ), అలల ఎత్తు, సముద్ర ప్రమాదం మరియు వాతావరణం గురించి తెలుగులో అడగండి.",
    placeholder: "తెలుగులో అడగండి (లేదా మైక్ నొక్కండి)...",
    prompts: [
      "ఈరోజు సముద్రంలోకి వెళ్లడం సురಕ್ಷితమేనా?",
      "విశాఖపట్నం తీరంలో అలల ఎత్తు మరియు గాలి వేగం ఎంత?",
      "సమీప PFZ చేపల వేట జోన్‌ను చూపించు",
      "ఏదైనా తుఫాను లేదా ప్రమాద హెచ్చరికలు ఉన్నాయా?",
    ],
  },
  ml: {
    welcome: "മത്സ്യബന്ധന മേഖലകൾ (PFZ), തിരമാലയുടെ ഉയരം, കടൽ അപകടസാധ്യത എന്നിവയെക്കുറിച്ച് മലയാളത്തിൽ ചോദിക്കുക.",
    placeholder: "മലയാളത്തിൽ ചോദിക്കുക (അല്ലെങ്കിൽ മൈക്ക് ഉപയോഗിക്കുക)...",
    prompts: [
      "ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?",
      "കൊച്ചി തീരത്തെ തിരമാലയുടെ ഉയരവും കാറ്റിന്റെ വേഗതയും",
      "ഏറ്റവും അടുത്തുള്ള PFZ മത്സ്യബന്ധന മേഖല കാട്ടുക",
      "ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുകൾ ഉണ്ടോ?",
    ],
  },
  gu: {
    welcome: "સંભવિત માછીમારી ઝોન (PFZ), મોજાંની ઊંચાઈ, દરિયાઈ જોખમ અને હવામાન વિશે ગુજરાતીમાં પૂછો.",
    placeholder: "ગુજરાતીમાં પૂછો (અથવા માઇક પર ક્લિક કરો)...",
    prompts: [
      "શું આજે દરિયામાં જવું સુરક્ષિત છે?",
      "પોરબંદર અને વેરાવળમાં મોજા અને પવનની સ્થિતિ",
      "નજીકનું PFZ માછીમારી ક્ષેત્ર બતાવો",
      "શું કોઈ વાવાઝોડાની ચેતવણી છે?",
    ],
  },
  mr: {
    welcome: "संभाव्य मासेमारी क्षेत्रे (PFZ), लाटांची उंची, सागरी धोका आणि हवामानाबद्दल मराठीत विचारा.",
    placeholder: "मराठीत विचारा (किंवा माइकवर बोला)...",
    prompts: [
      "आज समुद्रात जाणे सुरक्षित आहे का?",
      "मुंबई आणि रत्नागिरी किनाऱ्यावर लाटांची उंची किती आहे?",
      "जवळचे PFZ मासेमारी क्षेत्र दाखवा",
      "कोणताही चक्रीवादळ इशारा आहे का?",
    ],
  },
  bn: {
    welcome: "সম্ভাব্য মৎস্য অঞ্চল (PFZ), ঢেউয়ের উচ্চতা, সামুদ্রিক ঝুঁকি ও আবহাওয়ার পূর্বাভাস বাংলায় জানুন।",
    placeholder: "বাংলায় জিজ্ঞাসা করুন (বা মাইক ব্যবহার করুন)...",
    prompts: [
      "আজ কি সমুদ্রে যাওয়া নিরাপদ?",
      "কলকাতা এবং দিঘা উপকূলে ঢেউ এবং বাতাসের গতি কত?",
      "নিকটতম PFZ মাছ ধরার অঞ্চল দেখান",
      "কোনো ঘূর্ণিঝড়ের সতর্কতা আছে কি?",
    ],
  },
  or: {
    welcome: "ମତ୍ସ୍ୟ କ୍ଷେତ୍ର (PFZ), ଢେଉର ଉଚ୍ଚତା, ସାମୁଦ୍ରିକ ବିପଦ ଏବଂ ପାଣିପାଗ ପୂର୍ବାନୁମାନ ଓଡ଼ିଆରେ ପଚାରନ୍ତୁ।",
    placeholder: "ଓଡ଼ିଆରେ ପଚାରନ୍ତୁ (କିମ୍ବା ମାଇକ୍ ବ୍ୟବହାର କରନ୍ତୁ)...",
    prompts: [
      "ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?",
      "ପୁରୀ ଏବଂ ପାରାଦ୍ୱୀପରେ ଢେଉ ଓ ପବନର ସ୍ଥିତି କ'ଣ?",
      "ନିକଟତମ PFZ ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ଦେଖାନ୍ତୁ",
      "କୌଣସି ବାତ୍ୟା ଚେତାବନୀ ଅଛି କି?",
    ],
  },
  kn: {
    welcome: "ಸಂಭಾವ್ಯ ಮೀನುಗಾರಿಕಾ ವಲಯಗಳು (PFZ), ಅಲೆಗಳ ಎತ್ತರ, ಸಮುದ್ರ ಅಪಾಯ ಮತ್ತು ಹವಾಮಾನದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ.",
    placeholder: "ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ (ಅಥವಾ ಮೈಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ)...",
    prompts: [
      "ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?",
      "ಮಂಗಳೂರು ಕರಾವಳಿಯಲ್ಲಿ ಅಲೆಗಳ ಎತ್ತರ ಮತ್ತು ಗಾಳಿಯ ವೇಗ",
      "ಹತ್ತಿರದ PFZ ಮೀನುಗಾರಿಕಾ ವಲಯವನ್ನು ತೋರಿಸಿ",
      "ಯಾವುದಾದರೂ ಚಂಡಮಾರುತದ ಎಚ್ಚರಿಕೆ ಇದೆಯೇ?",
    ],
  },
};

export default function AssistantPage() {
  const [selectedLangCode, setSelectedLangCode] = useState("hi");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ query: string; reply: ConversationReply }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useSharedSelectedLocation();

  const currentLangConfig = LOCALIZED_PROMPTS[selectedLangCode] || LOCALIZED_PROMPTS.en;
  const activeVoiceCode = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangCode)?.voiceCode || "hi-IN";

  const handleQuery = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const text = textToSend.trim();
      const history = messages.slice(-6).flatMap((m) => [
        { role: "user" as const, content: m.query },
        { role: "assistant" as const, content: m.reply.answer },
      ]);
      const routing = classifyIntent(text, history);
      const isGeneral = routing.intent === "GENERAL_CONVERSATION";
      const locToSend = !isGeneral && location
        ? { latitude: location.latitude, longitude: location.longitude }
        : undefined;
      const reply = await sendMessage(
        text,
        locToSend,
        messages.at(-1)?.reply.conversation_id,
        {
          history,
          language: selectedLangCode,
        }
      );
      setMessages((items) => [...items, { query: text, reply }]);
      setQuery("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistant is unavailable. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) {
      void handleQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await handleQuery(query);
  };

  return (
    <div className="page assistant-page">
      <PageHeader
        eyebrow="INTELLIGENT MARINE ASSISTANT · 11 INDIAN LANGUAGES"
        title="Ask ORCA (Ocean AI)"
        subtitle="Natural coastal language reasoning, real-time satellite intelligence, deterministic safety rules, and source evidence."
      />
      <div className="assistant-layout">
        <section className="chat-panel">
          {/* Multilingual Selector Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "rgba(15, 23, 42, 0.7)",
              borderRadius: "10px",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              marginBottom: "14px",
              overflowX: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "12px", fontWeight: 600, flexShrink: 0 }}>
              <Languages size={15} />
              <span>Language:</span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap" }}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = selectedLangCode === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLangCode(lang.code)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.05)",
                      color: isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.75)",
                      border: isActive ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lang.native}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="chat-welcome">
            <span>
              <Bot size={20} />
            </span>
            <h2>How can ORCA assist your voyage today?</h2>
            <p>{currentLangConfig.welcome}</p>
          </div>

          <div className="prompt-row">
            {currentLangConfig.prompts.map((text) => (
              <button className="map-control" key={text} onClick={() => void handleQuery(text)}>
                <Sparkles size={13} style={{ color: "#38bdf8" }} />
                {text}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {messages.map(({ query: question, reply }) => (
              <article className="assistant-result" key={reply.message_id}>
                <p className="question-text">{question}</p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "13.5px", color: "#f8fafc", flex: 1 }}>
                    {reply.answer}
                  </div>
                  <VoiceSpeaker text={reply.answer} />
                </div>
                <p className="result-warning" style={{ marginTop: "10px" }}>
                  {JSON.stringify(reply.orchestration.data).match(/demo|fixture/i)
                    ? "DEMO / MIXED DATA — includes prototype fixtures. Check source evidence."
                    : "Real-time validated evidence from connected marine sources."}
                </p>
                <strong className="result-status">{reply.orchestration.status.replaceAll("_", " ")}</strong>
                {reply.orchestration.warnings.map((warning, index) => (
                  <p role="alert" className="result-warning" key={index}>
                    {warning}
                  </p>
                ))}
                {Object.entries(reply.orchestration.data).map(([name, facts]) => (
                  <ServiceFacts key={name} name={name} value={facts} />
                ))}
                {reply.orchestration.errors.length > 0 && (
                  <div role="alert">
                    <h4>Some data could not be checked</h4>
                    <EvidenceFacts value={reply.orchestration.errors} />
                  </div>
                )}
                <details className="conditions-evidence">
                  <summary>Source evidence · {reply.orchestration.evidence.length} records</summary>
                  <EvidenceFacts value={reply.orchestration.evidence} />
                </details>
                <details className="agent-activity">
                  <summary>Completed agent activity</summary>
                  <ol>
                    {reply.orchestration.step_results.map((step) => (
                      <li key={step.step_id}>
                        {step.agent} · {step.status}
                      </li>
                    ))}
                  </ol>
                </details>
              </article>
            ))}
          </div>

          {loading && (
            <p role="status">
              <LoaderCircle className="spin" size={16} /> Reasoning with collaborative marine agents…
            </p>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <form className="assistant-input" onSubmit={submit}>
            <VoiceMic
              onTranscript={(text) => setQuery(text)}
              disabled={loading}
              selectedLang={activeVoiceCode}
            />
            <input
              aria-label="Marine query"
              maxLength={4000}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={currentLangConfig.placeholder}
            />
            <button disabled={loading || !query.trim()} aria-label="Send query">
              {loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
            </button>
          </form>
        </section>

        <aside className="context-panel">
          <div className="context-title">
            <div>
              <p className="eyebrow">SELECTED LOCATION</p>
              <h3>{location?.label ?? "Choose a coastal location"}</h3>
            </div>
            <MapPin size={19} />
          </div>
          <MarineMap selectedLocation={location} showDemoFeatures={false} selectMode onSelectLocation={publishSelectedLocation} />
          <div className="context-facts">
            <p>
              {location
                ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                : "Select a point on the marine map or pick a coastal sector:"}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
              {[
                { name: "Chennai (Bay of Bengal)", lat: 13.08, lon: 80.27 },
                { name: "Mumbai (Arabian Sea)", lat: 18.92, lon: 72.83 },
                { name: "Porbandar (Gujarat)", lat: 21.64, lon: 69.60 },
                { name: "Kochi (Kerala)", lat: 9.93, lon: 76.26 },
                { name: "Vizag (Andhra)", lat: 17.68, lon: 83.21 },
              ].map((loc) => (
                <button
                  key={loc.name}
                  className="map-control"
                  style={{ fontSize: "11px", padding: "3px 8px" }}
                  onClick={() =>
                    publishSelectedLocation({
                      latitude: loc.lat,
                      longitude: loc.lon,
                      source: "default",
                      label: `${loc.name} Sector`,
                    })
                  }
                >
                  📍 {loc.name}
                </button>
              ))}
            </div>

            <Link href="/map">Open full satellite map & layers</Link>
            <p>
              Risk is computed deterministically by ORCA rules. LOW is not a guarantee of safety. Always observe official port clearances.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

