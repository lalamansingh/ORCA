"use client";

import { useState } from "react";
import { 
  PhoneCall, 
  ShieldAlert, 
  MapPin, 
  Wifi, 
  WifiOff, 
  HelpCircle, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { SOSReport, SOSWorkflowState } from "@/features/sos/types";
import { useSOSStore } from "@/features/sos/sos-store";

interface EmergencySOSCardProps {
  workflowState?: SOSWorkflowState;
  activeReport?: SOSReport | null;
  isOnline?: boolean;
  gpsAvailable?: boolean;
  locationLabel?: string;
  selectedLang?: string;
  onArmSOS?: () => void;
  onOpenOnboarding?: () => void;
  onResetSOS?: () => void;
}

const EMERGENCY_CARD_I18N: Record<string, {
  title: string;
  setup: string;
  resolved: string;
  ack: string;
  responding: string;
  waiting: string;
  ackDesc: string;
  loggedDesc: string;
  transcriptLabel: string;
  closeBtn: string;
  triggerDesc: string;
  triggerBtn: string;
  hwTrigger: string;
  gpsStatus: string;
  gpsAvail: string;
  gpsLast: string;
  netRelay: string;
  netOnline: string;
  netOffline: string;
  cgCall: string;
  mpCall: string;
}> = {
  hi: {
    title: "आपातकालीन समुद्री संकट (SOS)",
    setup: "सुरक्षा सेटअप",
    resolved: "✓ संकट का समाधान हो गया",
    ack: "✓ तटरक्षक बल द्वारा पुष्टि प्राप्त",
    responding: "🚨 बचाव दल रवाना हो चुका है",
    waiting: "⏳ SOS भेजा गया — पुष्टि की प्रतीक्षा",
    ackDesc: "भारतीय तटरक्षक कमांड रूम ने आपके संकट संदेश और जीपीएस निर्देशांक प्राप्त कर लिए हैं।",
    loggedDesc: "आपकी संकट रिपोर्ट समुद्री सुरक्षा कमांड सेंटर पर दर्ज हो गई है।",
    transcriptLabel: "बोला गया संदेश:",
    closeBtn: "बंद करें / नया संकट कॉल",
    triggerDesc: "तट रक्षक और स्थानीय बंदरगाहों को तत्काल संकट संदेश भेजने के लिए नीचे दिए गए बटन को दबाएं या वॉल्यूम डाउन 3 बार दबाएं।",
    triggerBtn: "आपातकालीन SOS भेजें",
    hwTrigger: "हार्डवेयर ट्रिगर: फोन का वॉल्यूम डाउन बटन 3 बार दबाएं।",
    gpsStatus: "GPS स्थिति",
    gpsAvail: "GPS उपलब्ध",
    gpsLast: "अंतिम ज्ञात",
    netRelay: "नेटवर्क रिले",
    netOnline: "ऑनलाइन (प्रत्यक्ष)",
    netOffline: "ऑफ़लाइन (मेश रिले सक्रिय)",
    cgCall: "तटरक्षक बल 1554",
    mpCall: "तटीय पुलिस 1093",
  },
  en: {
    title: "EMERGENCY SOS DISTRESS",
    setup: "Safety Setup",
    resolved: "✓ INCIDENT RESOLVED",
    ack: "✓ ACKNOWLEDGED BY AUTHORITIES",
    responding: "🚨 RESCUE TEAM RESPONDING",
    waiting: "⏳ SOS SENT — WAITING FOR ACKNOWLEDGEMENT",
    ackDesc: "Coast Guard Operations Room has acknowledged your distress signal and coordinates.",
    loggedDesc: "Your distress report is logged on the Marine Command Center.",
    transcriptLabel: "Distress Transcript:",
    closeBtn: "Close / New Distress Call",
    triggerDesc: "Press the button below or click Volume Down 3 times to trigger immediate distress call to Coast Guard & Local Ports.",
    triggerBtn: "SEND SOS DISTRESS",
    hwTrigger: "Hardware Trigger: Triple-press Volume Down key on device.",
    gpsStatus: "GPS Status",
    gpsAvail: "GPS Available",
    gpsLast: "Last Known",
    netRelay: "Network Relay",
    netOnline: "Online (Direct)",
    netOffline: "Offline (Peer Relay Active)",
    cgCall: "Coast Guard 1554",
    mpCall: "Marine Police 1093",
  },
  ta: {
    title: "அவசர கடல் ஆபத்து (SOS)",
    setup: "பாதுகாப்பு அமைப்பு",
    resolved: "✓ பிரச்சனை தீர்க்கப்பட்டது",
    ack: "✓ கடலோர காவல்படை உறுதிப்படுத்தியது",
    responding: "🚨 மீட்புக் குழு விரைந்து கொண்டிருக்கிறது",
    waiting: "⏳ SOS அனுப்பப்பட்டது — பதிலுக்காக காத்திருக்கிறது",
    ackDesc: "கடலோர காவல்படை கட்டுப்பாட்டு அறை உங்கள் சமிக்ஞையை பெற்றுள்ளது.",
    loggedDesc: "உங்கள் அவசர அறிக்கை கடல்சார் கட்டுப்பாட்டு மையத்தில் பதிவு செய்யப்பட்டது.",
    transcriptLabel: "பதிவான குரல் செய்தி:",
    closeBtn: "மூடு / புதிய அழைப்பு",
    triggerDesc: "கடலோர காவல்படைக்கு உடனடியாக தகவல் தெரிவிக்க கீழே உள்ள பொத்தானை அழுத்தவும் அல்லது வால்யூம் டவுன் பட்டனை 3 முறை அழுத்தவும்.",
    triggerBtn: "அவசர SOS அனுப்பவும்",
    hwTrigger: "வன்பொருள் தூண்டுதல்: போனின் வால்யூம் டவுன் பட்டனை 3 முறை அழுத்தவும்.",
    gpsStatus: "GPS நிலை",
    gpsAvail: "GPS கிடைக்கிறது",
    gpsLast: "கடைசி இருப்பிடம்",
    netRelay: "நெட்வொர்க் ரிலே",
    netOnline: "ஆன்லைன் (நேரடி)",
    netOffline: "ஆஃப்லைன் (பியர் ரிலே இயங்குகிறது)",
    cgCall: "கடலோர காவல்படை 1554",
    mpCall: "கடலோர காவல் 1093",
  },
  te: {
    title: "అత్యవసర సముద్ర ప్రమాదం (SOS)",
    setup: "భద్రతా సెటప్",
    resolved: "✓ ప్రమాదం పరిష్కరించబడింది",
    ack: "✓ కోస్ట్ గార్డ్ ద్వారా నిర్ధారణ",
    responding: "🚨 రెస్క్యూ టీమ్ బయలుదేరింది",
    waiting: "⏳ SOS పంపబడింది — నిర్ధారణ కోసం వేచి ఉంది",
    ackDesc: "కోస్ట్ గార్డ్ కమాండ్ రూమ్ మీ సంకేతం మరియు కోఆర్డినేట్లను అందుకుంది.",
    loggedDesc: "మీ అత్యవసర నివేదిక మెరైన్ కమాండ్ సెంటర్‌లో నమోదైంది.",
    transcriptLabel: "వాయిస్ సందేశం:",
    closeBtn: "మూసివేయి / కొత్త కాల్",
    triggerDesc: "కోస్ట్ గార్డ్ మరియు పోర్టులకు తక్షణ సహాయం కోసం కింద ఉన్న బటన్‌ను నొక్కండి లేదా వాల్యూమ్ డౌన్ బటన్ 3 సార్లు నొక్కండి.",
    triggerBtn: "అత్యవసర SOS పంపండి",
    hwTrigger: "హార్డ్‌వేర్ ట్రిగ్గర్: ఫోన్ వాల్యూమ్ డౌన్ బటన్‌ను 3 సార్లు నొక్కండి.",
    gpsStatus: "GPS స్థితి",
    gpsAvail: "GPS అందుబాటులో ఉంది",
    gpsLast: "చివరి తెలిసిన ప్రదేశం",
    netRelay: "నెట్‌వర్క్ రిలే",
    netOnline: "ఆన్‌లైన్ (డైరెక్ట్)",
    netOffline: "ఆఫ్‌లైన్ (పీర్ రిలే యాక్టివ్)",
    cgCall: "కోస్ట్ గార్డ్ 1554",
    mpCall: "కోస్టల్ పోలీస్ 1093",
  },
  ml: {
    title: "അടിയന്തര സമുദ്ര അപായം (SOS)",
    setup: "സുരക്ഷാ ക്രമീകരണം",
    resolved: "✓ അപകടം പരിഹരിച്ചു",
    ack: "✓ കോസ്റ്റ് ഗാർഡ് സ്ഥിരീകരിച്ചു",
    responding: "🚨 രക്ഷാപ്രവർത്തകർ തിരിച്ചിട്ടുണ്ട്",
    waiting: "⏳ SOS അയച്ചു — സ്ഥിരീകരണത്തിനായി കാത്തിരിക്കുന്നു",
    ackDesc: "കോസ്റ്റ് ഗാർഡ് കമാൻഡ് റൂം നിങ്ങളുടെ സന്ദേശം സ്വീകരിച്ചു.",
    loggedDesc: "നിങ്ങളുടെ അപകട റിപ്പോർട്ട് മറൈൻ കമാൻഡ് സെന്ററിൽ രേഖപ്പെടുത്തി.",
    transcriptLabel: "ശബ്ദ സന്ദേശം:",
    closeBtn: "അടയ്ക്കുക / പുതിയ കോൾ",
    triggerDesc: "കോസ്റ്റ് ഗാർഡിന് ഉടൻ മുന്നറിയിപ്പ് അയയ്ക്കാൻ താഴെയുള്ള ബട്ടൺ അമർത്തുക അല്ലെങ്കിൽ വോളിയം ഡൗൺ ബട്ടൺ 3 തവണ അമർത്തുക.",
    triggerBtn: "അടിയന്തര SOS അയക്കുക",
    hwTrigger: "ഹാർഡ്‌വെയർ ട്രിഗർ: ഫോണിലെ വോളിയം ഡൗൺ ബട്ടൺ 3 തവണ അമർത്തുക.",
    gpsStatus: "GPS നില",
    gpsAvail: "GPS ലഭ്യമാണ്",
    gpsLast: "അവസാനം രേഖപ്പെടുത്തിയത്",
    netRelay: "നെറ്റ്‌വർക്ക് റിലേ",
    netOnline: "ഓൺലൈൻ (ഡയറക്റ്റ്)",
    netOffline: "ഓഫ്‌ലൈൻ (പിയർ റിലേ സജീവം)",
    cgCall: "കോസ്റ്റ് ഗാർഡ് 1554",
    mpCall: "തീരദേശ പോലീസ് 1093",
  },
  gu: {
    title: "કટોકટી દરિયાઈ જોખમ (SOS)",
    setup: "સુરક્ષા સેટઅપ",
    resolved: "✓ સંકટનું નિરાકરણ થઈ ગયું",
    ack: "✓ કોસ્ટ ગાર્ડ દ્વારા પુષ્ટિ મળી",
    responding: "🚨 બચાવ ટીમ રવાના થઈ ગઈ છે",
    waiting: "⏳ SOS મોકલાયો — પુષ્ટિની પ્રતીક્ષા",
    ackDesc: "ભારતીય કોસ્ટ ગાર્ડે તમારો સંદેશ અને જીપીએસ લોકેશન મેળવી લીધું છે.",
    loggedDesc: "તમારો આપત્તિ અહેવાલ મરીન કમાન્ડ સેન્ટરમાં નોંધાઈ ગયો છે.",
    transcriptLabel: "રેકોર્ડ થયેલ સંદેશ:",
    closeBtn: "બંધ કરો / નવો કટોકટી કોલ",
    triggerDesc: "કોસ્ટ ગાર્ડ અને બંદરોને તાત્કાલિક સંકેત મોકલવા માટે નીચેનું બટન દબાવો અથવા વોલ્યુમ ડાઉન બટન 3 વાર દબાવો.",
    triggerBtn: "કટોકટી SOS મોકલો",
    hwTrigger: "હાર્ડવેર ટ્રિગર: ફોનનું વોલ્યુમ ડાઉન બટન 3 વાર દબાવો.",
    gpsStatus: "GPS સ્થિતિ",
    gpsAvail: "GPS ઉપલબ્ધ",
    gpsLast: "છેલ્લું જાણીતું",
    netRelay: "નેટવર્ક રિલે",
    netOnline: "ઓનલાઈન (ડાયરેક્ટ)",
    netOffline: "ઓફલાઈન (મેશ રિલે સક્રિય)",
    cgCall: "કોસ્ટ ગાર્ડ 1554",
    mpCall: "મરીન પોલીસ 1093",
  },
  mr: {
    title: "आपत्कालीन सागरी संकट (SOS)",
    setup: "सुरक्षा सेटअप",
    resolved: "✓ संकट निवारण झाले",
    ack: "✓ तटरक्षक दलाकडून पावती मिळाली",
    responding: "🚨 बचाव पथक रवाना झाले आहे",
    waiting: "⏳ SOS पाठवला — पावतीची प्रतीक्षा",
    ackDesc: "तटरक्षक दल नियंत्रण कक्षाला तुमचा संकट संदेश आणि जीपीएस निर्देशांक मिळाले आहेत.",
    loggedDesc: "तुमचा संकट अहवाल सागरी सुरक्षा नियंत्रण केंद्रात नोंदवला गेला आहे.",
    transcriptLabel: "नोंदवलेला संदेश:",
    closeBtn: "बंद करा / नवीन संकट कॉल",
    triggerDesc: "तटरक्षक दल आणि बंदरांना त्वरित संदेश पाठवण्यासाठी खालील बटण दाबा किंवा व्हॉल्यूम डाउन ३ वेळा दाबा.",
    triggerBtn: "आपत्कालीन SOS पाठवा",
    hwTrigger: "हार्डवेअर ट्रिगर: फोनचे व्हॉल्यूम डाउन बटण ३ वेळा दाबा.",
    gpsStatus: "GPS स्थिती",
    gpsAvail: "GPS उपलब्ध",
    gpsLast: "शेवटचे माहित असलेले",
    netRelay: "नेटवर्क रिले",
    netOnline: "ऑनलाइन (थेट)",
    netOffline: "ऑफलाइन (पीअर रिले सक्रिय)",
    cgCall: "तटरक्षक दल 1554",
    mpCall: "सागरी पोलीस 1093",
  },
  bn: {
    title: "জরুরী সামুদ্রিক বিপদ (SOS)",
    setup: "সুরক্ষা সেটআপ",
    resolved: "✓ সমস্যা সমাধান হয়েছে",
    ack: "✓ কোস্ট গার্ড দ্বারা নিশ্চিতকৃত",
    responding: "🚨 উদ্ধারকারী দল রওনা হয়েছে",
    waiting: "⏳ SOS পাঠানো হয়েছে — উত্তরের অপেক্ষায়",
    ackDesc: "ভারতীয় কোস্ট গার্ড কন্ট্রোল রুম আপনার সংকেত এবং জিপিএস স্থানাঙ্ক পেয়েছে।",
    loggedDesc: "আপনার বিপদ প্রতিবেদন মেরিন কমান্ড সেন্টারে সংরক্ষিত হয়েছে।",
    transcriptLabel: "ভয়েস বার্তা:",
    closeBtn: "বন্ধ করুন / নতুন কল",
    triggerDesc: "কোস্ট গার্ড এবং স্থানীয় বন্দরে তাত্ক্ষণিক বিপদ সংকেত পাঠাতে নিচের বোতামটি চাপুন বা ৩ বার ভলিউম ডাউন বোতাম টিপুন।",
    triggerBtn: "জরুরী SOS পাঠান",
    hwTrigger: "হার্ডওয়্যার ট্রিগার: ফোনের ভলিউম ডাউন বোতাম ৩ বার টিপুন।",
    gpsStatus: "GPS অবস্থা",
    gpsAvail: "GPS উপলব্ধ",
    gpsLast: "সর্বশেষ জ্ঞাত",
    netRelay: "নেটওয়ার্ক রিলে",
    netOnline: "অনলাইন (সরাসরি)",
    netOffline: "অফলাইন (মেশ রিলে সক্রিয়)",
    cgCall: "কোস্ট গার্ড 1554",
    mpCall: "উপকূলীয় পুলিশ 1093",
  },
  kn: {
    title: "ತುರ್ತು ಸಾಗರ ಅಪಾಯ (SOS)",
    setup: "ಸುರಕ್ಷತಾ ಸೆಟಪ್",
    resolved: "✓ ಸಂಕಷ್ಟ ಪರಿಹಾರವಾಗಿದೆ",
    ack: "✓ ಕೋಸ್ಟ್ ಗಾರ್ಡ್ ಖಚಿತಪಡಿಸಿದೆ",
    responding: "🚨 ರಕ್ಷಣಾ ತಂಡವು ಹೊರಟಿದೆ",
    waiting: "⏳ SOS ಕಳುಹಿಸಲಾಗಿದೆ — ಪ್ರತಿಕ್ರಿಯೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ",
    ackDesc: "ಕೋಸ್ಟ್ ಗಾರ್ಡ್ ನಿಯಂತ್ರಣ ಕೊಠಡಿಯು ನಿಮ್ಮ ಸಂಕಷ್ಟ ಸಂದೇಶ ಮತ್ತು ಜಿಪಿಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಸ್ವೀಕರಿಸಿದೆ.",
    loggedDesc: "ನಿಮ್ಮ ಸಂಕಷ್ಟ ವರದಿಯನ್ನು ಕಮಾಂಡ್ ಸೆಂಟರ್‌ನಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ.",
    transcriptLabel: "ಧ್ವನಿ ಸಂದೇಶ:",
    closeBtn: "ಮುಚ್ಚಿ / ಹೊಸ ಕರೆ",
    triggerDesc: "ಕೋಸ್ಟ್ ಗಾರ್ಡ್‌ಗೆ ತಕ್ಷಣವೇ ತುರ್ತು ಸಂದೇಶ ಕಳುಹಿಸಲು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ ಅಥವಾ ವಾಲ್ಯೂಮ್ ಡೌನ್ ಬಟನ್ 3 ಬಾರಿ ಒತ್ತಿ.",
    triggerBtn: "ತುರ್ತು SOS ಕಳುಹಿಸಿ",
    hwTrigger: "ಹಾರ್ಡ್‌ವೇರ್ ಟ್ರಿಗ್ಗರ್: ಫೋನ್‌ನ ವಾಲ್ಯೂಮ್ ಡೌನ್ ಬಟನ್ ಅನ್ನು 3 ಬಾರಿ ಒತ್ತಿ.",
    gpsStatus: "GPS ಸ್ಥಿತಿ",
    gpsAvail: "GPS ಲಭ್ಯವಿದೆ",
    gpsLast: "ಕೊನೆಯ ಸ್ಥಳ",
    netRelay: "ನೆಟ್‌ವರ್ಕ್ ರಿಲೇ",
    netOnline: "ಆನ್‌ಲೈನ್ (ನೇರ)",
    netOffline: "ಆಫ್‌ಲೈನ್ (ಪೀರ್ ರಿಲೇ ಸಕ್ರಿಯ)",
    cgCall: "ಕೋಸ್ಟ್ ಗಾರ್ಡ್ 1554",
    mpCall: "ಕರಾವಳಿ ಪೊಲೀಸ್ 1093",
  },
  or: {
    title: "ଜରୁରୀକାଳୀନ ସାମୁଦ୍ରିକ ସଙ୍କଟ (SOS)",
    setup: "ସୁରକ୍ଷା ସେଟଅପ୍",
    resolved: "✓ ସଙ୍କଟ ସମାଧାନ ହୋଇଛି",
    ack: "✓ କୋଷ୍ଟ ଗାର୍ଡ ଦ୍ୱାରା ନିଶ୍ଚିତ",
    responding: "🚨 ଉଦ୍ଧାରକାରୀ ଦଳ ବାହାରିଛନ୍ତି",
    waiting: "⏳ SOS ପଠାଗଲା — ଉତ୍ତରକୁ ଅପେକ୍ଷା",
    ackDesc: "ଭାରତୀୟ କୋଷ୍ଟ ଗାର୍ଡ କଣ୍ଟ୍ରୋଲ୍ ରୁମ୍ ଆପଣଙ୍କ ସଙ୍କେତ ଓ ଜିପିଏସ୍ ପାଇଛନ୍ତି।",
    loggedDesc: "ଆପଣଙ୍କ ବିପଦ ରିପୋର୍ଟ ସାମୁଦ୍ରିକ କମାଣ୍ଡ ସେଣ୍ଟରରେ ପଞ୍ଜୀକୃତ ହୋଇଛି।",
    transcriptLabel: "ଭଏସ୍ ବାର୍ତ୍ତା:",
    closeBtn: "ବନ୍ଦ କରନ୍ତୁ / ନୂତନ କଲ୍",
    triggerDesc: "କୋଷ୍ଟ ଗାର୍ଡ ଏବଂ ବନ୍ଦରକୁ ତୁରନ୍ତ ବାର୍ତ୍ତା ପଠାଇବା ପାଇଁ ତଳେ ଥିବା ବଟନ୍ ଦବାନ୍ତୁ କିମ୍ବା ଭଲ୍ୟୁମ୍ ଡାଉନ୍ ୩ ଥର ଦବାନ୍ତୁ।",
    triggerBtn: "ଜରୁରୀକାଳୀନ SOS ପଠାନ୍ତୁ",
    hwTrigger: "ହାର୍ଡୱେର୍ ଟ୍ରିଗର: ଫୋନର ଭଲ୍ୟୁମ୍ ଡାଉନ୍ ବଟନ୍ ୩ ଥର ଦବାନ୍ତୁ।",
    gpsStatus: "GPS ସ୍ଥିତି",
    gpsAvail: "GPS ଉପଲବ୍ଧ",
    gpsLast: "ଶେଷ ଜଣାଶୁଣା",
    netRelay: "ନେଟୱାର୍କ ରିଲେ",
    netOnline: "ଅନଲାଇନ୍ (ସିଧାସଳଖ)",
    netOffline: "ଅଫଲାଇନ୍ (ମେସ୍ ରିଲେ ସକ୍ରିୟ)",
    cgCall: "କୋଷ୍ଟ ଗାର୍ଡ 1554",
    mpCall: "ମେରାଇନ୍ ପୋଲିସ 1093",
  },
};

export function EmergencySOSCard({
  workflowState: propWorkflowState,
  activeReport: propActiveReport,
  isOnline = true,
  gpsAvailable = true,
  locationLabel = "Live GPS Sector",
  selectedLang = "hi",
  onArmSOS,
  onOpenOnboarding,
  onResetSOS,
}: EmergencySOSCardProps) {
  const store = useSOSStore();
  const workflowState = propWorkflowState || store.state;
  const activeReport = propActiveReport || store.lastSentReport;
  const armSOS = onArmSOS || store.armSOS;
  const resetSOS = onResetSOS || store.reset;

  const [isPressing, setIsPressing] = useState(false);

  const i18n = EMERGENCY_CARD_I18N[selectedLang] || EMERGENCY_CARD_I18N["hi"] || EMERGENCY_CARD_I18N["en"];

  const isAck = activeReport?.status === "ACKNOWLEDGED";
  const isResponding = activeReport?.status === "RESPONDING";
  const isResolved = activeReport?.status === "RESOLVED";
  const isSent = workflowState === "SENT" || workflowState === "QUEUED_OFFLINE";

  return (
    <div className="m-sos-emergency-container">
      {/* Top Header & Fisherman Identity Profile */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(225, 29, 72, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f43f5e",
            }}
          >
            <ShieldAlert size={18} />
          </div>
          <div>
            <strong style={{ fontSize: "13.5px", color: "#f8fafc", display: "block", letterSpacing: "0.2px" }}>
              {i18n.title}
            </strong>
            <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>
              {locationLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenOnboarding}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            color: "#e2e8f0",
            padding: "5px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={13} style={{ color: "#38bdf8" }} />
          <span>{i18n.setup}</span>
        </button>
      </div>

      {/* Main Active SOS Status Panel (When SOS is active/sent) */}
      {(isSent || isAck || isResponding || isResolved) && activeReport ? (
        <div
          style={{
            background: isResolved
              ? "rgba(16, 185, 129, 0.12)"
              : isAck || isResponding
              ? "rgba(14, 165, 233, 0.15)"
              : "rgba(225, 29, 72, 0.15)",
            border: `1.5px solid ${isResolved ? "#10b981" : isAck || isResponding ? "#38bdf8" : "#f43f5e"}`,
            borderRadius: "14px",
            padding: "14px",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isResolved ? (
                <CheckCircle2 size={18} style={{ color: "#34d399" }} />
              ) : isAck ? (
                <CheckCircle2 size={18} style={{ color: "#38bdf8" }} />
              ) : (
                <Clock size={18} style={{ color: "#fbbf24" }} />
              )}
              <strong style={{ fontSize: "13px" }}>
                {isResolved
                  ? i18n.resolved
                  : isAck
                  ? i18n.ack
                  : isResponding
                  ? i18n.responding
                  : i18n.waiting}
              </strong>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "6px",
                background: "rgba(0, 0, 0, 0.35)",
                color: "#e2e8f0",
              }}
            >
              {activeReport.delivery_path === "direct" ? "DIRECT" : "OFFLINE RELAY"}
            </span>
          </div>

          <p style={{ fontSize: "11.5px", color: "#cbd5e1", margin: "4px 0 10px 0", lineHeight: 1.4 }}>
            {isAck ? i18n.ackDesc : i18n.loggedDesc}
          </p>

          <div
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "11px",
              marginBottom: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "10px" }}>{i18n.transcriptLabel}</div>
            <div style={{ fontStyle: "italic", color: "#f8fafc", marginTop: "2px" }}>
              &ldquo;{activeReport.transcript}&rdquo;
            </div>
            <div style={{ color: "#38bdf8", fontSize: "10.5px", marginTop: "6px", fontWeight: 600 }}>
              📍 {activeReport.latitude.toFixed(4)}° N, {activeReport.longitude.toFixed(4)}° E (±{activeReport.accuracy_meters}m)
            </div>
          </div>

          <button
            type="button"
            onClick={resetSOS}
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              padding: "8px",
              borderRadius: "8px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {i18n.closeBtn}
          </button>
        </div>
      ) : (
        /* Primary In-App SOS Big Trigger Control */
        <div className="m-sos-hero-action">
          <p style={{ fontSize: "11.5px", color: "#fecdd3", margin: 0, lineHeight: 1.45 }}>
            {i18n.triggerDesc}
          </p>

          <button
            type="button"
            className={`m-big-sos-btn ${isPressing ? "pressing" : ""}`}
            onMouseDown={() => setIsPressing(true)}
            onMouseUp={() => setIsPressing(false)}
            onTouchStart={() => setIsPressing(true)}
            onTouchEnd={() => setIsPressing(false)}
            onClick={armSOS}
          >
            <ShieldAlert size={20} />
            <span>{i18n.triggerBtn}</span>
          </button>

          <div style={{ fontSize: "10.5px", color: "#94a3b8" }}>
            💡 {i18n.hwTrigger}
          </div>
        </div>
      )}

      {/* Live System Status Indicators (GPS & Network Relay State) */}
      <div className="m-sos-telemetry-grid">
        <div className="m-sos-telemetry-pill">
          <MapPin size={15} style={{ color: gpsAvailable ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
          <div>
            <span className="m-sos-telemetry-label">{i18n.gpsStatus}</span>
            <span className="m-sos-telemetry-val" style={{ color: gpsAvailable ? "#34d399" : "#fbbf24" }}>
              {gpsAvailable ? i18n.gpsAvail : i18n.gpsLast}
            </span>
          </div>
        </div>

        <div className="m-sos-telemetry-pill">
          {isOnline ? (
            <Wifi size={15} style={{ color: "#34d399", flexShrink: 0 }} />
          ) : (
            <WifiOff size={15} style={{ color: "#fbbf24", flexShrink: 0 }} />
          )}
          <div>
            <span className="m-sos-telemetry-label">{i18n.netRelay}</span>
            <span className="m-sos-telemetry-val" style={{ color: isOnline ? "#34d399" : "#fbbf24" }}>
              {isOnline ? i18n.netOnline : i18n.netOffline}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Direct Hotlines */}
      <div className="m-sos-helplines-grid">
        <a href="tel:1554" className="m-sos-helpline-pill cg">
          <PhoneCall size={13} style={{ color: "#f43f5e" }} />
          <span>{i18n.cgCall}</span>
        </a>

        <a href="tel:1093" className="m-sos-helpline-pill mp">
          <PhoneCall size={13} style={{ color: "#38bdf8" }} />
          <span>{i18n.mpCall}</span>
        </a>
      </div>
    </div>
  );
}
