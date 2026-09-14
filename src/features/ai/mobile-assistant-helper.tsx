/**
 * Mobile AI Sagar Saathi conversational helper
 * Handles greeting detection, natural conversational responses,
 * template localization, and language consistency across all 10 coastal languages.
 */

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
  te: "నమస్కారం కెప్టెన్! 🌊 నేను మీ ORCA సాగర్ మిత్రుడిని, సముద్ర భద్రత మరియు మత్స్య సలహాదారుని.\n\nఈరోజు మీకు ఎలా సహాయపడగలను? మీరు నన్ను అడగవచ్చు:\n• 🐟 ఈరోజు సముద్రంలో చేపల వేటకు వెళ్లడం సురಕ್ಷితమేనా?\n• 🌊 సమీప సంభావ్య చేపల వేట జోన్ (PFZ) ఎక్కడ ఉంది?\n• 💨 అలల ఎత్తు మరియు గాలి వేగం ఎంత?\n• ⚠️ ఏవైనా తుఫాను లేదా సముద్ర హెచ్చరికలు ఉన్నాయా?",
  ml: "നമസ്കാരം ക്യാപ്റ്റൻ! 🌊 ഞാൻ നിങ്ങളുടെ ORCA സാഗർ സഹായിയാണ്.\n\nഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം? നിങ്ങൾക്ക് ചോദിക്കാം:\n• 🐟 ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?\n• 🌊 അടുത്തുള്ള മത്സ്യബന്ധന മേഖല (PFZ) എവിടെയാണ്?\n• 💨 തിരമാലകളുടെ ഉയരവും കാറ്റിന്റെ വേഗതയും എത്രയാണ്?\n• ⚠️ എന്തെങ്കിലും ചുഴലിക്കാറ്റ് അല്ലെങ്കിൽ കടൽ മുന്നറിയിപ്പുണ്ടോ?",
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
  recommendation?: string;
}

/**
 * Localize template text and strictly synchronize with the Dashboard's live risk assessment
 * and currently selected coastal location/coordinates.
 */
export function localizeReplyText(text: string, lang: string, liveRisk?: LiveRiskContext): string {
  if (!text) return "";
  let out = text;

  // 1. Synchronize Location Header with the actual selected location
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

    // 2. Synchronize Safety Assessment block with the Dashboard's actual live risk
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

      // Replace safety assessment line or section
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

    // 3. Synchronize Wave Height & Wind Speed if live data is available
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

  if (lang === "ta") {
    return out
      .replace(/📍 \*\*Marine Sector\*\*:/g, "📍 **கடலோரப் பகுதி**:")
      .replace(/🛡️ \*\*Safety Assessment\*\*:/g, "🛡️ **பாதுகாப்பு மதிப்பீடு**:")
      .replace(/\*\*LOW RISK\*\*/gi, "**பாதுகாப்பானது (குறைந்த ஆபத்து)**")
      .replace(/🌊 \*\*Marine & Weather Conditions\*\*:/g, "🌊 **வானிலை மற்றும் கடல் நிலை**:")
      .replace(/• \*\*Significant Wave Height\*\*:/g, "• **அலை உயரம்**:")
      .replace(/• \*\*Wind Speed\*\*:/g, "• **காற்றின் வேகம்**:")
      .replace(/• \*\*Sea Surface Temp \(SST\)\*\*:/g, "• **கடல் வெப்பநிலை (SST)**:")
      .replace(/• \*\*Alert Status\*\*:/g, "• **எச்சரிக்கை நிலை**:")
      .replace(/🐟 \*\*PFZ Fisheries Intel\*\*:/g, "🐟 **PFZ மீன்பிடி தகவல்**:")
      .replace(/💡 \*\*Advisory\*\*:/g, "💡 **ஆலோசனை**:");
  }

  return out;
}

import React from "react";

export function FormattedChatMessage({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <div className="m-formatted-chat-msg" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: "6px" }} />;
        }
        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
        const parts = line.split(/(\*\*[^*]+\*\*)/g);

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
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

