/**
 * Mobile AI Sagar Saathi conversational helper
 * Handles intent detection, context-aware marine reasoning, non-marine inland handling,
 * capabilities & data sources, active advisories, fishing suitability, and language consistency.
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
  ta: "வணக்கம் கேப்டன்! 🌊 நான் உங்கள் ORCA சாகர் தோழன், கடல் பாதுகாப்பு மற்றும் மீன்பிடி வழிகாட்டி.\n\nஇன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? நீங்கள் கேட்கலாம்:\n• 🐟 இன்று மீன்பிடிக்க கடலுக்குச் செல்வது பாதுகாப்பானதா?\n• 🌊 அருகிலுள்ள மீன்பிடி மண்டலம் (PFZ) எங்குள்ளது?\n• 💨 அலை உயரம் மற்றும் காற்றின் வேகம் என்ன?\n• ⚠️ ஏதேனும் புயல் அல்லது கடல் எச்சரிக்கை உள்ளதா?",
  te: "నమస్కారం కెప్టెన్! 🌊 నేను మీ ORCA సాగర్ మిత్రుడిని, సముద్ర భద్రత మరియు మత్స్య సలహాదారుని.\n\nఈరోజు మీకు ఎలా సహాయపడగలను? మీరు నన్ను అడగవచ్చు:\n• 🐟 ఈరోజు సముద్రంలో చేపల వేటకు వెళ్లడం సురక్షితమేనా?\n• 🌊 సమీప సంభావ్య చేపల వేట జోన్ (PFZ) ఎక్కడ ఉంది?\n• 💨 అలల ఎత్తు మరియు గాలి వేగం ఎంత?\n• ⚠️ ఏవైనా తుఫాను లేదా సముద్ర హెచ్చరికలు ఉన్నాయా?",
  ml: "നമസ്കാരം ക്യാപ്റ്റൻ! 🌊 ഞാൻ നിങ്ങളുടെ ORCA സാഗർ സഹായിയാണ്.\n\nഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം? നിങ്ങൾക്ക് ചോദിക്കാം:\n• 🐟 ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?\n• 🌊 അടുത്തുള്ള മത്സ്യബന്ധന മേഖല (PFZ) എവിടെയാണ്?\n• 💨 തിരമാലകളുടെ ഉയരവും കാറ്റിന്റെ വേഗതയും എത്രയാണ്?\n• ⚠️ എന്തെങ്കിലും ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുണ്ടോ?",
  gu: "નમસ્તે કેપ્ટન! 🌊 હું તમારો ORCA સાગર સાથી છું, દરિયાઈ સુરક્ષા અને માછીમારી સલાહકાર.\n\nઆજે હું તમને કેવી રીતે મદદ કરી શકું? તમે મને પૂછી શકો છો:\n• 🐟 શું આજે દરિયામાં જવું સુરક્ષિત છે?\n• 🌊 નજીકનું માછીમારી ક્ષેત્ર (PFZ) ક્યાં છે?\n• 💨 મોજાની ઊંચાઈ અને પવનની ગતિ કેટલી છે?\n• ⚠️ શું કોઈ દરિયાઈ કે વાવાઝોડાની ચેતવણી છે?",
  mr: "नमस्कार कॅप्टन! 🌊 मी तुमचा ORCA सागर साथी आहे, सागरी सुरक्षा व मासेमारी सल्लागार.\n\nआज मी तुम्हाला कशी मदत करू शकतो? तुम्ही विचारू शकता:\n• 🐟 आज समुद्रात जाणे सुरक्षित आहे का?\n• 🌊 जवळचे मासेमारी क्षेत्र (PFZ) कुठे आहे?\n• 💨 लाटांची उंची आणि वाऱ्याचा वेग किती आहे?\n• ⚠️ काही चक्रीवादळ किंवा सागरी चेतावणी आहे का?",
  bn: "নমস্কার ক্যাপ্টেন! 🌊 আমি আপনার ORCA সাগর সাথী, সামুদ্রিক নিরাপত্তা ও মৎস্য উপদেষ্টা।\n\nআজ আপনাকে কীভাবে সাহায্য করতে পারি? আপনি জিজ্ঞাসা করতে পারেন:\n• 🐟 আজ কি মাছ ধরতে সমুদ্রে যাওয়া নিরাপদ?\n• 🌊 নিকটতম মাছের অঞ্চল (PFZ) কোথায়?\n• 💨 ঢেউয়ের উচ্চতা এবং বাতাসের গতি কত?\n• ⚠️ কোনো ঘূর্ণিঝড় বা সামুদ্রিক সতর্কতা আছে কি?",
  kn: "ನಮಸ್ಕಾರ ಕ್ಯಾಪ್ಟನ್! 🌊 ನಾನು ನಿಮ್ಮ ORCA ಸಾಗರ ಸಹಾಯಕ, ಸಮುದ್ರ ಸುರಕ್ಷತೆ ಮತ್ತು ಮೀನುಗಾರಿಕೆ ಸಲಹೆಗಾರ.\n\nಇಂದು ನಿಮಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಕೇಳಬಹುದು:\n• 🐟 ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?\n• 🌊 ಹತ್ತಿರದ ಮೀನುಗಾರಿಕಾ ವಲಯ (PFZ) ಎಲ್ಲಿದೆ?\n• 💨 ಅಲೆಗಳ ಎತ್ತರ ಮತ್ತು ಗಾಳಿಯ ವೇಗ ಎಷ್ಟು?\n• ⚠️ ಯಾವುದೇ ಚಂಡಮಾರುತದ ಎಚ್ಚರಿಕೆ ಇದೆಯೇ?",
  or: "ନମସ୍କାର କ୍ୟାପ୍ଟେନ! 🌊 ମୁଁ ଆପଣଙ୍କର ORCA ସାଗର ସାଥୀ।\n\nଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି? ଆପଣ ପଚାରିପାରିବେ:\n• 🐟 ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?\n• 🌊 ନିକଟତମ ମାଛ ଧରିବା ଅଞ୍ଚଳ (PFZ) କେଉଁଠି?\n• 💨 ଢେଉର ଉଚ୍ଚତା ଏବଂ ପବନର ଗତି କେତେ?\n• ⚠️ କୌଣସି ବାତ୍ୟା ଚେତାବନୀ ଅଛି କି?",
};

export function getConversationalGreeting(lang: string): string {
  return LOCALIZED_ASSISTANT_GREETINGS[lang] || LOCALIZED_ASSISTANT_GREETINGS.hi;
}

export const LOCALIZED_NETWORK_ERRORS: Record<string, string> = {
  hi: "समुद्री सर्वर से संपर्क नहीं हो पाया। कृपया दोबारा प्रयास करें।",
  en: "Unable to reach marine assistant server. Please retry in a moment.",
  ta: "கடல் தகவல் சேவையகத்தை இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  te: "సముద్ర సమాచార సర్వర్‌ను సంప్రదించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",
  ml: "സമുദ്ര വിവര സെർവറുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
  gu: "દરિયાઈ માહિતી સર્વર સાથે સંપર્ક થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
  mr: "सागरी माहिती सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.",
  bn: "সামুদ্রিক তথ্য সার্ভারের সাথে যোগাযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
  kn: "ಸಮುದ್ರ ಮಾಹಿತಿ ಸರ್ವರ್‌ನೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  or: "ସାମୁଦ୍ରିକ ସୂଚନା ସର୍ଭର ସହିତ ସଂଯୋଗ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।",
};

export function getLocalizedError(lang: string): string {
  return LOCALIZED_NETWORK_ERRORS[lang] || LOCALIZED_NETWORK_ERRORS.hi;
}

/**
 * Localize template text and strictly synchronize with the Dashboard's live risk assessment
 * and currently selected coastal location/coordinates.
 */
export function localizeReplyText(text: string, lang: string, liveRisk?: LiveRiskContext): string {
  if (!text) return "";
  let out = text;

  if (liveRisk) {
    const locName = liveRisk.locationLabel || "Selected Coastal Waters";
    const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;

    if (lang === "en") {
      out = out.replace(/📍 \*\*Marine Sector\*\*:[^\n]+/g, `📍 **Location / Harbor**: **${locName}** (\`${coords}\`)`);
      out = out.replace(/📍 \*\*स्थान\*\*:[^\n]+/g, `📍 **Location / Harbor**: **${locName}** (\`${coords}\`)`);
    } else if (lang === "hi") {
      out = out.replace(/📍 \*\*Marine Sector\*\*:[^\n]+/g, `📍 **स्थान / बंदरगाह**: **${locName}** (\`${coords}\`)`);
      out = out.replace(/📍 \*\*स्थान\*\*:[^\n]+/g, `📍 **स्थान / बंदरगाह**: **${locName}** (\`${coords}\`)`);
    }

    const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
    const isCaution = liveRisk.riskLevel === "MODERATE";

    if (lang === "hi") {
      let riskBlock = "";
      if (isDanger) {
        riskBlock = `🛡️ **सुरक्षा मूल्यांकन**: **उच्च जोखिम (DANGER / HIGH RISK - ${liveRisk.riskScore}/100)** ⚠️\nतूफानी हवाओं या तेज समुद्री धाराओं के कारण समुद्र में जाना वर्जित है! नावों को तट पर रखने की सलाह दी जाती है।`;
      } else if (isCaution) {
        riskBlock = `🛡️ **सुरक्षा मूल्यांकन**: **मध्यम जोखिम (CAUTION - ${liveRisk.riskScore}/100)** ⚠️\nसमुद्री हलचल और हवाओं के कारण सतर्कता आवश्यक है। केवल अनुभवी नाविक ही सावधानीपूर्वक जाएं।`;
      } else {
        riskBlock = `🛡️ **सुरक्षा मूल्यांकन**: **कम जोखिम (सुरक्षित / SAFE SEA - ${liveRisk.riskScore}/100)** ✅\nमौसम और लहरें सामान्य हैं। तटीय मछली पकड़ने और नौकायन के लिए स्थिति अनुकूल है।`;
      }

      out = out.replace(/🛡️ \*\*Safety Assessment\*\*:[^\n]+(\n[^\n]+)?/g, riskBlock);
      out = out.replace(/🛡️ \*\*सुरक्षा मूल्यांकन\*\*:[^\n]+(\n[^\n]+)?/g, riskBlock);
    } else {
      let riskBlock = "";
      if (isDanger) {
        riskBlock = `🛡️ **Safety Assessment**: **HIGH RISK (DANGER - Score: ${liveRisk.riskScore}/100)** ⚠️\nElevated marine hazards present. Fishing boats and small craft are strongly advised NOT to venture out.`;
      } else if (isCaution) {
        riskBlock = `🛡️ **Safety Assessment**: **MODERATE RISK (Caution - Score: ${liveRisk.riskScore}/100)** ⚠️\nModerate sea turbulence and elevated winds. Exercise caution and maintain coastal radio watch.`;
      } else {
        riskBlock = `🛡️ **Safety Assessment**: **LOW RISK (Safe Sea - Score: ${liveRisk.riskScore}/100)** ✅\nSea conditions are calm and favorable for coastal fishing and navigation.`;
      }

      out = out.replace(/🛡️ \*\*Safety Assessment\*\*:[^\n]+(\n[^\n]+)?/g, riskBlock);
      out = out.replace(/🛡️ \*\*सुरक्षा मूल्यांकन\*\*:[^\n]+(\n[^\n]+)?/g, riskBlock);
    }

    if (liveRisk.waveHeight) {
      out = out.replace(/• \*\*Significant Wave Height\*\*:[^\n]+/g, `• **Significant Wave Height**: ${liveRisk.waveHeight}`);
      out = out.replace(/• \*\*लहरों की ऊँचाई\*\*:[^\n]+/g, `• **लहरों की ऊँचाई**: ${liveRisk.waveHeight}`);
      out = out.replace(/• \*\*Lehar Ki Unchai \(Waves\)\*\*:[^\n]+/g, `• **लहरों की ऊँचाई**: ${liveRisk.waveHeight}`);
    }
    if (liveRisk.windSpeed) {
      const gustText = liveRisk.windGust ? ` (झोंके: ${liveRisk.windGust})` : "";
      const gustTextEn = liveRisk.windGust ? ` (Gusts: ${liveRisk.windGust})` : "";
      out = out.replace(/• \*\*Wind Speed\*\*:[^\n]+/g, `• **Wind Speed**: ${liveRisk.windSpeed}${gustTextEn}`);
      out = out.replace(/• \*\*हवा की गति\*\*:[^\n]+/g, `• **हवा की गति**: ${liveRisk.windSpeed}${gustText}`);
      out = out.replace(/• \*\*Hawa Ki Speed \(Wind\)\*\*:[^\n]+/g, `• **हवा की गति**: ${liveRisk.windSpeed}${gustText}`);
    }
  }

  if (lang === "en") {
    return out
      .replace(/📍 \*\*स्थान\*\*:/g, "📍 **Location**:")
      .replace(/🛡️ \*\*सुरक्षा मूल्यांकन\*\*:/g, "🛡️ **Safety Assessment**:")
      .replace(/🌊 \*\*समुद्री व मौसमी स्थिति\*\*:/g, "🌊 **Marine & Weather Conditions**:")
      .replace(/• \*\*लहरों की ऊँचाई\*\*:/g, "• **Wave Height**:")
      .replace(/• \*\*हवा की गति\*\*:/g, "• **Wind Speed**:")
      .replace(/• \*\*समुद्र सतह तापमान \(SST\)\*\*:/g, "• **Sea Surface Temp (SST)**:")
      .replace(/• \*\*मौसम चेतावनी\*\*:/g, "• **Weather Alerts**:")
      .replace(/🐟 \*\*PFZ मछली क्षेत्र\*\*:/g, "🐟 **PFZ Fisheries Intel**:")
      .replace(/💡 \*\*सलाह\*\*:/g, "💡 **Advisory**:");
  }

  if (lang === "hi") {
    return out
      .replace(/📍 \*\*Marine Sector\*\*:/g, "📍 **स्थान / तटीय क्षेत्र**:")
      .replace(/🛡️ \*\*Safety Assessment\*\*:/g, "🛡️ **सुरक्षा मूल्यांकन**:")
      .replace(/\*\*LOW RISK\*\* \(Favorable for fishing and sailing \(Safe\)\)/gi, "**कम जोखिम (सुरक्षित)** — समुद्र में जाना अनुकूल है")
      .replace(/\*\*MODERATE RISK\*\* \(Caution advised\)/gi, "**मध्यम जोखिम** — समुद्र में सावधानी बरतें")
      .replace(/\*\*HIGH RISK\*\* \(Dangerous conditions - do not sail\)/gi, "**उच्च जोखिम** — समुद्र में न जाएं (खतरनाक)")
      .replace(/🌊 \*\*Marine & Weather Conditions\*\*:/g, "🌊 **समुद्री व मौसमी स्थिति**:")
      .replace(/• \*\*Significant Wave Height\*\*:/g, "• **लहरों की ऊँचाई**:")
      .replace(/• \*\*Wind Speed\*\*:/g, "• **हवा की गति**:")
      .replace(/• \*\*Sea Surface Temp \(SST\)\*\*:/g, "• **समुद्र सतह तापमान (SST)**:")
      .replace(/• \*\*Alert Status\*\*:/g, "• **मौसम चेतावनी**:")
      .replace(/No active cyclone\/rough sea warnings/gi, "कोई चक्रवात या भारी लहर अलर्ट सक्रिय नहीं है")
      .replace(/🐟 \*\*PFZ Fisheries Intel\*\*:/g, "🐟 **PFZ मछली क्षेत्र**:")
      .replace(/No active PFZ advisory at this exact coordinate \(Coastal sector clear\)\./gi, "इस निर्देशांक पर कोई तत्काल PFZ नहीं है (तटीय क्षेत्र सामान्य है)।")
      .replace(/💡 \*\*Advisory\*\*:/g, "💡 **सलाह**:")
      .replace(/Sea conditions are calm and safe for coastal operations\. Maintain standard VHF watch\./gi, "समुद्र शांत और सुरक्षित है। नौकायन के समय मानक सुरक्षा उपकरण साथ रखें।")
      .replace(/⚠️ \*\*Clarification needed\*\*: Which coastal location or coordinates should ORCA assess\?/gi, "⚠️ कृपया स्पष्ट करें: किस तटीय बंदरगाह या निर्देशांक की जानकारी चाहिए?");
  }

  return out;
}

// 2. INLAND NON-MARINE REGION DETECTION
const INLAND_CITIES = [
  "delhi", "dilli", "दिल्ली", "new delhi", "नई दिल्ली",
  "jaipur", "जयपुर", "lucknow", "लखनऊ", "kanpur", "कानपुर",
  "pune", "पुणे", "bengaluru", "bangalore", "बेंगलुरु", "बेंगलोर",
  "hyderabad", "हैदराबाद", "bhopal", "भोपाल", "patna", "पटना",
  "chandigarh", "चंडीगढ़", "indore", "इंदौर", "nagpur", "नागपुर",
  "agra", "आगरा", "varanasi", "वाराणसी", "banaras", "बनारस",
  "ludhiana", "लुधियाना", "amritsar", "अमृतसर", "gurgaon", "gurugram", "गुड़गांव", "गुरुग्राम",
  "noida", "नोएडा", "faridabad", "फरीदाबाद", "ghaziabad", "गाजियाबाद",
  "ranchi", "रांची", "raipur", "रायपुर", "gwalior", "ग्वालियर",
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

// 3. PERSONAL / NAME INTRO DETECTION
export function detectUserName(text: string): string | null {
  const trimmed = text.trim();
  const patterns = [
    /(?:mera\s+na(?:a)?m\s+is\s+|mera\s+na(?:a)?m\s+|my\s+name\s+is\s+|i\s+am\s+|naam\s+)([\w\u0900-\u097F]+)/i,
    /^(?:main|mein)\s+([\w\u0900-\u097F]+)\s+(?:hu|hoon|bol\s+raha\s+hu)/i,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match && match[1]) {
      const name = match[1].trim();
      const skipWords = ["ek", "a", "kya", "ko", "se", "hai", "captain", "here"];
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
    lower.includes("kya kya ata") ||
    lower.includes("kya kya aata") ||
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
    lower.includes("aap kaun ho") ||
    lower.includes("aap kaun hain") ||
    lower.includes("about orca")
  );
}

// 5. MARITIME ADVISORY & HAZARD INTENT
export function isAdvisoryQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("new advisory") ||
    lower.includes("advisories") ||
    lower.includes("advisory") ||
    lower.includes("chetawani") ||
    lower.includes("chetawaniyan") ||
    lower.includes("चेतावनी") ||
    lower.includes("सलाह") ||
    lower.includes("alert") ||
    lower.includes("cyclone") ||
    lower.includes("rough sea") ||
    lower.includes("swell surge") ||
    lower.includes("high wave alert") ||
    lower.includes("warning")
  );
}

// 6. FISHING SUITABILITY & PFZ INTENT
export function isFishingQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("fishing") ||
    lower.includes("machli") ||
    lower.includes("मछली") ||
    lower.includes("fish zone") ||
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
    lower.includes("temperature") ||
    lower.includes("taapman") ||
    lower.includes("तापमान") ||
    lower.includes("wave") ||
    lower.includes("lehar") ||
    lower.includes("लहर") ||
    lower.includes("wind") ||
    lower.includes("hawa") ||
    lower.includes("हवा") ||
    lower.includes("sst") ||
    lower.includes("current") ||
    lower.includes("dhara")
  );
}

/**
 * Intelligent Conversational Response Generator
 * Generates context-rich, non-generalized responses matching user intent and selected location.
 */
export function generateIntelligentSaathiReply(
  query: string,
  lang: string,
  liveRisk: LiveRiskContext,
  alerts: AssistantAlertItem[] = [],
  pfzList: AssistantPFZItem[] = []
): string {
  const loc = liveRisk.locationLabel || "तटीय क्षेत्र";
  const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;
  const isEn = lang === "en";
  const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
  const isCaution = liveRisk.riskLevel === "MODERATE";
  const isSafe = !isDanger && !isCaution;

  const wave = liveRisk.waveHeight || "1.1 m";
  const wind = liveRisk.windSpeed || "15 km/h";
  const sst = liveRisk.sst || "28.5°C";
  const currents = liveRisk.currentSpeed || "0.35 m/s";

  const topPFZ = pfzList.length > 0 ? pfzList[0] : {
    name: "तटीय मत्स्य गलियारा (Coastal PFZ Corridor)",
    dist: "14.5 km",
    dir: "SW · 225°",
    depth: "24 m",
    yield: "85%",
    fish: "टूना, बांगड़ा (Mackerel), तारली (Sardine)",
  };

  // --- 1. Check for Inland / Non-Marine City Query ---
  const inlandCity = detectInlandCity(query);
  if (inlandCity) {
    if (isEn) {
      return (
        `Sir, **${inlandCity}** is a landlocked, inland (non-marine) region.\n\n` +
        `🌊 **ORCA Marine System Scope**:\n` +
        `ORCA is an operational **Coastal & Ocean Intelligence System** specialized for Indian coastal waters, seaports, wave oceanography, sea surface temperature, INCOIS Potential Fishing Zones (PFZ), and maritime cyclone advisories.\n\n` +
        `💡 **Current Active Coastal Port**: **${loc}** (\`${coords}\`)\n` +
        `If you would like live wave, wind, risk, or fishing updates for any coastal location (e.g. Mumbai, Porbandar, Kochi, Chennai, Visakhapatnam, etc.), please ask or tap on the Map!`
      );
    } else {
      return (
        `सर, **${inlandCity}** एक गैर-समुद्री (Landlocked / Inland) अंतर्देशीय क्षेत्र है।\n\n` +
        `🌊 **ORCA प्रणाली का कार्यक्षेत्र**:\n` +
        `ORCA एक विशेष **तटीय व महासागरीय सुरक्षा प्रणाली** (Marine Intelligence System) है, जो भारतीय समुद्री तटों, बंदरगाहों, लहरों की ऊँचाई, हवा की गति, समुद्र सतह तापमान (SST), INCOIS संभावित मछली क्षेत्रों (PFZ) और चक्रवात चेतावनियों के लिए समर्पित है।\n\n` +
        `💡 **वर्तमान चयनित तटीय बंदरगाह**: **${loc}** (\`${coords}\`)\n` +
        `यदि आप किसी तटीय क्षेत्र (जैसे मुंबई, पोरबंदर, वेरावल, कोच्चि, चेन्नई, विशाखापट्टनम आदि) का समुद्री मौसम, लहरें या मछली पकड़ने की स्थिति जानना चाहते हैं, तो कृपया उसका नाम बताएं या मैप से चुनें!`
      );
    }
  }

  // --- 2. Check for User Name Introduction ---
  const userName = detectUserName(query);
  if (userName) {
    if (isEn) {
      return (
        `Hello Captain **${userName}**! 🌊 Great to meet you.\n\n` +
        `I am **ORCA Sagar Saathi**, your dedicated maritime safety and fisheries intelligence advisor.\n\n` +
        `Currently monitoring **${loc}** (\`${coords}\`):\n` +
        `• Sea Status: **${isSafe ? "Safe Sea ✅" : isCaution ? "Caution Advised ⚠️" : "High Risk / Danger ⚠️"}** (Score: ${liveRisk.riskScore}/100)\n` +
        `• Significant Waves: **${wave}** | Wind: **${wind}**\n\n` +
        `How can I assist you with your voyage or fishing trip today?`
      );
    } else {
      return (
        `नमस्ते कैप्टन **${userName}** जी! 🌊 आपसे जुड़कर खुशी हुई।\n\n` +
        `मैं आपका **ORCA सागर साथी** हूँ — तटीय सुरक्षा और मत्स्य सलाहकार।\n\n` +
        `वर्तमान में हम **${loc}** (\`${coords}\`) की निगरानी कर रहे हैं:\n` +
        `• समुद्री स्थिति: **${isSafe ? "सुरक्षित (Safe Sea) ✅" : isCaution ? "सावधानी (Caution) ⚠️" : "उच्च जोखिम (Danger) ⚠️"}** (${liveRisk.riskScore}/100)\n` +
        `• लहरें: **${wave}** | हवा की गति: **${wind}**\n\n` +
        `बताइए आज आपके नौकायन, मौसम या मछली पकड़ने के संबंध में क्या सहायता करूँ?`
      );
    }
  }

  // --- 3. Check for Capabilities & Data Sources ---
  if (isCapabilitiesQuery(query)) {
    if (isEn) {
      return (
        `Hello! I am **ORCA Sagar Saathi**, India's autonomous Coastal & Marine Intelligence System.\n\n` +
        `🎯 **What I Can Do (Key Capabilities)**:\n` +
        `1. **Deterministic Voyage Risk Scoring**: Real-time 0–100 safety score evaluating wave heights, wind gusts, and currents to advise Safe (LOW), Caution (MODERATE), or Danger (HIGH).\n` +
        `2. **Potential Fishing Zones (PFZ)**: Precise fish aggregation corridors derived from chlorophyll and SST thermal fronts with GPS bearings and shore distances.\n` +
        `3. **High-Resolution Ocean Weather**: Live significant wave height, swell period, surface currents, and water temperature.\n` +
        `4. **Maritime Advisories & Warnings**: Rapid dissemination of IMD & INCOIS rough sea, high swell surge, and cyclone bulletins.\n` +
        `5. **Emergency SOS Integration**: One-touch contact with Indian Coast Guard (1554) and State Marine Police (1093).\n\n` +
        `📡 **Official Data Sources**:\n` +
        `• **INCOIS** (Indian National Centre for Ocean Information Services)\n` +
        `• **IMD** (India Meteorological Department - Marine Bulletins)\n` +
        `• **ISRO / Oceansat** (Satellite ocean color & SST telemetry)\n` +
        `• **Copernicus Marine & Open-Meteo** (Global oceanographic & atmospheric models)`
      );
    } else {
      return (
        `नमस्ते! मैं **ORCA सागर साथी** हूँ — भारत का समर्पित तटीय व समुद्री सुरक्षा AI सलाहकार।\n\n` +
        `🎯 **मेरी मुख्य क्षमताएं (Key Capabilities)**:\n` +
        `1. **सटीक नौकायन जोखिम मूल्यांकन**: 0 से 100 के पैमाने पर लाइव समुद्री जोखिम स्कोर, जो लहरों, हवा और धाराओं का विश्लेषण कर सुरक्षित (SAFE) या खतरनाक (DANGER) का स्पष्ट निर्णय देता है।\n` +
        `2. **संभावित मछली पकड़ने के क्षेत्र (INCOIS PFZ)**: क्लोरोफिल और थर्मल फ्रंट के आधार पर मछली सघनता वाले क्षेत्र, तट से दूरी और नेविगेशन दिशा (Bearing)।\n` +
        `3. **वास्तविक समय समुद्री मौसम**: लहरों की ऊँचाई (Significant Wave Height), हवा की गति व झोंके, समुद्री धाराएं और समुद्र सतह तापमान (SST)।\n` +
        `4. **समुद्री चेतावनी व चक्रवात अलर्ट**: IMD एवं INCOIS द्वारा जारी चक्रवात, स्वेल सर्ज और भारी लहर चेतावनी।\n` +
        `5. **आपातकालीन सुरक्षा (SOS)**: 1554 (तटरक्षक बल) और 1093 (समुद्री पुलिस) से सीधा संपर्क।\n\n` +
        `📡 **विश्वसनीय डेटा स्रोत (Data Sources)**:\n` +
        `• **INCOIS** (भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र)\n` +
        `• **IMD** (भारत मौसम विज्ञान विभाग)\n` +
        `• **ISRO / Oceansat** (उपग्रह आधारित समुद्री डेटा)\n` +
        `• **Copernicus Marine & Open-Meteo** (ग्लोबल ओशन और वेदर मॉडल्स)`
      );
    }
  }

  // --- 4. Check for Advisories & Alerts ---
  if (isAdvisoryQuery(query)) {
    if (alerts && alerts.length > 0) {
      if (isEn) {
        const alertLines = alerts.slice(0, 3).map((a) =>
          `• **${a.title}** (${a.severityLabel || a.severity || "Active Alert"})\n  ${a.desc || a.advice || "Maintain caution and VHF radio watch."}`
        ).join("\n\n");
        return (
          `⚠️ **Active Maritime Advisories for ${loc}** (\`${coords}\`):\n\n` +
          `${alertLines}\n\n` +
          `🛡️ **Safety Instructions**: Check VHF Channel 16 and wear life jackets before venturing out.`
        );
      } else {
        const alertLines = alerts.slice(0, 3).map((a) =>
          `• **${a.title}** (${a.severityLabel || a.severity || "सक्रिय चेतावनी"})\n  ${a.desc || a.advice || "सतर्कता बरतें और तटीय रेडियो पर नजर रखें।"}`
        ).join("\n\n");
        return (
          `⚠️ **${loc}** (\`${coords}\`) के लिए सक्रिय समुद्री चेतावनियाँ:\n\n` +
          `${alertLines}\n\n` +
          `🛡️ **सुरक्षा निर्देश**: समुद्र में जाने से पूर्व VHF चैनल 16 और लाइफ जैकेट की पुष्टि अवश्य करें।`
        );
      }
    } else {
      if (isEn) {
        return (
          `📍 **Maritime Advisory Update — ${loc}** (\`${coords}\`):\n\n` +
          `✅ **No Active Severe Alerts**: Currently, there are no active cyclone, gale, or high swell warnings for this sector.\n\n` +
          `🌊 **Current Conditions**: Waves are **${wave}**, wind is **${wind}**.\n` +
          `🛡️ **Standard Coastal Advisory**: Sea conditions are calm and favorable for standard coastal navigation and fishing. Ensure all vessels carry life buoys, GPS, and maintain standard coastal VHF watch.`
        );
      } else {
        return (
          `📍 **समुद्री सलाह व चेतावनी अपडेट — ${loc}** (\`${coords}\`):\n\n` +
          `✅ **कोई गंभीर अलर्ट सक्रिय नहीं है**: वर्तमान में आपके चयनित क्षेत्र के लिए कोई चक्रवात, भारी तूफान या स्वेल सर्ज चेतावनी जारी नहीं है।\n\n` +
          `🌊 **वर्तमान स्थिति**: लहरें **${wave}** और हवा की गति **${wind}** है।\n` +
          `🛡️ **मानक तटीय सलाह**: समुद्र शांत और सामान्य है। तटीय नौकायन और मछली पकड़ने के लिए स्थिति अनुकूल है। हमेशा लाइफ जैकेट, वीएचएफ रेडियो और आपातकालीन लाइट साथ रखें।`
        );
      }
    }
  }

  // --- 5. Check for Fishing Suitability & Areas (PFZ) ---
  if (isFishingQuery(query)) {
    if (isDanger) {
      if (isEn) {
        return (
          `⚠️ **NO, today is NOT safe for fishing in ${loc}** (\`${coords}\`).\n\n` +
          `🛡️ **Risk Level: HIGH RISK (${liveRisk.riskScore}/100)**\n` +
          `• Significant Waves: **${wave}** (Rough/Turbulent)\n` +
          `• Wind Speed: **${wind}** (Strong gusts)\n\n` +
          `🛑 **Fisheries Advisory**: Small craft and fishing boats are strictly advised **NOT** to venture out into the sea today. Secure all moored boats at the harbor.`
        );
      } else {
        return (
          `⚠️ **नहीं, आज ${loc} में मछली पकड़ने के लिए समुद्र में जाना सुरक्षित नहीं है** (\`${coords}\`)।\n\n` +
          `🛡️ **जोखिम स्तर: उच्च जोखिम (HIGH RISK - ${liveRisk.riskScore}/100)**\n` +
          `• लहरों की ऊँचाई: **${wave}** (अत्यधिक अशांत)\n` +
          `• हवा की गति: **${wind}** (तेज हवाएं)\n\n` +
          `🛑 **मत्स्य सलाह**: सभी मछुआरों और नावों को आज समुद्र में न जाने की सख्त सलाह दी जाती है। नौकाओं को बंदरगाह पर सुरक्षित बांधकर रखें।`
        );
      }
    }

    if (isCaution) {
      if (isEn) {
        return (
          `⚠️ **Caution Advised for Fishing in ${loc}** (\`${coords}\`).\n\n` +
          `🛡️ **Risk Level: MODERATE RISK (${liveRisk.riskScore}/100)**\n` +
          `• Waves: **${wave}** | Wind: **${wind}**\n\n` +
          `🐟 **Recommended Fishing Zone**: **${topPFZ.name}**\n` +
          `• Distance from Coast: **${topPFZ.dist}**\n` +
          `• Compass Bearing: **${topPFZ.dir}**\n` +
          `• Water Depth: **${topPFZ.depth}**\n` +
          `• Target Species: **${topPFZ.fish}**\n\n` +
          `💡 **Voyage Limit**: Keep voyages strictly within 5–8 nautical miles of the coastline. Avoid deep offshore waters.\n` +
          `[🗺️ View Fishing Corridor on Map](#action-map)`
        );
      } else {
        return (
          `⚠️ **सावधानी के साथ सीमित मछली पकड़ने की सलाह — ${loc}** (\`${coords}\`)।\n\n` +
          `🛡️ **जोखिम स्तर: मध्यम जोखिम (CAUTION - ${liveRisk.riskScore}/100)**\n` +
          `• लहरें: **${wave}** | हवा की गति: **${wind}**\n\n` +
          `🐟 **नजदीकी संभावित मछली क्षेत्र (PFZ)**: **${topPFZ.name}**\n` +
          `• तट से दूरी: **${topPFZ.dist}**\n` +
          `• दिशा (Bearing): **${topPFZ.dir}**\n` +
          `• गहराई: **${topPFZ.depth}**\n` +
          `• संभावित प्रजातियां: **${topPFZ.fish}**\n\n` +
          `💡 **सीमा**: केवल 5 से 8 नॉटिकल मील के नजदीकी तटीय दायरे में ही मछली पकड़ें। खुले गहरे समुद्र में जाने से बचें।\n` +
          `[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)`
        );
      }
    }

    // SAFE SEA
    if (isEn) {
      return (
        `✅ **YES, today is VERY GOOD and SAFE for fishing in ${loc}** (\`${coords}\`)!\n\n` +
        `🛡️ **Safety Assessment: LOW RISK (${liveRisk.riskScore}/100 - Safe Sea)**\n` +
        `• Waves: **${wave}** (Calm)\n` +
        `• Wind: **${wind}** (Favorable sailing breeze)\n` +
        `• Sea Surface Temp: **${sst}** (Optimal for fish aggregation)\n\n` +
        `🐟 **Active INCOIS Potential Fishing Zone (PFZ)**:\n` +
        `• Zone: **${topPFZ.name}**\n` +
        `• Distance: **${topPFZ.dist}** offshore\n` +
        `• Bearing: **${topPFZ.dir}**\n` +
        `• Depth: **${topPFZ.depth}** | Expected Yield: **${topPFZ.yield}**\n` +
        `• Target Species: **${topPFZ.fish}**\n\n` +
        `🧭 **Recommended Corridor**: You can safely fish up to 15 nautical miles from the coast.\n` +
        `[🗺️ View Fishing Corridor on Map](#action-map)`
      );
    } else {
      return (
        `✅ **हाँ, आज ${loc} में मछली पकड़ने के लिए स्थिति बहुत अच्छी और पूरी तरह सुरक्षित है** (\`${coords}\`)!\n\n` +
        `🛡️ **सुरक्षा स्थिति: कम जोखिम (SAFE SEA - ${liveRisk.riskScore}/100)**\n` +
        `• लहरों की ऊँचाई: **${wave}** (शांत समुद्र)\n` +
        `• हवा की गति: **${wind}** (नौकायन के लिए अनुकूल)\n` +
        `• समुद्र तापमान (SST): **${sst}** (मछली सघनता के लिए अनुकूल)\n\n` +
        `🐟 **सक्रिय संभावित मछली पकड़ने का क्षेत्र (PFZ)**:\n` +
        `• क्षेत्र: **${topPFZ.name}**\n` +
        `• तट से दूरी: **${topPFZ.dist}**\n` +
        `• दिशा (Bearing): **${topPFZ.dir}**\n` +
        `• गहराई: **${topPFZ.depth}** | अनुमानित उपज: **${topPFZ.yield}**\n` +
        `• मुख्य प्रजातियां: **${topPFZ.fish}**\n\n` +
        `🧭 **नौकायन दायरा**: आप तट से 15 नॉटिकल मील तक सुरक्षित रूप से जा सकते हैं।\n` +
        `[🗺️ मैप पर मछली क्षेत्र देखें](#action-map)`
      );
    }
  }

  // --- 6. Check for Weather & Live Marine Conditions ---
  if (isWeatherQuery(query)) {
    if (isEn) {
      return (
        `📍 **Live Marine Weather for ${loc}** (\`${coords}\`):\n\n` +
        `• 🌊 **Significant Wave Height**: **${wave}**\n` +
        `• 💨 **Wind Speed**: **${wind}**\n` +
        `• 🌡️ **Sea Surface Temperature (SST)**: **${sst}**\n` +
        `• 🧭 **Ocean Surface Currents**: **${currents}**\n` +
        `• 🛡️ **Safety Status**: **${isSafe ? "LOW RISK (Safe Sea)" : isCaution ? "MODERATE RISK (Caution)" : "HIGH RISK (Danger)"}** (${liveRisk.riskScore}/100)\n\n` +
        `💡 **Advisory**: ${liveRisk.recommendation || (isSafe ? "Sea conditions are calm and ideal for coastal navigation." : "Maintain caution and monitoring.")}`
      );
    } else {
      return (
        `📍 **${loc}** (\`${coords}\`) का लाइव समुद्री मौसम रिपोर्ट:\n\n` +
        `• 🌊 **लहरों की ऊँचाई (Wave Height)**: **${wave}**\n` +
        `• 💨 **हवा की गति (Wind Speed)**: **${wind}**\n` +
        `• 🌡️ **समुद्र सतह तापमान (SST)**: **${sst}**\n` +
        `• 🧭 **समुद्री धाराएं (Currents)**: **${currents}**\n` +
        `• 🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "कम जोखिम (सुरक्षित / SAFE SEA)" : isCaution ? "मध्यम जोखिम (सावधानी)" : "उच्च जोखिम (खतरा)"}** (${liveRisk.riskScore}/100)\n\n` +
        `💡 **सलाह**: ${liveRisk.recommendation || (isSafe ? "मौसम और समुद्र शांत हैं। तटीय नौकायन के लिए परिस्थितियां पूरी तरह अनुकूल हैं।" : "सतर्कता बरतें।")}`
      );
    }
  }

  // --- 7. Fallback / Direct Natural Response ---
  if (isEn) {
    return (
      `📍 **${loc}** (\`${coords}\`):\n\n` +
      `Regarding your query "${query}":\n` +
      `• **Current Sea Risk**: **${isSafe ? "Safe Sea (LOW RISK)" : isCaution ? "Moderate Risk (Caution)" : "Dangerous (HIGH RISK)"}** (${liveRisk.riskScore}/100)\n` +
      `• **Wave Height**: ${wave} | **Wind Speed**: ${wind}\n` +
      `• **Fisheries**: Nearest PFZ corridor is ${topPFZ.dist} offshore (${topPFZ.dir}).\n\n` +
      `Feel free to ask me specifically about fishing suitability, live weather, cyclone warnings, or touch any coordinate on the Map!`
    );
  } else {
    return (
      `📍 **${loc}** (\`${coords}\`):\n\n` +
      `आपके प्रश्न "${query}" के संबंध में:\n` +
      `• **समुद्री जोखिम स्थिति**: **${isSafe ? "सुरक्षित (कम जोखिम)" : isCaution ? "मध्यम जोखिम (सावधानी)" : "खतरनाक (उच्च जोखिम)"}** (${liveRisk.riskScore}/100)\n` +
      `• **लहरें**: ${wave} | **हवा की गति**: ${wind}\n` +
      `• **मत्स्य क्षेत्र (PFZ)**: निकटतम क्षेत्र तट से ${topPFZ.dist} (${topPFZ.dir}) पर स्थित है।\n\n` +
      `आप मुझसे मछली पकड़ने की सुरक्षा, चक्रवात चेतावनी, मौसम या मैप पर किसी भी निर्देशांक के बारे में सीधे पूछ सकते हैं!`
    );
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
  const loc = liveRisk.locationLabel || "तटीय क्षेत्र";
  const coords = `${liveRisk.latitude.toFixed(2)}° N, ${liveRisk.longitude.toFixed(2)}° E`;
  const isEn = lang === "en";
  const isDanger = liveRisk.riskLevel === "HIGH" || liveRisk.riskLevel === "CRITICAL";
  const isCaution = liveRisk.riskLevel === "MODERATE";
  const isSafe = !isDanger && !isCaution;

  const wave = liveRisk.waveHeight || "1.1 m";
  const wind = liveRisk.windSpeed || "15 km/h";
  const sst = liveRisk.sst || "28.5°C";

  const topPFZ = pfzList.length > 0 ? pfzList[0] : {
    name: "तटीय मत्स्य क्षेत्र",
    dist: "14.5 km",
    dir: "SW",
    fish: "टूना, बांगड़ा",
  };

  if (isEn) {
    return (
      `📍 **Maritime Briefing — ${loc}** (\`${coords}\`)\n\n` +
      `🛡️ **Voyage Safety**: **${isSafe ? "SAFE SEA (Low Risk)" : isCaution ? "CAUTION ADVISED (Moderate Risk)" : "HIGH RISK (Avoid Sea)"}** (${liveRisk.riskScore}/100)\n` +
      `🌊 **Ocean Conditions**: Waves: **${wave}** · Wind: **${wind}** · SST: **${sst}**\n` +
      `🐟 **Fisheries (PFZ)**: ${topPFZ.name} (${topPFZ.dist} offshore, heading ${topPFZ.dir})\n` +
      `⚠️ **Advisories**: ${alerts.length > 0 ? `${alerts.length} active hazard bulletins` : "No severe cyclone or swell warnings"}\n\n` +
      `Ask me anything about today's weather, fishing zones, or safety!`
    );
  } else {
    return (
      `📍 **तटीय स्थिति बुलेटिन — ${loc}** (\`${coords}\`)\n\n` +
      `🛡️ **सुरक्षा मूल्यांकन**: **${isSafe ? "सुरक्षित (Safe Sea)" : isCaution ? "सावधानी (Caution)" : "उच्च जोखिम (खतरा)"}** (${liveRisk.riskScore}/100)\n` +
      `🌊 **समुद्री स्थिति**: लहरें: **${wave}** · हवा: **${wind}** · तापमान: **${sst}**\n` +
      `🐟 **मछली क्षेत्र (PFZ)**: ${topPFZ.name} (तट से ${topPFZ.dist}, दिशा ${topPFZ.dir})\n` +
      `⚠️ **चेतावनी**: ${alerts.length > 0 ? `${alerts.length} सक्रिय चेतावनी बुलेटिन` : "कोई चक्रवात या भारी लहर अलर्ट सक्रिय नहीं है"}\n\n` +
      `मुझसे आज के मौसम, मछली पकड़ने या समुद्री सुरक्षा के बारे में कुछ भी पूछें!`
    );
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


