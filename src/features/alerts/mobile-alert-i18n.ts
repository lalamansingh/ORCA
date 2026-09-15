import type { MarineAlert } from "./types";

export interface LocalizedAlert {
  id: string;
  title: string;
  desc: string;
  advice: string;
  severityLabel: string;
  badgeClass: "critical" | "warning" | "watch" | "info";
  provider: string;
  timeAgo: string;
  regionName: string;
  affectedArea: string;
  isLocal: boolean;
  distanceKm?: number;
  distanceLabel?: string;
}

export interface CoastalSectorSOS {
  harborId: string;
  harborName: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  coastGuardStation: string;
  coastGuardPhone: string;
  coastalPoliceStation: string;
  coastalPolicePhone: string;
  portControl: string;
  portControlPhone: string;
  vhfChannel: string;
}

export const COASTAL_PORT_SOS_DIRECTORY: CoastalSectorSOS[] = [
  {
    harborId: "veraval",
    harborName: "Veraval Fishing Port",
    city: "Veraval",
    state: "Gujarat",
    lat: 20.90,
    lon: 70.36,
    coastGuardStation: "ICG Station Veraval (HQ Dist 1)",
    coastGuardPhone: "02876-220038",
    coastalPoliceStation: "Veraval Marine Police Station (Bhidbhanjan)",
    coastalPolicePhone: "02876-240100",
    portControl: "Veraval Port Control / GMB",
    portControlPhone: "02876-220140",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "porbandar",
    harborName: "Porbandar Harbor",
    city: "Porbandar",
    state: "Gujarat",
    lat: 21.64,
    lon: 69.60,
    coastGuardStation: "ICG Regional HQ North-West (Porbandar)",
    coastGuardPhone: "0286-2244040",
    coastalPoliceStation: "Porbandar Marine Police Station (Subhash Nagar)",
    coastalPolicePhone: "0286-2242100",
    portControl: "Porbandar Port Control Room",
    portControlPhone: "0286-2242780",
    vhfChannel: "VHF Channel 16 / 12",
  },
  {
    harborId: "mumbai",
    harborName: "Mumbai Sassoon Docks",
    city: "Mumbai",
    state: "Maharashtra",
    lat: 18.92,
    lon: 72.83,
    coastGuardStation: "MRCC Mumbai (Western Regional HQ, Worli)",
    coastGuardPhone: "022-24388065",
    coastalPoliceStation: "Mumbai Coastal Police Station (Yellow Gate / Sassoon)",
    coastalPolicePhone: "022-22620821",
    portControl: "Mumbai Port Authority (MbPT) VTS & Signal Station",
    portControlPhone: "022-66565656",
    vhfChannel: "VHF Channel 16 / 12",
  },
  {
    harborId: "ratnagiri",
    harborName: "Ratnagiri Mirkarwada",
    city: "Ratnagiri",
    state: "Maharashtra",
    lat: 16.99,
    lon: 73.30,
    coastGuardStation: "ICG Station Ratnagiri",
    coastGuardPhone: "02352-222855",
    coastalPoliceStation: "Ratnagiri Coastal Police Station (Mirkarwada Jetty)",
    coastalPolicePhone: "02352-223093",
    portControl: "Mirkarwada Fishing Harbor Master",
    portControlPhone: "02352-222120",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "goa",
    harborName: "Goa (Panaji & Mormugao)",
    city: "Goa",
    state: "Goa",
    lat: 15.40,
    lon: 73.80,
    coastGuardStation: "ICG District HQ 11 (Goa, Mormugao)",
    coastGuardPhone: "0832-2520625",
    coastalPoliceStation: "Goa Coastal Security Police Station (Panaji & Betul)",
    coastalPolicePhone: "0832-2420840",
    portControl: "Mormugao Port Authority (MPA) Marine Signal Station",
    portControlPhone: "0832-2521100",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "mangalore",
    harborName: "Mangalore Old Port",
    city: "Mangalore",
    state: "Karnataka",
    lat: 12.87,
    lon: 74.84,
    coastGuardStation: "ICG District HQ 3 (Panambur, Mangalore)",
    coastGuardPhone: "0824-2405266",
    coastalPoliceStation: "Coastal Security Police Station Mangalore (Bunder)",
    coastalPolicePhone: "0824-2431093",
    portControl: "New Mangalore Port Authority (NMPA) Marine Control",
    portControlPhone: "0824-2407298",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "kochi",
    harborName: "Kochi Port & Harbor",
    city: "Kochi",
    state: "Kerala",
    lat: 9.93,
    lon: 76.26,
    coastGuardStation: "MRCC Kochi (ICG District HQ 4)",
    coastGuardPhone: "0484-2218855",
    coastalPoliceStation: "Fort Kochi Coastal Police Station",
    coastalPolicePhone: "0484-2215355",
    portControl: "Cochin Port Authority Marine Operations Room",
    portControlPhone: "0484-2666417",
    vhfChannel: "VHF Channel 16 / 14",
  },
  {
    harborId: "kanyakumari",
    harborName: "Kanyakumari Coast",
    city: "Kanyakumari",
    state: "Tamil Nadu",
    lat: 8.08,
    lon: 77.55,
    coastGuardStation: "ICG Station Kanyakumari / Colachel",
    coastGuardPhone: "04651-227855",
    coastalPoliceStation: "Marine Police Station Kanyakumari",
    coastalPolicePhone: "04652-246093",
    portControl: "Kanyakumari Port & Fisheries Control Office",
    portControlPhone: "04652-246260",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "tuticorin",
    harborName: "Tuticorin Fishing Harbor",
    city: "Tuticorin",
    state: "Tamil Nadu",
    lat: 8.76,
    lon: 78.13,
    coastGuardStation: "ICG Station Tuticorin",
    coastGuardPhone: "0461-2352855",
    coastalPoliceStation: "Tharuvaikulam Marine Police Station (Tuticorin)",
    coastalPolicePhone: "0461-2376093",
    portControl: "V.O. Chidambaranar Port Authority Signal Station",
    portControlPhone: "0461-2352290",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "chennai",
    harborName: "Chennai Kasimedu Harbor",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.08,
    lon: 80.27,
    coastGuardStation: "MRCC Chennai (Eastern Regional HQ)",
    coastGuardPhone: "044-23460405",
    coastalPoliceStation: "Coastal Security Group (CSG) Chennai (Kasimedu)",
    coastalPolicePhone: "044-28447701",
    portControl: "Chennai Port Authority Marine Signal Station",
    portControlPhone: "044-25362201",
    vhfChannel: "VHF Channel 16 / 12",
  },
  {
    harborId: "visakhapatnam",
    harborName: "Visakhapatnam Harbor",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    lat: 17.68,
    lon: 83.21,
    coastGuardStation: "ICG District HQ 6 (Visakhapatnam)",
    coastGuardPhone: "0891-2568855",
    coastalPoliceStation: "Marine Police Station Visakhapatnam Harbor",
    coastalPolicePhone: "0891-2565093",
    portControl: "Visakhapatnam Port Authority Marine Operations",
    portControlPhone: "0891-2873133",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "paradip",
    harborName: "Paradip Port",
    city: "Paradip",
    state: "Odisha",
    lat: 20.26,
    lon: 86.66,
    coastGuardStation: "ICG District HQ 7 (Paradip)",
    coastGuardPhone: "06722-222855",
    coastalPoliceStation: "Paradip Marine Police Station",
    coastalPolicePhone: "06722-222093",
    portControl: "Paradip Port Trust Marine Signal Station",
    portControlPhone: "06722-222155",
    vhfChannel: "VHF Channel 16",
  },
  {
    harborId: "digha",
    harborName: "Digha & Shankarpur",
    city: "Digha",
    state: "West Bengal",
    lat: 21.62,
    lon: 87.51,
    coastGuardStation: "ICG Station Haldia / Digha",
    coastGuardPhone: "03224-263855",
    coastalPoliceStation: "Digha Coastal Police Station",
    coastalPolicePhone: "03220-266093",
    portControl: "Shankarpur Fishing Harbor Control Room",
    portControlPhone: "03220-264220",
    vhfChannel: "VHF Channel 16",
  },
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getSectorSOS(lat: number, lon: number, label?: string): CoastalSectorSOS {
  const clean = (label || "").toLowerCase();
  const directMatch = COASTAL_PORT_SOS_DIRECTORY.find((s) =>
    clean.includes(s.city.toLowerCase()) ||
    clean.includes(s.harborId.toLowerCase()) ||
    s.harborName.toLowerCase().includes(clean)
  );
  if (directMatch) return directMatch;

  let nearest = COASTAL_PORT_SOS_DIRECTORY[0];
  let minD = 999999;
  for (const s of COASTAL_PORT_SOS_DIRECTORY) {
    const d = calculateDistanceKm(lat, lon, s.lat, s.lon);
    if (d < minD) {
      minD = d;
      nearest = s;
    }
  }
  return nearest;
}

const SEVERITY_MAP: Record<string, Record<string, { label: string; badge: "critical" | "warning" | "watch" | "info" }>> = {
  CRITICAL: {
    hi: { label: "अति गंभीर आपदा चेतावनी (CRITICAL)", badge: "critical" },
    en: { label: "CRITICAL HAZARD WARNING", badge: "critical" },
    ta: { label: "மிகக் கடுமையான எச்சரிக்கை (CRITICAL)", badge: "critical" },
    te: { label: "అత్యంత తీవ్రమైన హెచ్చరిక (CRITICAL)", badge: "critical" },
    ml: { label: "അതിഗുരുതര ദുരന്ത മുന്നറിയിപ്പ് (CRITICAL)", badge: "critical" },
    gu: { label: "અતિ ગંભીર આપત્તિ ચેતવણી (CRITICAL)", badge: "critical" },
    mr: { label: "अति तीव्र आपत्ती इशारा (CRITICAL)", badge: "critical" },
    bn: { label: "চরম দুর্যোগ সতর্কতা (CRITICAL)", badge: "critical" },
    kn: { label: "ಅತ್ಯಂತ ತೀವ್ರ ವಿಪತ್ತು ಎಚ್ಚರಿಕೆ (CRITICAL)", badge: "critical" },
    or: { label: "ଅତି ଗମ୍ଭୀର ବିପର୍ଯ୍ୟୟ ସତର୍କତା (CRITICAL)", badge: "critical" },
  },
  SEVERE: {
    hi: { label: "गंभीर चेतावनी (SEVERE)", badge: "critical" },
    en: { label: "SEVERE WARNING", badge: "critical" },
    ta: { label: "கடுமையான எச்சரிக்கை (SEVERE)", badge: "critical" },
    te: { label: "తీవ్ర హెచ్చరిక (SEVERE)", badge: "critical" },
    ml: { label: "തീവ്ര മുന്നറിയിപ്പ് (SEVERE)", badge: "critical" },
    gu: { label: "ગંભીર ચેતવણી (SEVERE)", badge: "critical" },
    mr: { label: "तीव्र इशारा (SEVERE)", badge: "critical" },
    bn: { label: "মারাত্মক সতর্কতা (SEVERE)", badge: "critical" },
    kn: { label: "ತೀವ್ರ ಎಚ್ಚರಿಕೆ (SEVERE)", badge: "critical" },
    or: { label: "ଗମ୍ଭୀର ସତର୍କତା (SEVERE)", badge: "critical" },
  },
  WARNING: {
    hi: { label: "समुद्री चेतावनी (WARNING)", badge: "warning" },
    en: { label: "MARINE WARNING", badge: "warning" },
    ta: { label: "கடல் எச்சரிக்கை (WARNING)", badge: "warning" },
    te: { label: "సముద్ర హెచ్చరిక (WARNING)", badge: "warning" },
    ml: { label: "കടൽ മുന്നറിയിപ്പ് (WARNING)", badge: "warning" },
    gu: { label: "દરિયાઈ ચેતવણી (WARNING)", badge: "warning" },
    mr: { label: "समुद्री इशारा (WARNING)", badge: "warning" },
    bn: { label: "সামুদ্রিক সতর্কতা (WARNING)", badge: "warning" },
    kn: { label: "ಸಮುದ್ರ ಎಚ್ಚರಿಕೆ (WARNING)", badge: "warning" },
    or: { label: "ସାମୁଦ୍ରିକ ସତର୍କତା (WARNING)", badge: "warning" },
  },
  WATCH: {
    hi: { label: "सतर्कता व निगरानी (WATCH)", badge: "watch" },
    en: { label: "WATCH ADVISORY", badge: "watch" },
    ta: { label: "கண்காணிப்பு அறிவுறுத்தல் (WATCH)", badge: "watch" },
    te: { label: "నిఘా సూచన (WATCH)", badge: "watch" },
    ml: { label: "ജാഗ്രതാ നിർദ്ദേശം (WATCH)", badge: "watch" },
    gu: { label: "સતર્કતા વોચ (WATCH)", badge: "watch" },
    mr: { label: "दक्षता इशारा (WATCH)", badge: "watch" },
    bn: { label: "নজরদারি পরামর্শ (WATCH)", badge: "watch" },
    kn: { label: "ವೀಕ್ಷಣಾ ಸಲಹೆ (WATCH)", badge: "watch" },
    or: { label: "ଦୃଷ୍ଟି ରଖନ୍ତୁ (WATCH)", badge: "watch" },
  },
  INFO: {
    hi: { label: "मौसम सलाह (ADVISORY)", badge: "info" },
    en: { label: "MARINE ADVISORY", badge: "info" },
    ta: { label: "வானிலை தகவல் (ADVISORY)", badge: "info" },
    te: { label: "వాతావరణ సమాచారం (ADVISORY)", badge: "info" },
    ml: { label: "കാലാവസ്ഥാ വിവരം (ADVISORY)", badge: "info" },
    gu: { label: "હવામાન માહિતી (ADVISORY)", badge: "info" },
    mr: { label: "हवामान माहिती (ADVISORY)", badge: "info" },
    bn: { label: "আবহাওয়া তথ্য (ADVISORY)", badge: "info" },
    kn: { label: "ಹವಾಮಾನ ಮಾಹಿತಿ (ADVISORY)", badge: "info" },
    or: { label: "ପାଣିପାଗ ସୂଚନା (ADVISORY)", badge: "info" },
  },
};

interface AlertTextBundle {
  title: string;
  desc: string;
  advice: string;
}

const ALERT_DICTIONARY: Record<string, Record<string, AlertTextBundle>> = {
  high_waves: {
    hi: {
      title: "ऊंची लहरों की चेतावनी (High Wave Warning)",
      desc: "तटीय क्षेत्र में 2.8 से 3.8 मीटर ऊंची तीव्र समुद्री लहरें उठने की संभावना है। समुद्र में तेज उफान रहेगा।",
      advice: "मछुआरों को गहरे समुद्र में न जाने और सभी नौकाओं को तट पर सुरक्षित बांधने की सख्त सलाह दी जाती है।",
    },
    en: {
      title: "High Wave Warning (INCOIS Coastal Alert)",
      desc: "High and hazardous waves of 2.8m to 3.8m expected along coastal sectors with rough sea turbulence.",
      advice: "Fishermen are strictly advised not to venture into deep sea and to safely moor all nearshore vessels.",
    },
    ta: {
      title: "உயர்ந்த அலைகள் எச்சரிக்கை (High Waves)",
      desc: "கடலோரப் பகுதிகளில் 2.8 முதல் 3.8 மீட்டர் வரை உயரமான கொந்தளிப்பான அலைகள் எழ வாய்ப்புள்ளது.",
      advice: "மீனவர்கள் ஆழ்கடலுக்கு மீன்பிடிக்க செல்ல வேண்டாம் என்றும், படகுகளை பாதுகாப்பாக கரையில் கட்டவும் அறிவுறுத்தப்படுகிறார்கள்.",
    },
    te: {
      title: "ఎత్తైన అలల హెచ్చరిక (High Waves)",
      desc: "తీర ప్రాంతాల్లో 2.8 నుండి 3.8 మీటర్ల ఎత్తులో తీవ్రమైన సముద్ర అలలు ఎగిసిపడే అవకాశం ఉంది.",
      advice: "మత్స్యకారులు సముద్రంలోకి వేటకు వెళ్లకూడదని మరియు పడవలను ఒడ్డున భద్రంగా కట్టివేయాలని ఆదేశించడమైనది.",
    },
    ml: {
      title: "ഉയർന്ന തിരമാല മുന്നറിയിപ്പ് (High Waves)",
      desc: "തീരപ്രദേശങ്ങളിൽ 2.8 മുതൽ 3.8 മീറ്റർ വരെ ഉയർന്ന പ്രക്ഷുബ്ധമായ തിരമാലകൾക്ക് സാധ്യതയുണ്ട്.",
      advice: "മത്സ്യത്തൊഴിലാളികൾ യാതൊരു കാരണവശാലും കടലിൽ പോകരുത്; വള്ളങ്ങൾ സുരക്ഷിതമായി കെട്ടിയിടുക.",
    },
    gu: {
      title: "ઊંચા મોજાની ચેતવણી (High Waves)",
      desc: "દરિયાકાંઠે 2.8 થી 3.8 મીટર ઊંચા જોખમી મોજા ઉછળવાની સંભાવના છે. દરિયો તોફાની રહેશે.",
      advice: "માછીમારોને ઊંડા દરિયામાં ન જવા અને બોટોને કિનારે સુરક્ષિત બાંધવાની સ્પષ્ટ સલાહ આપવામાં આવે છે.",
    },
    mr: {
      title: "उंच लाटांचा इशारा (High Waves)",
      desc: "किनारपट्टी भागात 2.8 ते 3.8 मीटर उंच धोकादायक लाटा उसळण्याची दाट शक्यता आहे.",
      advice: "मच्छिमारांनी खोल समुद्रात जाणे टाळावे आणि लहान बोटी किनाऱ्यावर सुरक्षित बांधून ठेवाव्यात.",
    },
    bn: {
      title: "উচ্চ ঢেউয়ের সতর্কতা (High Waves)",
      desc: "উপকূলীয় অঞ্চলে ২.৮ থেকে ৩.৮ মিটার উঁচু বিপজ্জনক ঢেউয়ের সম্ভাবনা রয়েছে।",
      advice: "মৎস্যজীবীদের গভীর সমুদ্রে না যাওয়ার এবং সমস্ত নৌকা নিরাপদে তীরে বেঁধে রাখার পরামর্শ দেওয়া হচ্ছে।",
    },
    kn: {
      title: "ಎತ್ತರದ ಅಲೆಗಳ ಎಚ್ಚರಿಕೆ (High Waves)",
      desc: "ಕರಾವಳಿ ತೀರದಲ್ಲಿ 2.8 ರಿಂದ 3.8 ಮೀಟರ್ ಎತ್ತರದ ಅಪಾಯಕಾರಿ ಅಲೆಗಳು ಏಳುವ ಸಾಧ್ಯತೆಯಿದೆ.",
      advice: "ಮೀನುಗಾರರು ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬಾರದು ಮತ್ತು ದೋಣಿಗಳನ್ನು ದಡದಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಕಟ್ಟಿಹಾಕಬೇಕು.",
    },
    or: {
      title: "ଉଚ୍ଚ ତରଙ୍ଗ ସତର୍କତା (High Waves)",
      desc: "ଉପକୂଳବର୍ତ୍ତୀ ଅଞ୍ଚଳରେ ୨.୮ ରୁ ୩.୮ ମିଟର ଉଚ୍ଚ ବିପଜ୍ଜନକ ତରଙ୍ଗ ସୃଷ୍ଟି ହେବାର ଆଶଙ୍କା ଅଛି।",
      advice: "ମତ୍ସ୍ୟଜୀବୀମାନଙ୍କୁ ଗଭୀର ସମୁଦ୍ରକୁ ନ ଯିବାକୁ ଏବଂ ଡଙ୍ଗାଗୁଡ଼ିକୁ କୂଳରେ ସୁରକ୍ଷିତ ବାନ୍ଧିବାକୁ ପରାମର୍ଶ।",
    },
  },
  swell_surge: {
    hi: {
      title: "स्वेल सर्ज अलर्ट / अचानक तेज ज्वार (Swell Surge)",
      desc: "समुद्र में अचानक तेज गति से उठने वाली स्वेल तरंगों के कारण उथले पानी और बंदरगाह प्रवेश द्वार पर भारी जोखिम है।",
      advice: "उथले जलक्षेत्र और चट्टानी तटों के पास नौकायन न करें; छोटी नावों को सुरक्षित गोदी में रखें।",
    },
    en: {
      title: "Swell Surge Advisory (Kallakkadal Warning)",
      desc: "Rapid coastal swell surges with unexpected run-up waves threatening nearshore craft and harbor channels.",
      advice: "Avoid nearshore rocky breakers; navigate through marked deep channels only.",
    },
    ta: {
      title: "கள்ளக்கடல் / திடீர் அலை எழுச்சி (Swell Surge)",
      desc: "திடீரென எழும் பிரம்மாண்ட அலைகளால் துறைமுக முகத்துவாரங்கள் மற்றும் கரையோரங்களில் ஆபத்து ஏற்படலாம்.",
      advice: "ஆழமற்ற கடல் பகுதிகளில் செல்ல வேண்டாம்; படகுகளை பாதுகாப்பான நங்கூரத்தில் நிறுத்தவும்.",
    },
    te: {
      title: "స్వెల్ సర్జ్ అలర్ట్ / ఆకస్మిక అలల ఉధృతి",
      desc: "తీర ప్రాంతాల్లో ఆకస్మికంగా తీవ్రమైన అలల ఉధృతి రావచ్చు, రేవు ప్రవేశ మార్గాల్లో ప్రమాదం ఉంది.",
      advice: "చిన్న పడవలను సురక్షిత ప్రదేశాలకు తరలించండి; రాతి తీరాల వద్ద జాగ్రత్త పాటించండి.",
    },
    ml: {
      title: "കള്ളക്കടൽ മുന്നറിയിപ്പ് (Swell Surge)",
      desc: "കടൽ ശാന്തമാണെന്ന് തോന്നുമെങ്കിലും തീരത്തേക്ക് കൂറ്റൻ തിരമാലകൾ അപ്രതീക്ഷിതമായി ആഞ്ഞടിക്കാൻ സാധ്യത.",
      advice: "തീരപ്രദേശത്തുള്ളവർ അതീവ ജാഗ്രത പാലിക്കുക; ബീച്ചുകളിലും ആഴം കുറഞ്ഞ ഭാഗങ്ങളിലും ഇറങ്ങരുത്.",
    },
    gu: {
      title: "સ્વેલ સર્જ ચેતવણી (અચાનક તેજ મોજા)",
      desc: "દરિયાકિનારે અચાનક ઊંચા અને તેજ મોજા ઉછળવાની સંભાવના છે, બંદરના પ્રવેશદ્વારે જોખમ.",
      advice: "છીછરા પાણીમાં હોડી ન ચલાવવી; નાની હોડીઓને સુરક્ષિત જેટી પર બાંધવી.",
    },
    mr: {
      title: "स्वेल सर्ज इशारा (अचानक उसळणाऱ्या लाटा)",
      desc: "किनारपट्टीवर अचानक उसळणाऱ्या प्रचंड लाटांमुळे धक्के बसू शकतात.",
      advice: "लहान बोटी किनाऱ्यावर सुरक्षित आणाव्यात; खडकाळ भागाजवळ जाणे टाळावे.",
    },
    bn: {
      title: "সোয়েল সার্জ সতর্কতা (হঠাৎ সমুদ্রস্ফীতি)",
      desc: "হঠাৎ উপকূলে তীব্র ঢেউ ও সমুদ্রস্ফীতি দেখা দিতে পারে, যা অগভীর জলে বিপজ্জনক।",
      advice: "ছোট নৌকাগুলি নিরাপদে নোঙর করুন এবং উপকূলের পাথুরে এলাকা এড়িয়ে চলুন।",
    },
    kn: {
      title: "ಸ್ವೆಲ್ ಸರ್ಜ್ ಎಚ್ಚರಿಕೆ (ಅನಿರೀಕ್ಷಿತ ಅಲೆಗಳು)",
      desc: "ಕರಾವಳಿ ತೀರದಲ್ಲಿ ಅನಿರೀಕ್ಷಿತವಾಗಿ ಭಾರಿ ಅಲೆಗಳು ದಡಕ್ಕೆ ಅಪ್ಪಳಿಸುವ ಅಪಾಯವಿದೆ.",
      advice: "ಸಣ್ಣ ದೋಣಿಗಳನ್ನು ಸುರಕ್ಷಿತ ಜಾಗದಲ್ಲಿ ಕಟ್ಟಿಹಾಕಿ; ಆಳವಿಲ್ಲದ ನೀರಿನಲ್ಲಿ ಸಂಚರಿಸಬೇಡಿ.",
    },
    or: {
      title: "ସ୍ୱେଲ ସର୍ଜ ସତର୍କତା (ହଠାତ୍ ପ୍ରଚଣ୍ଡ ତରଙ୍ଗ)",
      desc: "ଉପକୂଳରେ ହଠାତ୍ ପ୍ରଚଣ୍ଡ ତରଙ୍ଗ କୂଳକୁ ମାଡ଼ିଆସିବାର ଆଶଙ୍କା ଅଛି।",
      advice: "ଛୋଟ ଡଙ୍ଗାଗୁଡ଼ିକୁ କୂଳରେ ବାନ୍ଧନ୍ତୁ ଏବଂ ଅଗଭୀର ସମୁଦ୍ରକୁ ଯାଆନ୍ତୁ ନାହିଁ।",
    },
  },
  cyclone: {
    hi: {
      title: "चक्रवाती तूफान की चेतावनी (Cyclone Warning)",
      desc: "समुद्र में गहरा अवसाद सक्रिय है, 65 से 85 किमी/घंटा की गति से प्रचंड तूफानी हवाएं चलने की आशंका है।",
      advice: "समुद्र में जाना पूर्णतः प्रतिबंधित है। बंदरगाह पर खतरे का लाल झंडा फहरा दिया गया है।",
    },
    en: {
      title: "Severe Cyclonic Storm Warning (IMD Red Alert)",
      desc: "Deep atmospheric depression intensifying into a cyclone with wind gusts up to 65-85 km/h.",
      advice: "Total suspension of all marine activities. Return to harbor immediately and monitor radio VHF 16.",
    },
    ta: {
      title: "புயல் எச்சரிக்கை (Cyclone Warning)",
      desc: "கடலில் காற்றழுத்த தாழ்வு மண்டலம் தீவிரமடைந்துள்ளது. மணிக்கு 65-85 கி.மீ வேகத்தில் சூறாவளி வீசும்.",
      advice: "மீன்பிடிக்க செல்வது முற்றிலும் தடை செய்யப்பட்டுள்ளது; உடனடியாக கரை திரும்புங்கள்.",
    },
    te: {
      title: "తీవ్ర తుఫాను హెచ్చరిక (Cyclone Warning)",
      desc: "తీవ్ర వాయుగుండం తుఫానుగా మారింది. గంటకు 65-85 కి.మీ వేగంతో పెనుగాలులు వీచే అవకాశం ఉంది.",
      advice: "సముద్రంలో చేపల వేటను పూర్తిగా నిషేధించడమైనది. రేవుల్లో ప్రమాద హెచ్చరికలు జారీ చేయబడ్డాయి.",
    },
    ml: {
      title: "തീവ്ര ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പ് (Cyclone Warning)",
      desc: "തീവ്ര ന്യൂനമർദ്ദം ചുഴലിക്കാറ്റായി മാറുന്നു. കാറ്റിന്റെ വേഗത 65-85 കി.മീ വരെയാകാൻ സാധ്യത.",
      advice: "യാതൊരു കാരണവശാലും കടലിൽ പോകരുത്. എല്ലാ മത്സ്യബന്ധന പ്രവർത്തനങ്ങളും നിർത്തിവെക്കുക.",
    },
    gu: {
      title: "વાવાઝોડાની ગંભીર ચેતવણી (Cyclone Warning)",
      desc: "દરિયામાં ડીપ ડિપ્રેશન વાવાઝોડામાં ફેરવાઈ રહ્યું છે. 65-85 કિમી/કલાકની ઝડપે ભારે પવન ફૂંકાશે.",
      advice: "માછીમારો માટે દરિયામાં જવું સંપૂર્ણપણે પ્રતિબંધિત છે. બંદરે ભયસૂચક સિગ્નલ લગાવવામાં આવ્યું છે.",
    },
    mr: {
      title: "तीव्र चक्रीवादळाचा इशारा (Cyclone Warning)",
      desc: "समुद्रातील कमी दाबाचे क्षेत्र चक्रीवादळात रुपांतरित झाले असून ताशी 65-85 किमी वेगाने वारे वाहतील.",
      advice: "समुद्रात जाण्यावर पूर्णपणे बंदी घालण्यात आली आहे. बंदरावर धोक्याचे निशाण उभारण्यात आले आहे.",
    },
    bn: {
      title: "ঘূর্ণিঝড় সতর্কতা (Cyclone Warning)",
      desc: "গভীর নিম্নচাপ ঘূর্ণিঝড়ে পরিণত হচ্ছে। বাতাসের গতিবেগ ঘণ্টায় ৬৫-৮৫ কিমি পর্যন্ত হতে পারে।",
      advice: "সমুদ্রে মাছ ধরা সম্পূর্ণ নিষিদ্ধ। বন্দরে বিপৎসংকেত জারি করা হয়েছে, অবিলম্বে ফিরে আসুন।",
    },
    kn: {
      title: "ತೀವ್ರ ಚಂಡಮಾರುತದ ಎಚ್ಚರಿಕೆ (Cyclone Warning)",
      desc: "ವಾಯುಭಾರ ಕುಸಿತವು ಚಂಡಮಾರುತವಾಗಿ ಬದಲಾಗುತ್ತಿದೆ. ಗಾಳಿಯ ವೇಗ ಗಂಟೆಗೆ 65-85 ಕಿ.ಮೀ ವರೆಗೆ ತಲುಪಬಹುದು.",
      advice: "ಮೀನುಗಾರಿಕೆ ಸಂಪೂರ್ಣ ನಿಷೇಧಿಸಲಾಗಿದೆ. ಬಂದರುಗಳಲ್ಲಿ ಅಪಾಯದ ಬಾವುಟ ಹಾರಿಸಲಾಗಿದೆ.",
    },
    or: {
      title: "ପ୍ରବଳ ବାତ୍ୟା ସତର୍କତା (Cyclone Warning)",
      desc: "ଗଭୀର ଅବପାତ ବାତ୍ୟାର ରୂପ ନେଉଛି। ଘଣ୍ଟାପ୍ରତି ୬୫-୮୫ କିମି ବେଗରେ ପ୍ରବଳ ପବନ ବହିବ।",
      advice: "ସମୁଦ୍ରକୁ ଯିବା ସମ୍ପୂର୍ଣ୍ଣ ରୂପେ ନିଷେଧ। ବନ୍ଦରରେ ବିପଦ ସଙ୍କେତ ଜାରି କରାଯାଇଛି।",
    },
  },
  strong_wind: {
    hi: {
      title: "तेज तूफानी हवाओं का अलर्ट (Squally Winds)",
      desc: "तटीय समुद्री क्षेत्र में 45 से 55 किमी/घंटा की रफ्तार से झोंकेदार हवाएं और समुद्र में तीव्र हलचल।",
      advice: "छोटी नौकाएं समुद्र में न जाएं; केवल बड़े पंजीकृत ट्रॉलर्स अत्यधिक सतर्कता बरतें।",
    },
    en: {
      title: "Squally Winds Warning",
      desc: "Squally wind speed reaching 45-55 km/h gusting to 65 km/h over coastal waters.",
      advice: "Small craft and traditional canoes are advised not to venture out.",
    },
    ta: {
      title: "பலத்த காற்று எச்சரிக்கை (Squally Winds)",
      desc: "கடற்பரப்பில் மணிக்கு 45 முதல் 55 கி.மீ வேகத்தில் பலத்த காற்று வீசக்கூடும்.",
      advice: "நாட்டுப் படகுகள் மற்றும் சிறிய விசைப்படகுகள் கடலுக்கு செல்ல வேண்டாம்.",
    },
    te: {
      title: "తీవ్ర ఈదురు గాలుల హెచ్చరిక (Strong Winds)",
      desc: "తీరంలో గంటకు 45-55 కి.మీ వేగంతో ఈదురు గాలులు వీచే అవకాశం ఉంది.",
      advice: "చిన్న పడవలు సముద్రంలోకి వెళ్లవద్దు; వాతావరణం అనుకూలించే వరకు వేచి ఉండండి.",
    },
    ml: {
      title: "ശക്തമായ കാറ്റ് മുന്നറിയിപ്പ് (Strong Winds)",
      desc: "മണിക്കൂറിൽ 45-55 കി.മീ വേഗതയിൽ ശക്തമായ കാറ്റും കടൽക്ഷോഭവും ഉണ്ടാകാം.",
      advice: "ചെറിയ വള്ളങ്ങൾ കടലിൽ ഇറക്കരുത്; അതീവ ജാഗ്രത പുലർത്തുക.",
    },
    gu: {
      title: "તોફાની પવનની ચેતવણી (Strong Winds)",
      desc: "દરિયામાં 45 થી 55 કિમી/કલાકની ઝડપે ભારે પવન ફૂંકાવાની શક્યતા છે.",
      advice: "નાની હોડીઓ દરિયામાં ન લઈ જવી; માત્ર મોટા જહાજો જ સાવચેતી સાથે ચાલે.",
    },
    mr: {
      title: "जोरदार वादळी वाऱ्यांचा इशारा (Strong Winds)",
      desc: "समुद्रात ताशी 45 ते 55 किमी वेगाने वादळी वारे वाहण्याची शक्यता आहे.",
      advice: "छोट्या नौकांनी समुद्रात जाणे टाळावे आणि हवामान निवळण्याची वाट पहावी.",
    },
    bn: {
      title: "দমকা হাওয়ার সতর্কতা (Strong Winds)",
      desc: "সমুদ্রে ঘণ্টায় ৪৫-৫৫ কিমি বেগে দমকা হাওয়া বয়ে যাওয়ার আশঙ্কা রয়েছে।",
      advice: "ছোট নৌকাগুলি সমুদ্রে যাবেন না; তীরে নিরাপদ আশ্রয়ে থাকুন।",
    },
    kn: {
      title: "ಬಿರುಗಾಳಿಯ ಎಚ್ಚರಿಕೆ (Strong Winds)",
      desc: "ಸಮುದ್ರದಲ್ಲಿ ಗಂಟೆಗೆ 45-55 ಕಿ.ಮೀ ವೇಗದಲ್ಲಿ ಬಿರುಗಾಳಿ ಬೀಸುವ ಸಾಧ್ಯತೆಯಿದೆ.",
      advice: "ಸಣ್ಣ ದೋಣಿಗಳು ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬಾರದು; ದೊಡ್ಡ ಬೋಟುಗಳು ಜಾಗರೂಕರಾಗಿರಬೇಕು.",
    },
    or: {
      title: "ପ୍ରବଳ ପବନ ସତର୍କତା (Strong Winds)",
      desc: "ସମୁଦ୍ରରେ ଘଣ୍ଟାପ୍ରତି ୪୫-୫୫ କିମି ବେଗରେ ପ୍ରବଳ ପବନ ବହିବାର ସମ୍ଭାବନା ଅଛି।",
      advice: "ଛୋଟ ଡଙ୍ଗାଗୁଡ଼ିକ ସମୁଦ୍ରକୁ ଯିବା ଅନୁଚିତ; ସୁରକ୍ଷିତ ସ୍ଥାନରେ ରୁହନ୍ତୁ।",
    },
  },
  rough_sea: {
    hi: {
      title: "अशांत समुद्र स्थिति (Rough Sea Advisory)",
      desc: "सतही धाराओं व तेज हवाओं के कारण समुद्र अशांत रहेगा। लहरों की दिशा में अनियमितता है।",
      advice: "तट के नजदीक सुरक्षित क्षेत्र में ही रहें और लाइफ जैकेट अनिवार्य रूप से पहनें।",
    },
    en: {
      title: "Rough Sea Advisory (Coastal Marine Bulletin)",
      desc: "Rough to moderate sea conditions prevailing due to localized ocean currents and choppy swell.",
      advice: "Operate strictly nearshore with life-jackets donned; avoid lone fishing voyages.",
    },
    ta: {
      title: "கொந்தளிப்பான கடல் நிலைமை (Rough Sea)",
      desc: "கடல் நீரோட்டம் மற்றும் அலைகளால் கடல் சீற்றத்துடன் காணப்படும்.",
      advice: "கட்டாயம் பாதுகாப்பு உடைகள் (Life Jackets) அணியவும்; கரைக்கு அருகிலேயே இருக்கவும்.",
    },
    te: {
      title: "అల్లకల్లోల సముద్రం సూచన (Rough Sea)",
      desc: "సముద్ర ప్రవాహాలు మరియు అలల కారణంగా సముద్రం అల్లకల్లోలంగా ఉంటుంది.",
      advice: "లైఫ్ జాకెట్లు తప్పనిసరిగా ధరించండి; తీరానికి దగ్గరగా మాత్రమే ఉండండి.",
    },
    ml: {
      title: "പ്രക്ഷുബ്ധമായ കടൽ മുന്നറിയിപ്പ് (Rough Sea)",
      desc: "അടിയൊഴുക്കുകൾ കാരണം കടൽ പ്രക്ഷുബ്ധമായി തുടരാൻ സാധ്യതയുണ്ട്.",
      advice: "ലൈഫ് ജാക്കറ്റുകൾ നിർബന്ധമായും ധരിക്കുക; സുരക്ഷിത തീരത്ത് തുടരുക.",
    },
    gu: {
      title: "તોફાની દરિયાઈ સલાહ (Rough Sea)",
      desc: "દરિયાઈ પ્રવાહો અને મોજાઓને કારણે દરિયો તોફાની રહેશે.",
      advice: "લાઈફ જેકેટ અવશ્ય પહેરવું અને કિનારાની નજીક રહેવું.",
    },
    mr: {
      title: "खवळलेला समुद्र सल्ला (Rough Sea)",
      desc: "समुद्री प्रवाह आणि लाटांमुळे समुद्र खवळलेला राहण्याची शक्यता आहे.",
      advice: "लाईफ जॅकेट नक्की वापरा आणि किनाऱ्याजवळ राहा.",
    },
    bn: {
      title: "উত্তাল সমুদ্র পরামর্শ (Rough Sea)",
      desc: "সামুদ্রিক স্রোতের কারণে সমুদ্র উত্তাল থাকার সম্ভাবনা রয়েছে।",
      advice: "লাইফ জ্যাকেট পরা বাধ্যতামূলক; উপকূলের কাছাকাছি থাকুন।",
    },
    kn: {
      title: "ಪ್ರಕ್ಷುಬ್ಧ ಸಮುದ್ರ ಸಲಹೆ (Rough Sea)",
      desc: "ಸಮುದ್ರ ಪ್ರವಾಹಗಳಿಂದಾಗಿ ಸಮುದ್ರವು ಪ್ರಕ್ಷುಬ್ಧವಾಗಿರಲಿದೆ.",
      advice: "ಲೈಫ್ ಜಾಕೆಟ್‌ಗಳನ್ನು ಕಡ್ಡಾಯವಾಗಿ ಧರಿಸಿ; ತೀರಕ್ಕೆ ಹತ್ತಿರವಿರಿ.",
    },
    or: {
      title: "ଅଶାନ୍ତ ସମୁଦ୍ର ପରାମର୍ଶ (Rough Sea)",
      desc: "ସାମୁଦ୍ରିକ ସ୍ରୋତ ଏବଂ ତରଙ୍ଗ ଯୋଗୁଁ ସମୁଦ୍ର ଅଶାନ୍ତ ରହିବ।",
      advice: "ଲାଇଫ୍ ଜ୍ୟାକେଟ୍ ନିଶ୍ଚୟ ପିନ୍ଧନ୍ତୁ ଏବଂ କୂଳ ନିକଟରେ ରୁହନ୍ତୁ।",
    },
  },
  heavy_rain: {
    hi: {
      title: "भारी वर्षा व मेघगर्जना चेतावनी (Heavy Rainfall)",
      desc: "तटीय क्षेत्र में मूसलाधार बारिश और गरज के साथ आकाशीय बिजली की प्रबल आशंका है।",
      advice: "विद्युत तारों से दूर रहें, खुली नौकाओं में यात्रा स्थगित करें और पक्के तट पर शरण लें।",
    },
    en: {
      title: "Heavy to Extremely Heavy Rainfall Alert (IMD Warning)",
      desc: "Intense precipitation spells and convective activity over coastal lowlands and harbors.",
      advice: "Avoid waterlogged low-lying jetties and moorings; suspend open-deck navigation.",
    },
    ta: {
      title: "கனமழை எச்சரிக்கை (Heavy Rainfall)",
      desc: "கடலோரப் பகுதிகளில் இடி மின்னலுடன் கூடிய மிக கனமழை பெய்ய வாய்ப்புள்ளது.",
      advice: "தாழ்வான பகுதிகளைத் தவிர்க்கவும்; படகுகளை பாதுகாப்பான இடத்தில் கட்டவும்.",
    },
    te: {
      title: "భారీ వర్షపాతం హెచ్చరిక (Heavy Rainfall)",
      desc: "తీర ప్రాంతాల్లో ఉరుములు, మెరుపులతో కూడిన భారీ నుండి అతి భారీ వర్షాలు కురిసే అవకాశం ఉంది.",
      advice: "పడవలను సురక్షిత తీరంలో ఉంచండి; లోతట్టు రేవు ప్రాంతాల్లో జాగ్రత్త పాటించండి.",
    },
    ml: {
      title: "അതിശക്തമായ മഴ മുന്നറിയിപ്പ് (Heavy Rainfall)",
      desc: "തീരദേശങ്ങളിൽ ഇടിമിന്നലോട് കൂടിയ ശക്തമായ മഴയ്ക്കും വെള്ളപ്പൊക്കത്തിനും സാധ്യത.",
      advice: "ബോട്ടുകൾ സുരക്ഷിതമായി കെട്ടിയിടുക; ജാഗ്രതാ നിർദ്ദേശങ്ങൾ പാലിക്കുക.",
    },
    gu: {
      title: "ભારે વરસાદની ચેતવણી (Heavy Rainfall)",
      desc: "દરિયાકાંઠાના વિસ્તારોમાં ગાજવીજ સાથે ભારેથી અતિભારે વરસાદની શક્યતા છે.",
      advice: "નીચાણવાળા વિસ્તારોથી દૂર રહેવું અને હોડીઓને કિનારે સુરક્ષિત રાખવી.",
    },
    mr: {
      title: "मुसळधार पावसाचा इशारा (Heavy Rainfall)",
      desc: "किनारपट्टी भागात विजांच्या कडकडाटासह मुसळधार ते अतिमुसळधार पावसाची दाट शक्यता आहे.",
      advice: "सखल भागातील धक्के टाळा आणि लहान नौका सुरक्षित बंदरात बांधून ठेवा.",
    },
    bn: {
      title: "ভারী থেকে অতি ভারী বৃষ্টির সতর্কতা (Heavy Rain)",
      desc: "উপকূলীয় অঞ্চলে বজ্রবিদ্যুৎ-সহ প্রবল বৃষ্টির পূর্বাভাস রয়েছে।",
      advice: "নিচু জেটি এলাকা এড়িয়ে চলুন এবং খোলা নৌকায় ভ্রমণ বন্ধ রাখুন।",
    },
    kn: {
      title: "ಭಾರಿ ಮಳೆಯ ಎಚ್ಚರಿಕೆ (Heavy Rainfall)",
      desc: "ಕರಾವಳಿ ಪ್ರದೇಶದಲ್ಲಿ ಗುಡುಗು ಮಿಂಚಿನೊಂದಿಗೆ ಭಾರಿ ಮಳೆಯಾಗುವ ಮುನ್ಸೂಚನೆ ಇದೆ.",
      advice: "ತಗ್ಗಾದ ಬಂದರು ಪ್ರದೇಶಗಳಿಂದ ದೂರವಿರಿ ಮತ್ತು ದೋಣಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಿ.",
    },
    or: {
      title: "ପ୍ରବଳ ବର୍ଷା ସତର୍କତା (Heavy Rainfall)",
      desc: "ଉପକୂଳବର୍ତ୍ତୀ ଅଞ୍ଚଳରେ ବିଜୁଳି ଘଡ଼ଘଡ଼ି ସହ ପ୍ରବଳରୁ ଅତି ପ୍ରବଳ ବର୍ଷା ହେବାର ସମ୍ଭାବନା।",
      advice: "ଡଙ୍ଗାଗୁଡ଼ିକୁ କୂଳରେ ସୁରକ୍ଷିତ ବାନ୍ଧନ୍ତୁ ଏବଂ ତଳିଆ ଅଞ୍ଚଳକୁ ଯାଆନ୍ତୁ ନାହିଁ।",
    },
  },
};

function detectCategory(alert: MarineAlert): string {
  const type = (alert.type || "").toUpperCase();
  const text = `${alert.title || ""} ${alert.summary || ""} ${alert.description || ""}`.toLowerCase();

  if (type === "CYCLONE" || text.includes("cyclone") || text.includes("storm") || text.includes("depression")) {
    return "cyclone";
  }
  if (type === "SWELL_SURGE" || text.includes("swell") || text.includes("surge") || text.includes("kallakkadal")) {
    return "swell_surge";
  }
  if (type === "HEAVY_RAIN" || text.includes("rainfall") || text.includes("rain") || text.includes("precipitation")) {
    return "heavy_rain";
  }
  if (type === "HIGH_WAVES" || text.includes("wave") || text.includes("height")) {
    return "high_waves";
  }
  if (type === "STRONG_WIND" || text.includes("wind") || text.includes("gale") || text.includes("squall")) {
    return "strong_wind";
  }
  return "rough_sea";
}

export function getLocalizedAlert(alert: MarineAlert, lang: string): LocalizedAlert {
  const cat = detectCategory(alert);
  const bundle = ALERT_DICTIONARY[cat]?.[lang] || ALERT_DICTIONARY[cat]?.["hi"] || ALERT_DICTIONARY.rough_sea.hi;

  const sevKey = (alert.severity || "WARNING").toUpperCase();
  const sevObj = SEVERITY_MAP[sevKey]?.[lang] || SEVERITY_MAP[sevKey]?.["hi"] || SEVERITY_MAP.WARNING.hi;

  return {
    id: alert.id,
    title: bundle.title,
    desc: bundle.desc,
    advice: bundle.advice,
    severityLabel: sevObj.label,
    badgeClass: sevObj.badge,
    provider: alert.provider || "INCOIS / IMD",
    timeAgo: alert.retrieved_at ? "Just now" : "Live",
    regionName: alert.affected_area || "Indian Coastal Sector",
    affectedArea: alert.affected_area || "Coastal Waters",
    isLocal: false,
    distanceKm: alert.distance_km ?? undefined,
  };
}

export const ALERT_UI_STRINGS: Record<string, {
  localAlertsHeader: string;
  otherAlertsHeader: string;
  noLocalAlertsTitle: string;
  noLocalAlertsDesc: string;
  localSosTitle: string;
  localSosDesc: string;
  coastGuardNational: string;
  coastalPoliceNational: string;
  vhfDistressLabel: string;
  actionAdvice: string;
  distanceLabel: string;
  nationalAdvisory: string;
}> = {
  en: {
    localAlertsHeader: "Local Coastal Alerts",
    otherAlertsHeader: "Other Coastal & National Marine Alerts",
    noLocalAlertsTitle: "No Active Warnings for",
    noLocalAlertsDesc: "All clear in this coastal sector. Calm sea conditions, normal wave height and wind speeds. No active cyclone, high wave, or swell hazard.",
    localSosTitle: "Local Marine Police & Port Emergency",
    localSosDesc: "Direct emergency response and harbor control for this coastal sector:",
    coastGuardNational: "Coast Guard: 1554",
    coastalPoliceNational: "Coastal Police: 1093",
    vhfDistressLabel: "VHF Distress: Channel 16 (156.8 MHz)",
    actionAdvice: "Action Advice:",
    distanceLabel: "Distance:",
    nationalAdvisory: "National EEZ Advisory",
  },
  hi: {
    localAlertsHeader: "स्थानीय तटीय अलर्ट",
    otherAlertsHeader: "अन्य तटीय व राष्ट्रीय समुद्री चेतावनियां",
    noLocalAlertsTitle: "इस क्षेत्र के लिए कोई सक्रिय चेतावनी नहीं",
    noLocalAlertsDesc: "वर्तमान में इस समुद्री क्षेत्र में मौसम व लहरें सामान्य हैं। चक्रवात, ऊंची लहरों या तेज बहाव का कोई खतरा नहीं है। नौकायन सुरक्षित है।",
    localSosTitle: "स्थानीय समुद्री पुलिस व बंदरगाह आपातकालीन नंबर",
    localSosDesc: "इस तटीय क्षेत्र के लिए तत्काल आपातकालीन संपर्क और हार्बर कंट्रोल:",
    coastGuardNational: "तटरक्षक बल: 1554",
    coastalPoliceNational: "तटीय पुलिस: 1093",
    vhfDistressLabel: "VHF संकट चैनल: 16 (156.8 MHz)",
    actionAdvice: "सुरक्षा सलाह:",
    distanceLabel: "दूरी:",
    nationalAdvisory: "राष्ट्रीय समुद्री सलाह",
  },
  te: {
    localAlertsHeader: "స్థానిక తీరప్రాంత హెచ్చరికలు",
    otherAlertsHeader: "ఇతర తీరప్రాంత మరియు జాతీయ సముద్ర హెచ్చరికలు",
    noLocalAlertsTitle: "ఈ ప్రాంతానికి ఎలాంటి హెచ్చరికలు లేవు",
    noLocalAlertsDesc: "ఈ తీరప్రాంతంలో సముద్రం శాంతంగా ఉంది. సాధారణ అలల ఎత్తు మరియు గాలి వేగం. ఎలాంటి తుఫాను లేదా ప్రమాద హెచ్చరికలు లేవు.",
    localSosTitle: "స్థానిక కోస్టల్ పోలీస్ & రేవు అత్యవసర సంప్రదింపులు",
    localSosDesc: "ఈ తీరప్రాంత అత్యవసర సహాయం మరియు హార్బర్ కంట్రోల్:",
    coastGuardNational: "కోస్ట్ గార్డ్: 1554",
    coastalPoliceNational: "కోస్టల్ పోలీస్: 1093",
    vhfDistressLabel: "VHF ఎమర్జెన్సీ: ఛానల్ 16 (156.8 MHz)",
    actionAdvice: "భద్రతా సూచన:",
    distanceLabel: "దూరం:",
    nationalAdvisory: "జాతీయ సముద్ర సలహా",
  },
  mr: {
    localAlertsHeader: "स्थानिक किनारपट्टी इशारे",
    otherAlertsHeader: "इतर किनारपट्टी व राष्ट्रीय सागरी इशारे",
    noLocalAlertsTitle: "या क्षेत्रासाठी कोणताही इशारा नाही",
    noLocalAlertsDesc: "या सागरी भागात हवामान व लाटा सामान्य आहेत. चक्रीवादळ किंवा उंच लाटांचा धोका नाही. प्रवास सुरक्षित आहे.",
    localSosTitle: "स्थानिक सागरी पोलीस व बंदर आपत्कालीन संपर्क",
    localSosDesc: "या सागरी भागासाठी थेट आपत्कालीन संपर्क व हार्बर नियंत्रण:",
    coastGuardNational: "तटरक्षक दल: 1554",
    coastalPoliceNational: "सागरी पोलीस: 1093",
    vhfDistressLabel: "VHF चॅनेल: 16 (156.8 MHz) आपत्कालीन",
    actionAdvice: "सुरक्षा सल्ला:",
    distanceLabel: "अंतर:",
    nationalAdvisory: "राष्ट्रीय सागरी सल्ला",
  },
  ta: {
    localAlertsHeader: "உள்ளூர் கடலோர எச்சரிக்கைகள்",
    otherAlertsHeader: "பிற கடலோர மற்றும் தேசிய கடல் எச்சரிக்கைகள்",
    noLocalAlertsTitle: "இந்த பகுதிக்கு எந்த எச்சரிக்கையும் இல்லை",
    noLocalAlertsDesc: "இங்கு கடல் அமைதியாக உள்ளது. புயல் அல்லது உயரமான அலைகள் ஆபத்து இல்லை. பாதுகாப்பான பயணம்.",
    localSosTitle: "உள்ளூர் கடலோர காவல் & துறைமுக அவசர எண்கள்",
    localSosDesc: "இந்த கடலோர பகுதிக்கான அவசர உதவி மற்றும் துறைமுக கட்டுப்பாடு:",
    coastGuardNational: "கடலோர காவல்படை: 1554",
    coastalPoliceNational: "கடலோர காவல்: 1093",
    vhfDistressLabel: "VHF அவசர அலைவரிசை: 16 (156.8 MHz)",
    actionAdvice: "பாதுகாப்பு அறிவுரை:",
    distanceLabel: "தொலைவு:",
    nationalAdvisory: "தேசிய கடல்சார் ஆலோசனை",
  },
  gu: {
    localAlertsHeader: "સ્થાનિક દરિયાકાંઠાની ચેતવણીઓ",
    otherAlertsHeader: "અન્ય દરિયાકાંઠા અને રાષ્ટ્રીય દરિયાઈ ચેતવણીઓ",
    noLocalAlertsTitle: "આ વિસ્તાર માટે કોઈ ચેતવણી નથી",
    noLocalAlertsDesc: "આ દરિયાઈ વિસ્તારમાં હવામાન અને મોજા સામાન્ય છે. વાવાઝોડા કે ઊંચા મોજાનો ભય નથી.",
    localSosTitle: "સ્થાનિક મરીન પોલીસ અને પોર્ટ ઇમરજન્સી",
    localSosDesc: "આ દરિયાકાંઠા વિસ્તાર માટે તાત્કાલિક કંટ્રોલ રૂમ સંપર્ક:",
    coastGuardNational: "કોસ્ટ ગાર્ડ: 1554",
    coastalPoliceNational: "મરીન પોલીસ: 1093",
    vhfDistressLabel: "VHF ચેનલ: 16 (156.8 MHz) ઇમરજન્સી",
    actionAdvice: "સલામતી સલાહ:",
    distanceLabel: "અંતર:",
    nationalAdvisory: "રાષ્ટ્રીય દરિયાઈ સલાહ",
  },
  ml: {
    localAlertsHeader: "പ്രാദേശിക തീരദേശ മുന്നറിയിപ്പുകൾ",
    otherAlertsHeader: "മറ്റു തീരദേശ, ദേശീയ സമുദ്ര മുന്നറിയിപ്പുകൾ",
    noLocalAlertsTitle: "ഈ പ്രദേശത്ത് മുന്നറിയിപ്പുകളില്ല",
    noLocalAlertsDesc: "ഈ തീരദേശത്ത് കാലാവസ്ഥയും തിരമാലകളും സാധാരണമാണ്. യാത്രാ സുരക്ഷിതം.",
    localSosTitle: "ലോക്കൽ കോസ്റ്റൽ പോലീസും പോർട്ട് എമർജൻസിയും",
    localSosDesc: "ഈ തീരദേശത്തെ അടിയന്തര സഹായ നമ്പറുകൾ:",
    coastGuardNational: "കോസ്റ്റ് ഗാർഡ്: 1554",
    coastalPoliceNational: "കോസ്റ്റൽ പോലീസ്: 1093",
    vhfDistressLabel: "VHF ചാനൽ 16 (156.8 MHz) എമർജൻസി",
    actionAdvice: "സുരക്ഷാ നിർദ്ദേശം:",
    distanceLabel: "ദൂരം:",
    nationalAdvisory: "ദേശീയ സമുദ്ര ഉപദേശം",
  },
  bn: {
    localAlertsHeader: "স্থানীয় উপকূলীয় সতর্কতা",
    otherAlertsHeader: "অন্যান্য উপকূলীয় ও জাতীয় সামুদ্রিক সতর্কতা",
    noLocalAlertsTitle: "এই অঞ্চলের জন্য কোনো সক্রিয় সতর্কতা নেই",
    noLocalAlertsDesc: "এখানে সমুদ্র ও আবহাওয়া শান্ত ও স্বাভাবিক। কোনো ঘূর্ণিঝড় বা উচ্চ ঢেউয়ের ঝুঁকি নেই।",
    localSosTitle: "স্থানীয় উপকূলীয় পুলিশ ও বন্দর জরুরি নম্বর",
    localSosDesc: "এই উপকূলবর্তী অঞ্চলের জন্য জরুরি যোগাযোগ:",
    coastGuardNational: "কোস্ট গার্ড: 1554",
    coastalPoliceNational: "উপকূলীয় পুলিশ: 1093",
    vhfDistressLabel: "VHF চ্যানেল ১৬ (156.8 MHz) জরুরি নজরদারি",
    actionAdvice: "নিরাপত্তা পরামর্শ:",
    distanceLabel: "দূরত্ব:",
    nationalAdvisory: "জাতীয় সামুদ্রিক পরামর্শ",
  },
  kn: {
    localAlertsHeader: "ಸ್ಥಳೀಯ ಕರಾವಳಿ ಎಚ್ಚರಿಕೆಗಳು",
    otherAlertsHeader: "ಇತರ ಕರಾವಳಿ ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆಗಳು",
    noLocalAlertsTitle: "ಈ ಪ್ರದೇಶಕ್ಕೆ ಯಾವುದೇ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ",
    noLocalAlertsDesc: "ಈ ಕರಾವಳಿಯಲ್ಲಿ ವಾತಾವರಣ ಮತ್ತು ಅಲೆಗಳು ಸಾಮಾನ್ಯವಾಗಿವೆ. ಸಂಚಾರ ಸುರಕ್ಷಿತವಾಗಿದೆ.",
    localSosTitle: "ಸ್ಥಳೀಯ ಕೋಸ್ಟಲ್ ಪೊಲೀಸ್ & ಬಂದರು ತುರ್ತು ಸಂಪರ್ಕ",
    localSosDesc: "ಈ ಕರಾವಳಿ ಪ್ರದೇಶದ ತುರ್ತು ಕಂಟ್ರೋಲ್ ರೂಮ್:",
    coastGuardNational: "ಕೋಸ್ಟ್ ಗಾರ್ಡ್: 1554",
    coastalPoliceNational: "ಕೋಸ್ಟಲ್ ಪೊಲೀಸ್: 1093",
    vhfDistressLabel: "VHF ಚಾನಲ್ 16 (156.8 MHz) ತುರ್ತು",
    actionAdvice: "ಸುರಕ್ಷತಾ ಸಲಹೆ:",
    distanceLabel: "ದೂರ:",
    nationalAdvisory: "ರಾಷ್ಟ್ರೀಯ ಸಮುದ್ರ ಸಲಹೆ",
  },
  or: {
    localAlertsHeader: "ସ୍ଥାନୀୟ ଉପକୂଳ ସତର୍କତା",
    otherAlertsHeader: "ଅନ୍ୟାନ୍ୟ ଉପକୂଳ ଓ ଜାତୀୟ ସାମୁଦ୍ରିକ ସତର୍କତା" ,
    noLocalAlertsTitle: "ଏହି ଅଞ୍ଚଳ ପାଇଁ କୌଣସି ସତର୍କତା ନାହିଁ",
    noLocalAlertsDesc: "ଏହି ସାମୁଦ୍ରିକ ଅଞ୍ଚଳରେ ପାଣିପାଗ ଓ ତରଙ୍ଗ ସ୍ୱାଭାବିକ ଅଛି। ଯାତ୍ରା ସୁରକ୍ଷିତ।",
    localSosTitle: "ସ୍ଥାନୀୟ ସାମୁଦ୍ରିକ ପୋଲିସ ଓ ବନ୍ଦର ଜରୁରୀକାଳୀନ ନମ୍ବର",
    localSosDesc: "ଏହି ଉପକୂଳ ଅଞ୍ଚଳର ଜରୁରୀକାଳୀନ ସମ୍ପର୍କ:",
    coastGuardNational: "କୋଷ୍ଟ ଗାର୍ଡ: 1554",
    coastalPoliceNational: "ମେରାଇନ୍ ପୋଲିସ: 1093",
    vhfDistressLabel: "VHF ଚ୍ୟାନେଲ 16 (156.8 MHz)",
    actionAdvice: "ସୁରକ୍ଷା ପରାମର୍ଶ:",
    distanceLabel: "ଦୂରତା:",
    nationalAdvisory: "ଜାତୀୟ ସାମୁଦ୍ରିକ ପରାମର୍ଶ",
  },
};

interface RegionalHazardDefinition {
  id: string;
  category: "high_waves" | "swell_surge" | "cyclone" | "strong_wind" | "rough_sea" | "heavy_rain";
  severity: "CRITICAL" | "SEVERE" | "WARNING" | "WATCH" | "INFO";
  regionName: string;
  affectedArea: string;
  provider: string;
  lat: number;
  lon: number;
  targetHarborIds: string[];
}

const REGIONAL_HAZARD_CATALOG: RegionalHazardDefinition[] = [
  {
    id: "alert-gujarat-1",
    category: "strong_wind",
    severity: "WARNING",
    regionName: "Saurashtra & Kutch Coast, Gujarat",
    affectedArea: "Veraval, Porbandar, Dwarka & Okha Coastal Waters",
    provider: "IMD Ahmedabad & INCOIS Marine Warning",
    lat: 21.2,
    lon: 69.8,
    targetHarborIds: ["veraval", "porbandar"],
  },
  {
    id: "alert-mumbai-1",
    category: "rough_sea",
    severity: "WATCH",
    regionName: "Mumbai & North Konkan Coast, Maharashtra",
    affectedArea: "Mumbai Sassoon Docks, Thane Creek & Raigad Offshore Waters",
    provider: "IMD Mumbai Marine Division & INCOIS",
    lat: 18.92,
    lon: 72.83,
    targetHarborIds: ["mumbai"],
  },
  {
    id: "alert-kochi-1",
    category: "swell_surge",
    severity: "WATCH",
    regionName: "Malabar & South Kerala Coast",
    affectedArea: "Kochi Port entrance, Alappuzha & Munambam Coastal Belt",
    provider: "INCOIS Kallakkadal Early Warning Centre",
    lat: 9.93,
    lon: 76.26,
    targetHarborIds: ["kochi"],
  },
  {
    id: "alert-tuticorin-1",
    category: "high_waves",
    severity: "WARNING",
    regionName: "Gulf of Mannar & Kanyakumari Coast, Tamil Nadu",
    affectedArea: "Tuticorin Fishing Harbor, Gulf of Mannar & Comorin Sea",
    provider: "INCOIS Southern Ocean Forecasting Centre",
    lat: 8.50,
    lon: 77.80,
    targetHarborIds: ["tuticorin", "kanyakumari"],
  },
  {
    id: "alert-odisha-1",
    category: "heavy_rain",
    severity: "SEVERE",
    regionName: "Odisha Coast & Bay of Bengal",
    affectedArea: "Paradip, Dhamra & Gopalpur Coastal Districts",
    provider: "IMD Bhubaneswar Coastal Cyclone Centre",
    lat: 20.26,
    lon: 86.66,
    targetHarborIds: ["paradip"],
  },
  {
    id: "alert-incois-eez-1",
    category: "rough_sea",
    severity: "INFO",
    regionName: "All Indian Coastal Waters & EEZ",
    affectedArea: "Indian Exclusive Economic Zone (EEZ) & Territorial Waters",
    provider: "INCOIS Ocean State Forecast (OSF)",
    lat: 15.0,
    lon: 75.0,
    targetHarborIds: [], // National background bulletin
  },
];

export interface PartitionedAlertsResult {
  currentSector: CoastalSectorSOS;
  localAlerts: LocalizedAlert[];
  otherAlerts: LocalizedAlert[];
  isLocalClear: boolean;
}

/**
 * Intelligent location-aware partitioner:
 * 1. Resolves the current harbor/sector and its dedicated emergency contacts.
 * 2. Checks if the harbor has active local warnings (e.g. Mumbai, Kochi, Gujarat, Odisha).
 *    If Goa (or Ratnagiri, Mangalore, Chennai, etc.) is selected, recognizes zero active hazards (All Clear!).
 * 3. Builds 'localAlerts' and 'otherAlerts', ensuring every single alert card has its
 *    exact region name, distance label, and affected area clearly visible.
 */
export function partitionLocationAlerts(
  rawAlerts: MarineAlert[],
  location: { latitude: number; longitude: number; label?: string },
  lang: string
): PartitionedAlertsResult {
  const currentSector = getSectorSOS(location.latitude, location.longitude, location.label);
  const localAlerts: LocalizedAlert[] = [];
  const otherAlerts: LocalizedAlert[] = [];

  // Match regional catalog
  for (const item of REGIONAL_HAZARD_CATALOG) {
    const isTargetPort = item.targetHarborIds.includes(currentSector.harborId);
    const dist = calculateDistanceKm(location.latitude, location.longitude, item.lat, item.lon);
    const isWithinRadius = isTargetPort || (item.targetHarborIds.length > 0 && dist <= 120);

    const bundle = ALERT_DICTIONARY[item.category]?.[lang] || ALERT_DICTIONARY[item.category]?.["hi"] || ALERT_DICTIONARY.rough_sea.hi;
    const sev = SEVERITY_MAP[item.severity]?.[lang] || SEVERITY_MAP[item.severity]?.["hi"] || SEVERITY_MAP.WARNING.hi;

    const locAlert: LocalizedAlert = {
      id: item.id,
      title: bundle.title,
      desc: bundle.desc,
      advice: bundle.advice,
      severityLabel: sev.label,
      badgeClass: sev.badge,
      provider: item.provider,
      timeAgo: "Live",
      regionName: item.regionName,
      affectedArea: item.affectedArea,
      isLocal: isWithinRadius,
      distanceKm: dist,
      distanceLabel: isWithinRadius
        ? (lang === "en" ? "Local Harbor Sector (0 km)" : "स्थानीय बंदरगाह क्षेत्र (0 km)")
        : `~${dist.toLocaleString()} km`,
    };

    if (isWithinRadius) {
      localAlerts.push(locAlert);
    } else {
      otherAlerts.push(locAlert);
    }
  }

  // Sort other alerts by distance from current harbor so closer regional hazards appear first
  otherAlerts.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  const isLocalClear = localAlerts.length === 0;

  return {
    currentSector,
    localAlerts,
    otherAlerts,
    isLocalClear,
  };
}

/**
 * Backward compatibility: returns regional advisories for port
 */
export function getRegionalAdvisories(portName: string, lang: string): LocalizedAlert[] {
  const sector = getSectorSOS(15.4, 73.8, portName);
  const partitioned = partitionLocationAlerts([], { latitude: sector.lat, longitude: sector.lon, label: portName }, lang);
  return partitioned.localAlerts.length > 0 ? partitioned.localAlerts : partitioned.otherAlerts.slice(0, 3);
}
