"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Send, ShieldAlert, X, Edit3 } from "lucide-react";
import { VoiceDistressCapture } from "@/features/sos/voice-distress-capture";
import { useSOSStore } from "@/features/sos/sos-store";

interface VoiceDistressModalProps {
  selectedLang?: string;
  onCancel?: () => void;
  onSubmitTranscript?: (transcript: string) => void;
}

const VOICE_I18N: Record<
  string,
  {
    title: string;
    subtitle: string;
    listening: string;
    defaultMsg: string;
    sendBtn: string;
    cancelBtn: string;
  }
> = {
  hi: {
    title: "अपनी आपातकालीन स्थिति बोलें",
    subtitle: "अपनी भाषा में स्पष्ट बोलें (उदा. इंजन खराब, नाव में पानी भरना, तूफान)।",
    listening: "आपकी आवाज सुनी जा रही है...",
    defaultMsg: "समुद्र में तत्काल आपातकालीन सहायता की आवश्यकता है।",
    sendBtn: "तुरंत SOS रिपोर्ट भेजें",
    cancelBtn: "रद्द करें",
  },
  en: {
    title: "SPEAK YOUR DISTRESS MESSAGE",
    subtitle: "Speak clearly in your language (e.g. engine failure, rough sea, flooding).",
    listening: "Listening to your voice...",
    defaultMsg: "Immediate emergency assistance required at sea.",
    sendBtn: "TRANSMIT SOS REPORT NOW",
    cancelBtn: "Cancel Distress",
  },
  ta: {
    title: "உங்கள் அவசர நிலையை பேசுங்கள்",
    subtitle: "உங்கள் தாய்மொழியில் தெளிவாக பேசுங்கள் (எ.கா. இயந்திரக் கோளாறு, படகில் நீர்).",
    listening: "உங்கள் குரல் கேட்கப்படுகிறது...",
    defaultMsg: "கடலில் உடனடி அவசர உதவி தேவைப்படுகிறது.",
    sendBtn: "உடனடியாக SOS அனுப்பவும்",
    cancelBtn: "ரத்து செய்",
  },
  te: {
    title: "మీ అత్యవసర పరిస్థితిని మాట్లాడండి",
    subtitle: "స్పష్టంగా మాట్లాడండి (ఉదా. ఇంజిన్ వైఫల్యం, పడవలో నీరు చేరడం, తుఫాను).",
    listening: "మీ వాయిస్ వినబడుతోంది...",
    defaultMsg: "సముద్రంలో తక్షణ అత్యవసర సహాయం అవసరం.",
    sendBtn: "వెంటనే SOS నివేదికను పంపండి",
    cancelBtn: "రద్దు చేయండి",
  },
  ml: {
    title: "നിങ്ങളുടെ അടിയന്തര സാഹചര്യം സംസാരിക്കുക",
    subtitle: "വ്യക്തമായി സംസാരിക്കുക (ഉദാ. എഞ്ചിൻ തകരാർ, ബോട്ടിൽ വെള്ളം കയറൽ).",
    listening: "നിങ്ങളുടെ ശബ്ദം കേൾക്കുന്നു...",
    defaultMsg: "കടലിൽ അടിയന്തര സഹായം ആവശ്യമാണ്.",
    sendBtn: "ഉടൻ SOS അയക്കുക",
    cancelBtn: "റദ്ദാക്കുക",
  },
  gu: {
    title: "તમારી કટોકટીની સ્થિતિ બોલો",
    subtitle: "સ્પષ્ટ રીતે બોલો (દા.ત. એન્જિન નિષ્ફળતા, બોટમાં પાણી ભરાવું, તોફાન).",
    listening: "તમારો અવાજ સંભળાઈ રહ્યો છે...",
    defaultMsg: "દરિયામાં તાત્કાલિક કટોકટી સહાયની જરૂર છે.",
    sendBtn: "તરત જ SOS રિપોર્ટ મોકલો",
    cancelBtn: "રદ કરો",
  },
  mr: {
    title: "आपली आपत्कालीन परिस्थिती बोला",
    subtitle: "स्पष्ट बोला (उदा. इंजिन बिघाड, बोटीमध्ये पाणी भरणे, वादळ).",
    listening: "आपला आवाज ऐकला जात आहे...",
    defaultMsg: "समुद्रात त्वरित आपत्कालीन मदतीची आवश्यकता आहे.",
    sendBtn: "त्वरित SOS अहवाल पाठवा",
    cancelBtn: "रद्द करा",
  },
  bn: {
    title: "আপনার জরুরী পরিস্থিতি বলুন",
    subtitle: "পরিষ্কারভাবে বলুন (যেমন ইঞ্জিন বিকল, নৌকায় জল ঢোকা, তীব্র ঝড়)।",
    listening: "আপনার কণ্ঠস্বর শোনা হচ্ছে...",
    defaultMsg: "সমুদ্রে অবিলম্বে জরুরী সহায়তা প্রয়োজন।",
    sendBtn: "এখনই SOS রিপোর্ট পাঠান",
    cancelBtn: "বাতিল করুন",
  },
  kn: {
    title: "ನಿಮ್ಮ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯನ್ನು ಮಾತನಾಡಿ",
    subtitle: "ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ (ಉದಾ. ಎಂಜಿನ್ ವೈಫಲ್ಯ, ದೋಣಿಯಲ್ಲಿ ನೀರು, ಚಂಡಮಾರುತ).",
    listening: "ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ...",
    defaultMsg: "ಸಮುದ್ರದಲ್ಲಿ ತಕ್ಷಣದ ತುರ್ತು ನೆರವು ಅಗತ್ಯವಿದೆ.",
    sendBtn: "ತಕ್ಷಣ SOS ವರದಿ ಕಳುಹಿಸಿ",
    cancelBtn: "ರದ್ದುಮಾಡಿ",
  },
  or: {
    title: "ଆପଣଙ୍କ ଜରୁରୀ ସ୍ଥିତି ବିଷୟରେ କୁହନ୍ତୁ",
    subtitle: "ସ୍ପଷ୍ଟ ଭାବରେ କୁହନ୍ତୁ (ଇଞ୍ଜିନ୍ ଖରାପ, ଡଙ୍ଗାରେ ପାଣି ପଶିବା, ବାତ୍ୟା)।",
    listening: "ଆପଣଙ୍କ ସ୍ୱର ଶୁଣାଯାଉଛି...",
    defaultMsg: "ସମୁଦ୍ରରେ ତୁରନ୍ତ ଜରୁରୀ ସହାୟତା ଆବଶ୍ୟକ।",
    sendBtn: "ତୁରନ୍ତ SOS ରିପୋର୍ଟ ପଠାନ୍ତୁ",
    cancelBtn: "ବାତିଲ୍ କରନ୍ତୁ",
  },
};

export function VoiceDistressModal({
  selectedLang = "en",
  onCancel,
  onSubmitTranscript,
}: VoiceDistressModalProps) {
  const store = useSOSStore();
  const isCapturing = store.workflowState === "CAPTURING" || store.workflowState === "TRANSCRIBING";

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(true);
  const [manualMode, setManualMode] = useState(false);

  const i18n = VOICE_I18N[selectedLang] || VOICE_I18N["en"] || VOICE_I18N["hi"];

  useEffect(() => {
    if (!isCapturing && !onSubmitTranscript) return;
    if (manualMode) return;

    const cleanup = VoiceDistressCapture.startCapture(
      selectedLang,
      (text) => setTranscript(text),
      (result) => {
        setTranscript(result.transcript);
        setIsListening(false);
      }
    );

    return () => cleanup();
  }, [selectedLang, manualMode, isCapturing, onSubmitTranscript]);

  if (!isCapturing && !onSubmitTranscript) return null;

  const handleSubmit = () => {
    const finalMsg = transcript.trim() || i18n.defaultMsg;
    if (onSubmitTranscript) {
      onSubmitTranscript(finalMsg);
    } else {
      store.submitReport({ transcript: finalMsg, language: selectedLang });
    }
  };

  const handleCancel = onCancel || store.cancelSOS;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "linear-gradient(180deg, #180a0a 0%, #080202 100%)",
          border: "2px solid #ef4444",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 0 50px rgba(239, 68, 68, 0.5)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: isListening ? "rgba(220, 38, 38, 0.3)" : "rgba(56, 189, 248, 0.2)",
            border: `2px solid ${isListening ? "#ef4444" : "#38bdf8"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            color: isListening ? "#ef4444" : "#38bdf8",
            animation: isListening ? "pulse 1.5s infinite" : "none",
          }}
        >
          {isListening ? <Mic size={32} /> : <MicOff size={32} />}
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px 0", color: "#fee2e2" }}>
          {i18n.title}
        </h3>

        <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "0 0 14px 0", lineHeight: 1.4 }}>
          {i18n.subtitle}
        </p>

        {/* Live Speech Recognition Transcript Box */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "12px",
            minHeight: "80px",
            textAlign: "left",
            fontSize: "13px",
            color: transcript ? "#ffffff" : "#64748b",
            marginBottom: "16px",
            position: "relative",
          }}
        >
          {manualMode ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type distress description here..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
                resize: "none",
                height: "60px",
              }}
            />
          ) : (
            <div>{transcript || i18n.listening}</div>
          )}

          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#94a3b8",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10.5px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <Edit3 size={11} />
            <span>{manualMode ? "Mic Mode" : "Edit Text"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              border: "1.5px solid #ef4444",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
            }}
          >
            <Send size={15} />
            <span>{i18n.sendBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <X size={14} />
            <span>{i18n.cancelBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
