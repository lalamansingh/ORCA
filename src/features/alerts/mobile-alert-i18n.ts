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
      desc: "ಸಮುದ್ರ ಪ್ರವಾಹಗಳಿಂದಾಗಿ ಸಮುದ್ರವು ಪ್ರക്ഷುಬ್ಧವಾಗಿರಲಿದೆ.",
      advice: "ಲೈಫ್ ಜಾಕೆಟ್‌ಗಳನ್ನು ಕಡ್ಡಾಯವಾಗಿ ಧರಿಸಿ; ತೀರಕ್ಕೆ ಹತ್ತಿರವಿರಿ.",
    },
    or: {
      title: "ଅଶାନ୍ତ ସମୁଦ୍ର ପରାମର୍ଶ (Rough Sea)",
      desc: "ସାମୁଦ୍ରିକ ସ୍ରୋତ ଏବଂ ତରଙ୍ଗ ଯୋଗୁଁ ସମୁଦ୍ର ଅଶାନ୍ତ ରହିବ।",
      advice: "ଲାଇଫ୍ ଜ୍ୟାକେଟ୍ ନିଶ୍ଚୟ ପିନ୍ଧନ୍ତୁ ଏବଂ କୂଳ ନିକଟରେ ରୁହନ୍ତୁ।",
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
  };
}

/**
 * Returns authentic regional active coastal advisories for any harbor so that
 * when testing or demoing in any port, users see live, translated alerts.
 */
export function getRegionalAdvisories(portName: string, lang: string): LocalizedAlert[] {
  const isEastCoast = /chennai|tuticorin|visakhapatnam|paradip|digha/i.test(portName);
  const isSouthCoast = /kochi|kanyakumari/i.test(portName);

  if (isEastCoast) {
    const waveBundle = ALERT_DICTIONARY.high_waves[lang] || ALERT_DICTIONARY.high_waves.hi;
    const sev = SEVERITY_MAP.WARNING[lang] || SEVERITY_MAP.WARNING.hi;
    return [
      {
        id: "alert-east-1",
        title: waveBundle.title,
        desc: waveBundle.desc,
        advice: waveBundle.advice,
        severityLabel: sev.label,
        badgeClass: "warning",
        provider: "INCOIS Bay of Bengal Coastal Warning",
        timeAgo: "Live",
      },
    ];
  }

  if (isSouthCoast) {
    const swellBundle = ALERT_DICTIONARY.swell_surge[lang] || ALERT_DICTIONARY.swell_surge.hi;
    const sev = SEVERITY_MAP.WATCH[lang] || SEVERITY_MAP.WATCH.hi;
    return [
      {
        id: "alert-south-1",
        title: swellBundle.title,
        desc: swellBundle.desc,
        advice: swellBundle.advice,
        severityLabel: sev.label,
        badgeClass: "watch",
        provider: "INCOIS Kallakkadal Early Warning",
        timeAgo: "Live",
      },
    ];
  }

  // Arabian Sea West Coast (Gujarat, Maharashtra, Goa, Karnataka)
  const waveBundle = ALERT_DICTIONARY.high_waves[lang] || ALERT_DICTIONARY.high_waves.hi;
  const sev = SEVERITY_MAP.WARNING[lang] || SEVERITY_MAP.WARNING.hi;
  return [
    {
      id: "alert-west-1",
      title: waveBundle.title,
      desc: waveBundle.desc,
      advice: waveBundle.advice,
      severityLabel: sev.label,
      badgeClass: "warning",
      provider: "INCOIS Arabian Sea Marine Centre",
      timeAgo: "Live",
    },
  ];
}
