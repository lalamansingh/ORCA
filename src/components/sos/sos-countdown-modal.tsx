"use client";

import { ShieldAlert, X, Send } from "lucide-react";
import { useSOSStore } from "@/features/sos/sos-store";

interface SOSCountdownModalProps {
  countdownSeconds?: number;
  selectedLang?: string;
  onCancel?: () => void;
  onSendNow?: () => void;
}

const COUNTDOWN_I18N: Record<
  string,
  {
    title: string;
    desc: string;
    cancelBtn: string;
    sendNowBtn: string;
  }
> = {
  hi: {
    title: "आपातकालीन SOS भेजा जा रहा है",
    desc: "कुछ सेकंड में आवाज रिकॉर्डर खुलेगा। गलत अलार्म रोकने के लिए रद्द करें।",
    cancelBtn: "रद्द करें (गलत अलार्म)",
    sendNowBtn: "तुरंत आवाज रिकॉर्ड करें",
  },
  en: {
    title: "TRANSMITTING DISTRESS SOS",
    desc: "Voice recorder opening in seconds. Tap cancel if this is a false alarm.",
    cancelBtn: "Cancel SOS (False Alarm)",
    sendNowBtn: "Skip Countdown & Record Voice",
  },
  ta: {
    title: "அவசர SOS அனுப்பப்படுகிறது",
    desc: "குரல் பதிவு சில வினாடிகளில் தொடங்கும். தவறான எச்சரிக்கையை ரத்து செய்யவும்.",
    cancelBtn: "ரத்து செய் (தவறான எச்சரிக்கை)",
    sendNowBtn: "உடனடியாக குரல் பதிவு செய்",
  },
  te: {
    title: "అత్యవసర SOS పంపబడుతోంది",
    desc: "వాయిస్ రికార్డర్ కొన్ని సెకన్లలో ప్రారంభమవుతుంది. తప్పుడు అలారం అయితే రద్దు చేయండి.",
    cancelBtn: "రద్దు చేయండి (తప్పుడు అలారం)",
    sendNowBtn: "తక్షణమే వాయిస్ రికార్డ్ చేయండి",
  },
  ml: {
    title: "അടിയന്തര SOS അയക്കുന്നു",
    desc: "ശബ്ദ റെക്കോർഡർ ഉടൻ തുറക്കും. തെറ്റായ അലാറം ആണെങ്കിൽ റദ്ദാക്കുക.",
    cancelBtn: "റദ്ദാക്കുക (തെറ്റായ അലാറം)",
    sendNowBtn: "ഉടൻ ശബ്ദം റെക്കോർഡ് ചെയ്യുക",
  },
  gu: {
    title: "કટોકટી SOS મોકલાઈ રહ્યું છે",
    desc: "થોડીવારમાં વોઇસ રેકોર્ડર ખુલશે. ખોટા એલાર્મ માટે રદ કરો.",
    cancelBtn: "રદ કરો (ખોટો એલાર્મ)",
    sendNowBtn: "તરત જ અવાજ રેકોર્ડ કરો",
  },
  mr: {
    title: "आपत्कालीन SOS पाठवले जात आहे",
    desc: "काही सेकंदात व्हॉइस रेकॉर्डर उघडेल. खोटा अलार्म असल्यास रद्द करा.",
    cancelBtn: "रद्द करा (खोटा अलार्म)",
    sendNowBtn: "त्वरित आवाज रेकॉर्ड करा",
  },
  bn: {
    title: "জরুরী SOS পাঠানো হচ্ছে",
    desc: "কিছু সেকেন্ডের মধ্যে ভয়েস রেকর্ডার খুলবে। ভুল অ্যালার্ম বাতিল করুন।",
    cancelBtn: "বাতিল করুন (ভুল অ্যালার্ম)",
    sendNowBtn: "এখনই ভয়েস রেকর্ড করুন",
  },
  kn: {
    title: "ತುರ್ತು SOS ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ",
    desc: "ಕೆಲವೇ ಕ್ಷಣಗಳಲ್ಲಿ ಧ್ವನಿ ರೆಕಾರ್ಡರ್ ತೆರೆಯುತ್ತದೆ. ತಪ್ಪು ಅಲಾರಾಂ ರದ್ದುಗೊಳಿಸಿ.",
    cancelBtn: "ರದ್ದುಮಾಡಿ (ತಪ್ಪು ಅಲಾರಾಂ)",
    sendNowBtn: "ತಕ್ಷಣ ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಮಾಡಿ",
  },
  or: {
    title: "ଜରୁରୀକାଳୀନ SOS ପଠାଯାଉଛି",
    desc: "କିଛି ସେକେଣ୍ଡରେ ଭଏସ୍ ରେକର୍ଡର ଖୋଲିବ। ଭୁଲ୍ ଆଲାର୍ମ ବାତିଲ୍ କରନ୍ତୁ।",
    cancelBtn: "ବାତିଲ୍ କରନ୍ତୁ",
    sendNowBtn: "ତୁରନ୍ତ ଭଏସ୍ ରେକର୍ଡ କରନ୍ତୁ",
  },
};

export function SOSCountdownModal({
  countdownSeconds: propCountdown,
  selectedLang = "hi",
  onCancel,
  onSendNow,
}: SOSCountdownModalProps) {
  const store = useSOSStore();
  const isArmed = store.workflowState === "ARMED";
  const countdownSeconds = propCountdown !== undefined ? propCountdown : store.countdownSeconds;
  const handleCancel = onCancel || store.cancelSOS;
  const handleSendNow = onSendNow || store.startVoiceCapture;

  const i18n = COUNTDOWN_I18N[selectedLang] || COUNTDOWN_I18N["hi"] || COUNTDOWN_I18N["en"];

  if (!isArmed && propCountdown === undefined) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
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
          maxWidth: "380px",
          background: "linear-gradient(180deg, #1e0505 0%, #0a0101 100%)",
          border: "2px solid #ef4444",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 0 40px rgba(239, 68, 68, 0.4)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "rgba(220, 38, 38, 0.2)",
            border: "2px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            color: "#ef4444",
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px 0", color: "#fee2e2" }}>
          {i18n.title}
        </h3>

        <p style={{ fontSize: "12px", color: "#fca5a5", margin: "0 0 16px 0", lineHeight: 1.4 }}>
          {i18n.desc}
        </p>

        {/* Big Countdown Number Circle */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "4px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            fontSize: "36px",
            fontWeight: 900,
            color: "#ffffff",
            background: "rgba(239, 68, 68, 0.2)",
            animation: "pulse 1s infinite ease-in-out",
          }}
        >
          {countdownSeconds}
        </div>

        {/* Modal Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <X size={16} />
            <span>{i18n.cancelBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleSendNow}
            style={{
              width: "100%",
              padding: "12px",
              background: "#ef4444",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Send size={15} />
            <span>{i18n.sendNowBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
