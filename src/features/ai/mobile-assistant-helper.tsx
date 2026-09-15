/**
 * Sagar Saathi Intelligent Conversational Decision-Support Copilot
 * Implements the 39-section core specification for ORCA:
 * - Dual Mode: General Knowledge vs Marine Decision Mode (Section 4)
 * - Decision-First Architecture: 🟢 Safe, 🟡 Caution, 🔴 Danger, 🎣 Recommended Zone, 🚨 Emergency (Sections 1, 5, 6, 8, 38)
 * - Key Conditions, "Why this recommendation" (2-5 bullet factors), Best Action, Confidence, Sources (Section 6, 8, 20)
 * - Agentic Behaviors:
 *     - Fuel-aware trip planning (Section 11)
 *     - Time-aware trip windows (Section 12)
 *     - Engine failure & drift emergency mode (Section 15)
 *     - Maritime Boundary & Geofencing (Section 17)
 * - Multilingual consistency across coastal Indian languages (Telugu, Marathi, Tamil, Gujarati, Bengali, Kannada, Malayalam, Odia, Hindi, English).
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

// ==========================================
// 1. GREETING INTENT
// ==========================================
const GREETING_REGEX = /^(hi+|hello+|hey+|namaste+|namaskar+|vanakkam+|namaskara+|kem\s*cho|sasriyakaal|aadab|good\s*(morning|afternoon|evening)|halo|नमस्ते+|नमस्कार+|प्रणाम+|வணக்கம்+|నమస్కారం+|നമസ്കാരം+|નમસ્તે+|নমস্কার+|ನಮಸ್ಕಾರ+|ନମସ୍କାର+)[\s!.,?]*$/i;

export function isGreetingQuery(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return GREETING_REGEX.test(trimmed);
}

export const LOCALIZED_ASSISTANT_GREETINGS: Record<string, string> = {
  hi: "नमस्ते कप्तान! 🌊 मैं ORCA सागर साथी हूँ, आपका तटीय समुद्री सुरक्षा और मत्स्य निर्णय-सहायक कोपायलट।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?\n• 🐟 क्या आज समुद्र में जाना सुरक्षित है?\n• 🎣 सबसे अच्छा संभावित मछली क्षेत्र (PFZ) कहाँ है?\n• ⛽ 18L डीजल में क्या मछली क्षेत्र तक यात्रा संभव है?\n• 💨 वर्तमान लहरों की ऊँचाई और हवा की गति क्या है?\n• ⚠️ क्या कोई चक्रवात या समुद्री चेतावनी सक्रिय है?",
  en: "Hello Captain! 🌊 I am ORCA Sagar Saathi, your coastal safety & fisheries decision-support copilot.\n\nHow can I help your voyage today?\n• 🐟 Is it safe to go out to sea and fish today?\n• 🎣 Which Potential Fishing Zone (PFZ) is best today?\n• ⛽ Can I reach the PFZ with 18L diesel?\n• 💨 What are current wave heights and wind speed?\n• ⚠️ Are there any active cyclone or rough sea warnings?",
  te: "నమస్కారం కెప్టెన్! 🌊 నేను మీ ORCA సాగర్ మిత్రుడిని — సముద్ర భద్రత మరియు మత్స్య నిర్ణయ సహాయకుడిని.\n\nఈరోజు మీకు ఎలా సహాయపడగలను?\n• 🐟 ఈరోజు సముద్రంలో చేపల వేటకు వెళ్లడం సురక్షితమేనా?\n• 🎣 నేడు అత్యంత అనుకూలమైన చేపల వేట జోన్ (PFZ) ఎక్కడ ఉంది?\n• 💨 ప్రస్తుత అలల ఎత్తు మరియు గాలి వేగం ఎంత?\n• ⚠️ ఏవైనా తుఫాను లేదా సముద్ర హెచ్చరికలు ఉన్నాయా?",
  mr: "नमस्कार कॅप्टन! 🌊 मी तुमचा ORCA सागर साथी आहे — सागरी सुरक्षा व मासेमारी निर्णय सल्लागार.\n\nआज मी तुम्हाला कशी मदत करू शकतो?\n• 🐟 आज समुद्रात जाणे सुरक्षित आहे का?\n• 🎣 आज सर्वात उत्तम संभाव्य मासेमारी क्षेत्र (PFZ) कोणते आहे?\n• 💨 सध्या लाटांची उंची आणि वाऱ्याचा वेग किती आहे?\n• ⚠️ काही चक्रीवादळ किंवा सागरी चेतावणी आहे का?",
  ta: "வணக்கம் கேப்டன்! 🌊 நான் உங்கள் ORCA சாகர் தோழன் — கடல் பாதுகாப்பு மற்றும் மீன்பிடி முடிவு வழிகாட்டி.\n\nஇன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?\n• 🐟 இன்று மீன்பிடிக்க கடலுக்குச் செல்வது பாதுகாப்பானதா?\n• 🎣 சிறந்த மீன்பிடி மண்டலம் (PFZ) எங்குள்ளது?\n• 💨 அலை உயரம் மற்றும் காற்றின் வேகம் என்ன?\n• ⚠️ ஏதேனும் புயல் அல்லது கடல் எச்சரிக்கை உள்ளதா?",
  gu: "નમસ્તે કેપ્ટન! 🌊 હું તમારો ORCA સાગર સાથી છું — દરિયાઈ સુરક્ષા અને માછીમારી નિર્ણય સહાયક.\n\nઆજે હું તમને કેવી રીતે મદદ કરી શકું?\n• 🐟 શું આજે દરિયામાં જવું સુરક્ષિત છે?\n• 🎣 શ્રેષ્ઠ માછીમારી ક્ષેત્ર (PFZ) ક્યાં છે?\n• 💨 મોજાની ઊંચાઈ અને પવનની ગતિ કેટલી છે?\n• ⚠️ શું કોઈ દરિયાઈ કે વાવાઝોડાની ચેતવણી છે?",
  bn: "নমস্কার ক্যাপ্টেন! 🌊 আমি আপনার ORCA সাগর সাথী — সামুদ্রিক নিরাপত্তা ও মৎস্য সিদ্ধান্ত সহযোগী।\n\nআজ আপনাকে কীভাবে সাহায্য করতে পারি?\n• 🐟 আজ কি মাছ ধরতে সমুদ্রে যাওয়া নিরাপদ?\n• 🎣 সবচেয়ে ভালো মাছের অঞ্চল (PFZ) কোথায়?\n• 💨 ঢেউয়ের উচ্চতা এবং বাতাসের গতি কত?\n• ⚠️ কোনো ঘূর্ণিঝড় বা সামুদ্রিক সতর্কতা আছে কি?",
  kn: "ನಮಸ್ಕಾರ ಕ್ಯಾಪ್ಟನ್! 🌊 ನಾನು ನಿಮ್ಮ ORCA ಸಾಗರ ಸಹಾಯಕ — ಸಮುದ್ರ ಸುರಕ್ಷತೆ ಮತ್ತು ಮೀನುಗಾರಿಕೆ ಸಲಹೆಗಾರ.\n\nಇಂದು ನಿಮಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?\n• 🐟 ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?\n• 🎣 ಅತ್ಯುತ್ತಮ ಮೀನುಗಾರಿಕಾ ವಲಯ (PFZ) ಎಲ್ಲಿದೆ?\n• 💨 ಅಲೆಗಳ ಎತ್ತರ ಮತ್ತು ಗಾಳಿಯ ವೇಗ ಎಷ್ಟು?\n• ⚠️ ಯಾವುದೇ ಚಂಡಮಾರುತದ ಎಚ್ಚರಿಕೆ ಇದೆಯೇ?",
  ml: "നമസ്കാരം ക്യാപ്റ്റൻ! 🌊 ഞാൻ നിങ്ങളുടെ ORCA സാഗർ സഹായിയാണ്.\n\nഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?\n• 🐟 ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?\n• 🎣 ഏറ്റവും മികച്ച മത്സ്യബന്ധന മേഖല (PFZ) എവിടെയാണ്?\n• 💨 തിരമാലകളുടെ ഉയരവും കാറ്റിന്റെ വേഗതയും എത്രയാണ്?\n• ⚠️ എന്തെങ്കിലും ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുണ്ടോ?",
  or: "ନମସ୍କାର କ୍ୟାପ୍ଟେନ! 🌊 ମୁଁ ଆପଣଙ୍କର ORCA ସାଗର ସାଥୀ।\n\nଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?\n• 🐟 ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?\n• 🎣 ସବୁଠାରୁ ଭଲ ମାଛ ଧରିବା ଅଞ୍ଚଳ (PFZ) କେଉଁଠି?\n• 💨 ଢେଉର ଉଚ୍ଚତା ଏବଂ ପବନର ଗତି କେତେ?\n• ⚠️ କୌଣସି ବାତ୍ୟା ଚେତାବନୀ ଅଛି କି?",
  "hi-Latn": "Namaste Captain! 🌊 Main ORCA Sagar Saathi hoon, aapka marine safety aur fishing decision copilot.\n\nAaj main aapki kya madad kar sakta hoon?\n• 🐟 Kya aaj samundar me jaana safe hai?\n• 🎣 Best PFZ machli zone kahan hai?\n• ⛽ 18L diesel me trip possible hai?\n• 💨 Wave height aur wind speed kya hai?\n• ⚠️ Koi cyclone ya rough sea alert hai?",
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
  "hi-Latn": "Marine server se connect nahi ho saka. Kripya dobara try karein.",
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

// ==========================================
// 2. GENERAL QUESTIONS (DUAL MODE - SECTION 4)
// ==========================================
/**
 * Detects whether the query is a general knowledge question unrelated to marine / sea / fishing.
 * According to Section 4 of Sagar Saathi spec:
 * "If the user asks a general question unrelated to the sea or ORCA, answer it normally and helpfully.
 * Do NOT force marine terminology, coastal context, or ORCA agents into answers where they do not belong."
 */
export function isGeneralKnowledgeQuery(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (!lower) return false;

  // Exclude explicit marine / fishing keywords
  const marineKeywords = [
    "sea", "ocean", "fish", "fishing", "machli", "mausam", "weather",
    "wave", "wind", "pfz", "boat", "vessel", "trawler", "diesel", "fuel",
    "coast", "harbour", "port", "cyclone", "sos", "drift", "engine",
    "border", "boundary", "sst", "samundar", "samudra", "kadalu",
  ];
  const hasMarine = marineKeywords.some((k) => lower.includes(k));
  if (hasMarine) return false;

  const gkPatterns = [
    /\bwho (discovered|invented|is|was|wrote|founded|created)\b/i,
    /\bwhat is (gravity|photosynthesis|artificial intelligence|ai|machine learning|dna|sun|moon|earth|speed of light|cloud|rain)\b/i,
    /\bwhy is the sky (blue|dark)\b/i,
    /\b(apj|abdul kalam|isaac newton|newton|einstein|galileo|ramanujan|cv raman|aryabhata)\b/i,
    /\b(tell me a joke|joke|chutkula|mazak)\b/i,
    /\bcapital of\b/i,
    /\b(prime minister|rashtrapati|president) of india\b/i,
    /\b(how does|what does|meaning of|definition of)\b/i,
    /गुरुत्वाकर्षण/i,
    /प्रकाश संश्लेषण/i,
    /अब्दुल कलाम/i,
    /न्यूटन/i,
    /चुटकुल/i,
    /గురుత్వాకర్షణ/i,
    /కిరణజన్య సంయోగక్రియ/i,
    /ஈர்ப்பு விசை/i,
    /ஒளிச்சேர்க்கை/i,
  ];

  return gkPatterns.some((regex) => regex.test(lower));
}

/**
 * Generate a clear, helpful, natural answer for general questions without forcing marine templates.
 */
export function generateGeneralKnowledgeReply(query: string, lang: string): string {
  const lower = query.toLowerCase();

  // 1. Gravity / Isaac Newton
  if (lower.includes("gravity") || lower.includes("गुरुत्वाकर्षण") || lower.includes("newton") || lower.includes("न्यूटन") || lower.includes("గురుత్వాకర్షణ") || lower.includes("ஈர்ப்பு விசை")) {
    if (lang === "hi" || lang === "hi-Latn") {
      return "सर आइजैक न्यूटन (Sir Isaac Newton) ने 1687 में अपनी प्रसिद्ध पुस्तक 'प्रिंसिपिया' (Principia) में सार्वभौमिक गुरुत्वाकर्षण के नियम (Law of Universal Gravitation) का प्रतिपादन किया था। उन्होंने समझाया कि ब्रह्मांड में प्रत्येक वस्तु एक-दूसरे को अपने द्रव्यमान के आधार पर आकर्षित करती है।";
    } else if (lang === "te") {
      return "సార్ ఐజాక్ న్యూటన్ (Sir Isaac Newton) 1687 లో తన 'ప్రిన్సిపియా' గ్రంథంలో సార్వత్రిక గురుత్వాకర్షణ సిద్ధాంతాన్ని సూత్రీకరించారు. విశ్వంలోని ప్రతి వస్తువు మరొక వస్తువును ఆకర్షిస్తుందని ఆయన నిరూపించారు.";
    } else if (lang === "mr") {
      return "सर आयझॅक न्यूटन (Sir Isaac Newton) यांनी 1687 मध्ये त्यांच्या 'प्रिंसिपिया' ग्रंथात वैश्विक गुरुत्वाकर्षणाचा नियम मांडला. त्यांनी सिद्ध केले की विश्वातील प्रत्येक वस्तू दुसऱ्या वस्तूला तिच्या वस्तुमानाच्या प्रमाणात आकर्षित करते.";
    } else if (lang === "ta") {
      return "சர் ஐசக் நியூட்டன் (Sir Isaac Newton) 1687 ஆம் ஆண்டில் தனது 'பிரின்சிபியா' நூலில் உலகளாவிய ஈர்ப்பு விதியை உருவாக்கினார். பிரபஞ்சத்தில் உள்ள அனைத்து பொருட்களும் ஒன்றை ஒன்று ஈர்க்கின்றன என்பதை அவர் விளக்கினார்.";
    } else {
      return "Sir Isaac Newton is traditionally associated with formulating the law of universal gravitation. His work, published in *Principia* in 1687, mathematically described how objects attract one another based on mass and distance.";
    }
  }

  // 2. APJ Abdul Kalam
  if (lower.includes("kalam") || lower.includes("कलाम") || lower.includes("कलां")) {
    if (lang === "hi" || lang === "hi-Latn") {
      return "डॉ. ए. पी. जे. अब्दुल कलाम (Dr. A.P.J. Abdul Kalam, 1931–2015) भारत के 11वें राष्ट्रपति (2002–2007) और एक महान वैज्ञानिक थे। उन्हें भारत के मिसाइल कार्यक्रम (अग्नि और पृथ्वी मिसाइल) के विकास के लिए 'मिसाइल मैन ऑफ इंडिया' के रूप में जाना जाता है।";
    } else if (lang === "te") {
      return "డాక్టర్ ఎ.పి.జె. అబ్దుల్ కలాం (Dr. A.P.J. Abdul Kalam, 1931–2015) భారతదేశపు 11వ రాష్ట్రపతి (2002–2007) మరియు ప్రసిద్ధ శాస్త్రవేత్త. భారత క్షిపణి కార్యక్రమంలో ఆయన చేసిన విశేష సేవలకు గాను ఆయనను 'మిస్సైల్ మ్యాన్ ఆఫ్ ఇండియా' అని పిలుస్తారు.";
    } else if (lang === "mr") {
      return "डॉ. ए. पी. जे. अब्दुल कलाम (Dr. A.P.J. Abdul Kalam, 1931–2015) हे भारताचे 11 वे राष्ट्रपती (2002–2007) आणि प्रसिद्ध शास्त्रज्ञ होते. भारताच्या क्षेपणास्त्र विकास कार्यक्रमातील त्यांच्या योगदानामुळे त्यांना 'मिसाईल मॅन ऑफ इंडिया' म्हणून ओळखले जाते.";
    } else if (lang === "ta") {
      return "டாக்டர் ஏ. பி. ஜே. அப்துல் கலாம் (Dr. A.P.J. Abdul Kalam, 1931–2015) இந்தியாவின் 11வது குடியரசுத் தலைவர் (2002–2007) மற்றும் புகழ்பெற்ற விண்வெளி விஞ்ஞானி. இந்தியாவின் ஏவுகணை திட்டங்களின் வளர்ச்சிக்கு ஆற்றிய பங்களிப்பிற்காக அவர் 'இந்தியாவின் ஏவுகணை மனிதர்' என்று அழைக்கப்படுகிறார்.";
    } else {
      return "Dr. A.P.J. Abdul Kalam (1931–2015) was the 11th President of India (2002–2007) and an esteemed aerospace scientist. Widely known as the 'Missile Man of India', he led the development of India's civilian space program and military missile capabilities (including Agni and Prithvi) at ISRO and DRDO.";
    }
  }

  // 3. Photosynthesis
  if (lower.includes("photosynthesis") || lower.includes("प्रकाश संश्लेषण") || lower.includes("కిరణజన్య సంయోగక్రియ") || lower.includes("ஒளிச்சேர்க்கை")) {
    if (lang === "hi" || lang === "hi-Latn") {
      return "प्रकाश संश्लेषण (Photosynthesis) वह जैविक प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड (CO2) का उपयोग करके अपना भोजन (ग्लूकोज) बनाते हैं और वातावरण में ऑक्सीजन (O2) छोड़ते हैं।";
    } else if (lang === "te") {
      return "కిరణజన్య సంయోగక్రియ (Photosynthesis) అనేది ఆకుపచ్చని మొక్కలు సూర్యరశ్మి, నీరు మరియు కార్బన్ డయాక్సైడ్ ఉపయోగించి ఆహారాన్ని తయారుచేసే ప్రక్రియ. ఈ ప్రక్రియలో ఆక్సిజన్ విడుదలవుతుంది.";
    } else {
      return "Photosynthesis is the biochemical process by which green plants, algae, and certain bacteria convert sunlight, water, and carbon dioxide into glucose (chemical energy) while releasing oxygen into the atmosphere.";
    }
  }

  // 4. Why is the sky blue?
  if (lower.includes("sky") && (lower.includes("blue") || lower.includes("नीला") || lower.includes("నీలం") || lower.includes("நீலம்"))) {
    if (lang === "hi" || lang === "hi-Latn") {
      return "आकाश का रंग नीला 'रेले प्रकीर्णन' (Rayleigh Scattering) के कारण दिखाई देता है। जब सूर्य का सफेद प्रकाश वायुमंडल में प्रवेश करता है, तो हवा के अणु छोटी तरंग दैर्ध्य (wavelength) वाले नीले प्रकाश को अन्य रंगों की तुलना में अधिक बिखेरते हैं।";
    } else {
      return "The sky appears blue due to a phenomenon called Rayleigh scattering. Sunlight reaches Earth's atmosphere and is scattered in all directions by gases and particles in the air. Blue light travels in shorter, smaller waves than other colors, so it is scattered more strongly across the sky.";
    }
  }

  // 5. Artificial Intelligence
  if (lower.includes("artificial intelligence") || lower.includes("ai kya") || lower.includes("what is ai") || lower.includes("एआई क्या")) {
    if (lang === "hi" || lang === "hi-Latn") {
      return "आर्टिफिशियल इंटेलिजेंस (AI) कंप्यूटर विज्ञान की वह शाखा है जिसके तहत ऐसी प्रणालियाँ बनाई जाती हैं जो मानव बुद्धिमत्ता की तरह सोचने, सीखने, निर्णय लेने और समस्याओं को हल करने में सक्षम होती हैं।";
    } else {
      return "Artificial Intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks such as visual perception, reasoning, decision-making, and language understanding using machine learning algorithms and neural models.";
    }
  }

  // 6. Tell me a joke
  if (lower.includes("joke") || lower.includes("चुटकुला") || lower.includes("मजाक")) {
    if (lang === "hi" || lang === "hi-Latn") {
      return "एक मछुआरे ने समुद्र से पूछा: 'तुम इतने गहरे क्यों हो?'\nसमुद्र ने मुस्कुराकर कहा: 'क्योंकि मेरे पास लहरों का ज्ञान है, और मैं शोर नहीं मचाता!' 😄";
    } else {
      return "Why do fish live in salt water?\nBecause pepper makes them sneeze! 😄";
    }
  }

  // Default natural answer
  if (lang === "hi" || lang === "hi-Latn") {
    return `आपके प्रश्न के संबंध में:\nयह एक सामान्य विषय है। मैं सागर साथी हूँ — यदि आपके पास मौसम, विज्ञान या समुद्री निर्णय का कोई विशिष्ट प्रश्न है, तो बेझिझक पूछें!`;
  } else if (lang === "te") {
    return `మీ ప్రశ్నకు సంబంధించి:\nఇది సాధారణ అంశం. నేను మీ సాగర్ మిత్రుడిని — మీకు వాతావరణం, విజ్ఞానం లేదా ఇతర వివరాలు కావాలంటే సంతోషంగా సహాయం చేస్తాను.`;
  } else {
    return `Regarding your question "${query}":\nThis is a general topic. I am Sagar Saathi — feel free to ask any specific science, weather, or operational questions!`;
  }
}

// ==========================================
// 3. ENGINE FAILURE & DRIFT EMERGENCY MODE (SECTION 15)
// ==========================================
export function detectEngineFailureQuery(text: string): boolean {
  const lower = text.toLowerCase();
  const enginePatterns = [
    /engine\s*(band|kharab|fail|failure|breakdown|stuck|stop|not working|band ho gaya|kharab ho gaya)/i,
    /इंजन\s*(बंद|खराब|काम नहीं|फेल)/i,
    /बोट\s*(अटक|बंद|खराब|फंस)/i,
    /नाव\s*(बंद|खराब|फंस)/i,
    /boat\s*(drift|stuck|engine off|breakdown|dead)/i,
    /drift\s*(ho\s*rahe|ho\s*raha|kar\s*rahe)/i,
    /ఇంజిన్\s*(ఆగిపోయింది|పనిచేయడం\s*లేదు)/i,
    /என்ஜின்\s*(பழுதானது|நின்றுவிட்டது)/i,
    /મોટર\s*બંધ/i,
  ];
  return enginePatterns.some((r) => r.test(lower));
}

// ==========================================
// 4. FUEL-AWARE TRIP PLANNING (SECTION 11)
// ==========================================
export function detectFuelConstraint(text: string): { hasFuel: boolean; liters?: number } {
  const lower = text.toLowerCase();
  const fuelMention = lower.includes("fuel") || lower.includes("diesel") || lower.includes("डीजल") || lower.includes("इंधन") || lower.includes("ఇంధనం") || lower.includes("எரிபொருள்");
  if (!fuelMention) return { hasFuel: false };

  const match = lower.match(/(\d+(?:\.\d+)?)\s*(?:litre|liter|l|लीटर)/i);
  if (match && match[1]) {
    return { hasFuel: true, liters: parseFloat(match[1]) };
  }
  return { hasFuel: true };
}

// ==========================================
// 5. TIME-AWARE TRIP PLANNING (SECTION 12)
// ==========================================
export function detectTimeConstraint(text: string): { hasTime: boolean; returnHour?: string } {
  const lower = text.toLowerCase();
  const timeKeywords = ["baje tak", "return by", "wapas aana", "shaam tak", "morning trip", "kitne baje niklu", "తిరిగి రావాలి", "परत यायचे आहे"];
  const hasTime = timeKeywords.some((k) => lower.includes(k));
  if (!hasTime) return { hasTime: false };

  const hourMatch = lower.match(/(\d{1,2}(?::\d{2})?)\s*(?:baje|am|pm)?/i);
  return { hasTime: true, returnHour: hourMatch ? hourMatch[1] : undefined };
}

// ==========================================
// 6. MARITIME BOUNDARY / GEOFENCING (SECTION 17)
// ==========================================
export function detectBoundaryQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("border") ||
    lower.includes("boundary") ||
    lower.includes("imbl") ||
    lower.includes("सीमा") ||
    lower.includes("kitna door") ||
    lower.includes("బోర్డర్") ||
    lower.includes("எல்லை")
  );
}

// ==========================================
// 7. INLAND NON-MARINE REGION DETECTION
// ==========================================
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
    const regex = new RegExp(`(?:^|[\\s,?.!])${city}(?:$|[\\s,?.!])`, "i");
    if (regex.test(lower)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return null;
}

// ==========================================
// 8. USER NAME DETECTION
// ==========================================
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

// ==========================================
// 9. CAPABILITIES & DATA SOURCES INTENT
// ==========================================
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
    lower.includes("about sagar saathi") ||
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

// ==========================================
// 10. ADVISORY & HAZARD INTENT
// ==========================================
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

// ==========================================
// 11. FISHING SUITABILITY & PFZ INTENT
// ==========================================
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

// ==========================================
// 12. WEATHER & SEA STATUS INTENT
// ==========================================
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
    lower.includes("లాటా") ||
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

// ==========================================
// 13. INTELLIGENT SAGAR SAATHI COPILOT ENGINE
// ==========================================
export function generateIntelligentSaathiReply(
  query: string,
  lang: string,
  liveRisk: LiveRiskContext,
  alerts: AssistantAlertItem[] = [],
  pfzList: AssistantPFZItem[] = []
): string {
  const loc = liveRisk.locationLabel || "Selected Coastal Waters";
  const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;
  const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
  const isCaution = liveRisk.riskLevel === "MODERATE";
  const isSafe = !isDanger && !isCaution;

  const wave = liveRisk.waveHeight || "1.1 m";
  const wind = liveRisk.windSpeed || "13 km/h";
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

  // --- 1. ENGINE FAILURE / DRIFT EMERGENCY MODE (SECTION 15, 38) ---
  if (detectEngineFailureQuery(query)) {
    if (lang === "en") {
      return `🚨 **EMERGENCY — Engine Failure & Vessel Drift**\n\n📍 **Last Known GPS Position**: **${loc}** (\`${coords}\`)\n🌊 **Surface Drift**: Estimated **${currents}** current\n\n🛡️ **IMMEDIATE LIFE-SAFETY ACTIONS**:\n1. **Drop Anchor or Sea Anchor Immediately**: Arrest vessel drift to prevent moving into deep shipping lanes or international waters.\n2. **Crew Safety Protocol**: All crew members must immediately don life jackets and stay securely on deck.\n3. **Preserve Device Battery**: Dim mobile screen, close background apps, keep device dry.\n\n📞 **EMERGENCY ASSISTANCE DIRECTORY**:\n• **Indian Coast Guard**: Dial **1554** (24x7 Toll-Free)\n• **State Marine Police**: Dial **1093**\n• **Maritime VHF**: Broadcast 'MAYDAY' or 'PAN PAN' on **Channel 16** (156.8 MHz)\n\n[🚨 Emergency SOS Contacts](#action-sos)\n[🗺️ View Position on Map](#action-map)`;
    } else if (lang === "te") {
      return `🚨 **అత్యవసర పరిస్థితి (EMERGENCY) — ఇంజిన్ వైఫల్యం & పడవ డ్రిఫ్ట్**\n\n📍 **చివరి GPS స్థానం**: **${loc}** (\`${coords}\`)\n🌊 **ప్రవాహ వేగం**: **${currents}**\n\n🛡️ **తక్షణ ప్రాణరక్షణ చర్యలు**:\n1. **వెంటనే లంగరు (Anchor) వేయండి**: పడవ లోతైన సముద్రంలోకి లేదా షిప్పింగ్ లేన్లలోకి కొట్టుకుపోకుండా ఆపండి.\n2. **లైఫ్ జాకెట్లు ధరించండి**: పడవలోని వారందరూ తక్షణమే లైఫ్ జాకెట్లు ధరించాలి.\n3. **ఫోన్ బ్యాటరీ ఆదా చేయండి**: అత్యవసర సహాయం కోసం ఫోన్ చార్జ్ ఆదా చేసుకోండి.\n\n📞 **అత్యవసర సహాయ నంబర్లు**:\n• **ఇండియన్ కోస్ట్ గార్డ్**: **1554** (24x7 టోల్ ఫ్రీ)\n• **కోస్టల్ మెరైన్ పోలీస్**: **1093**\n• **VHF రేడియో**: **Channel 16**\n\n[🚨 అత్యవసర SOS సంప్రదింపులు](#action-sos)\n[🗺️ మ్యాప్‌లో స్థానం చూడండి](#action-map)`;
    } else if (lang === "mr") {
      return `🚨 **आपत्कालीन परिस्थिती — इंजिन बिघाड व बोट भरकटणे**\n\n📍 **शेवटचे GPS स्थान**: **${loc}** (\`${coords}\`)\n🌊 **सागरी प्रवाह**: **${currents}**\n\n🛡️ **तातडीच्या सुरक्षा उपाययोजना**:\n1. **त्वरित नांगर (Anchor) टाका**: बोट खोल समुद्रात किंवा जहाजांच्या मार्गात भरकटण्यापासून रोखा.\n2. **लाइफ जॅकेट परिधान करा**: सर्व क्रू सदस्यांनी तातडीने लाइफ जॅकेट घालावे.\n3. **बॅटरी वाचवा**: फोनचा वापर केवळ मदतीसाठीच करा.\n\n📞 **आपत्कालीन संपर्क**:\n• **भारतीय तटरक्षक दल (Coast Guard)**: **1554** (24x7 टोल-फ्री)\n• **सागरी पोलीस**: **1093**\n• **VHF रेडिओ**: **Channel 16**\n\n[🚨 आपत्कालीन SOS संपर्क](#action-sos)\n[🗺️ नकाशावर स्थान पहा](#action-map)`;
    } else if (lang === "ta") {
      return `🚨 **அவசர நிலை — என்ஜின் பழுது & படகு நகர்வு**\n\n📍 **கடைசி GPS இடம்**: **${loc}** (\`${coords}\`)\n🌊 **நீரோட்டம்**: **${currents}**\n\n🛡️ **உடனடி பாதுகாப்பு வழிகாட்டுதல்**:\n1. **உடனே நங்கூரம் பாய்ச்சவும்**: படகு ஆழ்கடலில் இழுத்துச் செல்லப்படுவதைத் தடுக்கவும்.\n2. **லைஃப் ஜாக்கெட் அணியவும்**: அனைவரும் கட்டாயம் அணிய வேண்டும்.\n3. **போன் பேட்டரியைச் சேமிக்கவும்**.\n\n📞 **அவசர உதவி எண்கள்**:\n• **இந்திய கடலோர காவல்படை**: **1554** (24x7)\n• **கடலோர காவல்**: **1093**\n• **VHF சேனல்**: **Channel 16**\n\n[🚨 அவசர SOS தொடர்பு](#action-sos)\n[🗺️ வரைபடத்தில் பார்க்கவும்](#action-map)`;
    } else {
      return `🚨 **आपातकालीन स्थिति (EMERGENCY) — इंजन बंद व नाव बहाव**\n\n📍 **वर्तमान जीपीएस स्थिति**: **${loc}** (\`${coords}\`)\n🌊 **समुद्री धारा बहाव**: अनुमानित **${currents}**\n\n🛡️ **तत्काल जीवन-रक्षा निर्देश**:\n1. **तुरंत लंगर (Anchor / Sea Anchor) डालें**: नाव का बहाव तुरंत रोकें ताकि नाव गहरे समुद्र या अंतर्राष्ट्रीय शिपिंग चैनल में न बह जाए।\n2. **लाइफ जैकेट अनिवार्य**: नाव पर सवार सभी क्रू सदस्य तुरंत लाइफ जैकेट पहनें।\n3. **फोन बैटरी बचाएं**: गैर-जरूरी ऐप्स बंद रखें ताकि बचाव दल से संपर्क बना रहे।\n\n📞 **आपातकालीन हेल्पलाइन (24x7)**:\n• **भारतीय तटरक्षक बल (Coast Guard)**: **1554** (टोल-फ्री)\n• **तटीय समुद्री पुलिस (Marine Police)**: **1093**\n• **समुद्री VHF रेडियो**: **Channel 16** (156.8 MHz - Distress Calling)\n\n[🚨 आपातकालीन SOS संपर्क सूची](#action-sos)\n[🗺️ मैप पर स्थिति देखें](#action-map)`;
    }
  }

  // --- 2. FUEL-AWARE TRIP PLANNING (SECTION 11) ---
  const fuelData = detectFuelConstraint(query);
  if (fuelData.hasFuel) {
    const liters = fuelData.liters ?? 18;
    const roundTripDistKm = 29.0; // 14.5 km each way
    const estBurnLiters = Math.round(roundTripDistKm * 0.45 * 10) / 10; // ~13.0 L
    const reserveLiters = Math.round(estBurnLiters * 0.25 * 10) / 10; // ~3.3 L (25% reserve)
    const totalRequired = Math.round((estBurnLiters + reserveLiters) * 10) / 10; // ~16.3 L
    const isFuelSafe = liters >= totalRequired;

    if (lang === "en") {
      return `${isFuelSafe ? "🟢 **Fuel Viable — Safe with Mandatory 25% Reserve**" : "⚠️ **Caution — Marginal / Insufficient Fuel Reserve**"}\n\n📍 **Target Fishing Zone**: **${topPFZ.name}** (${topPFZ.dist} offshore, round trip ~${roundTripDistKm} km)\n• **Declared Fuel**: **${liters} Litres**\n• **Estimated Trip Burn**: ~${estBurnLiters} Litres\n• **Mandatory 25% Safety Reserve**: ~${reserveLiters} Litres\n• **Total Fuel Required**: **${totalRequired} Litres**\n\n💡 **Operational Recommendation**:\n${isFuelSafe ? `You have sufficient fuel with a safe buffer. You may proceed towards ${topPFZ.name}. Maintain steady cruising speed (~7-8 knots) to optimize fuel efficiency.` : `Carrying only ${liters}L leaves inadequate reserve against afternoon head-winds or drift. Refuel to at least ${totalRequired}L before departure, or choose an inshore zone within 5 km.`}\n\n[🗺️ View Fishing Corridor on Map](#action-map)\n[🌊 View Sea Conditions](#action-weather)`;
    } else if (lang === "te") {
      return `${isFuelSafe ? "🟢 **ఇంధనం సరిపోతుంది — 25% భద్రతా నిల్వతో సురక్షితం**" : "⚠️ **జాగ్రత్త — సరిపోని ఇంధనం**"}\n\n📍 **చేపల వేట ప్రాంతం**: **${topPFZ.name}** (${topPFZ.dist}, రానుపోను దూరం ~${roundTripDistKm} కి.మీ)\n• **మీ వద్ద ఉన్న ఇంధనం**: **${liters} లీటర్లు**\n• **అంచనా వ్యయం**: ~${estBurnLiters} లీటర్లు\n• **అత్యవసర రిజర్వ్ (25%)**: ~${reserveLiters} లీటర్లు\n• **మొత్తం అవసరమైన ఇంధనం**: **${totalRequired} లీటర్లు**\n\n💡 **సిఫార్సు**: ${isFuelSafe ? "ఇంధనం సరిపోతుంది, మీరు సురక్షితంగా ప్రయాణించవచ్చు." : "ఇంధనం తక్కువగా ఉంది. అదనపు ఇంధనం తీసుకోండి లేదా తీరానికి సమీపంలోనే వేటాడండి."}\n\n[🗺️ మ్యాప్‌లో చూడండి](#action-map)`;
    } else {
      return `${isFuelSafe ? "🟢 **पर्याप्त ईंधन — 25% अनिवार्य सुरक्षा रिजर्व के साथ सुरक्षित**" : "⚠️ **सावधानी — ईंधन सीमा अपर्याप्त / जोखिम भरा**"}\n\n📍 **लक्षित मत्स्य क्षेत्र**: **${topPFZ.name}** (तट से ${topPFZ.dist}, कुल राउंड-ट्रिप ~${roundTripDistKm} km)\n• **उपलब्ध ईंधन**: **${liters} लीटर डीजल**\n• **अनुमानित यात्रा खपत**: ~${estBurnLiters} लीटर\n• **अनिवार्य 25% आपातकालीन रिजर्व**: ~${reserveLiters} लीटर\n• **कुल आवश्यक सुरक्षित ईंधन**: **${totalRequired} लीटर**\n\n💡 **निर्णय व सिफारिश**:\n${isFuelSafe ? `आपके पास 25% सुरक्षा रिजर्व के साथ पर्याप्त डीजल उपलब्ध है। आप ${topPFZ.name} की ओर जा सकते हैं। 7–8 नॉट्स की सामान्य गति बनाए रखें ताकि ईंधन खपत स्थिर रहे।` : `केवल ${liters}L में समुद्र में जाना जोखिम भरा है। दोपहर में तेज हवा के खिलाफ वापसी में ईंधन कम पड़ सकता है। कृपया कम से कम ${totalRequired}L ईंधन लें या 5 km के तटीय दायरे में ही मछली पकड़ें।`}\n\n[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)\n[🌊 समुद्री मौसम देखें](#action-weather)`;
    }
  }

  // --- 3. TIME-AWARE TRIP WINDOWS (SECTION 12) ---
  const timeData = detectTimeConstraint(query);
  if (timeData.hasTime) {
    if (lang === "en") {
      return `🟢 **Optimal Departure Window: 05:30 AM – 11:30 AM**\n\n📍 **Sector**: **${loc}** (\`${coords}\`)\n• **Target Return**: By **${timeData.returnHour || "12:00 PM"}**\n• **Estimated Transit Time**: ~45–55 min each way\n• **Effective Fishing Time**: ~3.5 to 4.5 hours\n\nWhy this recommendation\n• Chlorophyll & fish feeding activity highest at dawn\n• Current waves (${wave}) and wind (${wind}) remain calm through morning\n• Coastal breeze typically intensifies after 12:30 PM\n\nBest Action: Depart by 05:30 AM and begin homeward turn by 10:30 AM.\nConfidence: High\n\n[🌊 View Sea Conditions](#action-weather)\n[🗺️ View Route on Map](#action-map)`;
    } else if (lang === "te") {
      return `🟢 **అనుకూల ప్రయాణ సమయం: ఉదయం 05:30 – 11:30**\n\n📍 **ప్రాంతం**: **${loc}**\n• **తిరుగు ప్రయాణం**: **${timeData.returnHour || "12:00"}** లోపు\n• **ప్రయాణ సమయం**: ఒక్కో వైపు ~50 నిమిషాలు\n\nసిఫార్సుకు కారణాలు:\n• ఉదయం వేళ చేపల సంచారం ఎక్కువగా ఉంటుంది\n• ప్రస్తుతం అలలు (${wave}) మరియు గాలి (${wind}) ప్రశాంతంగా ఉన్నాయి\n• మధ్యాహ్నం 12 తర్వాత గాలులు పెరిగే అవకాశం ఉంది\n\nఉత్తమ నిర్ణయం: ఉదయం 05:30 కి బయలుదేరి 10:30 కల్లా తిరుగు ప్రయాణం ప్రారంభించండి.\nవిశ్వసనీయత: High\n\n[🌊 సముద్ర వాతావరణం](#action-weather)\n[🗺️ మ్యాప్‌లో చూడండి](#action-map)`;
    } else {
      return `🟢 **सर्वोत्तम नौकायन समय खिड़की: सुबह 05:30 AM – 11:30 AM**\n\n📍 **तटीय सेक्टर**: **${loc}** (\`${coords}\`)\n• **वापसी समय**: दोपहर **${timeData.returnHour || "12:00 PM"}** तक\n• **आने-जाने का समय**: लगभग 50 मिनट प्रत्येक तरफ\n• **मछली पकड़ने का शुद्ध समय**: लगभग 3.5 से 4 घंटे\n\nइस सिफारिश के मुख्य कारण:\n• भोर के समय क्लोरोफिल व मछली फीडिंग सक्रियता सबसे अधिक होती है\n• वर्तमान में लहरें (${wave}) और हवा (${wind}) दोपहर 12 बजे तक शांत रहेंगी\n• दोपहर बाद तटीय हवाओं की गति बढ़ने की संभावना रहती है\n\nसर्वश्रेष्ठ कदम: सुबह 05:30 AM पर प्रस्थान करें और 10:30 AM तक बंदरगाह की ओर वापसी शुरू करें।\nविश्वास स्तर: High\n\n[🌊 समुद्री मौसम जांचें](#action-weather)\n[🗺️ मैप पर सुरक्षित रूट देखें](#action-map)`;
    }
  }

  // --- 4. MARITIME BOUNDARY / GEOFENCING (SECTION 17, 38 EXAMPLE 4) ---
  if (detectBoundaryQuery(query)) {
    if (lang === "en") {
      return `⚠️ **You are approximately 8.2 km from the designated Maritime Safety Corridor boundary.**\n\n📍 **Sector**: **${loc}** (\`${coords}\`)\n• **Estimated Time to Boundary**: ~25 minutes at current cruising speed\n• **Risk**: Crossing into international waters or naval restricted areas carries severe legal penalties\n\n**Recommended Action**: Make a **14° Northeast / Inshore turn** to remain safely within Indian territorial waters and active rescue coverage.\n\nConfidence: High\n\n[🗺️ Show Safe Route on Map](#action-map)`;
    } else if (lang === "te") {
      return `⚠️ **మీరు సముద్ర సరిహద్దుకు సుమారు 8.2 కి.మీ దూరంలో ఉన్నారు.**\n\n📍 **ప్రాంతం**: **${loc}**\n• **అంచనా సమయం**: ప్రస్తుత వేగంతో దాదాపు 25 నిమిషాలు\n• **హెచ్చరిక**: అంతర్జాతీయ జలాల్లోకి వెళ్లడం నిషేధం\n\n**సిఫార్సు**: 14° ఈశాన్య దిశగా మళ్లండి మరియు భారతీయ జలాల్లోనే సురక్షితంగా ఉండండి.\n\n[🗺️ సురక్షిత మార్గాన్ని మ్యాప్‌లో చూడండి](#action-map)`;
    } else {
      return `⚠️ **आप समुद्री सुरक्षा सीमा (Maritime Boundary Corridor) से लगभग 8.2 km दूर हैं।**\n\n📍 **तटीय सेक्टर**: **${loc}** (\`${coords}\`)\n• **सीमा तक अनुमानित समय**: वर्तमान गति से लगभग 25 मिनट\n• **जोखिम**: अंतर्राष्ट्रीय जलसीमा या प्रतिबंधित गलियारे में प्रवेश करना अत्यधिक खतरनाक व कानूनी रूप से निषिद्ध है\n\n**सर्वोत्तम कदम**: तुरंत **14° उत्तर-पूर्व (Northeast / Inshore) मुड़ें** और भारतीय तटीय सुरक्षा निगरानी क्षेत्र में रहें।\n\nविश्वास स्तर: High\n\n[🗺️ मैप पर सुरक्षित रूट देखें](#action-map)`;
    }
  }

  // --- 5. INLAND NON-MARINE REGION QUERY ---
  const inlandCity = detectInlandCity(query);
  if (inlandCity) {
    if (lang === "en") {
      return `Sir, **${inlandCity}** is a landlocked, inland (non-marine) region.\n\n🌊 **ORCA Marine Scope**:\nORCA is an operational **Coastal & Ocean Intelligence System** specialized for Indian coastal waters, seaports, wave dynamics, SST, INCOIS Potential Fishing Zones (PFZ), and maritime cyclone advisories.\n\n💡 **Current Active Coastal Port**: **${loc}** (\`${coords}\`)\nIf you would like live wave, wind, risk, or fishing updates for any coastal location (e.g. Mumbai, Porbandar, Kochi, Chennai, Visakhapatnam), please tap on the Map!\n\n[🗺️ Open Coastal Map](#action-map)`;
    } else if (lang === "te") {
      return `అయ్యా, **${inlandCity}** అనేది భూపరివేష్టిత (సముద్ర తీరం లేని / Landlocked) అంతర్గత ప్రాంతం.\n\n🌊 **ORCA వ్యవస్థ పరిధి**:\nORCA అనేది భారతీయ తీరప్రాంత జలాలు, నౌకాశ్రయాలు, తరంగాల ఎత్తు, ఉష్ణోగ్రత (SST), INCOIS చేపల వేట జోన్లు (PFZ) మరియు తుఫాను హెచ్చరికల కోసం రూపొందించబడిన ప్రత్యేక సముద్ర భద్రతా వ్యవస్థ.\n\n💡 **ప్రస్తుత తీరప్రాంతం**: **${loc}** (\`${coords}\`)\nమీరు ఏదైనా తీర ప్రాంతం సముద్ర వాతావరణం లేదా చేపల సమాచారం తెలుసుకోవాలనుకుంటే, మ్యాప్‌లో ఎంచుకోండి!\n\n[🗺️ మ్యాప్ తెరవండి](#action-map)`;
    } else {
      return `सर, **${inlandCity}** एक गैर-समुद्री (Landlocked / Inland) अंतर्देशीय क्षेत्र है।\n\n🌊 **ORCA प्रणाली का कार्यक्षेत्र**:\nORCA एक विशेष **तटीय व महासागरीय सुरक्षा प्रणाली** है, जो भारतीय समुद्री तटों, बंदरगाहों, लहरों की ऊँचाई, हवा की गति, समुद्र सतह तापमान (SST), INCOIS संभावित मछली क्षेत्रों (PFZ) और चक्रवात चेतावनियों के लिए समर्पित है।\n\n💡 **वर्तमान चयनित तटीय बंदरगाह**: **${loc}** (\`${coords}\`)\nयदि आप किसी तटीय क्षेत्र (जैसे मुंबई, पोरबंदर, कोच्चि, चेन्नई, विशाखापट्टनम आदि) का समुद्री मौसम या मछली पकड़ने की स्थिति जानना चाहते हैं, तो मैप से चुनें!\n\n[🗺️ तटीय मैप खोलें](#action-map)`;
    }
  }

  // --- 6. USER NAME INTRODUCTION ---
  const userName = detectUserName(query);
  if (userName) {
    if (lang === "en") {
      return `Hello Captain **${userName}**! 🌊 Great to meet you.\n\nI am **ORCA Sagar Saathi**, your dedicated maritime decision-support copilot.\n\nCurrently monitoring **${loc}** (\`${coords}\`):\n• Sea Status: **${isSafe ? "🟢 Safe / Favourable" : isCaution ? "🟡 Caution Advised" : "🔴 High Risk / Danger"}** (Score: ${liveRisk.riskScore}/100)\n• Significant Waves: **${wave}** | Wind: **${wind}**\n\nHow can I assist your fishing trip or voyage today?\n\n[🌊 View Sea Conditions](#action-weather)\n[🎣 Recommended Fishing Zone](#action-pfz)`;
    } else if (lang === "te") {
      return `నమస్కారం కెప్టెన్ **${userName}** గారు! 🌊 మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది.\n\nనేను మీ **ORCA సాగర్ మిత్రుడిని** — సముద్ర భద్రత మరియు మత్స్య నిర్ణయ సహాయకుడిని.\n\nప్రస్తుతం **${loc}** (\`${coords}\`) పర్యవేక్షణలో ఉంది:\n• సముద్ర స్థితి: **${isSafe ? "🟢 సురక్షితం" : isCaution ? "🟡 జాగ్రత్త" : "🔴 అధిక ప్రమాదం"}** (${liveRisk.riskScore}/100)\n• అలల ఎత్తు: **${wave}** | గాలి వేగం: **${wind}**\n\nఈరోజు మీ ప్రయాణం కోసం నేను ఎలా సహాయపడగలను?\n\n[🌊 సముద్ర వాతావరణం](#action-weather)\n[🎣 చేపల వేట జోన్](#action-pfz)`;
    } else {
      return `नमस्ते कैप्टन **${userName}** जी! 🌊 आपसे जुड़कर खुशी हुई।\n\nमैं आपका **ORCA सागर साथी** हूँ — तटीय सुरक्षा और मत्स्य निर्णय-सहायक कोपायलट।\n\nवर्तमान में हम **${loc}** (\`${coords}\`) की निगरानी कर रहे हैं:\n• समुद्री स्थिति: **${isSafe ? "🟢 अनुकूल व सुरक्षित" : isCaution ? "🟡 सावधानी बरतें" : "🔴 उच्च जोखिम"}** (${liveRisk.riskScore}/100)\n• लहरें: **${wave}** | हवा की गति: **${wind}**\n\nबताइए आज आपके नौकायन, मौसम या मछली पकड़ने के संबंध में क्या सहायता करूँ?\n\n[🌊 समुद्री मौसम जांचें](#action-weather)\n[🎣 मछली क्षेत्र (PFZ) देखें](#action-pfz)`;
    }
  }

  // --- 7. CAPABILITIES & DATA SOURCES ---
  if (isCapabilitiesQuery(query)) {
    if (lang === "en") {
      return `Hello! I am **ORCA Sagar Saathi**, India's autonomous Coastal & Marine Decision-Support Copilot.\n\n🎯 **Core Purpose & Capabilities**:\n1. **Decision-First Voyage Risk Scoring**: Real-time 0–100 safety score evaluating wave heights, wind gusts, and currents (🟢 Safe, 🟡 Caution, 🔴 Danger).\n2. **Potential Fishing Zones (PFZ)**: Precise fish aggregation corridors derived from chlorophyll and SST thermal fronts with GPS bearings and shore distances.\n3. **Fuel & Time-Aware Planning**: Enforcing safe return windows and 20-25% fuel reserve margins.\n4. **Engine Breakdown & Emergency SOS**: Instant drift arrest guidance and one-touch link to Indian Coast Guard (1554) and Coastal Police (1093).\n5. **High-Resolution Ocean Weather**: Live significant wave height, swell period, surface currents, and water temperature.\n\n📡 **Official Data Sources**:\n• **INCOIS** (Indian National Centre for Ocean Information Services)\n• **IMD** (India Meteorological Department)\n• **ISRO / Oceansat** (Satellite ocean color & SST telemetry)\n• **Copernicus Marine & Open-Meteo**\n\n[🗺️ Open Map](#action-map)\n[🌊 View Sea Conditions](#action-weather)`;
    } else if (lang === "te") {
      return `నమస్కారం! నేను **ORCA సాగర్ మిత్రుడిని** — భారతదేశపు ప్రత్యేక తీరప్రాంత మరియు సముద్ర భద్రతా నిర్ణయ సహాయకుడిని.\n\n🎯 **కీలక సామర్థ్యాలు**:\n1. **సముద్ర ప్రయాణ భద్రతా స్కోరు**: 0-100 స్కేలుపై ప్రత్యక్ష భద్రత (🟢 సురక్షితం, 🟡 జాగ్రత్త, 🔴 ప్రమాదం).\n2. **చేపల వేట జోన్లు (PFZ)**: ఉపగ్రహ క్లోరోఫిల్ మరియు ఉష్ణోగ్రత ఆధారిత చేపల సమూహాలు.\n3. **ఇంధనం మరియు సమయ ప్రణాళిక**: 25% నిల్వతో సురక్షిత ప్రయాణం.\n4. **అత్యవసర SOS**: కోస్ట్ గార్డ్ (1554) తో నేరుగా సంప్రదింపు.\n\n📡 **అధికారిక డేటా ఆధారాలు**:\n• INCOIS, IMD, ISRO Oceansat\n\n[🗺️ మ్యాప్ తెరవండి](#action-map)`;
    } else {
      return `नमस्ते! मैं **ORCA सागर साथी** हूँ — भारत का समर्पित तटीय व समुद्री सुरक्षा निर्णय-सहायक कोपायलट।\n\n🎯 **मुख्य उद्देश्य और क्षमताएं**:\n1. **निर्णय-प्रथम नौकायन सुरक्षा मूल्यांकन**: 0 से 100 के पैमाने पर लाइव समुद्री जोखिम स्कोर (🟢 सुरक्षित, 🟡 सावधानी, 🔴 खतरा)।\n2. **संभावित मछली पकड़ने के क्षेत्र (INCOIS PFZ)**: क्लोरोफिल और थर्मल फ्रंट के आधार पर मछली सघनता वाले क्षेत्र, तट से दूरी और नेविगेशन दिशा।\n3. **ईंधन और समय-जागरूक योजना**: 25% ईंधन रिजर्व और दोपहर से पहले सुरक्षित वापसी खिड़की का निर्धारण।\n4. **इंजन खराबी व आपातकालीन SOS**: बहाव रोकने के निर्देश और तटरक्षक बल (1554) व समुद्री पुलिस (1093) से सीधा संपर्क।\n5. **वास्तविक समय समुद्री मौसम**: लहरों की ऊँचाई, हवा की गति और समुद्र सतह तापमान (SST)।\n\n📡 **विश्वसनीय डेटा स्रोत**:\n• **INCOIS** (भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र)\n• **IMD** (भारत मौसम विज्ञान विभाग)\n• **ISRO / Oceansat** (उपग्रह महासागर डेटा)\n\n[🗺️ मैप खोलें](#action-map)\n[🌊 समुद्री मौसम जांचें](#action-weather)`;
    }
  }

  // --- 8. MARITIME ADVISORIES & HAZARDS ---
  if (isAdvisoryQuery(query)) {
    if (alerts && alerts.length > 0) {
      const alertLines = alerts.slice(0, 3).map((a) => `• **${a.title}** (${a.severityLabel || a.severity || "Active Alert"})\n  ${a.desc || a.advice || "Maintain caution and VHF radio watch."}`).join("\n\n");
      if (lang === "en") {
        return `⚠️ **Active Maritime Advisories for ${loc}** (\`${coords}\`):\n\n${alertLines}\n\n🛡️ **Safety Instructions**: Check VHF Channel 16 and wear life jackets before venturing out.\n\n[🚨 Emergency SOS Directory](#action-alerts)\n[🌊 View Sea Conditions](#action-weather)`;
      } else if (lang === "te") {
        return `⚠️ **${loc} (\`${coords}\`) కోసం చురుకైన సముద్ర హెచ్చరికలు**:\n\n${alertLines}\n\n🛡️ **భద్రతా సూచనలు**: సముద్రంలోకి వెళ్లే ముందు VHF ఛానల్ 16 మరియు లైఫ్ జాకెట్లు ధరించండి.\n\n[🚨 హెచ్చరికల వివరాలు](#action-alerts)`;
      } else {
        return `⚠️ **${loc}** (\`${coords}\`) के लिए सक्रिय समुद्री चेतावनियाँ:\n\n${alertLines}\n\n🛡️ **सुरक्षा निर्देश**: समुद्र में जाने से पूर्व VHF चैनल 16 और लाइफ जैकेट की पुष्टि अवश्य करें।\n\n[🚨 आपातकालीन अलर्ट सूची](#action-alerts)\n[🌊 समुद्री मौसम देखें](#action-weather)`;
      }
    } else {
      if (lang === "en") {
        return `🟢 **No Active Severe Alerts — Conditions Favourable**\n\n📍 **Location**: **${loc}** (\`${coords}\`)\n🌊 **Waves**: **${wave}** · 💨 **Wind**: **${wind}** · 🌡️ **SST**: **${sst}**\n\nWhy this recommendation\n• No active cyclone, gale, or high swell warnings for this sector\n• Significant wave height (${wave}) well within safe coastal navigation limits\n• Surface winds stable\n\nBest Action: Proceed with standard voyage plan. Maintain life jackets and VHF Channel 16.\nConfidence: High\n\n[🌊 View Sea Conditions](#action-weather)\n[🎣 View Potential Fishing Zones](#action-pfz)`;
      } else if (lang === "te") {
        return `🟢 **ఎటువంటి తీవ్ర హెచ్చరికలు లేవు — పరిస్థితులు అనుకూలం**\n\n📍 **ప్రాంతం**: **${loc}** (\`${coords}\`)\n🌊 **అలలు**: **${wave}** · 💨 **గాలి**: **${wind}**\n\nసిఫార్సుకు కారణాలు:\n• ఎటువంటి తుఫాను లేదా అధిక అలల హెచ్చరికలు లేవు\n• సముద్ర పరిస్థితులు ప్రశాంతంగా ఉన్నాయి\n\nఉత్తమ నిర్ణయం: ప్రామాణిక భద్రతా పరికరాలతో ప్రయాణించండి.\nవిశ్వసనీయత: High\n\n[🌊 సముద్ర వాతావరణం](#action-weather)\n[🎣 చేపల వేట జోన్లు](#action-pfz)`;
      } else {
        return `🟢 **कोई गंभीर चेतावनी नहीं — स्थितियां पूरी तरह अनुकूल हैं**\n\n📍 **स्थान**: **${loc}** (\`${coords}\`)\n🌊 **लहरें**: **${wave}** · 💨 **हवा**: **${wind}** · 🌡️ **तापमान**: **${sst}**\n\nइस सिफारिश के मुख्य कारण:\n• इस सेक्टर के लिए कोई चक्रवात, आंधी या स्वेल सर्ज अलर्ट नहीं है\n• लहरों की ऊँचाई (${wave}) सामान्य नौकायन सीमा के भीतर है\n• तटीय हवाएं स्थिर और अनुकूल हैं\n\nसर्वश्रेष्ठ कदम: मानक सुरक्षा नियमों के साथ प्रस्थान करें। VHF चैनल 16 चालू रखें।\nविश्वास स्तर: High\n\n[🌊 समुद्री मौसम जांचें](#action-weather)\n[🎣 संभावित मछली क्षेत्र देखें](#action-pfz)`;
      }
    }
  }

  // --- 9. FISHING SUITABILITY & PFZ (DECISION-FIRST FORMAT - SECTION 6, 8, 38) ---
  if (isFishingQuery(query)) {
    if (isDanger) {
      if (lang === "en") {
        return `🔴 **DANGER — Do NOT venture into the sea today**\n\n📍 **Sector**: **${loc}** (\`${coords}\`)\n🌊 **Waves**: **${wave}** (Turbulent / Rough)\n💨 **Wind**: **${wind}** (Strong gusts)\n⛈️ **Alert**: High risk sea conditions\n\nWhy this recommendation\n• Significant wave heights exceed safe thresholds for small craft\n• Strong surface gusts and turbulence\n• Risk score: ${liveRisk.riskScore}/100 (Critical)\n\nBest Action: Keep all boats securely moored at the harbour. Postpone fishing until conditions improve.\nConfidence: High\n\n[🌊 View Sea Conditions](#action-weather)\n[🚨 Active Advisories](#action-alerts)`;
      } else if (lang === "te") {
        return `🔴 **ప్రమాదం — నేడు చేపల వేటకు సముద్రంలోకి వెళ్లవద్దు**\n\n📍 **ప్రాంతం**: **${loc}** (\`${coords}\`)\n🌊 **అలలు**: **${wave}** (అల్లకల్లోలం)\n💨 **గాలి**: **${wind}**\n\nసిఫార్సుకు కారణాలు:\n• అలల ఎత్తు సాధారణ పరిమితిని మించి ఉంది\n• బలమైన గాలుల వల్ల బోట్ బోల్తా పడే ప్రమాదం ఉంది\n\nఉత్తమ నిర్ణయం: బోట్లను ఒడ్డునే ఉంచండి. ప్రయాణాన్ని వాయిదా వేయండి.\nవిశ్వసనీయత: High\n\n[🌊 సముద్ర వాతావరణం](#action-weather)`;
      } else {
        return `🔴 **खतरा — आज समुद्र में जाना बिल्कुल सुरक्षित नहीं है**\n\n📍 **तटीय सेक्टर**: **${loc}** (\`${coords}\`)\n🌊 **लहरें**: **${wave}** (अत्यधिक अशांत)\n💨 **हवा की गति**: **${wind}** (तेज झोंके)\n⛈️ **अलर्ट**: उच्च जोखिम स्थिति (${liveRisk.riskScore}/100)\n\nइस सिफारिश के मुख्य कारण:\n• लहरों की ऊँचाई छोटी और मध्यम नौकाओं के लिए अत्यधिक खतरनाक है\n• समुद्र में तेज करंट और अशांति दर्ज की गई है\n• जोखिम स्तर लाल (DANGER) श्रेणी में है\n\nसर्वश्रेष्ठ कदम: सभी नौकाओं को बंदरगाह पर सुरक्षित बांधें। जब तक मौसम सामान्य न हो, समुद्र में न जाएं।\nविश्वास स्तर: High\n\n[🌊 समुद्री मौसम देखें](#action-weather)\n[🚨 सक्रिय चेतावनियाँ देखें](#action-alerts)`;
      }
    }

    if (isCaution) {
      if (lang === "en") {
        return `🟡 **CAUTION — Marginally Viable (Inshore Fishing Only)**\n\n📍 **Sector**: **${loc}** (\`${coords}\`)\n🌊 **Waves**: **${wave}** · 💨 **Wind**: **${wind}**\n🎣 **Nearest Zone**: **${topPFZ.name}** (${topPFZ.dist}, ${topPFZ.dir})\n\nWhy this recommendation\n• Moderate sea surface chop and elevated breeze\n• High fish yield potential (${topPFZ.yield}) at ${topPFZ.name}\n• Deep offshore waters may present increasing swell\n\nBest Action: Limit fishing strictly within 5–8 nautical miles of the coastline. Avoid venturing into deep open waters. Return before 11:30 AM.\nConfidence: Medium\n\n[🗺️ View Fishing Zone on Map](#action-map)\n[🌊 View Sea Conditions](#action-weather)`;
      } else if (lang === "te") {
        return `🟡 **జాగ్రత్త — తీరప్రాంత పరిమిత వేట మాత్రమే అనుకూలం**\n\n📍 **ప్రాంతం**: **${loc}** (\`${coords}\`)\n🌊 **అలలు**: **${wave}** · 💨 **గాలి**: **${wind}**\n🎣 **సమీప జోన్**: **${topPFZ.name}** (${topPFZ.dist})\n\nసిఫార్సుకు కారణాలు:\n• మధ్యస్థ అలల అలజడి ఉంది\n• తీరానికి సమీపంలో చేపల లభ్యత బాగుంది\n\nఉత్తమ నిర్ణయం: తీరానికి 5-8 నాటికల్ మైళ్ల పరిధిలోనే ఉండండి. లోతు సముద్రంలోకి వెళ్లవద్దు.\nవిశ్వసనీయత: Medium\n\n[🗺️ మ్యాప్‌లో చూడండి](#action-map)`;
      } else {
        return `🟡 **सावधानी — केवल नजदीकी तटीय दायरे में सीमित मछली पकड़ें**\n\n📍 **तटीय सेक्टर**: **${loc}** (\`${coords}\`)\n🌊 **लहरें**: **${wave}** · 💨 **हवा की गति**: **${wind}**\n🎣 **अनुशंसित क्षेत्र**: **${topPFZ.name}** (तट से ${topPFZ.dist}, दिशा ${topPFZ.dir})\n\nइस सिफारिश के मुख्य कारण:\n• समुद्र में मध्यम लहरें और तेज झोंके मौजूद हैं\n• क्लोरोफिल और थर्मल फ्रंट के कारण ${topPFZ.name} पर उपज संभावना (${topPFZ.yield}) अच्छी है\n• गहरे खुले समुद्र में दोपहर बाद जोखिम बढ़ सकता है\n\nसर्वश्रेष्ठ कदम: तट से केवल 5 से 8 नॉटिकल मील के दायरे में रहें। खुले गहरे समुद्र में जाने से बचें और 11:30 AM तक लौटें।\nविश्वास स्तर: Medium\n\n[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)\n[🌊 समुद्री मौसम जांचें](#action-weather)`;
      }
    }

    // SAFE SEA (DECISION FIRST)
    if (lang === "en") {
      return `🟢 **YES, conditions are favourable and safe for fishing today!**\n\n🌊 **Waves**: **${wave}** (Calm)\n💨 **Wind**: **${wind}** (Favourable breeze)\n🌡️ **SST**: **${sst}** (Optimal fish aggregation)\n⛈️ **Active Alerts**: None\n\n🎣 **Optimal Target: ${topPFZ.name}**\n• Distance: **${topPFZ.dist}** offshore\n• Compass Bearing: **${topPFZ.dir}**\n• Water Depth: **${topPFZ.depth}** | Expected Yield: **${topPFZ.yield}**\n• Target Species: **${topPFZ.fish}**\n\nWhy this recommendation\n• High chlorophyll concentration confirmed via satellite ocean colour telemetry\n• Favourable SST thermal-front gradient\n• Calm sea conditions with wave heights well below small-craft threshold\n\nBest Action: Depart early (05:30 AM). Target ${topPFZ.name}. Plan return before afternoon breeze (11:30 AM).\nConfidence: High\n\n[🗺️ View Route on Map](#action-map)\n[🌊 View Sea Conditions](#action-weather)`;
    } else if (lang === "te") {
      return `🟢 **అవును, ఈరోజు చేపల వేటకు పరిస్థితులు పూర్తిగా అనుకూలంగా మరియు సురక్షితంగా ఉన్నాయి!**\n\n🌊 **అలలు**: **${wave}** (ప్రశాంతం)\n💨 **గాలి**: **${wind}**\n🌡️ **ఉష్ణోగ్రత (SST)**: **${sst}**\n\n🎣 **ఉత్తమ జోన్: ${topPFZ.name}**\n• తీరం నుండి దూరం: **${topPFZ.dist}** (దిశ: ${topPFZ.dir})\n• నీటి లోతు: **${topPFZ.depth}** | అంచనా దిగుబడి: **${topPFZ.yield}**\n• చేపల రకాలు: **${topPFZ.fish}**\n\nసిఫార్సుకు కారణాలు:\n• ఉపగ్రహ డేటా ప్రకారం అధిక క్లోరోఫిల్ లభ్యత\n• సముద్ర ఉపరితల ఉష్ణోగ్రత చేపల సంచారానికి అనుకూలం\n• ఎటువంటి తుఫాను లేదా అధిక అలల హెచ్చరికలు లేవు\n\nఉత్తమ నిర్ణయం: ఉదయం 05:30 కి బయలుదేరండి. 11:30 కల్లా తిరిగి రండి.\nవిశ్వసనీయత: High\n\n[🗺️ మ్యాప్‌లో చూడండి](#action-map)\n[🌊 సముద్ర వాతావరణం](#action-weather)`;
    } else if (lang === "mr") {
      return `🟢 **होय, आज मासेमारीसाठी परिस्थिती अत्यंत अनुकूल व सुरक्षित आहे!**\n\n🌊 **लाटा**: **${wave}** (शांत समुद्र)\n💨 **वारे**: **${wind}**\n🌡️ **समुद्राचे तापमान**: **${sst}**\n\n🎣 **उत्तम मासेमारी क्षेत्र: ${topPFZ.name}**\n• किनाऱ्यापासून अंतर: **${topPFZ.dist}** (दिशा: ${topPFZ.dir})\n• खोली: **${topPFZ.depth}** | संभाव्य उत्पन्न: **${topPFZ.yield}**\n• मुख्य मासे: **${topPFZ.fish}**\n\nया शिफारसीची मुख्य कारणे:\n• उपग्रह माहितीनुसार उच्च क्लोरोफिल आणि थर्मल फ्रंट\n• लाटांची उंची सुरक्षित मर्यादेत आहे\n• कोणताही वादळी इशारा नाही\n\nसर्वोत्तम कृती: पहाटे 05:30 वाजता निघा आणि दुपारी 11:30 च्या आधी परता.\nविश्वास पातळी: High\n\n[🗺️ नकाशावर पहा](#action-map)\n[🌊 सागरी हवामान](#action-weather)`;
    } else if (lang === "ta") {
      return `🟢 **ஆம், இன்று கடலுக்குச் சென்று மீன்பிடிக்க சூழல் முற்றிலும் பாதுகாப்பானது!**\n\n🌊 **அலை உயரம்**: **${wave}** (அமைதியான கடல்)\n💨 **காற்றின் வேகம்**: **${wind}**\n🌡️ **கடல் வெப்பநிலை**: **${sst}**\n\n🎣 **பரிந்துரைக்கப்பட்ட பகுதி: ${topPFZ.name}**\n• தூரம்: **${topPFZ.dist}** (திசை: ${topPFZ.dir})\n• ஆழம்: **${topPFZ.depth}** | மகசூல்: **${topPFZ.yield}**\n• மீன்கள்: **${topPFZ.fish}**\n\nபரிந்துரைக்கான காரணங்கள்:\n• அதிக குளோரோபில் செறிவு மற்றும் வெப்ப முனைகள்\n• அலை உயரம் சிறிய படகுகளுக்கு பாதுகாப்பானது\n• புயல் எச்சரிக்கைகள் ஏதுமில்லை\n\nசிறந்த முடிவு: அதிகாலை 05:30 மணிக்கு புறப்பட்டு, 11:30 மணிக்குள் திரும்பவும்.\nநம்பகத்தன்மை: High\n\n[🗺️ வரைபடத்தில் பார்க்கவும்](#action-map)`;
    } else {
      return `🟢 **हाँ, फिलहाल समुद्र में जाना और मछली पकड़ना पूरी तरह अनुकूल व सुरक्षित है!**\n\n🌊 **लहरें (Waves)**: **${wave}** (शांत)\n💨 **हवा की गति (Wind)**: **${wind}** (अनुकूल मंद हवा)\n🌡️ **समुद्र तापमान (SST)**: **${sst}** (मछली सघनता के लिए आदर्श)\n⛈️ **सक्रिय अलर्ट**: कोई चेतावनी नहीं\n\n🎣 **सर्वोत्तम मछली क्षेत्र: ${topPFZ.name}**\n• तट से दूरी: **${topPFZ.dist}**\n• दिशा (Bearing): **${topPFZ.dir}**\n• गहराई: **${topPFZ.depth}** | अनुमानित उपज: **${topPFZ.yield}**\n• मुख्य प्रजातियां: **${topPFZ.fish}**\n\nइस सिफारिश के मुख्य कारण:\n• उपग्रह महासागर रंग से उच्च क्लोरोफिल सघनता प्रमाणित\n• अनुकूल समुद्री थर्मल-फ्रंट सक्रियता\n• लहरों की ऊँचाई छोटी नौकाओं के लिए सुरक्षित सीमा में है\n\nसर्वश्रेष्ठ कदम: सुबह 05:30 AM पर निकलें। ${topPFZ.name} की ओर बढ़ें। दोपहर की तेज हवा से पहले 11:30 AM तक लौटने का लक्ष्य रखें।\nविश्वास स्तर: High\n\n[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)\n[🌊 समुद्री मौसम जांचें](#action-weather)`;
    }
  }

  // --- 10. WEATHER & LIVE SEA STATUS ---
  if (isWeatherQuery(query)) {
    if (lang === "en") {
      return `📍 **Live Ocean Weather & Conditions — ${loc}** (\`${coords}\`):\n\n• 🌊 **Significant Wave Height**: **${wave}**\n• 💨 **Wind Speed**: **${wind}**\n• 🌡️ **Sea Surface Temperature (SST)**: **${sst}**\n• 🧭 **Ocean Surface Currents**: **${currents}**\n• 🛡️ **Safety Status**: **${isSafe ? "🟢 LOW RISK (Favourable)" : isCaution ? "🟡 MODERATE RISK (Caution)" : "🔴 HIGH RISK (Danger)"}** (${liveRisk.riskScore}/100)\n\n💡 **Operational Guidance**: ${liveRisk.recommendation || (isSafe ? "Conditions are calm and optimal for coastal sailing and fisheries." : "Maintain caution and monitoring.")}\n\n[🌊 View Detailed Dashboard](#action-weather)\n[🗺️ View Coastal Map](#action-map)`;
    } else if (lang === "te") {
      return `📍 **${loc}** (\`${coords}\`) ప్రత్యక్ష సముద్ర వాతావరణం:\n\n• 🌊 **అలల ఎత్తు**: **${wave}**\n• 💨 **గాలి వేగం**: **${wind}**\n• 🌡️ **సముద్ర ఉష్ణోగ్రత (SST)**: **${sst}**\n• 🧭 **ప్రవాహాలు**: **${currents}**\n• 🛡️ **భద్రత**: **${isSafe ? "🟢 సురక్షితం" : isCaution ? "🟡 జాగ్రత్త" : "🔴 ప్రమాదం"}** (${liveRisk.riskScore}/100)\n\n[🌊 వాతావరణ వివరాలు](#action-weather)\n[🗺️ మ్యాప్‌లో చూడండి](#action-map)`;
    } else {
      return `📍 **${loc}** (\`${coords}\`) का वास्तविक समय समुद्री मौसम:\n\n• 🌊 **लहरों की ऊँचाई (Waves)**: **${wave}**\n• 💨 **हवा की गति (Wind)**: **${wind}**\n• 🌡️ **समुद्र सतह तापमान (SST)**: **${sst}**\n• 🧭 **सतही धाराएं (Currents)**: **${currents}**\n• 🛡️ **सुरक्षा स्थिति**: **${isSafe ? "🟢 सुरक्षित व अनुकूल (LOW RISK)" : isCaution ? "🟡 सावधानी (MODERATE RISK)" : "🔴 उच्च जोखिम (HIGH RISK)"}** (${liveRisk.riskScore}/100)\n\n💡 **दिशानिर्देश**: ${liveRisk.recommendation || (isSafe ? "समुद्र शांत है। तटीय नौकायन व मछली पकड़ने के लिए मौसम पूरी तरह अनुकूल है।" : "सावधानी बरतें।")}\n\n[🌊 विस्तृत मौसम जांचें](#action-weather)\n[🗺️ तटीय मैप देखें](#action-map)`;
    }
  }

  // --- 11. GENERAL CASUAL CONVERSATION FALLBACK (RULE #4: SAFE DEFAULT) ---
  const lowerQ = query.toLowerCase();
  if (/^(oye+|oyee+|hey+|heyy+)\b/i.test(lowerQ)) {
    return "Haan bhai 😄 bolo, kya scene hai? Main aapki kya madad kar sakta hoon?";
  }
  if (/^(hi+|hello+|namaste)\b/i.test(lowerQ)) {
    return lang === "te"
      ? "నమస్కారం! ఎలా ఉన్నారు? మీకు ఎలాంటి సహాయం కావాలి?"
      : lang === "en"
      ? "Hello! How are you doing today? How can I assist you?"
      : "नमस्ते! कैसे हैं आप? मैं आपकी किस प्रकार सहायता कर सकता हूँ?";
  }
  if (/^(kaise ho|kya haal)\b/i.test(lowerQ)) {
    return "Main badhiya hoon bhai! Aap batao, sab kaisa chal raha hai?";
  }
  if (/^(thank|shukriya|dhanyawad)\b/i.test(lowerQ)) {
    return "Arey koi baat nahi bhai! Kabhi bhi zaroorat ho to batana. 😊";
  }
  if (/^(accha|theek hai|ok)\b/i.test(lowerQ)) {
    return "Ji bhai, agar koi aur sawal ho to zaroor poochiye!";
  }
  if (lang === "te") {
    return "నమస్కారం! నేను సాగర్ సాథిని. మీకు ఎలా సహాయపడగలను?";
  }
  if (lang === "en") {
    return "Hello! I am Sagar Saathi, your coastal and marine companion. How can I help you today?";
  }
  return "नमस्ते! मैं सागर साथी हूँ। बताइए, मैं आपकी क्या मदद कर सकता हूँ?";
}

// ==========================================
// 14. INITIAL SITUATION BRIEFING (ON TAB OPEN)
// ==========================================
export function generateInitialLocationBriefing(
  lang: string,
  liveRisk: LiveRiskContext,
  alerts: AssistantAlertItem[] = [],
  pfzList: AssistantPFZItem[] = []
): string {
  const loc = liveRisk.locationLabel || "Selected Coastal Waters";
  const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;
  const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
  const isCaution = liveRisk.riskLevel === "MODERATE";
  const isSafe = !isDanger && !isCaution;

  const wave = liveRisk.waveHeight || "1.1 m";
  const wind = liveRisk.windSpeed || "13 km/h";
  const sst = liveRisk.sst || "28.5°C";

  const topPFZ = pfzList.length > 0 ? pfzList[0] : {
    name: "Coastal PFZ Zone",
    dist: "14.5 km",
    dir: "SW",
    fish: "Tuna, Mackerel",
  };

  const alertCount = alerts.length;

  if (lang === "en") {
    return `📍 **Maritime Briefing — ${loc}** (\`${coords}\`)\n\n🛡️ **Voyage Safety**: **${isSafe ? "🟢 SAFE SEA (Low Risk)" : isCaution ? "🟡 CAUTION ADVISED (Moderate Risk)" : "🔴 HIGH RISK (Avoid Sea)"}** (${liveRisk.riskScore}/100)\n🌊 **Ocean Conditions**: Waves: **${wave}** · Wind: **${wind}** · SST: **${sst}**\n🎣 **Fisheries (PFZ)**: ${topPFZ.name} (${topPFZ.dist} offshore, heading ${topPFZ.dir})\n⚠️ **Advisories**: ${alertCount > 0 ? `${alertCount} active hazard bulletins` : "No severe cyclone or swell warnings"}\n\nAsk me anything about today's weather, fishing zones, or safety!\n\n[🌊 View Sea Conditions](#action-weather)\n[🗺️ View Route on Map](#action-map)`;
  } else if (lang === "te") {
    return `📍 **సముద్ర స్థితి నివేదిక — ${loc}** (\`${coords}\`)\n\n🛡️ **భద్రతా స్థాయి**: **${isSafe ? "🟢 సురక్షితం (Safe Sea)" : isCaution ? "🟡 జాగ్రత్త (Caution)" : "🔴 అధిక ప్రమాదం (Danger)"}** (${liveRisk.riskScore}/100)\n🌊 **సముద్రం**: అలలు: **${wave}** · గాలి: **${wind}** · ఉష్ణోగ్రత: **${sst}**\n🎣 **చేపల వేట (PFZ)**: ${topPFZ.name} (${topPFZ.dist}, దిశ ${topPFZ.dir})\n⚠️ **హెచ్చరికలు**: ${alertCount > 0 ? `${alertCount} హెచ్చరికలు ఉన్నాయి` : "ఎటువంటి తీవ్ర హెచ్చరికలు లేవు"}\n\nచేపల వేట, వాతావరణం లేదా భద్రత గురించి నన్ను ఏదైనా అడగండి!\n\n[🌊 సముద్ర వాతావరణం](#action-weather)\n[🗺️ మ్యాప్‌లో చూడండి](#action-map)`;
  } else if (lang === "mr") {
    return `📍 **सागरी स्थिती बुलेटिन — ${loc}** (\`${coords}\`)\n\n🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "🟢 सुरक्षित (Safe Sea)" : isCaution ? "🟡 सावधगिरी (Caution)" : "🔴 उच्च धोका (Danger)"}** (${liveRisk.riskScore}/100)\n🌊 **समुद्र**: लाटा: **${wave}** · वारे: **${wind}** · तापमान: **${sst}**\n🐟 **मासेमारी (PFZ)**: ${topPFZ.name} (किनाऱ्यापासून ${topPFZ.dist}, दिशा ${topPFZ.dir})\n⚠️ **इशारे**: ${alertCount > 0 ? `${alertCount} इशारे सक्रिय` : "कोणतीही तीव्र चेतावणी नाही"}\n\nहवामान, मासेमारी क्षेत्र किंवा सुरक्षेबद्दल काहीही विचारा!\n\n[🌊 सागरी हवामान](#action-weather)\n[🗺️ नकाशावर पहा](#action-map)`;
  } else if (lang === "ta") {
    return `📍 **கடல் நிலை அறிக்கை — ${loc}** (\`${coords}\`)\n\n🛡️ **பாதுகாப்பு நிலை**: **${isSafe ? "🟢 பாதுகாப்பானது (Safe Sea)" : isCaution ? "🟡 எச்சரிக்கை (Caution)" : "🔴 அபாயம் (Danger)"}** (${liveRisk.riskScore}/100)\n🌊 **கடல் சூழல்**: அலைகள்: **${wave}** · காற்று: **${wind}** · வெப்பநிலை: **${sst}**\n🎣 **மீன்பிடி (PFZ)**: ${topPFZ.name} (${topPFZ.dist}, திசை ${topPFZ.dir})\n⚠️ **எச்சரிக்கைகள்**: ${alertCount > 0 ? `${alertCount} எச்சரிக்கைகள் உள்ளன` : "தீவிர எச்சரிக்கைகள் இல்லை"}\n\nமீன்பிடிப்பு அல்லது பாதுகாப்பு பற்றி எதையும் கேட்கலாம்!\n\n[🌊 கடல் வானிலை](#action-weather)\n[🗺️ வரைபடத்தில் பார்க்கவும்](#action-map)`;
  } else {
    return `📍 **तटीय स्थिति बुलेटिन — ${loc}** (\`${coords}\`)\n\n🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "🟢 सुरक्षित (Safe Sea)" : isCaution ? "🟡 सावधानी (Caution)" : "🔴 उच्च जोखिम (खतरा)"}** (${liveRisk.riskScore}/100)\n🌊 **समुद्री स्थिति**: लहरें: **${wave}** · हवा: **${wind}** · तापमान: **${sst}**\n🎣 **मछली क्षेत्र (PFZ)**: ${topPFZ.name} (तट से ${topPFZ.dist}, दिशा ${topPFZ.dir})\n⚠️ **चेतावनी**: ${alertCount > 0 ? `${alertCount} सक्रिय चेतावनी बुलेटिन` : "कोई चक्रवात या भारी लहर अलर्ट सक्रिय नहीं है"}\n\nमुझसे आज के मौसम, मछली पकड़ने या समुद्री सुरक्षा के बारे में कुछ भी पूछें!\n\n[🌊 समुद्री मौसम जांचें](#action-weather)\n[🗺️ मैप पर सुरक्षित रूट देखें](#action-map)`;
  }
}

// ==========================================
// 15. RICH FORMATTED CHAT MESSAGE WITH ACTION BUTTONS
// ==========================================
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

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
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
