"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, MapPin, Mic, Radio, Bell, X, Sparkles, User, Ship, Phone, CheckCircle2 } from "lucide-react";

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
    profileHeading: string;
    nameLabel: string;
    namePlaceholder: string;
    vesselLabel: string;
    vesselPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    testBtn: string;
    saveBtn: string;
    savedToast: string;
  }
> = {
  hi: {
    title: "आपातकालीन सुरक्षा सेटअप (Safety Setup)",
    subtitle: "हार्डवेयर इमरजेंसी बटन, मछुआरा प्रोफाइल और आवाज संकट पहचान कॉन्फ़िगर करें।",
    hwTitle: "3 बार वॉल्यूम डाउन बटन (3x Volume-Down)",
    hwDesc: "गीले हाथों या कम रोशनी में भी 2 सेकंड में 3 बार वॉल्यूम डाउन (या F1 / Alt+V) दबाकर तुरंत SOS भेजें।",
    voiceTitle: "आवाज से संकट पहचान (Multilingual VAD)",
    voiceDesc: "अपनी मातृभाषा में बोलकर आपातकालीन विवरण तुरंत दर्ज करें (इंजन खराब, तूफान, पानी भरना)।",
    offlineTitle: "ऑफलाइन पीयर रिले सुरक्षा",
    offlineDesc: "नेटवर्क न होने पर SOS सुरक्षित सेव रहता है और पास की नावों के माध्यम से रिले होता है।",
    profileHeading: "मछुआरा व नौका पहचान (Fisherman & Vessel Profile)",
    nameLabel: "मछुआरे का नाम (Fisherman Name)",
    namePlaceholder: "उदा. रमेश कुमार / सागर नाविक",
    vesselLabel: "नाव / पोत पंजीकरण संख्या (Vessel Reg No)",
    vesselPlaceholder: "उदा. IND-MH-02-MM-1042",
    phoneLabel: "आपातकालीन संपर्क नंबर (Emergency Contact Mobile)",
    phonePlaceholder: "उदा. +91 98765 43210",
    testBtn: "🚨 लाइव SOS संकट का परीक्षण करें (Test SOS Now)",
    saveBtn: "✓ सेटिंग्स सुरक्षित करें (Save Settings)",
    savedToast: "सेटिंग्स सफलतापूर्वक सहेज ली गईं!",
  },
  en: {
    title: "Emergency Safety Setup",
    subtitle: "Configure hardware emergency keys, fisherman profile, and multilingual voice distress capture.",
    hwTitle: "3x Volume-Down Hardware Trigger",
    hwDesc: "Press Volume Down 3 times within 2 seconds (or F1 / Alt+V hotkey) to trigger SOS instantly.",
    voiceTitle: "Voice Distress Capture (VAD)",
    voiceDesc: "Speak emergency details in your native language (engine failure, capsizing, rough sea).",
    offlineTitle: "Offline Peer-to-Peer Relay",
    offlineDesc: "When cellular/satellite is unavailable, SOS is queued safely in IndexedDB and mesh-relayed.",
    profileHeading: "Fisherman & Vessel Profile",
    nameLabel: "Fisherman Name",
    namePlaceholder: "e.g. Ramesh Kumar",
    vesselLabel: "Vessel Registration Number",
    vesselPlaceholder: "e.g. IND-MH-02-MM-1042",
    phoneLabel: "Emergency Contact Mobile",
    phonePlaceholder: "e.g. +91 98765 43210",
    testBtn: "🚨 Run Live SOS Test (Test SOS Now)",
    saveBtn: "✓ Save & Close Settings",
    savedToast: "Settings saved successfully!",
  },
  ta: {
    title: "அவசர பாதுகாப்பு அமைப்பு",
    subtitle: "ஹார்டுவேர் எமர்ஜென்சி பட்டன், மீனவர் விவரங்கள் மற்றும் குரல் உதவி அமைப்புகள்.",
    hwTitle: "3 முறை வால்யூம் டவுன் பட்டன்",
    hwDesc: "ஈரமான கைகளிலும் 2 வினாடிகளில் 3 முறை வால்யூம் டவுன் அழுத்தி அவசர SOS அனுப்பலாம்.",
    voiceTitle: "குரல் வழி அவசர செய்தி (VAD)",
    voiceDesc: "உங்கள் தாய்மொழியில் பேசி அவசர நிலையை உடனடியாக பதிவு செய்யலாம்.",
    offlineTitle: "ஆஃப்லைன் பியர் ரிலே பாதுகாப்பு",
    offlineDesc: "நெட்வொர்க் இல்லாதபோது SOS பாதுகாப்பாக சேமிக்கப்பட்டு அருகிலுள்ள படகுகள் மூலம் ரிலே செய்யப்படும்.",
    profileHeading: "மீனவர் மற்றும் படகு விவரங்கள்",
    nameLabel: "மீனவர் பெயர்",
    namePlaceholder: "எ.கா. ரமேஷ் குமார்",
    vesselLabel: "படகு பதிவு எண்",
    vesselPlaceholder: "எ.கா. IND-TN-02-FB-1042",
    phoneLabel: "அவசர தொடர்பு எண்",
    phonePlaceholder: "எ.கா. +91 98765 43210",
    testBtn: "🚨 சோதனை SOS இயக்கவும்",
    saveBtn: "✓ அமைப்புகளை சேமிக்கவும்",
    savedToast: "அமைப்புகள் சேமிக்கப்பட்டன!",
  },
  te: {
    title: "అత్యవసర భద్రతా సెటప్",
    subtitle: "హార్డ్‌వేర్ ఎమర్జెన్సీ బటన్, మత్స్యకారుల ప్రొఫైల్ మరియు వాయిస్ డిస్ట్రెస్ గుర్తింపు.",
    hwTitle: "3 సార్లు వాల్యూమ్ డౌన్ బటన్",
    hwDesc: "తడి చేతులతో కూడా 2 సెకన్లలో 3 సార్లు వాల్యూమ్ డౌన్ నొక్కి వెంటనే SOS పంపండి.",
    voiceTitle: "వాయిస్ డిస్ట్రెస్ క్యాప్చర్ (VAD)",
    voiceDesc: "మీ మాతృభాషలో మాట్లాడి అత్యవసర పరిస్థితిని నమోదు చేయండి.",
    offlineTitle: "ఆఫ్‌లైన్ పీర్ రిలే రక్షణ",
    offlineDesc: "నెట్‌వర్క్ లేనప్పుడు SOS భద్రంగా నిల్వ చేయబడి సమీపంలోని పడవల ద్వారా రిలే చేయబడుతుంది.",
    profileHeading: "మత్స్యకారుడు మరియు పడవ వివరాలు",
    nameLabel: "మత్స్యకారుని పేరు",
    namePlaceholder: "ఉదా. రమేష్ కుమార్",
    vesselLabel: "పడవ రిజిస్ట్రేషన్ నంబర్",
    vesselPlaceholder: "ఉదా. IND-AP-02-FB-1042",
    phoneLabel: "అత్యవసర సంప్రదింపు నంబర్",
    phonePlaceholder: "ఉదా. +91 98765 43210",
    testBtn: "🚨 టెస్ట్ SOS రన్ చేయండి",
    saveBtn: "✓ సెట్టింగ్‌లను సేవ్ చేయండి",
    savedToast: "సెట్టింగ్‌లు సేవ్ చేయబడ్డాయి!",
  },
  ml: {
    title: "അടിയന്തര സുരക്ഷാ ക്രമീകരണം",
    subtitle: "ഹാർഡ്‌വെയർ എമർജൻസി ബട്ടൺ, മത്സ്യത്തൊഴിലാളി പ്രൊഫൈൽ എന്നിവ ക്രമീകരിക്കുക.",
    hwTitle: "3 തവണ വോളിയം ഡൗൺ ബട്ടൺ",
    hwDesc: "നനഞ്ഞ കൈകളിലും 2 സെക്കൻഡിൽ 3 തവണ വോളിയം ഡൗൺ അമർത്തി ഉടൻ SOS അയക്കുക.",
    voiceTitle: "ശബ്ദത്തിലൂടെയുള്ള സഹായ അഭ്യർത്ഥന",
    voiceDesc: "നിങ്ങളുടെ മാതൃഭാഷയിൽ സംസാരിച്ച് അടിയന്തര വിവരങ്ങൾ രേഖപ്പെടുത്തുക.",
    offlineTitle: "ഓഫ്‌ലൈൻ പിയർ റിലേ",
    offlineDesc: "നെറ്റ്‌വർക്ക് ഇല്ലാത്തപ്പോൾ SOS സുരക്ഷിതമായി അടുത്തുള്ള ബോട്ടുകൾ വഴി കൈമാറുന്നു.",
    profileHeading: "മത്സ്യത്തൊഴിലാളിയുടെ വിവരങ്ങൾ",
    nameLabel: "പേര്",
    namePlaceholder: "ഉദാ. രമേഷ് കുമാർ",
    vesselLabel: "ബോട്ട് രജിസ്ട്രേഷൻ നമ്പർ",
    vesselPlaceholder: "ഉദാ. IND-KL-02-MM-1042",
    phoneLabel: "അടിയന്തര ഫോൺ നമ്പർ",
    phonePlaceholder: "ഉദാ. +91 98765 43210",
    testBtn: "🚨 ടെസ്റ്റ് SOS പ്രവർത്തിപ്പിക്കുക",
    saveBtn: "✓ സേവ് ചെയ്യുക",
    savedToast: "വിവരങ്ങൾ വിജയകരമായി സംരക്ഷിച്ചു!",
  },
  gu: {
    title: "ઇમરજન્સી સુરક્ષા સેટઅપ",
    subtitle: "હાર્ડવેર ઇમરજન્સી બટન, માછીમાર પ્રોફાઇલ અને અવાજ સંકટ ઓળખ સેટ કરો.",
    hwTitle: "3 વાર વોલ્યુમ ડાઉન બટન",
    hwDesc: "ભીના હાથે પણ 2 સેકન્ડમાં 3 વાર વોલ્યુમ ડાઉન દબાવીને તાત્કાલિક SOS મોકલો.",
    voiceTitle: "અવાજ દ્વારા સંકટ સંદેશ (VAD)",
    voiceDesc: "તમારી માતૃભાષામાં બોલીને કટોકટીની વિગતો નોંધાવો.",
    offlineTitle: "ઑફલાઇન પીઅર રિલે સુરક્ષા",
    offlineDesc: "નેટવર્ક ન હોય ત્યારે SOS સુરક્ષિત રીતે નજીકની બોટો દ્વારા રિલે થાય છે.",
    profileHeading: "માછીમાર અને બોટ વિગતો",
    nameLabel: "માછીમારનું નામ",
    namePlaceholder: "દા.ત. રમેશ કુમાર",
    vesselLabel: "બોટ નોંધણી નંબર",
    vesselPlaceholder: "દા.ત. IND-GJ-02-MM-1042",
    phoneLabel: "કટોકટી મોબાઈલ નંબર",
    phonePlaceholder: "દા.ત. +91 98765 43210",
    testBtn: "🚨 ટેસ્ટ SOS ચલાવો",
    saveBtn: "✓ સેટિંગ્સ સાચવો",
    savedToast: "સેટિંગ્સ સાચવવામાં આવી!",
  },
  mr: {
    title: "आपत्कालीन सुरक्षा सेटअप",
    subtitle: "हार्डवेअर इमर्जन्सी बटण, मच्छीमार प्रोफाइल आणि व्हॉइस डिस्ट्रेस ओळख सेट करा.",
    hwTitle: "3 वेळा व्हॉल्यूम डाऊन बटण",
    hwDesc: "ओल्या हातांनीही 2 सेकंदात 3 वेळा व्हॉल्यूम डाऊन दाबून त्वरित SOS पाठवा.",
    voiceTitle: "आवाजाद्वारे संकट नोंद (VAD)",
    voiceDesc: "आपल्या मातृभाषेत बोलून आपत्कालीन परिस्थिती नोंदवा.",
    offlineTitle: "ऑफलाइन पीअर रिले सुरक्षा",
    offlineDesc: "नेटवर्क नसताना SOS सुरक्षित साठवला जातो आणि जवळच्या बोटींद्वारे रिले केला जातो.",
    profileHeading: "मच्छीमार व नौका तपशील",
    nameLabel: "मच्छीमाराचे नाव",
    namePlaceholder: "उदा. रमेश कुमार",
    vesselLabel: "नौका नोंदणी क्रमांक",
    vesselPlaceholder: "उदा. IND-MH-02-MM-1042",
    phoneLabel: "आपत्कालीन संपर्क क्रमांक",
    phonePlaceholder: "उदा. +91 98765 43210",
    testBtn: "🚨 चाचणी SOS चालवा",
    saveBtn: "✓ सेटिंग्ज जतन करा",
    savedToast: "सेटिंग्ज यशस्वीरित्या जतन केल्या!",
  },
  bn: {
    title: "জরুরী সুরক্ষা সেটআপ",
    subtitle: "হার্ডওয়্যার জরুরী বোতাম, জেলে প্রোফাইল এবং ভয়েস সতর্কতা সেট করুন।",
    hwTitle: "৩ বার ভলিউম ডাউন বোতাম",
    hwDesc: "ভেজা হাতেও ২ সেকেন্ডে ৩ বার ভলিউম ডাউন টিপে সাথে সাথে SOS পাঠান।",
    voiceTitle: "কণ্ঠস্বরের মাধ্যমে জরুরী বার্তা (VAD)",
    voiceDesc: "আপনার মাতৃভাষায় কথা বলে জরুরী পরিস্থিতি রেকর্ড করুন।",
    offlineTitle: "অফলাইন পিয়ার রিলে সুরক্ষা",
    offlineDesc: "নেটওয়ার্ক না থাকলে SOS নিরাপদে সংরক্ষিত থাকে এবং কাছের নৌকার মাধ্যমে রিলে হয়।",
    profileHeading: "জেলে এবং নৌকার বিবরণ",
    nameLabel: "জেলের নাম",
    namePlaceholder: "যেমন: রমেশ কুমার",
    vesselLabel: "নৌকা নিবন্ধন নম্বর",
    vesselPlaceholder: "যেমন: IND-WB-02-MM-1042",
    phoneLabel: "জরুরী মোবাইল নম্বর",
    phonePlaceholder: "যেমন: +91 98765 43210",
    testBtn: "🚨 টেস্ট SOS চালান",
    saveBtn: "✓ সংরক্ষণ করুন",
    savedToast: "সেটিংস সংরক্ষিত হয়েছে!",
  },
  kn: {
    title: "ತುರ್ತು ಸುರಕ್ಷತಾ ಸೆಟಪ್",
    subtitle: "ಹಾರ್ಡ್‌ವೇರ್ ತುರ್ತು ಬಟನ್, ಮೀನುಗಾರರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಯನ್ನು ಹೊಂದಿಸಿ.",
    hwTitle: "3 ಬಾರಿ ವಾಲ್ಯೂಮ್ ಡೌನ್ ಬಟನ್",
    hwDesc: "ತೇವವಾದ ಕೈಗಳಲ್ಲೂ 2 ಸೆಕೆಂಡುಗಳಲ್ಲಿ 3 ಬಾರಿ ವಾಲ್ಯೂಮ್ ಡೌನ್ ಒತ್ತಿ ತಕ್ಷಣ SOS ಕಳುಹಿಸಿ.",
    voiceTitle: "ಧ್ವನಿ ಮೂಲಕ ತುರ್ತು ಸಂದೇಶ (VAD)",
    voiceDesc: "ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ತುರ್ತು ವಿವರಗಳನ್ನು ದಾಖಲಿಸಿ.",
    offlineTitle: "ಆಫ್‌ಲೈನ್ ಪೀರ್ ರಿಲೇ ಸುರಕ್ಷತೆ",
    offlineDesc: "ನೆಟ್‌ವರ್ಕ್ ಇಲ್ಲದಿದ್ದಾಗ SOS ಸುರಕ್ಷಿತವಾಗಿ ಹತ್ತಿರದ ದೋಣಿಗಳ ಮೂಲಕ ರಿಲೇ ಆಗುತ್ತದೆ.",
    profileHeading: "ಮೀನುಗಾರ ಮತ್ತು ದೋಣಿ ವಿವರಗಳು",
    nameLabel: "ಮೀನುಗಾರರ ಹೆಸರು",
    namePlaceholder: "ಉದಾ. ರಮೇಶ್ ಕುಮಾರ್",
    vesselLabel: "ದೋಣಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ",
    vesselPlaceholder: "ಉದಾ. IND-KA-02-MM-1042",
    phoneLabel: "ತುರ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    phonePlaceholder: "ಉದಾ. +91 98765 43210",
    testBtn: "🚨 ಟೆಸ್ಟ್ SOS ರನ್ ಮಾಡಿ",
    saveBtn: "✓ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
    savedToast: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ!",
  },
  or: {
    title: "ଜରୁରୀକାଳୀନ ସୁରକ୍ଷା ସେଟଅପ୍",
    subtitle: "ହାର୍ଡୱେର୍ ଜରୁରୀ ବଟନ୍, ମତ୍ସ୍ୟଜୀବୀ ପ୍ରୋଫାଇଲ୍ ଏବଂ ଭଏସ୍ ସତର୍କତା ସେଟ୍ କରନ୍ତୁ।",
    hwTitle: "୩ ଥର ଭଲ୍ୟୁମ୍ ଡାଉନ୍ ବଟନ୍",
    hwDesc: "ଓଦା ହାତରେ ମଧ୍ୟ ୨ ସେକେଣ୍ଡରେ ୩ ଥର ଭଲ୍ୟୁମ୍ ଡାଉନ୍ ଦବାଇ ତୁରନ୍ତ SOS ପଠାନ୍ତୁ।",
    voiceTitle: "ଭଏସ୍ ମାଧ୍ୟମରେ ସତର୍କତା (VAD)",
    voiceDesc: "ଆପଣଙ୍କ ମାତୃଭାଷାରେ କହି ଜରୁରୀ ସୂଚନା ରେକର୍ଡ କରନ୍ତୁ।",
    offlineTitle: "ଅଫଲାଇନ୍ ପିଅର୍ ରିଲେ ସୁରକ୍ଷା",
    offlineDesc: "ନେଟୱର୍କ ନଥିଲେ ମଧ୍ୟ SOS ସୁରକ୍ଷିତ ରହି ପାଖ ଡଙ୍ଗା ମାଧ୍ୟମରେ ରିଲେ ହୁଏ।",
    profileHeading: "ମତ୍ସ୍ୟଜୀବୀ ଓ ଡଙ୍ଗା ବିବରଣୀ",
    nameLabel: "ମତ୍ସ୍ୟଜୀବୀଙ୍କ ନାମ",
    namePlaceholder: "ଯଥା: ରମେଶ କୁମାର",
    vesselLabel: "ଡଙ୍ଗା ପଞ୍ଜୀକରଣ ନମ୍ବର",
    vesselPlaceholder: "ଯଥା: IND-OD-02-MM-1042",
    phoneLabel: "ଜରୁରୀକାଳୀନ ଫୋନ୍ ନମ୍ବର",
    phonePlaceholder: "ଯଥା: +91 98765 43210",
    testBtn: "🚨 ଟେଷ୍ଟ SOS ଚଲାନ୍ତୁ",
    saveBtn: "✓ ସେଟିଙ୍ଗସ୍ ସେଭ୍ କରନ୍ତୁ",
    savedToast: "ସେଟିଙ୍ଗସ୍ ସେଭ୍ ହୋଇଗଲା!",
  },
};

export function SafetyOnboardingModal({
  isOpen = true,
  selectedLang = "hi",
  onClose,
  onRunTestSOS,
}: SafetyOnboardingModalProps) {
  const i18n = ONBOARDING_I18N[selectedLang] || ONBOARDING_I18N["hi"] || ONBOARDING_I18N["en"];

  const [name, setName] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [phone, setPhone] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(localStorage.getItem("orca_sos_fisherman_name") || "Captain Sagar");
      setVesselId(localStorage.getItem("orca_sos_vessel_id") || "IND-MH-02-MM-1042");
      setPhone(localStorage.getItem("orca_sos_emergency_phone") || "+91 98765 43210");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orca_sos_fisherman_name", name.trim() || "Captain Sagar");
      localStorage.setItem("orca_sos_vessel_id", vesselId.trim() || "IND-MH-02-MM-1042");
      localStorage.setItem("orca_sos_emergency_phone", phone.trim() || "+91 98765 43210");
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

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
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "linear-gradient(180deg, #091b26 0%, #030d14 100%)",
          border: "1.5px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "20px",
          padding: "20px",
          color: "#ffffff",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={22} style={{ color: "#38bdf8" }} />
            <h3 style={{ fontSize: "16px", margin: 0, color: "#f8fafc", fontWeight: 800 }}>
              {i18n.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#94a3b8",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "0 0 14px 0", lineHeight: 1.4 }}>
          {i18n.subtitle}
        </p>

        {/* Fisherman & Vessel Profile Configuration */}
        <div
          style={{
            background: "rgba(8, 37, 54, 0.7)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <strong style={{ fontSize: "12px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px" }}>
            <User size={14} /> {i18n.profileHeading}
          </strong>

          <div>
            <label style={{ fontSize: "10.5px", color: "#cbd5e1", display: "block", marginBottom: "3px" }}>
              {i18n.nameLabel}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={i18n.namePlaceholder}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "10.5px", color: "#cbd5e1", display: "block", marginBottom: "3px" }}>
              {i18n.vesselLabel}
            </label>
            <input
              type="text"
              value={vesselId}
              onChange={(e) => setVesselId(e.target.value)}
              placeholder={i18n.vesselPlaceholder}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "10.5px", color: "#cbd5e1", display: "block", marginBottom: "3px" }}>
              {i18n.phoneLabel}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={i18n.phonePlaceholder}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Feature Information Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#ef4444", flexShrink: 0 }}><Radio size={18} /></div>
            <div>
              <strong style={{ fontSize: "11.5px", display: "block", color: "#f8fafc" }}>
                {i18n.hwTitle}
              </strong>
              <span style={{ fontSize: "10.5px", color: "#94a3b8", lineHeight: 1.35, display: "block" }}>
                {i18n.hwDesc}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#38bdf8", flexShrink: 0 }}><Mic size={18} /></div>
            <div>
              <strong style={{ fontSize: "11.5px", display: "block", color: "#f8fafc" }}>
                {i18n.voiceTitle}
              </strong>
              <span style={{ fontSize: "10.5px", color: "#94a3b8", lineHeight: 1.35, display: "block" }}>
                {i18n.voiceDesc}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#34d399", flexShrink: 0 }}><MapPin size={18} /></div>
            <div>
              <strong style={{ fontSize: "11.5px", display: "block", color: "#f8fafc" }}>
                {i18n.offlineTitle}
              </strong>
              <span style={{ fontSize: "10.5px", color: "#94a3b8", lineHeight: 1.35, display: "block" }}>
                {i18n.offlineDesc}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {onRunTestSOS && (
            <button
              type="button"
              onClick={onRunTestSOS}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                border: "1.5px solid #ef4444",
                borderRadius: "10px",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
              }}
            >
              <Sparkles size={16} />
              <span>{i18n.testBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            style={{
              width: "100%",
              padding: "12px",
              background: savedSuccess ? "#10b981" : "#38bdf8",
              border: "none",
              borderRadius: "10px",
              color: "#082536",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background 0.2s ease",
            }}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={16} /> {i18n.savedToast}
              </>
            ) : (
              i18n.saveBtn
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
