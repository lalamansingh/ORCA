"use client";

import { useState } from "react";
import { ShieldCheck, MapPin, Mic, Radio, Bell, X, Sparkles } from "lucide-react";

interface SafetyOnboardingModalProps {
  isOpen?: boolean;
  selectedLang?: string;
  onClose: () => void;
  onRunTestSOS?: () => void;
}

const ONBOARDING_I18N: Record<
  string,
  {
    title: string;
    subtitle: string;
    hwTitle: string;
    hwDesc: string;
    voiceTitle: string;
    voiceDesc: string;
    offlineTitle: string;
    offlineDesc: string;
    testBtn: string;
    saveBtn: string;
  }
> = {
  hi: {
    title: "आपातकालीन सुरक्षा सेटअप",
    subtitle: "हार्डवेयर इमरजेंसी बटन, ऑफलाइन रिले अनुमतियां और आवाज संकट पहचान सेट करें।",
    hwTitle: "3 बार वॉल्यूम डाउन बटन",
    hwDesc: "गीले हाथों या कम रोशनी में भी 2 सेकंड में 3 बार वॉल्यूम डाउन दबाकर तुरंत SOS भेजें।",
    voiceTitle: "आवाज से संकट पहचान (VAD)",
    voiceDesc: "अपनी मातृभाषा में बोलकर आपातकालीन विवरण तुरंत दर्ज करें (इंजन खराब, तूफान, पानी भरना)।",
    offlineTitle: "ऑफलाइन पीयर रिले सुरक्षा",
    offlineDesc: "नेटवर्क न होने पर SOS सुरक्षित सेव रहता है और पास की नावों के माध्यम से रिले होता है।",
    testBtn: "परीक्षण SOS सिमुलेशन चलाएं",
    saveBtn: "सुरक्षा सेटिंग्स सहेजें",
  },
  en: {
    title: "Emergency Safety Setup",
    subtitle: "Configure hardware emergency keys, offline peer relay, and multilingual voice distress capture.",
    hwTitle: "3x Volume-Down Hardware Trigger",
    hwDesc: "Press Volume Down 3 times within 2 seconds to trigger SOS even with wet hands or low vision.",
    voiceTitle: "Voice Distress Capture (VAD)",
    voiceDesc: "Speak emergency details in your native language (engine failure, capsizing, rough sea).",
    offlineTitle: "Offline Peer-to-Peer Relay",
    offlineDesc: "When cellular/satellite is unavailable, SOS is queued safely in IndexedDB and mesh-relayed.",
    testBtn: "Run Test SOS Simulation",
    saveBtn: "Save & Close Safety Settings",
  },
  ta: {
    title: "அவசர பாதுகாப்பு அமைப்பு",
    subtitle: "ஹார்டுவேர் எமர்ஜென்சி பட்டன், ஆஃப்லைன் ரிலே மற்றும் குரல் உதவி அமைப்புகள்.",
    hwTitle: "3 முறை வால்யூம் டவுன் பட்டன்",
    hwDesc: "ஈரமான கைகளிலும் 2 வினாடிகளில் 3 முறை வால்யூம் டவுன் அழுத்தி அவசர SOS அனுப்பலாம்.",
    voiceTitle: "குரல் வழி அவசர செய்தி (VAD)",
    voiceDesc: "உங்கள் தாய்மொழியில் பேசி அவசர நிலையை உடனடியாக பதிவு செய்யலாம் (இயந்திரக் கோளாறு, புயல்).",
    offlineTitle: "ஆஃப்லைன் பியர் ரிலே பாதுகாப்பு",
    offlineDesc: "நெட்வொர்க் இல்லாதபோது SOS பாதுகாப்பாக சேமிக்கப்பட்டு அருகிலுள்ள படகுகள் மூலம் ரிலே செய்யப்படும்.",
    testBtn: "சோதனை SOS இயக்கவும்",
    saveBtn: "அமைப்புகளை சேமிக்கவும்",
  },
  te: {
    title: "అత్యవసర భద్రతా సెటప్",
    subtitle: "హార్డ్‌వేర్ ఎమర్జెన్సీ బటన్, ఆఫ్‌లైన్ రిలే మరియు వాయిస్ డిస్ట్రెస్ గుర్తింపు.",
    hwTitle: "3 సార్లు వాల్యూమ్ డౌన్ బటన్",
    hwDesc: "తడి చేతులతో కూడా 2 సెకన్లలో 3 సార్లు వాల్యూమ్ డౌన్ నొక్కి వెంటనే SOS పంపండి.",
    voiceTitle: "వాయిస్ డిస్ట్రెస్ క్యాప్చర్ (VAD)",
    voiceDesc: "మీ మాతృభాషలో మాట్లాడి అత్యవసర పరిస్థితిని నమోదు చేయండి (ఇంజిన్ వైఫల్యం, తుఫాను).",
    offlineTitle: "ఆఫ్‌లైన్ పీర్ రిలే రక్షణ",
    offlineDesc: "నెట్‌వర్క్ లేనప్పుడు SOS భద్రంగా నిల్వ చేయబడి సమీపంలోని పడవల ద్వారా రిలే చేయబడుతుంది.",
    testBtn: "టెస్ట్ SOS సిమ్యులేషన్",
    saveBtn: "సెట్టింగ్‌లను సేవ్ చేయండి",
  },
  ml: {
    title: "അടിയന്തര സുരക്ഷാ ക്രമീകരണം",
    subtitle: "ഹാർഡ്‌വെയർ എമർജൻസി ബട്ടൺ, ഓഫ്‌ലൈൻ റിലേ, വോയ്‌സ് ഡിസ്ട്രസ്സ് എന്നിവ ക്രമീകരിക്കുക.",
    hwTitle: "3 തവണ വോളിയം ഡൗൺ ബട്ടൺ",
    hwDesc: "നനഞ്ഞ കൈകളിലും 2 സെക്കൻഡിൽ 3 തവണ വോളിയം ഡൗൺ അമർത്തി ഉടൻ SOS അയക്കുക.",
    voiceTitle: "ശബ്ദത്തിലൂടെയുള്ള സഹായ അഭ്യർത്ഥന",
    voiceDesc: "നിങ്ങളുടെ മാതൃഭാഷയിൽ സംസാരിച്ച് അടിയന്തര വിവരങ്ങൾ രേഖപ്പെടുത്തുക (എഞ്ചിൻ തകരാർ, കാറ്റ്).",
    offlineTitle: "ഓഫ്‌ലൈൻ പിയർ റിലേ",
    offlineDesc: "നെറ്റ്‌വർക്ക് ഇല്ലാത്തപ്പോൾ SOS സുരക്ഷിതമായി സൂക്ഷിക്കുകയും അടുത്തുള്ള ബോട്ടുകൾ വഴി കൈമാറുകയും ചെയ്യുന്നു.",
    testBtn: "ടെസ്റ്റ് SOS പ്രവർത്തിപ്പിക്കുക",
    saveBtn: "ക്രമീകരണങ്ങൾ സംരക്ഷിക്കുക",
  },
  gu: {
    title: "ઇમરજન્સી સુરક્ષા સેટઅપ",
    subtitle: "હાર્ડવેર ઇમરજન્સી બટન, ઑફલાઇન રિલે અને અવાજ સંકટ ઓળખ સેટ કરો.",
    hwTitle: "3 વાર વોલ્યુમ ડાઉન બટન",
    hwDesc: "ભીના હાથે પણ 2 સેકન્ડમાં 3 વાર વોલ્યુમ ડાઉન દબાવીને તાત્કાલિક SOS મોકલો.",
    voiceTitle: "અવાજ દ્વારા સંકટ સંદેશ (VAD)",
    voiceDesc: "તમારી માતૃભાષામાં બોલીને કટોકટીની વિગતો નોંધાવો (એન્જિન નિષ્ફળતા, તોફાન).",
    offlineTitle: "ઑફલાઇન પીઅર રિલે સુરક્ષા",
    offlineDesc: "નેટવર્ક ન હોય ત્યારે SOS સુરક્ષિત રીતે સચવાય છે અને નજીકની બોટો દ્વારા રિલે થાય છે.",
    testBtn: "ટેસ્ટ SOS સિમ્યુલેશન",
    saveBtn: "સેટિંગ્સ સાચવો",
  },
  mr: {
    title: "आपत्कालीन सुरक्षा सेटअप",
    subtitle: "हार्डवेअर इमर्जन्सी बटण, ऑफलाइन रिले आणि व्हॉइस डिस्ट्रेस ओळख सेट करा.",
    hwTitle: "3 वेळा व्हॉल्यूम डाऊन बटण",
    hwDesc: "ओल्या हातांनीही 2 सेकंदात 3 वेळा व्हॉल्यूम डाऊन दाबून त्वरित SOS पाठवा.",
    voiceTitle: "आवाजाद्वारे संकट नोंद (VAD)",
    voiceDesc: "आपल्या मातृभाषेत बोलून आपत्कालीन परिस्थिती नोंदवा (इंजिन बिघाड, वादळ, पाणी भरणे).",
    offlineTitle: "ऑफलाइन पीअर रिले सुरक्षा",
    offlineDesc: "नेटवर्क नसताना SOS सुरक्षित साठवला जातो आणि जवळच्या बोटींद्वारे रिले केला जातो.",
    testBtn: "चाचणी SOS चालवा",
    saveBtn: "सेटिंग्ज जतन करा",
  },
  bn: {
    title: "জরুরী সুরক্ষা সেটআপ",
    subtitle: "হার্ডওয়্যার জরুরী বোতাম, অফলাইন রিলে এবং ভয়েস সতর্কতা সেট করুন।",
    hwTitle: "৩ বার ভলিউম ডাউন বোতাম",
    hwDesc: "ভেজা হাতেও ২ সেকেন্ডে ৩ বার ভলিউম ডাউন টিপে সাথে সাথে SOS পাঠান।",
    voiceTitle: "কণ্ঠস্বরের মাধ্যমে জরুরী বার্তা (VAD)",
    voiceDesc: "আপনার মাতৃভাষায় কথা বলে জরুরী পরিস্থিতি রেকর্ড করুন (ইঞ্জিন বিকল, ঝড়, জল ঢোকা)।",
    offlineTitle: "অফলাইন পিয়ার রিলে সুরক্ষা",
    offlineDesc: "নেটওয়ার্ক না থাকলে SOS নিরাপদে সংরক্ষিত থাকে এবং কাছের নৌকার মাধ্যমে রিলে হয়।",
    testBtn: "টেস্ট SOS চালান",
    saveBtn: "সেটিংস সংরক্ষণ করুন",
  },
  kn: {
    title: "ತುರ್ತು ಸುರಕ್ಷತಾ ಸೆಟಪ್",
    subtitle: "ಹಾರ್ಡ್‌ವೇರ್ ತುರ್ತು ಬಟನ್, ಆಫ್‌ಲೈನ್ ರಿಲೇ ಮತ್ತು ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯನ್ನು ಹೊಂದಿಸಿ.",
    hwTitle: "3 ಬಾರಿ ವಾಲ್ಯೂಮ್ ಡೌನ್ ಬಟನ್",
    hwDesc: "ತೇವವಾದ ಕೈಗಳಲ್ಲೂ 2 ಸೆಕೆಂಡುಗಳಲ್ಲಿ 3 ಬಾರಿ ವಾಲ್ಯೂಮ್ ಡೌನ್ ಒತ್ತಿ ತಕ್ಷಣ SOS ಕಳುಹಿಸಿ.",
    voiceTitle: "ಧ್ವನಿ ಮೂಲಕ ತುರ್ತು ಸಂದೇಶ (VAD)",
    voiceDesc: "ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ತುರ್ತು ವಿವರಗಳನ್ನು ದಾಖಲಿಸಿ (ಎಂಜಿನ್ ವೈಫಲ್ಯ, ಚಂಡಮಾರುತ).",
    offlineTitle: "ಆಫ್‌ಲೈನ್ ಪೀರ್ ರಿಲೇ ಸುರಕ್ಷತೆ",
    offlineDesc: "ನೆಟ್‌ವರ್ಕ್ ಇಲ್ಲದಿದ್ದಾಗ SOS ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹವಾಗುತ್ತದೆ ಮತ್ತು ಹತ್ತಿರದ ದೋಣಿಗಳ ಮೂಲಕ ರಿಲೇ ಆಗುತ್ತದೆ.",
    testBtn: "ಟೆಸ್ಟ್ SOS ರನ್ ಮಾಡಿ",
    saveBtn: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
  },
  or: {
    title: "ଜରୁରୀକାଳୀନ ସୁରକ୍ଷା ସେଟଅପ୍",
    subtitle: "ହାର୍ଡୱେର୍ ଜରୁରୀ ବଟନ୍, ଅଫଲାଇନ୍ ରିଲେ ଏବଂ ଭଏସ୍ ସତର୍କତା ସେଟ୍ କରନ୍ତୁ।",
    hwTitle: "୩ ଥର ଭଲ୍ୟୁମ୍ ଡାଉନ୍ ବଟନ୍",
    hwDesc: "ଓଦା ହାତରେ ମଧ୍ୟ ୨ ସେକେଣ୍ଡରେ ୩ ଥର ଭଲ୍ୟୁମ୍ ଡାଉନ୍ ଦବାଇ ତୁରନ୍ତ SOS ପଠାନ୍ତୁ।",
    voiceTitle: "ଭଏସ୍ ମାଧ୍ୟମରେ ସତର୍କତା (VAD)",
    voiceDesc: "ଆପଣଙ୍କ ମାତୃଭାଷାରେ କହି ଜରୁରୀ ସୂଚନା ରେକର୍ଡ କରନ୍ତୁ (ଇଞ୍ଜିନ୍ ଖରାପ, ବାତ୍ୟା, ପାଣି ପଶିବା)।",
    offlineTitle: "ଅଫଲାଇନ୍ ପିଅର୍ ରିଲେ ସୁରକ୍ଷା",
    offlineDesc: "ନେଟୱର୍କ ନଥିଲେ ମଧ୍ୟ SOS ସୁରକ୍ଷିତ ରହି ପାଖ ଡଙ୍ଗା ମାଧ୍ୟମରେ ରିଲେ ହୁଏ।",
    testBtn: "ଟେଷ୍ଟ SOS ଚଲାନ୍ତୁ",
    saveBtn: "ସେଟିଙ୍ଗସ୍ ସେଭ୍ କରନ୍ତୁ",
  },
};

export function SafetyOnboardingModal({
  isOpen = true,
  selectedLang = "hi",
  onClose,
  onRunTestSOS,
}: SafetyOnboardingModalProps) {
  const i18n = ONBOARDING_I18N[selectedLang] || ONBOARDING_I18N["hi"] || ONBOARDING_I18N["en"];

  if (!isOpen) return null;

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
          maxWidth: "420px",
          background: "linear-gradient(180deg, #091b26 0%, #030d14 100%)",
          border: "1.5px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "20px",
          padding: "20px",
          color: "#ffffff",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={20} style={{ color: "#38bdf8" }} />
            <h3 style={{ fontSize: "16px", margin: 0, color: "#f8fafc" }}>
              {i18n.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "0 0 16px 0", lineHeight: 1.4 }}>
          {i18n.subtitle}
        </p>

        {/* Feature List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#ef4444" }}><Radio size={20} /></div>
            <div>
              <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc" }}>
                {i18n.hwTitle}
              </strong>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {i18n.hwDesc}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#38bdf8" }}><Mic size={20} /></div>
            <div>
              <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc" }}>
                {i18n.voiceTitle}
              </strong>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {i18n.voiceDesc}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#34d399" }}><MapPin size={20} /></div>
            <div>
              <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc" }}>
                {i18n.offlineTitle}
              </strong>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {i18n.offlineDesc}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {onRunTestSOS && (
            <button
              type="button"
              onClick={onRunTestSOS}
              style={{
                width: "100%",
                padding: "10px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                borderRadius: "10px",
                color: "#fee2e2",
                fontWeight: 700,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Sparkles size={14} />
              <span>{i18n.testBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              background: "#38bdf8",
              border: "none",
              borderRadius: "10px",
              color: "#082536",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {i18n.saveBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
