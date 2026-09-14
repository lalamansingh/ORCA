/**
 * Mobile AI Sagar Saathi conversational helper
 * Handles intent detection, context-aware marine reasoning, non-marine inland handling,
 * capabilities & data sources, active advisories, fishing suitability, and language consistency
 * across all 10 coastal Indian languages (Telugu, Marathi, Tamil, Gujarati, Bengali, Kannada, Malayalam, Odia, Hindi, English).
 */

import React from "react";

export interface LiveRiskContext {
  locationLabel: string;
  latitude: number;
  longitude: number;
  riskLevel: string; // "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
  riskScore: number;
  waveHeight?: string;
  windSpeed?: string;
  windGust?: string;
  currentSpeed?: string;
  sst?: string;
  recommendation?: string;
}

export interface AssistantPFZItem {
  name: string;
  dist: string;
  dir: string;
  depth: string;
  yield: string;
  fish: string;
}

export interface AssistantAlertItem {
  id?: string;
  title: string;
  desc?: string;
  severityLabel?: string;
  badgeClass?: string;
  severity?: string;
  advice?: string;
}

// 1. GREETING INTENT
const GREETING_REGEX = /^(hi+|hello+|hey+|namaste+|namaskar+|vanakkam+|namaskara+|kem\s*cho|sasriyakaal|aadab|good\s*(morning|afternoon|evening)|halo|नमस्ते+|नमस्कार+|प्रणाम+|வணக்கம்+|నమస్కారం+|നമസ്കാരം+|નમસ્તે+|নমস্কার+|ನಮಸ್ಕಾರ+|ନମସ୍କାର+)[\s!.,?]*$/i;

export function isGreetingQuery(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return GREETING_REGEX.test(trimmed);
}

export const LOCALIZED_ASSISTANT_GREETINGS: Record<string, string> = {
  hi: "नमस्ते कप्तान! 🌊 मैं ORCA सागर साथी हूँ, आपका तटीय समुद्री सुरक्षा और मत्स्य सलाहकार।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे पूछ सकते हैं:\n• 🐟 क्या आज समुद्र में जाना सुरक्षित है?\n• 🌊 नजदीकी संभावित मछली क्षेत्र (PFZ) कहाँ है?\n• 💨 वर्तमान लहरों की ऊँचाई और हवा की गति क्या है?\n• ⚠️ क्या कोई चक्रवात या समुद्री चेतावनी सक्रिय है?",
  en: "Hello Captain! 🌊 I am ORCA Sagar Saathi, your coastal safety & fishing intelligence companion.\n\nHow can I help you today? You can ask me:\n• 🐟 Is it safe to go out to sea and fish today?\n• 🌊 Where is the nearest Potential Fishing Zone (PFZ)?\n• 💨 What are the current wave height and wind speed?\n• ⚠️ Are there any active cyclone or rough sea warnings?",
  te: "నమస్కారం కెప్టెన్! 🌊 నేను మీ ORCA సాగర్ మిత్రుడిని, సముద్ర భద్రత మరియు మత్స్య సలహాదారుని.\n\nఈరోజు మీకు ఎలా సహాయపడగలను? మీరు నన్ను అడగవచ్చు:\n• 🐟 ఈరోజు సముద్రంలో చేపల వేటకు వెళ్లడం సురక్షితమేనా?\n• 🌊 సమీప సంభావ్య చేపల వేట జోన్ (PFZ) ఎక్కడ ఉంది?\n• 💨 అలల ఎత్తు మరియు గాలి వేగం ఎంత?\n• ⚠️ ఏవైనా తుఫాను లేదా సముద్ర హెచ్చరికలు ఉన్నాయా?",
  mr: "नमस्कार कॅप्टन! 🌊 मी तुमचा ORCA सागर साथी आहे, सागरी सुरक्षा व मासेमारी सल्लागार.\n\nआज मी तुम्हाला कशी मदत करू शकतो? तुम्ही विचारू शकता:\n• 🐟 आज समुद्रात जाणे सुरक्षित आहे का?\n• 🌊 जवळचे मासेमारी क्षेत्र (PFZ) कुठे आहे?\n• 💨 लाटांची उंची आणि वाऱ्याचा वेग किती आहे?\n• ⚠️ काही चक्रीवादळ किंवा सागरी चेतावणी आहे का?",
  ta: "வணக்கம் கேப்டன்! 🌊 நான் உங்கள் ORCA சாகர் தோழன், கடல் பாதுகாப்பு மற்றும் மீன்பிடி வழிகாட்டி.\n\nஇன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? நீங்கள் கேட்கலாம்:\n• 🐟 இன்று மீன்பிடிக்க கடலுக்குச் செல்வது பாதுகாப்பானதா?\n• 🌊 அருகிலுள்ள மீன்பிடி மண்டலம் (PFZ) எங்குள்ளது?\n• 💨 அலை உயரம் மற்றும் காற்றின் வேகம் என்ன?\n• ⚠️ ஏதேனும் புயல் அல்லது கடல் எச்சரிக்கை உள்ளதா?",
  gu: "નમસ્તે કેપ્ટન! 🌊 હું તમારો ORCA સાગર સાથી છું, દરિયાઈ સુરક્ષા અને માછીમારી સલાહકાર.\n\nઆજે હું તમને કેવી રીતે મદદ કરી શકું? તમે મને પૂછી શકો છો:\n• 🐟 શું આજે દરિયામાં જવું સુરક્ષિત છે?\n• 🌊 નજીકનું માછીમારી ક્ષેત્ર (PFZ) ક્યાં છે?\n• 💨 મોજાની ઊંચાઈ અને પવનની ગતિ કેટલી છે?\n• ⚠️ શું કોઈ દરિયાઈ કે વાવાઝોડાની ચેતવણી છે?",
  bn: "নমস্কার ক্যাপ্টেন! 🌊 আমি আপনার ORCA সাগর সাথী, সামুদ্রিক নিরাপত্তা ও মৎস্য উপদেষ্টা।\n\nআজ আপনাকে কীভাবে সাহায্য করতে পারি? আপনি জিজ্ঞাসা করতে পারেন:\n• 🐟 আজ কি মাছ ধরতে সমুদ্রে যাওয়া নিরাপদ?\n• 🌊 নিকটতম মাছের অঞ্চল (PFZ) কোথায়?\n• 💨 ঢেউয়ের উচ্চতা এবং বাতাসের গতি কত?\n• ⚠️ কোনো ঘূর্ণিঝড় বা সামুদ্রিক সতর্কতা আছে কি?",
  kn: "ನಮಸ್ಕಾರ ಕ್ಯಾಪ್ಟನ್! 🌊 ನಾನು ನಿಮ್ಮ ORCA ಸಾಗರ ಸಹಾಯಕ, ಸಮುದ್ರ ಸುರಕ್ಷತೆ ಮತ್ತು ಮೀನುಗಾರಿಕೆ ಸಲಹೆಗಾರ.\n\nಇಂದು ನಿಮಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಕೇಳಬಹುದು:\n• 🐟 ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?\n• 🌊 ಹತ್ತಿರದ ಮೀನುಗಾರಿಕಾ ವಲಯ (PFZ) ಎಲ್ಲಿದೆ?\n• 💨 ಅಲೆಗಳ ಎತ್ತರ ಮತ್ತು ಗಾಳಿಯ ವೇಗ ಎಷ್ಟು?\n• ⚠️ ಯಾವುದೇ ಚಂಡಮಾರುತದ ಎಚ್ಚರಿಕೆ ಇದೆಯೇ?",
  ml: "നമസ്കാരം ക്യാപ്റ്റൻ! 🌊 ഞാൻ നിങ്ങളുടെ ORCA സാഗർ സഹായിയാണ്.\n\nഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം? നിങ്ങൾക്ക് ചോദിക്കാം:\n• 🐟 ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?\n• 🌊 അടുത്തുള്ള മത്സ്യബന്ധന മേഖല (PFZ) എവിടെയാണ്?\n• 💨 തിരമാലകളുടെ ഉയരവും കാറ്റിന്റെ വേഗതയും എത്രയാണ്?\n• ⚠️ എന്തെങ്കിലും ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുണ്ടോ?",
  or: "ନମସ୍କାର କ୍ୟାପ୍ଟେନ! 🌊 ମୁଁ ଆପଣଙ୍କର ORCA ସାଗର ସାଥୀ।\n\nଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି? ଆପଣ ପଚାରିପାରିବେ:\n• 🐟 ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?\n• 🌊 ନିକଟତମ ମାଛ ଧରିବା ଅଞ୍ଚଳ (PFZ) କେଉଁଠି?\n• 💨 ଢେଉର ଉଚ୍ଚତା ଏବଂ ପବନର ଗତି କେତେ?\n• ⚠️ କୌଣସି ବାତ୍ୟା ଚେତାବନୀ ଅଛି କି?",
};

export function getConversationalGreeting(lang: string): string {
  return LOCALIZED_ASSISTANT_GREETINGS[lang] || LOCALIZED_ASSISTANT_GREETINGS.hi;
}

export const LOCALIZED_NETWORK_ERRORS: Record<string, string> = {
  hi: "समुद्री सर्वर से संपर्क नहीं हो पाया। कृपया दोबारा प्रयास करें।",
  en: "Unable to reach marine assistant server. Please retry in a moment.",
  te: "సముద్ర సమాచార సర్వర్‌ను సంప్రదించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",
  mr: "सागरी माहिती सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.",
  ta: "கடல் தகவல் சேவையகத்தை இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  ml: "സമുദ്ര വിവര സെർവറുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
  gu: "દરિયાઈ માહિતી સર્વર સાથે સંપર્ક થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
  bn: "সামুদ্রিক তথ্য সার্ভারের সাথে যোগাযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
  kn: "ಸಮುದ್ರ ಮಾಹಿತಿ ಸರ್ವರ್‌ನೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  or: "ସାମୁଦ୍ରିକ ସୂଚନା ସର୍ଭର ସହିତ ସଂଯୋଗ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।",
};

export function getLocalizedError(lang: string): string {
  return LOCALIZED_NETWORK_ERRORS[lang] || LOCALIZED_NETWORK_ERRORS.hi;
}

export function localizeReplyText(text: string, lang: string, liveRisk?: LiveRiskContext): string {
  if (!text) return "";
  let out = text;

  if (liveRisk) {
    const locName = liveRisk.locationLabel || "Selected Coastal Waters";
    const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;

    if (lang === "en") {
      out = out.replace(/📍 \*\*Marine Sector\*\*:[^\n]+/g, `📍 **Location / Harbor**: **${locName}** (\`${coords}\`)`);
      out = out.replace(/📍 \*\*स्थान\*\*:[^\n]+/g, `📍 **Location / Harbor**: **${locName}** (\`${coords}\`)`);
    } else if (lang === "te") {
      out = out.replace(/📍 \*\*Marine Sector\*\*:[^\n]+/g, `📍 **ప్రాంతం / నౌకాశ్రయం**: **${locName}** (\`${coords}\`)`);
      out = out.replace(/📍 \*\*स्थान\*\*:[^\n]+/g, `📍 **ప్రాంతం / నౌకాశ్రయం**: **${locName}** (\`${coords}\`)`);
    } else if (lang === "mr") {
      out = out.replace(/📍 \*\*Marine Sector\*\*:[^\n]+/g, `📍 **स्थान / बंदर**: **${locName}** (\`${coords}\`)`);
      out = out.replace(/📍 \*\*स्थान\*\*:[^\n]+/g, `📍 **स्थान / बंदर**: **${locName}** (\`${coords}\`)`);
    } else {
      out = out.replace(/📍 \*\*Marine Sector\*\*:[^\n]+/g, `📍 **स्थान / बंदरगाह**: **${locName}** (\`${coords}\`)`);
      out = out.replace(/📍 \*\*स्थान\*\*:[^\n]+/g, `📍 **स्थान / बंदरगाह**: **${locName}** (\`${coords}\`)`);
    }
  }
  return out;
}

// 2. INLAND NON-MARINE REGION DETECTION
const INLAND_CITIES = [
  "delhi", "dilli", "दिल्ली", "ఢిల్లీ", "दिल्लीत", "புதுதில்லி", "દિલ્હી", "দিল্লি", "ದೆಹಲಿ", "new delhi", "नई दिल्ली",
  "jaipur", "जयपुर", "జైపూర్", "lucknow", "लखनऊ", "లక్నో", "kanpur", "कानपुर", "కాన్పూర్",
  "pune", "पुणे", "పుణె", "bengaluru", "bangalore", "बेंगलुरु", "बेंगलोर", "బెంగళూరు", "ಬೆಂಗಳೂರು",
  "hyderabad", "हैदराबाद", "హైదరాబాద్", "bhopal", "भोपाल", "భోపాల్", "patna", "पटना", "పాట్నా",
  "chandigarh", "चंडीगढ़", "చండీగఢ్", "indore", "इंदौर", "ఇండోర్", "nagpur", "नागपुर", "నాగపూర్",
  "agra", "आगरा", "ಆಗ್ರಾ", "varanasi", "वाराणसी", "కాశీ", "banaras", "बनारस",
  "ludhiana", "लुधियाना", "amritsar", "अमृतसर", "gurgaon", "gurugram", "गुड़गांव", "गुरुग्राम",
  "noida", "नोएडा", "faridabad", "फरीदाबाद", "ghaziabad", "गाजियाबाद",
  "ranchi", "रांची", "రాంచీ", "raipur", "रायपुर", "రాయ్‌పూర్", "gwalior", "ग्वालियर",
  "jodhpur", "जोधपुर", "udaipur", "उदयपुर", "dehradun", "देहरादून",
  "shimla", "शिमला", "srinagar", "श्रीनगर", "jammu", "जम्मू",
  "allahabad", "prayagraj", "प्रयागराज", "meerut", "मेरठ",
  "punjab", "haryana", "rajasthan", "uttar pradesh", "bihar", "madhya pradesh", "jharkhand", "chhattisgarh"
];

export function detectInlandCity(text: string): string | null {
  const lower = text.toLowerCase();
  for (const city of INLAND_CITIES) {
    const regex = new RegExp(`(?:^|[\s,?.!])${city}(?:$|[\s,?.!])`, "i");
    if (regex.test(lower)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return null;
}

// 3. PERSONAL / NAME INTRO DETECTION
export function detectUserName(text: string): string | null {
  const trimmed = text.trim();
  const patterns = [
    /(?:mera\s+na(?:a)?m\s+is\s+|mera\s+na(?:a)?m\s+|my\s+name\s+is\s+|i\s+am\s+|naam\s+|na\s+peru\s+|peru\s+|majhe\s+naav\s+|majha\s+naav\s+|en\s+peyar\s+)([\wऀ-ॿఀ-౿]+)/i,
    /^(?:main|mein|nenu|mee)\s+([\wऀ-ॿఀ-౿]+)\s+(?:hu|hoon|bol\s+raha\s+hu|ni)/i,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match && match[1]) {
      const name = match[1].trim();
      const skipWords = ["ek", "a", "kya", "ko", "se", "hai", "captain", "here", "nenu"];
      if (!skipWords.includes(name.toLowerCase()) && name.length >= 2) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
  }
  return null;
}

// 4. CAPABILITIES & DATA SOURCES INTENT
export function isCapabilitiesQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("kya kya") ||
    lower.includes("kya kar sakte") ||
    lower.includes("data kha se") ||
    lower.includes("data kahan se") ||
    lower.includes("data source") ||
    lower.includes("sources of data") ||
    lower.includes("what can you do") ||
    lower.includes("your capabilities") ||
    lower.includes("who made you") ||
    lower.includes("who are you") ||
    lower.includes("tum kaun ho") ||
    lower.includes("aap kaun") ||
    lower.includes("about orca") ||
    lower.includes("ఏమి చేయగలరు") ||
    lower.includes("ఎక్కడి నుండి") ||
    lower.includes("సామర్థ్యాలు") ||
    lower.includes("काय करू शकता") ||
    lower.includes("माहिती कुठून") ||
    lower.includes("क्षमता") ||
    lower.includes("என்ன செய்ய முடியும்") ||
    lower.includes("தகவல் எங்கிருந்து")
  );
}

// 5. MARITIME ADVISORY & HAZARD INTENT
export function isAdvisoryQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("advisory") ||
    lower.includes("advisories") ||
    lower.includes("सलाह") ||
    lower.includes("सल्ला") ||
    lower.includes("సలహా") ||
    lower.includes("ఆలోచన") ||
    lower.includes("ஆலோசனை") ||
    lower.includes("alert") ||
    lower.includes("अलर्ट") ||
    lower.includes("chetawani") ||
    lower.includes("चेतावनी") ||
    lower.includes("इशारा") ||
    lower.includes("హెచ్చరిక") ||
    lower.includes("எச்சரிக்கை") ||
    lower.includes("সতর্কতা") ||
    lower.includes("warning") ||
    lower.includes("cyclone") ||
    lower.includes("तूफान") ||
    lower.includes("తుఫాను") ||
    lower.includes("चक्रीवादळ") ||
    lower.includes("புயல்") ||
    lower.includes("rough sea") ||
    lower.includes("swell surge")
  );
}

// 6. FISHING SUITABILITY & PFZ INTENT
export function isFishingQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("fishing") ||
    lower.includes("fish") ||
    lower.includes("machli") ||
    lower.includes("मछली") ||
    lower.includes("मासे") ||
    lower.includes("मासेमारी") ||
    lower.includes("చేప") ||
    lower.includes("వేట") ||
    lower.includes("మీన్") ||
    lower.includes("மீன்பிடி") ||
    lower.includes("માછીમારી") ||
    lower.includes("মাছ") ||
    lower.includes("ಮೀನು") ||
    lower.includes("മത്സ്യ") ||
    lower.includes("ମାଛ") ||
    lower.includes("pfz") ||
    lower.includes("pakadna") ||
    lower.includes("how much area") ||
    lower.includes("good or not") ||
    lower.includes("is today fishing") ||
    lower.includes("safe for fishing") ||
    lower.includes("shikar")
  );
}

// 7. WEATHER & LIVE SEA STATUS INTENT
export function isWeatherQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("weather") ||
    lower.includes("mausam") ||
    lower.includes("मौसम") ||
    lower.includes("వాతావరణం") ||
    lower.includes("हवामान") ||
    lower.includes("வானிலை") ||
    lower.includes("હવામાન") ||
    lower.includes("আবহাওয়া") ||
    lower.includes("ಹವಾಮಾನ") ||
    lower.includes("കാലാവസ്ഥ") ||
    lower.includes("temperature") ||
    lower.includes("taapman") ||
    lower.includes("तापमान") ||
    lower.includes("ఉష్ణోగ్రత") ||
    lower.includes("wave") ||
    lower.includes("lehar") ||
    lower.includes("लहर") ||
    lower.includes("అలలు") ||
    lower.includes("लाटा") ||
    lower.includes("அலை") ||
    lower.includes("wind") ||
    lower.includes("hawa") ||
    lower.includes("हवा") ||
    lower.includes("గాలి") ||
    lower.includes("वारे") ||
    lower.includes("காற்று") ||
    lower.includes("sst") ||
    lower.includes("current") ||
    lower.includes("dhara")
  );
}

/**
 * Intelligent Conversational Response Generator
 * Generates context-rich, non-generalized responses in the EXACT language selected by the user.
 */
export function generateIntelligentSaathiReply(
  query: string,
  lang: string,
  liveRisk: LiveRiskContext,
  alerts: AssistantAlertItem[] = [],
  pfzList: AssistantPFZItem[] = []
): string {
  const loc = liveRisk.locationLabel || "Coastal Waters";
  const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;
  const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
  const isCaution = liveRisk.riskLevel === "MODERATE";
  const isSafe = !isDanger && !isCaution;

  const wave = liveRisk.waveHeight || "1.1 m";
  const wind = liveRisk.windSpeed || "15 km/h";
  const sst = liveRisk.sst || "28.5°C";
  const currents = liveRisk.currentSpeed || "0.35 m/s";

  const topPFZ = pfzList.length > 0 ? pfzList[0] : {
    name: "Coastal PFZ Corridor",
    dist: "14.5 km",
    dir: "SW · 225°",
    depth: "24 m",
    yield: "85%",
    fish: "Tuna, Mackerel, Sardine",
  };

  // --- 1. Check for Inland / Non-Marine City Query ---
  const inlandCity = detectInlandCity(query);
  if (inlandCity) {
    if (lang === "en") {
      return `Sir, **${inlandCity}** is a landlocked, inland (non-marine) region.\n\n🌊 **ORCA Marine System Scope**:\nORCA is an operational **Coastal & Ocean Intelligence System** specialized for Indian coastal waters, seaports, wave dynamics, SST, INCOIS Potential Fishing Zones (PFZ), and maritime cyclone advisories.\n\n💡 **Current Active Coastal Port**: **${loc}** (\`${coords}\`)\nIf you would like live wave, wind, risk, or fishing updates for any coastal location (e.g. Mumbai, Porbandar, Kochi, Chennai, Visakhapatnam, etc.), please ask or tap on the Map!`;
    } else if (lang === "te") {
      return `అయ్యా, **${inlandCity}** అనేది భూపరివేష్టిత (సముద్ర తీరం లేని / Landlocked) అంతర్గత ప్రాంతం.\n\n🌊 **ORCA వ్యవస్థ పరిధి**:\nORCA అనేది భారతీయ తీరప్రాంత జలాలు, నౌకాశ్రయాలు, తరంగాల ఎత్తు, సముద్ర ఉపరితల ఉష్ణోగ్రత (SST), INCOIS చేపల వేట జోన్లు (PFZ) మరియు తుఫాను హెచ్చరికల కోసం రూపొందించబడిన ప్రత్యేక సముద్ర భద్రతా వ్యవస్థ.\n\n💡 **ప్రస్తుత తీరప్రాంతం**: **${loc}** (\`${coords}\`)\nమీరు ఏదైనా తీర ప్రాంతం (విశాఖపట్నం, కాకినాడ, చెన్నై, ముంబై మొదలైనవి) సముద్ర వాతావరణం లేదా చేపల సమాచారం తెలుసుకోవాలనుకుంటే, దయచేసి పేరును తెలపండి లేదా మ్యాప్‌లో ఎంచుకోండి!`;
    } else if (lang === "mr") {
      return `सर, **${inlandCity}** हे जमिनीने वेढलेले (अ-सागरी / Landlocked) अंतर्गत क्षेत्र आहे.\n\n🌊 **ORCA प्रणालीचे कार्यक्षेत्र**:\nORCA ही विशेषतः भारतीय सागरी किनारपट्टी, बंदरे, लाटांची उंची, वाऱ्याचा वेग, समुद्राचे तापमान (SST), INCOIS मासेमारी क्षेत्र (PFZ) आणि चक्रीवादळाच्या इशाऱ्यांसाठी समर्पित सागरी सुरक्षा प्रणाली आहे.\n\n💡 **सध्याचे बंदर**: **${loc}** (\`${coords}\`)\nजर आपल्याला कोणत्याही किनारपट्टी भागाची (जसे मुंबई, रत्नागिरी, गोवा, विशाखापट्टणम इत्यादी) माहिती हवी असेल, तर कृपया विचारू शकता किंवा नकाशावर निवडा!`;
    } else if (lang === "ta") {
      return `ஐயா, **${inlandCity}** ஒரு நிலப்பரப்பு சார்ந்த (கடல் அல்லாத / Landlocked) பகுதியாகும்.\n\n🌊 **ORCA கடல்சார் அமைப்பின் நோக்கம்**:\nORCA என்பது இந்தியக் கடற்கரை, துறைமுகங்கள், அலைகளின் உயரம், காற்றின் வேகம், INCOIS மீன்பிடி மண்டலங்கள் (PFZ) மற்றும் புயல் எச்சரிக்கைகளுக்கான பிரத்யேக கடல்சார் பாதுகாப்பு அமைப்பாகும்.\n\n💡 **தற்போதைய துறைமுகம்**: **${loc}** (\`${coords}\`)\nநீங்கள் ஏதேனும் கடலோரப் பகுதியின் வானிலை அல்லது மீன்பிடி நிலவரங்களை அறிய விரும்பினால், தயவுசெய்து கேட்கவும்!`;
    } else if (lang === "gu") {
      return `સાહેબ, **${inlandCity}** એ જમીનથી ઘેરાયેલો (બિન-દરિયાઈ / Landlocked) વિસ્તાર છે.\n\n🌊 **ORCA સિસ્ટમનું કાર્યક્ષેત્ર**:\nORCA એ ખાસ કરીને ભારતીય દરિયાકાંઠો, બંદરો, મોજાની ઊંચાઈ, પવનની ગતિ, દરિયાઈ સપાટીનું તાપમાન (SST), INCOIS સંભવિત માછીમારી ક્ષેત્રો (PFZ) અને વાવાઝોડાની ચેતવણીઓ માટે રચાયેલ છે.\n\n💡 **હાલનું બંદર**: **${loc}** (\`${coords}\`)\nજો તમારે દરિયાકાંઠાના વિસ્તાર (દા.ત. વેરાવળ, પોરબંદર, મુંબઈ) અંગે પૂછવું હોય તો કૃપા કરીને જણાવો!`;
    } else if (lang === "bn") {
      return `মহাশয়, **${inlandCity}** একটি স্থলবেষ্টিত (অ-সামুদ্রিক / Landlocked) অভ্যন্তরীণ অঞ্চল।\n\n🌊 **ORCA সামুদ্রিক ব্যবস্থার পরিধি**:\nORCA হলো ভারতীয় উপকূলবর্তী জলসীমা, বন্দর, ঢেউয়ের উচ্চতা, বাতাসের গতি, समुद्रপৃষ্ঠের তাপমাত্রা (SST), INCOIS সম্ভাব্য মাছ ধরার অঞ্চল (PFZ) এবং ঘূর্ণিঝড় সতর্কতার জন্য একটি বিশেষ ব্যবস্থা।\n\n💡 **বর্তমান উপকূলীয় অবস্থান**: **${loc}** (\`${coords}\`)\nকোনো উপকূলীয় অঞ্চলের তথ্য জানতে চাইলে নাম উল্লেখ করুন বা মানচিত্রে নির্বাচন করুন!`;
    } else if (lang === "kn") {
      return `ಸರ್, **${inlandCity}** ಭೂಪ್ರದೇಶದಿಂದ ಆವೃತವಾದ (ಅ-ಸಮುದ್ರ / Landlocked) ಪ್ರದೇಶವಾಗಿದೆ.\n\n🌊 **ORCA ವ್ಯವಸ್ಥೆಯ ವ್ಯಾಪ್ತಿ**:\nORCA ಭಾರತದ ಕರಾವಳಿ ತೀರ, ಬಂದರುಗಳು, ಅಲೆಗಳ ಎತ್ತರ, ಗಾಳಿಯ ವೇಗ, INCOIS ಮೀನುಗಾರಿಕಾ ವಲಯಗಳು (PFZ) ಮತ್ತು ಚಂಡಮಾರುತ ಎಚ್ಚರಿಕೆಗಳಿಗಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಸಾಗರ ಭದ್ರತಾ ವ್ಯವಸ್ಥೆಯಾಗಿದೆ.\n\n💡 **ಪ್ರಸ್ತುತ ಕರಾವಳಿ ಬಂದರು**: **${loc}** (\`${coords}\`)\nಕರಾವಳಿ ಪ್ರದೇಶಗಳ ವಿವರಗಳಿಗಾಗಿ ಬಂದರನ್ನು ನಮೂದಿಸಿ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಆರಿಸಿ!`;
    } else if (lang === "ml") {
      return `സർ, **${inlandCity}** സമുദ്രതീരമില്ലാത്ത ഒരു ഉൾനാടൻ (Landlocked) പ്രദേശമാണ്.\n\n🌊 **ORCA സമുദ്ര സുരക്ഷാ സംവിധാനം**:\nതീരപ്രദേശങ്ങൾ, തുറമുഖങ്ങൾ, തിരമാലകളുടെ ഉയരം, കാറ്റിന്റെ വേഗത, INCOIS മത്സ്യബന്ധന മേഖലകൾ (PFZ), ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുകൾ എന്നിവയ്ക്കായുള്ള പ്രത്യേക സംവിധാനമാണ് ORCA.\n\n💡 **നിലവിലെ തുറമുഖം**: **${loc}** (\`${coords}\`)\nതീരദേശ മേഖലകളുടെ വിവരങ്ങൾക്കായി തുറമുഖത്തിന്റെ പേര് നൽകുക!`;
    } else if (lang === "or") {
      return `ସାର୍, **${inlandCity}** ଏକ ଅଣ-ସାମୁଦ୍ରିକ (Landlocked) ଅନ୍ତର୍ଦେଶୀୟ ଅଞ୍ଚଳ।\n\n🌊 **ORCA ସାମୁଦ୍ରିକ ପ୍ରଣାଳୀ**:\nORCA ଭାରତୀୟ ଉପକୂଳ, ବନ୍ଦର, ଢେଉର ଉଚ୍ଚତା, ପବନର ବେଗ, INCOIS ମତ୍ସ୍ୟ କ୍ଷେତ୍ର (PFZ) ଏବଂ ବାତ୍ୟା ଚେତାବନୀ ପାଇଁ ଏକ ସ୍ୱତନ୍ତ୍ର ବ୍ୟବସ୍ଥା।\n\n💡 **ବର୍ତ୍ତମାନର ଉପକୂଳ**: **${loc}** (\`${coords}\`)\nଉପକୂଳବର୍ତ୍ତୀ ସୂଚନା ପାଇଁ ନାମ କୁହନ୍ତୁ କିମ୍ବା ମ୍ୟାପ୍‌ରେ ବାଛନ୍ତୁ!`;
    } else {
      return `सर, **${inlandCity}** एक गैर-समुद्री (Landlocked / Inland) अंतर्देशीय क्षेत्र है।\n\n🌊 **ORCA प्रणाली का कार्यक्षेत्र**:\nORCA एक विशेष **तटीय व महासागरीय सुरक्षा प्रणाली** (Marine Intelligence System) है, जो भारतीय समुद्री तटों, बंदरगाहों, लहरों की ऊँचाई, हवा की गति, समुद्र सतह तापमान (SST), INCOIS संभावित मछली क्षेत्रों (PFZ) और चक्रवात चेतावनियों के लिए समर्पित है।\n\n💡 **वर्तमान चयनित तटीय बंदरगाह**: **${loc}** (\`${coords}\`)\nयदि आप किसी तटीय क्षेत्र (जैसे मुंबई, पोरबंदर, वेरावल, कोच्चि, चेन्नई, विशाखापट्टनम आदि) का समुद्री मौसम, लहरें या मछली पकड़ने की स्थिति जानना चाहते हैं, तो कृपया उसका नाम बताएं या मैप से चुनें!`;
    }
  }

  // --- 2. Check for User Name Introduction ---
  const userName = detectUserName(query);
  if (userName) {
    if (lang === "en") {
      return `Hello Captain **${userName}**! 🌊 Great to meet you.\n\nI am **ORCA Sagar Saathi**, your dedicated maritime safety and fisheries intelligence advisor.\n\nCurrently monitoring **${loc}** (\`${coords}\`):\n• Sea Status: **${isSafe ? "Safe Sea ✅" : isCaution ? "Caution Advised ⚠️" : "High Risk / Danger ⚠️"}** (Score: ${liveRisk.riskScore}/100)\n• Significant Waves: **${wave}** | Wind: **${wind}**\n\nHow can I assist you with your voyage or fishing trip today?`;
    } else if (lang === "te") {
      return `నమస్కారం కెప్టెన్ **${userName}** గారు! 🌊 మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది.\n\nనేను మీ **ORCA సాగర్ మిత్రుడిని** — సముద్ర భద్రత మరియు మత్స్య సలహాదారుని.\n\nప్రస్తుతం **${loc}** (\`${coords}\`) పర్యవేక్షణలో ఉంది:\n• సముద్ర స్థితి: **${isSafe ? "సురక్షితం (Safe Sea) ✅" : isCaution ? "జాగ్రత్త (Caution) ⚠️" : "అధిక ప్రమాదం (Danger) ⚠️"}** (${liveRisk.riskScore}/100)\n• అలల ఎత్తు: **${wave}** | గాలి వేగం: **${wind}**\n\nఈరోజు మీ ప్రయాణం లేదా చేపల వేట కోసం నేను మీకు ఎలా సహాయపడగలను?`;
    } else if (lang === "mr") {
      return `नमस्कार कॅप्टन **${userName}** जी! 🌊 आपल्याशी जोडून आनंद झाला.\n\nमी आपला **ORCA सागर साथी** आहे — सागरी सुरक्षा व मासेमारी सल्लागार.\n\nसध्या **${loc}** (\`${coords}\`) चे निरीक्षण सुरू आहे:\n• सागरी स्थिती: **${isSafe ? "सुरक्षित (Safe Sea) ✅" : isCaution ? "सावधगिरी (Caution) ⚠️" : "धोकादायक (Danger) ⚠️"}** (${liveRisk.riskScore}/100)\n• लाटांची उंची: **${wave}** | वाऱ्याचा वेग: **${wind}**\n\nआज आपल्या प्रवासासाठी किंवा मासेमारीसाठी मी कशी मदत करू?`;
    } else if (lang === "ta") {
      return `வணக்கம் கேப்டன் **${userName}**! 🌊 உங்களைச் சந்திப்பதில் மகிழ்ச்சி.\n\nநான் உங்கள் **ORCA சாகர் தோழன்** — கடல் பாதுகாப்பு மற்றும் மீன்பிடி வழிகாட்டி.\n\nதற்போது **${loc}** (\`${coords}\`) கண்காணிக்கப்படுகிறது:\n• கடல் நிலை: **${isSafe ? "பாதுகாப்பானது ✅" : isCaution ? "எச்சரிக்கை ⚠️" : "அபாயகரமானது ⚠️"}** (${liveRisk.riskScore}/100)\n• அலை: **${wave}** | காற்று: **${wind}**\n\nஇன்று உங்கள் கடற்பயணம் அல்லது மீன்பிடிப்புக்கு நான் எவ்வாறு உதவ முடியும்?`;
    } else {
      return `नमस्ते कैप्टन **${userName}** जी! 🌊 आपसे जुड़कर खुशी हुई।\n\nमैं आपका **ORCA सागर साथी** हूँ — तटीय सुरक्षा और मत्स्य सलाहकार।\n\nवर्तमान में हम **${loc}** (\`${coords}\`) की निगरानी कर रहे हैं:\n• समुद्री स्थिति: **${isSafe ? "सुरक्षित (Safe Sea) ✅" : isCaution ? "सावधानी (Caution) ⚠️" : "उच्च जोखिम (Danger) ⚠️"}** (${liveRisk.riskScore}/100)\n• लहरें: **${wave}** | हवा की गति: **${wind}**\n\nबताइए आज आपके नौकायन, मौसम या मछली पकड़ने के संबंध में क्या सहायता करूँ?`;
    }
  }

  // --- 3. Check for Capabilities & Data Sources ---
  if (isCapabilitiesQuery(query)) {
    if (lang === "en") {
      return `Hello! I am **ORCA Sagar Saathi**, India's autonomous Coastal & Marine Intelligence System.\n\n🎯 **What I Can Do (Key Capabilities)**:\n1. **Deterministic Voyage Risk Scoring**: Real-time 0–100 safety score evaluating wave heights, wind gusts, and currents to advise Safe (LOW), Caution (MODERATE), or Danger (HIGH).\n2. **Potential Fishing Zones (PFZ)**: Precise fish aggregation corridors derived from chlorophyll and SST thermal fronts with GPS bearings and shore distances.\n3. **High-Resolution Ocean Weather**: Live significant wave height, swell period, surface currents, and water temperature.\n4. **Maritime Advisories & Warnings**: Rapid dissemination of IMD & INCOIS rough sea, high swell surge, and cyclone bulletins.\n5. **Emergency SOS Integration**: One-touch contact with Indian Coast Guard (1554) and State Marine Police (1093).\n\n📡 **Official Data Sources**:\n• **INCOIS** (Indian National Centre for Ocean Information Services)\n• **IMD** (India Meteorological Department - Marine Bulletins)\n• **ISRO / Oceansat** (Satellite ocean color & SST telemetry)\n• **Copernicus Marine & Open-Meteo** (Global oceanographic & atmospheric models)`;
    } else if (lang === "te") {
      return `నమస్కారం! నేను **ORCA సాగర్ మిత్రుడిని (AI Maritime Assistant)** — భారతదేశపు ప్రత్యేక తీరప్రాంత మరియు సముద్ర భద్రతా సలహాదారుని.\n\n🎯 **కీలక సామర్థ్యాలు (Key Capabilities)**:\n1. **సముద్ర ప్రయాణ భద్రతా స్కోరు (Voyage Risk)**: 0-100 స్కేలుపై రియల్ టైమ్ విశ్లేషణ (Safe / Caution / Danger స్పష్టమైన నిర్ణయం).\n2. **చేపల వేట జోన్లు (INCOIS PFZ)**: ఉపగ్రహ ఆధారిత క్లోరోఫిల్ మరియు ఉష్ణోగ్రత డేటాతో చేపల సమూహాలు, తీరం నుండి దూరం మరియు దిశ (Bearing).\n3. **సముద్ర వాతావరణం**: అలల ఎత్తు, గాలి వేగం, సముద్ర ప్రవాహాలు మరియు ఉష్ణోగ్రత (SST).\n4. **తుఫాను మరియు సముద్ర హెచ్చరికలు**: IMD మరియు INCOIS హెచ్చరికల తక్షణ సమాచారం.\n5. **అత్యవసర SOS**: కోస్ట్ గార్డ్ (1554) మరియు మెరైన్ పోలీస్ (1093) తో నేరుగా సంప్రదింపు.\n\n📡 **అధికారిక డేటా ఆధారాలు (Data Sources)**:\n• **INCOIS** (భారత జాతీయ సముద్ర సమాచార కేంద్రం)\n• **IMD** (భారత వాతావరణ శాఖ)\n• **ISRO / Oceansat** (ఉపగ్రహ పరిశీలనలు)\n• **Copernicus Marine & Open-Meteo** (గ్లోబల్ ఓషన్ మోడల్స్)`;
    } else if (lang === "mr") {
      return `नमस्कार! मी **ORCA सागर साथी** आहे — भारताचा समर्पित सागरी सुरक्षा व मत्स्य AI सल्लागार.\n\n🎯 **मुख्य क्षमता (Key Capabilities)**:\n1. **सागरी प्रवास सुरक्षा स्कोअर**: 0 ते 100 च्या प्रमाणात सुरक्षित किंवा धोकादायक परिस्थितीचे थेट विश्लेषण.\n2. **संभाव्य मासेमारी क्षेत्रे (INCOIS PFZ)**: उपग्रह डेटाद्वारे माशांचे साठे, किनाऱ्यापासून अंतर आणि दिशा (Bearing).\n3. **थेट सागरी हवामान**: लाटांची उंची, वाऱ्याचा वेग, समुद्राचे तापमान (SST) व प्रवाह.\n4. **चक्रीवादळ व सागरी इशारे**: IMD व INCOIS चे अधिकृत इशारे.\n5. **आपत्कालीन सुरक्षा (SOS)**: भारतीय तटरक्षक दल (1554) आणि सागरी पोलीस (1093).\n\n📡 **अधिकृत डेटा स्रोत (Data Sources)**:\n• **INCOIS** (भारतीय राष्ट्रीय सागरी माहिती सेवा केंद्र)\n• **IMD** (भारतीय हवामान विभाग)\n• **ISRO / Oceansat** (उपग्रह डेटा)\n• **Copernicus Marine & Open-Meteo** (ग्लोबल मॉडेल्स)`;
    } else if (lang === "ta") {
      return `வணக்கம்! நான் **ORCA சாகர் தோழன்** — இந்தியாவின் பிரத்யேக கடல்சார் பாதுகாப்பு மற்றும் மீன்பிடி AI ஆலோசகர்.\n\n🎯 **முக்கிய திறன்கள்**:\n1. **கடற்பயண பாதுகாப்பு மதிப்பீடு (Voyage Risk)**: 0-100 அளவீட்டில் நேரடி பகுப்பாய்வு.\n2. **மீன்பிடி மண்டலங்கள் (INCOIS PFZ)**: செயற்கைக்கோள் தரவு மூலம் மீன்வளப் பகுதிகள், தூரம் மற்றும் திசை.\n3. **நேரலை கடல் வானிலை**: அலை உயரம், காற்றின் வேகம், கடல் வெப்பநிலை (SST) மற்றும் நீரோட்டம்.\n4. **புயல் மற்றும் கடல் எச்சரிக்கைகள்**: IMD மற்றும் INCOIS அதிகாரப்பூர்வ எச்சரிக்கைகள்.\n5. **அவசர உதவி (SOS)**: இந்தியக் கடலோரக் காவல்படை (1554) மற்றும் கடலோரக் காவல் (1093).\n\n📡 **அதிகாரப்பூர்வ தரவு ஆதாரங்கள்**:\n• **INCOIS** (இந்திய தேசிய பெருங்கடல் தகவல் மையம்)\n• **IMD** (இந்திய வானிலை ஆய்வு மையம்)\n• **ISRO / Oceansat** (செயற்கைக்கோள் தரவு)\n• **Copernicus Marine & Open-Meteo**`;
    } else {
      return `नमस्ते! मैं **ORCA सागर साथी** हूँ — भारत का समर्पित तटीय व समुद्री सुरक्षा AI सलाहकार।\n\n🎯 **मेरी मुख्य क्षमताएं (Key Capabilities)**:\n1. **सटीक नौकायन जोखिम मूल्यांकन**: 0 से 100 के पैमाने पर लाइव समुद्री जोखिम स्कोर, जो लहरों, हवा और धाराओं का विश्लेषण कर सुरक्षित (SAFE) या खतरनाक (DANGER) का स्पष्ट निर्णय देता है।\n2. **संभावित मछली पकड़ने के क्षेत्र (INCOIS PFZ)**: क्लोरोफिल और थर्मल फ्रंट के आधार पर मछली सघनता वाले क्षेत्र, तट से दूरी और नेविगेशन दिशा (Bearing)।\n3. **वास्तविक समय समुद्री मौसम**: लहरों की ऊँचाई (Significant Wave Height), हवा की गति व झोंके, समुद्री धाराएं और समुद्र सतह तापमान (SST)।\n4. **समुद्री चेतावनी व चक्रवात अलर्ट**: IMD एवं INCOIS द्वारा जारी चक्रवात, स्वेल सर्ज और भारी लहर चेतावनी।\n5. **आपातकालीन सुरक्षा (SOS)**: 1554 (तटरक्षक बल) और 1093 (समुद्री पुलिस) से सीधा संपर्क।\n\n📡 **विश्वसनीय डेटा स्रोत (Data Sources)**:\n• **INCOIS** (भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र)\n• **IMD** (भारत मौसम विज्ञान विभाग)\n• **ISRO / Oceansat** (उपग्रह आधारित समुद्री डेटा)\n• **Copernicus Marine & Open-Meteo** (ग्लोबल ओशन और वेदर मॉडल्स)`;
    }
  }

  // --- 4. Check for Advisories & Alerts ---
  if (isAdvisoryQuery(query)) {
    if (alerts && alerts.length > 0) {
      if (lang === "en") {
        const alertLines = alerts.slice(0, 3).map((a) => `• **${a.title}** (${a.severityLabel || a.severity || "Active Alert"})\n  ${a.desc || a.advice || "Maintain caution and VHF radio watch."}`).join("\n\n");
        return `⚠️ **Active Maritime Advisories for ${loc}** (\`${coords}\`):\n\n${alertLines}\n\n🛡️ **Safety Instructions**: Check VHF Channel 16 and wear life jackets before venturing out.`;
      } else if (lang === "te") {
        const alertLines = alerts.slice(0, 3).map((a) => `• **${a.title}** (${a.severityLabel || a.severity || "హెచ్చరిక"})\n  ${a.desc || a.advice || "జాగ్రత్త వహించండి మరియు కోస్టల్ రేడియోను గమనించండి."}`).join("\n\n");
        return `⚠️ **${loc} (\`${coords}\`) కోసం చురుకైన సముద్ర హెచ్చరికలు**:\n\n${alertLines}\n\n🛡️ **భద్రతా సూచనలు**: సముద్రంలోకి వెళ్లే ముందు VHF ఛానల్ 16 మరియు లైఫ్ జాకెట్లు తప్పనిసరిగా ధరించండి.`;
      } else if (lang === "mr") {
        const alertLines = alerts.slice(0, 3).map((a) => `• **${a.title}** (${a.severityLabel || a.severity || "सक्रिय इशारा"})\n  ${a.desc || a.advice || "सावधगिरी बाळगा आणि सागरी रेडिओवर लक्ष ठेवा."}`).join("\n\n");
        return `⚠️ **${loc} (\`${coords}\`) साठी सक्रिय सागरी इशारे**:\n\n${alertLines}\n\n🛡️ **सुरक्षा सूचना**: समुद्रात जाण्यापूर्वी VHF चॅनेल 16 आणि लाइफ जॅकेटची खात्री करा.`;
      } else if (lang === "ta") {
        const alertLines = alerts.slice(0, 3).map((a) => `• **${a.title}** (${a.severityLabel || a.severity || "எச்சரிக்கை"})\n  ${a.desc || a.advice || "கவனமாக இருங்கள் மற்றும் வானொலியைக் கண்காணிக்கவும்."}`).join("\n\n");
        return `⚠️ **${loc} (\`${coords}\`) க்கான நேரலை கடல் எச்சரிக்கைகள்**:\n\n${alertLines}\n\n🛡️ **பாதுகாப்பு வழிமுறைகள்**: VHF சேனல் 16 மற்றும் லைஃப் ஜாக்கெட்டுகளைச் சரிபார்க்கவும்.`;
      } else {
        const alertLines = alerts.slice(0, 3).map((a) => `• **${a.title}** (${a.severityLabel || a.severity || "सक्रिय चेतावनी"})\n  ${a.desc || a.advice || "सतर्कता बरतें और तटीय रेडियो पर नजर रखें।"}`).join("\n\n");
        return `⚠️ **${loc}** (\`${coords}\`) के लिए सक्रिय समुद्री चेतावनियाँ:\n\n${alertLines}\n\n🛡️ **सुरक्षा निर्देश**: समुद्र में जाने से पूर्व VHF चैनल 16 और लाइफ जैकेट की पुष्टि अवश्य करें।`;
      }
    } else {
      if (lang === "en") {
        return `📍 **Maritime Advisory Update — ${loc}** (\`${coords}\`):\n\n✅ **No Active Severe Alerts**: Currently, there are no active cyclone, gale, or high swell warnings for this sector.\n\n🌊 **Current Conditions**: Waves are **${wave}**, wind is **${wind}**.\n🛡️ **Standard Coastal Advisory**: Sea conditions are calm and favorable for standard coastal navigation and fishing. Ensure all vessels carry life buoys, GPS, and maintain standard coastal VHF watch.`;
      } else if (lang === "te") {
        return `📍 **సముద్ర సలహా నివేదిక — ${loc}** (\`${coords}\`):\n\n✅ **ప్రస్తుతం ఎటువంటి తీవ్రమైన తుఫాను లేదా అధిక అలల హెచ్చరికలు లేవు.**\n\n🌊 **ప్రస్తుత స్థితి**: అలలు **${wave}**, గాలి వేగం **${wind}**.\n🛡️ **ప్రామాణిక సలహా**: సముద్రం ప్రశాంతంగా ఉంది. చేపల వేట మరియు ప్రయాణానికి పరిస్థితులు అనుకూలంగా ఉన్నాయి. బోటులో ఎల్లప్పుడూ లైఫ్ జాకెట్లు, GPS మరియు VHF రేడియో ఉండేలా చూసుకోండి.`;
      } else if (lang === "mr") {
        return `📍 **सागरी सल्ला व इशारा — ${loc}** (\`${coords}\`):\n\n✅ **सध्या कोणताही गंभीर चक्रीवादळ किंवा उंच लाटांचा इशारा नाही.**\n\n🌊 **सध्याची स्थिती**: लाटा **${wave}**, वाऱ्याचा वेग **${wind}**.\n🛡️ **मानक सल्ला**: समुद्र शांत आहे. मासेमारी व नौकानयनासाठी परिस्थिती अनुकूल आहे. नेहमी लाइफ जॅकेट, GPS आणि VHF रेडिओ सोबत ठेवा.`;
      } else if (lang === "ta") {
        return `📍 **கடல்சார் ஆலோசனை — ${loc}** (\`${coords}\`):\n\n✅ **தற்போது தீவிர புயல் அல்லது அதிக அலை எச்சரிக்கைகள் ஏதுமில்லை.**\n\n🌊 **தற்போதைய நிலை**: அலைகள் **${wave}**, காற்றின் வேகம் **${wind}**.\n🛡️ **வழக்கமான ஆலோசனை**: கடல் அமைதியாக உள்ளது. மீன்பிடிக்கச் செல்ல சாதகமான சூழல் நிலவுகிறது. படகில் லைஃப் ஜாக்கெட் மற்றும் ஜிபிஎஸ் இருப்பதை உறுதி செய்யவும்.`;
      } else {
        return `📍 **समुद्री सलाह व चेतावनी अपडेट — ${loc}** (\`${coords}\`):\n\n✅ **कोई गंभीर अलर्ट सक्रिय नहीं है**: वर्तमान में आपके चयनित क्षेत्र के लिए कोई चक्रवात, भारी तूफान या स्वेल सर्ज चेतावनी जारी नहीं है।\n\n🌊 **वर्तमान स्थिति**: लहरें **${wave}** और हवा की गति **${wind}** है।\n🛡️ **मानक तटीय सलाह**: समुद्र शांत और सामान्य है। तटीय नौकायन और मछली पकड़ने के लिए स्थिति अनुकूल है। हमेशा लाइफ जैकेट, वीएचएफ रेडियो और आपातकालीन लाइट साथ रखें।`;
      }
    }
  }

  // --- 5. Check for Fishing Suitability & Areas (PFZ) ---
  if (isFishingQuery(query)) {
    if (isDanger) {
      if (lang === "en") {
        return `⚠️ **NO, today is NOT safe for fishing in ${loc}** (\`${coords}\`).\n\n🛡️ **Risk Level: HIGH RISK (${liveRisk.riskScore}/100)**\n• Significant Waves: **${wave}** (Rough/Turbulent)\n• Wind Speed: **${wind}** (Strong gusts)\n\n🛑 **Fisheries Advisory**: Small craft and fishing boats are strictly advised **NOT** to venture out into the sea today. Secure all moored boats at the harbor.`;
      } else if (lang === "te") {
        return `⚠️ **లేదు, ఈరోజు ${loc} వద్ద చేపల వేటకు సముద్రంలోకి వెళ్లడం సురక్షితం కాదు** (\`${coords}\`).\n\n🛡️ **ప్రమాద స్థాయి: అధిక ప్రమాదం (HIGH RISK - ${liveRisk.riskScore}/100)**\n• అలల ఎత్తు: **${wave}** (తీవ్ర అల్లకల్లోలం)\n• గాలి వేగం: **${wind}** (బలమైన గాలులు)\n\n🛑 **మత్స్య సలహా**: చిన్న పడవలు మరియు మత్స్యకారులు నేడు సముద్రంలోకి వెళ్లవద్దని ఖచ్చితంగా సూచించబడింది. బోట్లను ఒడ్డునే సురక్షితంగా ఉంచండి.`;
      } else if (lang === "mr") {
        return `⚠️ **नाही, आज ${loc} येथे मासेमारीसाठी समुद्रात जाणे अत्यंत धोक्याचे आहे** (\`${coords}\`).\n\n🛡️ **धोका पातळी: उच्च धोका (HIGH RISK - ${liveRisk.riskScore}/100)**\n• लाटांची उंची: **${wave}** (अशांत समुद्र)\n• वाऱ्याचा वेग: **${wind}** (वादळी वारे)\n\n🛑 **मत्स्य सल्ला**: सर्व मच्छीमारांना आज समुद्रात न जाण्याचा कडक इशारा देण्यात आला आहे. नौका किनाऱ्यावरच बांधून ठेवा.`;
      } else if (lang === "ta") {
        return `⚠️ **இல்லை, இன்று ${loc} பகுதியில் கடலுக்குச் செல்வது பாதுகாப்பற்றது** (\`${coords}\`).\n\n🛡️ **ஆபத்து நிலை: அதிக ஆபத்து (HIGH RISK - ${liveRisk.riskScore}/100)**\n• அலை உயரம்: **${wave}** (கொந்தளிப்பான கடல்)\n• காற்றின் வேகம்: **${wind}** (பலத்த காற்று)\n\n🛑 **மீன்பிடி ஆலோசனை**: சிறிய படகுகள் மற்றும் மீனவர்கள் இன்று கடலுக்குள் செல்ல வேண்டாம் என்று கண்டிப்பாக அறிவுறுத்தப்படுகிறார்கள்.`;
      } else {
        return `⚠️ **नहीं, आज ${loc} में मछली पकड़ने के लिए समुद्र में जाना सुरक्षित नहीं है** (\`${coords}\`)।\n\n🛡️ **जोखिम स्तर: उच्च जोखिम (HIGH RISK - ${liveRisk.riskScore}/100)**\n• लहरों की ऊँचाई: **${wave}** (अत्यधिक अशांत)\n• हवा की गति: **${wind}** (तेज हवाएं)\n\n🛑 **मत्स्य सलाह**: सभी मछुआरों और नावों को आज समुद्र में न जाने की सख्त सलाह दी जाती है। नौकाओं को बंदरगाह पर सुरक्षित बांधकर रखें।`;
      }
    }

    if (isCaution) {
      if (lang === "en") {
        return `⚠️ **Caution Advised for Fishing in ${loc}** (\`${coords}\`).\n\n🛡️ **Risk Level: MODERATE RISK (${liveRisk.riskScore}/100)**\n• Waves: **${wave}** | Wind: **${wind}**\n\n🐟 **Recommended Fishing Zone**: **${topPFZ.name}**\n• Distance from Coast: **${topPFZ.dist}**\n• Compass Bearing: **${topPFZ.dir}**\n• Water Depth: **${topPFZ.depth}**\n• Target Species: **${topPFZ.fish}**\n\n💡 **Voyage Limit**: Keep voyages strictly within 5–8 nautical miles of the coastline. Avoid deep offshore waters.\n[🗺️ View Fishing Corridor on Map](#action-map)`;
      } else if (lang === "te") {
        return `⚠️ **జాగ్రత్తతో కూడిన పరిమిత చేపల వేట సలహా — ${loc}** (\`${coords}\`).\n\n🛡️ **ప్రమాద స్థాయి: మధ్యస్థ ప్రమాదం (CAUTION - ${liveRisk.riskScore}/100)**\n• అలలు: **${wave}** | గాలి: **${wind}**\n\n🐟 **సమీప చేపల వేట జోన్ (PFZ)**: **${topPFZ.name}**\n• తీరం నుండి దూరం: **${topPFZ.dist}**\n• దిశ (Bearing): **${topPFZ.dir}**\n• నీటి లోతు: **${topPFZ.depth}**\n• చేపల రకాలు: **${topPFZ.fish}**\n\n💡 **సలహా**: తీరానికి 5 నుండి 8 నాటికల్ మైళ్ల పరిధిలోనే వేటాడండి. లోతైన సముద్రంలోకి వెళ్లవద్దు.\n[🗺️ మ్యాప్‌లో చేపల వేట జోన్ చూడండి](#action-map)`;
      } else if (lang === "mr") {
        return `⚠️ **सावधगिरीसह मर्यादित मासेमारीचा सल्ला — ${loc}** (\`${coords}\`).\n\n🛡️ **धोका पातळी: मध्यम धोका (CAUTION - ${liveRisk.riskScore}/100)**\n• लाटा: **${wave}** | वारे: **${wind}**\n\n🐟 **जवळचे संभाव्य मासेमारी क्षेत्र (PFZ)**: **${topPFZ.name}**\n• किनाऱ्यापासून अंतर: **${topPFZ.dist}**\n• दिशा: **${topPFZ.dir}**\n• खोली: **${topPFZ.depth}**\n• माशांचे प्रकार: **${topPFZ.fish}**\n\n💡 **सल्ला**: केवळ किनाऱ्याजवळ 5 ते 8 नॉटिकल मैलांपर्यंतच मासेमारी करा. खोल समुद्रात जाणे टाळा.\n[🗺️ नकाशावर मासेमारी क्षेत्र पहा](#action-map)`;
      } else if (lang === "ta") {
        return `⚠️ **எச்சரிக்கையுடன் மீன்பிடிக்க ஆலோசனை — ${loc}** (\`${coords}\`).\n\n🛡️ **ஆபத்து நிலை: மிதமான ஆபத்து (CAUTION - ${liveRisk.riskScore}/100)**\n• அலை: **${wave}** | காற்று: **${wind}**\n\n🐟 **அருகிலுள்ள மீன்பிடி மண்டலம் (PFZ)**: **${topPFZ.name}**\n• தூரம்: **${topPFZ.dist}**\n• திசை: **${topPFZ.dir}**\n• ஆழம்: **${topPFZ.depth}**\n• மீன்கள்: **${topPFZ.fish}**\n\n💡 **பரிந்துரை**: கரையிலிருந்து 5 முதல் 8 கடல் மைல் தூரத்திற்குள் மட்டுமே மீன்பிடிக்கவும்.\n[🗺️ வரைபடத்தில் பார்க்கவும்](#action-map)`;
      } else {
        return `⚠️ **सावधानी के साथ सीमित मछली पकड़ने की सलाह — ${loc}** (\`${coords}\`)।\n\n🛡️ **जोखिम स्तर: मध्यम जोखिम (CAUTION - ${liveRisk.riskScore}/100)**\n• लहरें: **${wave}** | हवा की गति: **${wind}**\n\n🐟 **नजदीकी संभावित मछली क्षेत्र (PFZ)**: **${topPFZ.name}**\n• तट से दूरी: **${topPFZ.dist}**\n• दिशा (Bearing): **${topPFZ.dir}**\n• गहराई: **${topPFZ.depth}**\n• संभावित प्रजातियां: **${topPFZ.fish}**\n\n💡 **सीमा**: केवल 5 से 8 नॉटिकल मील के नजदीकी तटीय दायरे में ही मछली पकड़ें। खुले गहरे समुद्र में जाने से बचें।\n[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)`;
      }
    }

    // SAFE SEA
    if (lang === "en") {
      return `✅ **YES, today is VERY GOOD and SAFE for fishing in ${loc}** (\`${coords}\`)!\n\n🛡️ **Safety Assessment: LOW RISK (${liveRisk.riskScore}/100 - Safe Sea)**\n• Waves: **${wave}** (Calm)\n• Wind: **${wind}** (Favorable sailing breeze)\n• Sea Surface Temp: **${sst}** (Optimal for fish aggregation)\n\n🐟 **Active INCOIS Potential Fishing Zone (PFZ)**:\n• Zone: **${topPFZ.name}**\n• Distance: **${topPFZ.dist}** offshore\n• Bearing: **${topPFZ.dir}**\n• Depth: **${topPFZ.depth}** | Expected Yield: **${topPFZ.yield}**\n• Target Species: **${topPFZ.fish}**\n\n🧭 **Recommended Corridor**: You can safely fish up to 15 nautical miles from the coast.\n[🗺️ View Fishing Corridor on Map](#action-map)`;
    } else if (lang === "te") {
      return `✅ **అవును, ఈరోజు ${loc} వద్ద చేపల వేటకు వెళ్లడం చాలా అనుకూలంగా మరియు పూర్తిగా సురక్షితంగా ఉంది** (\`${coords}\`)!\n\n🛡️ **భద్రతా స్థితి: తక్కువ ప్రమాదం (SAFE SEA - ${liveRisk.riskScore}/100)**\n• అలల ఎత్తు: **${wave}** (ప్రశాంతమైన సముద్రం)\n• గాలి వేగం: **${wind}** (అనుకూలమైన గాలి)\n• సముద్ర ఉష్ణోగ్రత (SST): **${sst}** (చేపల సంచారానికి అనుకూలం)\n\n🐟 **సమీప INCOIS చేపల వేట జోన్ (PFZ)**:\n• ప్రాంతం: **${topPFZ.name}**\n• తీరం నుండి దూరం: **${topPFZ.dist}**\n• దిశ (Bearing): **${topPFZ.dir}**\n• నీటి లోతు: **${topPFZ.depth}** | అంచనా దిగుబడి: **${topPFZ.yield}**\n• చేపల రకాలు: **ట్యూనా (Tuna), బంగడా (Mackerel), సార్డైన్ (Sardine)**\n\n🧭 **రహదారి సలహా**: మీరు తీరం నుండి 15 నాటికల్ మైళ్ల వరకు సురక్షితంగా చేపల వేట సాగించవచ్చు.\n[🗺️ మ్యాప్‌లో చేపల వేట జోన్ చూడండి](#action-map)`;
    } else if (lang === "mr") {
      return `✅ **होय, आज ${loc} येथे मासेमारीसाठी समुद्रात जाणे अत्यंत अनुकूल व सुरक्षित आहे** (\`${coords}\`)!\n\n🛡️ **सुरक्षा मूल्यांकन: कमी धोका (SAFE SEA - ${liveRisk.riskScore}/100)**\n• लाटांची उंची: **${wave}** (शांत समुद्र)\n• वाऱ्याचा वेग: **${wind}** (अनुकूल वारे)\n• समुद्राचे तापमान (SST): **${sst}** (माशांच्या साठ्यासाठी योग्य)\n\n🐟 **जवळचे संभाव्य मासेमारी क्षेत्र (PFZ)**:\n• क्षेत्र: **${topPFZ.name}**\n• किनाऱ्यापासून अंतर: **${topPFZ.dist}**\n• दिशा (Bearing): **${topPFZ.dir}**\n• खोली: **${topPFZ.depth}** | संभाव्य उत्पन्न: **${topPFZ.yield}**\n• मुख्य मासे: **सुरमई/टुना (Tuna), बांगडा (Mackerel), तारली (Sardine)**\n\n🧭 **सल्ला**: आपण किनाऱ्यापासून 15 नॉटिकल मैलांपर्यंत सुरक्षितपणे मासेमारी करू शकता.\n[🗺️ नकाशावर मासेमारी क्षेत्र पहा](#action-map)`;
    } else if (lang === "ta") {
      return `✅ **ஆம், இன்று ${loc} பகுதியில் மீன்பிடிக்கச் செல்வது முற்றிலும் பாதுகாப்பானது மற்றும் சாதகமானது** (\`${coords}\`)!\n\n🛡️ **பாதுகாப்பு நிலை: குறைந்த ஆபத்து (SAFE SEA - ${liveRisk.riskScore}/100)**\n• அலை உயரம்: **${wave}** (அமைதியான கடல்)\n• காற்றின் வேகம்: **${wind}** (சாதகமான காற்று)\n• கடல் வெப்பநிலை (SST): **${sst}**\n\n🐟 **அருகிலுள்ள INCOIS மீன்பிடி மண்டலம் (PFZ)**:\n• மண்டலம்: **${topPFZ.name}**\n• தூரம்: கரையிலிருந்து **${topPFZ.dist}**\n• திசை: **${topPFZ.dir}**\n• ஆழம்: **${topPFZ.depth}** | மகசூல்: **${topPFZ.yield}**\n• மீன் வகைகள்: **சூரை (Tuna), கானாங்கெளுத்தி (Mackerel), மத்தி (Sardine)**\n\n🧭 **பரிந்துரை**: கரையிலிருந்து 15 கடல் மைல் தூரம் வரை பாதுகாப்பாக மீன்பிடிக்கலாம்.\n[🗺️ வரைபடத்தில் பார்க்கவும்](#action-map)`;
    } else {
      return `✅ **हाँ, आज ${loc} में मछली पकड़ने के लिए स्थिति बहुत अच्छी और पूरी तरह सुरक्षित है** (\`${coords}\`)!\n\n🛡️ **सुरक्षा स्थिति: कम जोखिम (SAFE SEA - ${liveRisk.riskScore}/100)**\n• लहरों की ऊँचाई: **${wave}** (शांत समुद्र)\n• हवा की गति: **${wind}** (नौकायन के लिए अनुकूल)\n• समुद्र तापमान (SST): **${sst}** (मछली सघनता के लिए अनुकूल)\n\n🐟 **सक्रिय संभावित मछली पकड़ने का क्षेत्र (PFZ)**:\n• क्षेत्र: **${topPFZ.name}**\n• तट से दूरी: **${topPFZ.dist}**\n• दिशा (Bearing): **${topPFZ.dir}**\n• गहराई: **${topPFZ.depth}** | अनुमानित उपज: **${topPFZ.yield}**\n• मुख्य प्रजातियां: **${topPFZ.fish}**\n\n🧭 **नौकायन दायरा**: आप तट से 15 नॉटिकल मील तक सुरक्षित रूप से जा सकते हैं।\n[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)`;
    }
  }

  // --- 6. Check for Weather & Live Marine Conditions ---
  if (isWeatherQuery(query)) {
    if (lang === "en") {
      return `📍 **Live Marine Weather for ${loc}** (\`${coords}\`):\n\n• 🌊 **Significant Wave Height**: **${wave}**\n• 💨 **Wind Speed**: **${wind}**\n• 🌡️ **Sea Surface Temperature (SST)**: **${sst}**\n• 🧭 **Ocean Surface Currents**: **${currents}**\n• 🛡️ **Safety Status**: **${isSafe ? "LOW RISK (Safe Sea)" : isCaution ? "MODERATE RISK (Caution)" : "HIGH RISK (Danger)"}** (${liveRisk.riskScore}/100)\n\n💡 **Advisory**: ${liveRisk.recommendation || (isSafe ? "Sea conditions are calm and ideal for coastal navigation." : "Maintain caution and monitoring.")}`;
    } else if (lang === "te") {
      return `📍 **${loc}** (\`${coords}\`) ప్రత్యక్ష సముద్ర వాతావరణం:\n\n• 🌊 **అలల ఎత్తు (Wave Height)**: **${wave}**\n• 💨 **గాలి వేగం (Wind Speed)**: **${wind}**\n• 🌡️ **సముద్ర ఉపరితల ఉష్ణోగ్రత (SST)**: **${sst}**\n• 🧭 **సముద్ర ప్రవాహాలు**: **${currents}**\n• 🛡️ **భద్రతా స్థితి**: **${isSafe ? "సురక్షితం (SAFE SEA)" : isCaution ? "జాగ్రత్త (CAUTION)" : "ప్రమాదం (HIGH RISK)"}** (${liveRisk.riskScore}/100)\n\n💡 **సలహా**: ${liveRisk.recommendation || (isSafe ? "సముద్రం ప్రశాంతంగా ఉంది, చేపల వేటకు పరిస్థితులు అనుకూలం." : "జాగ్రత్త వహించండి.")}`;
    } else if (lang === "mr") {
      return `📍 **${loc}** (\`${coords}\`) थेट सागरी हवामान अहवाल:\n\n• 🌊 **लाटांची उंची**: **${wave}**\n• 💨 **वाऱ्याचा वेग**: **${wind}**\n• 🌡️ **समुद्राचे तापमान (SST)**: **${sst}**\n• 🧭 **सागरी प्रवाह**: **${currents}**\n• 🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "सुरक्षित (SAFE SEA)" : isCaution ? "दक्षता (CAUTION)" : "धोका (HIGH RISK)"}** (${liveRisk.riskScore}/100)\n\n💡 **सल्ला**: ${liveRisk.recommendation || (isSafe ? "मासेमारी व प्रवासासाठी परिस्थिती अनुकूल आहे." : "सावधगिरी बाळगा.")}`;
    } else if (lang === "ta") {
      return `📍 **${loc}** (\`${coords}\`) நேரலை கடல் வானிலை:\n\n• 🌊 **அலை உயரம்**: **${wave}**\n• 💨 **காற்றின் வேகம்**: **${wind}**\n• 🌡️ **கடல் வெப்பநிலை (SST)**: **${sst}**\n• 🧭 **நீரோட்டம்**: **${currents}**\n• 🛡️ **பாதுகாப்பு நிலை**: **${isSafe ? "பாதுகாப்பானது" : isCaution ? "எச்சரிக்கை" : "அபாயம்"}** (${liveRisk.riskScore}/100)\n\n💡 **ஆலோசனை**: ${liveRisk.recommendation || (isSafe ? "கடல் அமைதியாக உள்ளது, கடற்பயணம் சாதகமானது." : "கவனமாக இருக்கவும்.")}`;
    } else {
      return `📍 **${loc}** (\`${coords}\`) का लाइव समुद्री मौसम रिपोर्ट:\n\n• 🌊 **लहरों की ऊँचाई (Wave Height)**: **${wave}**\n• 💨 **हवा की गति (Wind Speed)**: **${wind}**\n• 🌡️ **समुद्र सतह तापमान (SST)**: **${sst}**\n• 🧭 **समुद्री धाराएं (Currents)**: **${currents}**\n• 🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "कम जोखिम (सुरक्षित / SAFE SEA)" : isCaution ? "मध्यम जोखिम (सावधानी)" : "उच्च जोखिम (खतरा)"}** (${liveRisk.riskScore}/100)\n\n💡 **सलाह**: ${liveRisk.recommendation || (isSafe ? "मौसम और समुद्र शांत हैं। तटीय नौकायन के लिए परिस्थितियां पूरी तरह अनुकूल हैं।" : "सतर्कता बरतें।")}`;
    }
  }

  // --- 7. Fallback / Direct Natural Response ---
  if (lang === "en") {
    return `📍 **${loc}** (\`${coords}\`):\n\nRegarding your query "${query}":\n• **Current Sea Risk**: **${isSafe ? "Safe Sea (LOW RISK)" : isCaution ? "Moderate Risk (Caution)" : "Dangerous (HIGH RISK)"}** (${liveRisk.riskScore}/100)\n• **Wave Height**: ${wave} | **Wind Speed**: ${wind}\n• **Fisheries**: Nearest PFZ corridor is ${topPFZ.dist} offshore (${topPFZ.dir}).\n\nFeel free to ask me specifically about fishing suitability, live weather, cyclone warnings, or touch any coordinate on the Map!`;
  } else if (lang === "te") {
    return `📍 **${loc}** (\`${coords}\`):\n\nమీ ప్రశ్న "${query}" కు సంబంధించి:\n• **సముద్ర భద్రతా స్థాయి**: **${isSafe ? "సురక్షితం (తక్కువ ప్రమాదం)" : isCaution ? "జాగ్రత్త (మధ్యస్థం)" : "ప్రమాదం (అధికం)"}** (${liveRisk.riskScore}/100)\n• **అలలు**: ${wave} | **గాలి**: ${wind}\n• **చేపల వేట (PFZ)**: సమీప జోన్ తీరం నుండి ${topPFZ.dist} (${topPFZ.dir}) వద్ద ఉంది.\n\nచేపల వేట, వాతావరణం, తుఫాను హెచ్చరికల గురించి నన్ను నేరుగా అడగండి లేదా మ్యాప్‌ను తాకండి!`;
  } else if (lang === "mr") {
    return `📍 **${loc}** (\`${coords}\`):\n\nआपल्या प्रश्नाबाबत "${query}":\n• **सागरी सुरक्षा स्तर**: **${isSafe ? "सुरक्षित (कमी धोका)" : isCaution ? "सावधगिरी (मध्यम)" : "धोकादायक (उच्च)"}** (${liveRisk.riskScore}/100)\n• **लाटा**: ${wave} | **वारे**: ${wind}\n• **मासेमारी क्षेत्र**: जवळचे क्षेत्र किनाऱ्यापासून ${topPFZ.dist} (${topPFZ.dir}) अंतरावर आहे.\n\nमासेमारी, हवामान किंवा चक्रीवादळाच्या इशाऱ्यांबद्दल थेट विचारा किंवा नकाशावर टॅप करा!`;
  } else if (lang === "ta") {
    return `📍 **${loc}** (\`${coords}\`):\n\nஉங்கள் கேள்வி "${query}" தொடர்பாக:\n• **கடல் பாதுகாப்பு நிலை**: **${isSafe ? "பாதுகாப்பானது" : isCaution ? "எச்சரிக்கை" : "அபாயம்"}** (${liveRisk.riskScore}/100)\n• **அலை**: ${wave} | **காற்று**: ${wind}\n• **மீன்பிடி பகுதி**: அருகிலுள்ள பகுதி ${topPFZ.dist} (${topPFZ.dir}) தொலைவில் உள்ளது.\n\nமீன்பிடிப்பு அல்லது வானிலை குறித்து எதையும் கேட்கலாம்!`;
  } else {
    return `📍 **${loc}** (\`${coords}\`):\n\nआपके प्रश्न "${query}" के संबंध में:\n• **समुद्री जोखिम स्थिति**: **${isSafe ? "सुरक्षित (कम जोखिम)" : isCaution ? "मध्यम जोखिम (सावधानी)" : "खतरनाक (उच्च जोखिम)"}** (${liveRisk.riskScore}/100)\n• **लहरें**: ${wave} | **हवा की गति**: ${wind}\n• **मत्स्य क्षेत्र (PFZ)**: निकटतम क्षेत्र तट से ${topPFZ.dist} (${topPFZ.dir}) पर स्थित है।\n\nआप मुझसे मछली पकड़ने की सुरक्षा, चक्रवात चेतावनी, मौसम या मैप पर किसी भी निर्देशांक के बारे में सीधे पूछ सकते हैं!`;
  }
}

/**
 * Generate Initial Situation Briefing when user first switches to the AI Saathi tab.
 */
export function generateInitialLocationBriefing(
  lang: string,
  liveRisk: LiveRiskContext,
  alerts: AssistantAlertItem[] = [],
  pfzList: AssistantPFZItem[] = []
): string {
  const loc = liveRisk.locationLabel || "Coastal Waters";
  const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;
  const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
  const isCaution = liveRisk.riskLevel === "MODERATE";
  const isSafe = !isDanger && !isCaution;

  const wave = liveRisk.waveHeight || "1.1 m";
  const wind = liveRisk.windSpeed || "15 km/h";
  const sst = liveRisk.sst || "28.5°C";

  const topPFZ = pfzList.length > 0 ? pfzList[0] : {
    name: "Coastal PFZ Zone",
    dist: "14.5 km",
    dir: "SW",
    fish: "Tuna, Mackerel",
  };

  const alertCount = alerts.length;

  if (lang === "en") {
    return `📍 **Maritime Briefing — ${loc}** (\`${coords}\`)\n\n🛡️ **Voyage Safety**: **${isSafe ? "SAFE SEA (Low Risk)" : isCaution ? "CAUTION ADVISED (Moderate Risk)" : "HIGH RISK (Avoid Sea)"}** (${liveRisk.riskScore}/100)\n🌊 **Ocean Conditions**: Waves: **${wave}** · Wind: **${wind}** · SST: **${sst}**\n🐟 **Fisheries (PFZ)**: ${topPFZ.name} (${topPFZ.dist} offshore, heading ${topPFZ.dir})\n⚠️ **Advisories**: ${alertCount > 0 ? `${alertCount} active hazard bulletins` : "No severe cyclone or swell warnings"}\n\nAsk me anything about today's weather, fishing zones, or safety!`;
  } else if (lang === "te") {
    return `📍 **సముద్ర స్థితి నివేదిక — ${loc}** (\`${coords}\`)\n\n🛡️ **భద్రతా స్థాయి**: **${isSafe ? "సురక్షితం (Safe Sea)" : isCaution ? "జాగ్రత్త (Caution)" : "అధిక ప్రమాదం (Danger)"}** (${liveRisk.riskScore}/100)\n🌊 **సముద్రం**: అలలు: **${wave}** · గాలి: **${wind}** · ఉష్ణోగ్రత: **${sst}**\n🐟 **చేపల వేట (PFZ)**: ${topPFZ.name} (${topPFZ.dist}, దిశ ${topPFZ.dir})\n⚠️ **హెచ్చరికలు**: ${alertCount > 0 ? `${alertCount} హెచ్చరికలు ఉన్నాయి` : "ఎటువంటి తీవ్ర హెచ్చరికలు లేవు"}\n\nచేపల వేట, వాతావరణం లేదా భద్రత గురించి నన్ను ఏదైనా అడగండి!`;
  } else if (lang === "mr") {
    return `📍 **सागरी स्थिती बुलेटिन — ${loc}** (\`${coords}\`)\n\n🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "सुरक्षित (Safe Sea)" : isCaution ? "सावधगिरी (Caution)" : "उच्च धोका (Danger)"}** (${liveRisk.riskScore}/100)\n🌊 **समुद्र**: लाटा: **${wave}** · वारे: **${wind}** · तापमान: **${sst}**\n🐟 **मासेमारी (PFZ)**: ${topPFZ.name} (किनाऱ्यापासून ${topPFZ.dist}, दिशा ${topPFZ.dir})\n⚠️ **इशारे**: ${alertCount > 0 ? `${alertCount} इशारे सक्रिय` : "कोणतीही तीव्र चेतावणी नाही"}\n\nहवामान, मासेमारी क्षेत्र किंवा सुरक्षेबद्दल काहीही विचारा!`;
  } else if (lang === "ta") {
    return `📍 **கடல் நிலை அறிக்கை — ${loc}** (\`${coords}\`)\n\n🛡️ **பாதுகாப்பு நிலை**: **${isSafe ? "பாதுகாப்பானது (Safe Sea)" : isCaution ? "எச்சரிக்கை (Caution)" : "அபாயம் (Danger)"}** (${liveRisk.riskScore}/100)\n🌊 **கடல் சூழல்**: அலைகள்: **${wave}** · காற்று: **${wind}** · வெப்பநிலை: **${sst}**\n🐟 **மீன்பிடி (PFZ)**: ${topPFZ.name} (${topPFZ.dist}, திசை ${topPFZ.dir})\n⚠️ **எச்சரிக்கைகள்**: ${alertCount > 0 ? `${alertCount} எச்சரிக்கைகள் உள்ளன` : "தீவிர எச்சரிக்கைகள் இல்லை"}\n\nமீன்பிடிப்பு அல்லது பாதுகாப்பு பற்றி எதையும் கேட்கலாம்!`;
  } else {
    return `📍 **तटीय स्थिति बुलेटिन — ${loc}** (\`${coords}\`)\n\n🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "सुरक्षित (Safe Sea)" : isCaution ? "सावधानी (Caution)" : "उच्च जोखिम (खतरा)"}** (${liveRisk.riskScore}/100)\n🌊 **समुद्री स्थिति**: लहरें: **${wave}** · हवा: **${wind}** · तापमान: **${sst}**\n🐟 **मछली क्षेत्र (PFZ)**: ${topPFZ.name} (तट से ${topPFZ.dist}, दिशा ${topPFZ.dir})\n⚠️ **चेतावनी**: ${alertCount > 0 ? `${alertCount} सक्रिय चेतावनी बुलेटिन` : "कोई चक्रवात या भारी लहर अलर्ट सक्रिय नहीं है"}\n\nमुझसे आज के मौसम, मछली पकड़ने या समुद्री सुरक्षा के बारे में कुछ भी पूछें!`;
  }
}

/**
 * Rich Formatted Chat Message supporting clickable in-message action buttons.
 */
export function FormattedChatMessage({
  text,
  onAction,
}: {
  text: string;
  onAction?: (action: string) => void;
}) {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <div className="m-formatted-chat-msg" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: "6px" }} />;
        }

        // Check for Action link pattern [Label](#action-type)
        const actionMatch = trimmed.match(/^\[([^\]]+)\]\(#(action-[a-z0-9-]+)\)$/i);
        if (actionMatch) {
          const btnText = actionMatch[1];
          const actionTarget = actionMatch[2].replace("action-", "");
          return (
            <div key={idx} style={{ marginTop: "6px", marginBottom: "4px" }}>
              <button
                type="button"
                className="m-chat-action-btn"
                onClick={() => onAction?.(actionTarget)}
              >
                {btnText}
              </button>
            </div>
          );
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

        return (
          <div
            key={idx}
            style={{
              paddingLeft: isBullet ? "6px" : undefined,
              marginBottom: "3px",
              lineHeight: 1.48,
            }}
          >
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} style={{ fontWeight: 700 }}>
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={pIdx}
                    style={{
                      background: "rgba(15, 23, 42, 0.08)",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      fontSize: "0.9em",
                      fontFamily: "monospace",
                    }}
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}
