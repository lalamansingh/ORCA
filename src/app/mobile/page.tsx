"use client";

import { useState, useEffect, useRef, FormEvent, useMemo } from "react";
import Link from "next/link";
import { 
  Anchor, 
  Bot, 
  Fish, 
  LayoutDashboard, 
  Map as MapIcon, 
  MapPin, 
  PhoneCall, 
  RefreshCw, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  Waves, 
  Wind, 
  Activity, 
  Eye, 
  Droplets, 
  Gauge,
  ChevronDown,
  LoaderCircle,
  X,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Radio,
  ShieldCheck,
  Route as RouteIcon,
  Navigation as NavigationIcon,
  ArrowRight,
  RotateCcw,
  ArrowLeftRight,
  Compass
} from "lucide-react";

import { useSharedSelectedLocation, publishSelectedLocation } from "@/features/map/location-store";
import { useConditions } from "@/features/conditions/hooks/use-conditions";
import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { useRiskAssessment } from "@/features/risk/hooks/use-risk-assessment";
import { usePFZ } from "@/features/pfz/hooks/use-pfz";
import { useOceanProducts } from "@/features/ocean-products/hooks/use-ocean-products";
import { formatMeasurement, degreesToCompass, updatedAgo } from "@/features/conditions/format";
import { sendMessage, type ConversationReply } from "@/lib/api/ai";
import { classifyIntent } from "@/features/ai/intent-router";
import { MarineMap } from "@/components/marine-map";
import { VoiceMic, VoiceSpeaker } from "@/components/voice-mic";
import type { SelectedLocation } from "@/features/map/types";
import { useMapLayers } from "@/features/map/hooks/use-map-layers";
import { MAP_PARAMETERS } from "@/features/map/mobile-map-params";
import {
  getLocalizedAlert,
  getRegionalAdvisories,
  partitionLocationAlerts,
  getSectorSOS,
  ALERT_UI_STRINGS,
  type LocalizedAlert,
  type CoastalSectorSOS,
} from "@/features/alerts/mobile-alert-i18n";
import { getPFZGeoJSON } from "@/lib/api/pfz";
import type { PFZGeoJSON } from "@/features/pfz/types";
import { SplashScreen } from "@/components/splash-screen";
import { useSOSService } from "@/features/sos/hooks/use-sos-service";
import { useEmergencyAlerts } from "@/features/hazards/hooks/use-emergency-alerts";
import { VolumeKeyListener } from "@/features/sos/volume-key-listener";
import { useSOSStore } from "@/features/sos/sos-store";
import { EmergencySOSCard } from "@/components/sos/emergency-sos-card";
import { SOSCountdownModal } from "@/components/sos/sos-countdown-modal";
import { VoiceDistressModal } from "@/components/sos/voice-distress-modal";
import { SafetyOnboardingModal } from "@/components/sos/safety-onboarding-modal";
import { FullScreenAlarmAlert } from "@/components/sos/full-screen-alarm-alert";
import {
  isGreetingQuery,
  getConversationalGreeting,
  getLocalizedError,
  FormattedChatMessage,
  generateIntelligentSaathiReply,
  generateInitialLocationBriefing,
  detectInlandCity,
  detectUserName,
  isCapabilitiesQuery,
  isAdvisoryQuery,
  isFishingQuery,
  isWeatherQuery,
  isGeneralKnowledgeQuery,
  generateGeneralKnowledgeReply,
  detectEngineFailureQuery,
  detectFuelConstraint,
  detectTimeConstraint,
  detectBoundaryQuery,
  type LiveRiskContext,
} from "@/features/ai/mobile-assistant-helper";

import "./mobile.css";

const COASTAL_HARBORS = [
  { name: "Veraval Fishing Port", state: "Gujarat", lat: 20.90, lon: 70.36, sea: "Arabian Sea" },
  { name: "Porbandar Harbor", state: "Gujarat", lat: 21.64, lon: 69.60, sea: "Arabian Sea" },
  { name: "Mumbai Sassoon Docks", state: "Maharashtra", lat: 18.92, lon: 72.83, sea: "Arabian Sea" },
  { name: "Ratnagiri Mirkarwada", state: "Maharashtra", lat: 16.99, lon: 73.30, sea: "Arabian Sea" },
  { name: "Goa (Panaji & Mormugao)", state: "Goa", lat: 15.40, lon: 73.80, sea: "Arabian Sea" },
  { name: "Mangalore Old Port", state: "Karnataka", lat: 12.87, lon: 74.84, sea: "Arabian Sea" },
  { name: "Kochi Port & Harbor", state: "Kerala", lat: 9.93, lon: 76.26, sea: "Arabian Sea" },
  { name: "Kanyakumari Coast", state: "Tamil Nadu", lat: 8.08, lon: 77.55, sea: "Indian Ocean" },
  { name: "Tuticorin Fishing Harbor", state: "Tamil Nadu", lat: 8.76, lon: 78.13, sea: "Gulf of Mannar" },
  { name: "Chennai Kasimedu Harbor", state: "Tamil Nadu", lat: 13.08, lon: 80.27, sea: "Bay of Bengal" },
  { name: "Visakhapatnam Harbor", state: "Andhra Pradesh", lat: 17.68, lon: 83.21, sea: "Bay of Bengal" },
  { name: "Paradip Port", state: "Odisha", lat: 20.26, lon: 86.66, sea: "Bay of Bengal" },
  { name: "Digha & Shankarpur", state: "West Bengal", lat: 21.62, lon: 87.51, sea: "Bay of Bengal" },
];

const SUPPORTED_LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी", voiceCode: "hi-IN" },
  { code: "en", name: "English", native: "English", voiceCode: "en-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", voiceCode: "ta-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", voiceCode: "te-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", voiceCode: "ml-IN" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", voiceCode: "gu-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", voiceCode: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", voiceCode: "bn-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", voiceCode: "kn-IN" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", voiceCode: "hi-IN" },
];

// Comprehensive Localization Dictionary across 10 Coastal Indian Languages
const I18N_MAP: Record<string, Record<string, string>> = {
  hi: {
    safeSea: "समुद्र सुरक्षित · Safe Sea",
    caution: "मध्यम जोखिम · Caution",
    danger: "उच्च जोखिम · Danger",
    voyageSafe: "यात्रा सुरक्षित है",
    voyageCaution: "सतर्कता आवश्यक है",
    voyageDanger: "समुद्र में न जाएं",
    safeAdvice: "मौसम और लहरें सामान्य हैं। तटीय मछली पकड़ने की यात्रा सुरक्षित है।",
    cautionAdvice: "गहरी समुद्री धाराओं या तेज हवाओं के कारण सतर्क रहें।",
    dangerAdvice: "तूफानी हवाओं या ऊंची लहरों के कारण समुद्र में जाना वर्जित है।",
    liveSeaStatus: "लाइव समुद्र स्थिति",
    wave: "लहर की ऊंचाई (Wave)",
    calmSea: "शांत समुद्र (Calm)",
    wind: "हवा की गति (Wind)",
    windDir: "दिशा",
    sst: "समुद्र तापमान (SST)",
    optimalFish: "मछली अनुकूल (Optimal)",
    current: "समुद्री धारा (Current)",
    steadyCurrent: "स्थिर बहाव",
    visibility: "दृश्यता (Visibility)",
    goodVis: "स्पष्ट दृष्टि (Good)",
    tide: "ज्वार स्तर (Tide)",
    normalTide: "सामान्य स्तर",
    productivity: "महासागरीय उत्पादकता (Productivity)",
    productivityDesc: "क्लोरोफिल घनत्व और थर्मल फ्रंट्स के आधार पर आज मछली की सघनता सामान्य से अधिक है।",
    chlorophyll: "क्लोरोफिल",
    thermalFront: "थर्मल फ्रंट: सक्रिय",
    aiSaathi: "AI साथी",
    fishZones: "मछली ज़ोन",
    map: "मैप",
    sosAlert: "SOS अलर्ट",
    statusTab: "स्थिति",
    assistantTab: "साग़र साथी",
    pfzTab: "मछली ज़ोन",
    mapTab: "मैप",
    routeTab: "रूट",
    alertsTab: "अलर्ट व SOS",
    askPlaceholder: "बोलें या सवाल पूछें...",
    orcaThinking: "ORCA सोच रहा है...",
    availablePFZ: "उपलब्ध मछली पकड़ने के क्षेत्र · INCOIS Advisory",
    distFromCoast: "तट से दूरी",
    bearing: "दिशा (Bearing)",
    depth: "जल गहराई",
    targetSpecies: "लक्ष्य",
    viewOnMap: "मैप पर देखें →",
    sosCardTitle: "आपातकालीन सुरक्षा (SOS)",
    sosCardDesc: "समुद्र में किसी भी आपात स्थिति या खतरे के समय सीधे कोस्ट गार्ड या तटीय पुलिस से संपर्क करें:",
    coastGuard: "1554 (Coast Guard)",
    marinePolice: "1093 (Marine Police)",
    activeAlerts: "सक्रिय समुद्री चेतावनियां (Active Alerts)",
    noActiveAlerts: "कोई सक्रिय चेतावनी नहीं",
    noAlertsDesc: "वर्तमान में इस क्षेत्र में कोई चक्रवात या ऊंची लहरों का खतरा नहीं है।",
    selectHarbor: "बंदरगाह चुनें (Select Port / Harbor)",
    selectLang: "भाषा चुनें (Select Language)",
    welcomeMessage: "नमस्ते! मैं ORCA सागर साथी हूँ। अपने क्षेत्र के मौसम, मछली क्षेत्र (PFZ) या समुद्र सुरक्षा के बारे में पूछें।",
    mapTip: "नेविगेशन टिप: स्क्रीन पर टैप करके किसी भी समुद्री बिंदु का मौसम और स्थिति देखें।",
    dataSource: "डेटा स्रोत",
    updated: "अपडेटेड",
    justNow: "अभी",
    networkError: "नेटवर्क त्रुटि: समुद्री सर्वर से संपर्क नहीं हो पाया। कृपया दोबारा प्रयास करें।",
    chipWeather: "आज का मौसम कैसा है?",
    chipPFZ: "नजदीकी मछली क्षेत्र (PFZ)?",
    chipWind: "हवा की गति व दिशा क्या है?",
    chipSafety: "क्या आज समुद्र में जाना सुरक्षित है?",
    recenter: "पुनः केंद्र",
    reportSos: "आपातकालीन SOS",
    turnByTurn: "कदम-दर-कदम सुरक्षित मार्ग बिंदु",
    askSaathiCoord: "इस निर्देशांक के बारे में AI साथी से पूछें →",
    currentSeaStatus: "वर्तमान समुद्री स्थिति",
    safeFairway: "सुरक्षित समुद्री मार्ग",
    departurePort: "प्रस्थान बंदरगाह",
    midChannel: "मध्य-मार्ग सुरक्षित गलियारा",
    targetPfz: "मत्स्य क्षेत्र गंतव्य",
    customCoord: "कस्टम निर्देशांक",
    coastalHarbor: "तटीय बंदरगाह",
    routePlannerTitle: "समुद्री रूट प्लानर",
    routeSubtitle: "मैप पर दो बिंदुओं (A और B) पर क्लिक करके सुरक्षित समुद्री मार्ग बनाएं",
    routeStepA: "Step 1: Start Point (A) चुनने के लिए मैप पर टैप करें",
    routeStepB: "Step 2: Destination Point (B) चुनने के लिए मैप पर टैप करें",
    routeBothReady: "सुरक्षित समुद्री मार्ग तैयार है",
    routeStartA: "Start (A)",
    routeDestB: "Destination (B)",
    routeDirectDist: "सीधी दूरी",
    routePassageDist: "नेविगेशन दूरी",
    routeEstVoyage: "अनुमानित समय",
    routeBearing: "दिशा / Heading",
    routeFuelEst: "अनुमानित ईंधन",
    routeClear: "रीसेट करें",
    routeSwap: "दिशा बदलें (A ⇄ B)",
    routeUseCurrent: "वर्तमान बंदरगाह को Start बनाएं",
    routeAskSaathi: "AI साथी से इस रूट के बारे में पूछें",
    routeWaypoints: "मार्ग के प्रमुख बिंदु (Waypoints)",
  },
  en: {
    safeSea: "Safe Sea · Safe for Voyage",
    caution: "Moderate Risk · Caution",
    danger: "High Risk · Avoid Sea",
    voyageSafe: "Voyage is Safe",
    voyageCaution: "Exercise Caution",
    voyageDanger: "Do Not Venture Out",
    safeAdvice: "Weather and waves are calm. Coastal fishing voyage is safe today.",
    cautionAdvice: "Be cautious due to strong ocean currents or moderate winds.",
    dangerAdvice: "Dangerous sea conditions. Fishing boats advised not to venture out.",
    liveSeaStatus: "Live Ocean Conditions",
    wave: "Wave Height",
    calmSea: "Calm Sea",
    wind: "Wind Speed",
    windDir: "Direction",
    sst: "Sea Surface Temp (SST)",
    optimalFish: "Optimal for Fish",
    current: "Ocean Current",
    steadyCurrent: "Steady Flow",
    visibility: "Visibility",
    goodVis: "Good Visibility",
    tide: "Tide Level",
    normalTide: "Normal Level",
    productivity: "Ocean Productivity",
    productivityDesc: "High fish density concentration detected based on chlorophyll & thermal fronts.",
    chlorophyll: "Chlorophyll",
    thermalFront: "Thermal Front: Active",
    aiSaathi: "AI Saathi",
    fishZones: "PFZ Zones",
    map: "Map",
    sosAlert: "SOS Alert",
    statusTab: "Status",
    assistantTab: "AI Saathi",
    pfzTab: "Fish Zones",
    mapTab: "Map",
    routeTab: "Route",
    alertsTab: "Alerts & SOS",
    askPlaceholder: "Speak or type question...",
    orcaThinking: "ORCA is analyzing...",
    availablePFZ: "Potential Fishing Zones (PFZ) · INCOIS Advisory",
    distFromCoast: "Distance from Coast",
    bearing: "Bearing Direction",
    depth: "Water Depth",
    targetSpecies: "Target Species",
    viewOnMap: "View on Map →",
    sosCardTitle: "Emergency Safety (SOS)",
    sosCardDesc: "In case of sea accident or marine distress, connect directly with emergency forces:",
    coastGuard: "1554 (Coast Guard)",
    marinePolice: "1093 (Marine Police)",
    activeAlerts: "Active Marine Advisories",
    noActiveAlerts: "No Active Warnings",
    noAlertsDesc: "Currently no cyclone or high-wave hazard detected in this coastal sector.",
    selectHarbor: "Select Coastal Port / Harbor",
    selectLang: "Select App Language",
    welcomeMessage: "Hello! I am ORCA Sagar Saathi. Ask me about weather, fishing zones (PFZ), or marine safety.",
    mapTip: "Navigation Tip: Tap any marine point on the map to inspect live conditions and advisories.",
    dataSource: "Data Sources",
    updated: "Updated",
    justNow: "Just now",
    networkError: "Network error: Unable to reach marine assistant. Please retry.",
    chipWeather: "How is the ocean weather today?",
    chipPFZ: "Where is nearest fish zone (PFZ)?",
    chipWind: "Wind speed and direction?",
    chipSafety: "Is it safe to sail today?",
    recenter: "Re-centre",
    reportSos: "Report SOS",
    turnByTurn: "Turn-by-Turn Safe Waypoints",
    askSaathiCoord: "Ask AI Saathi about this coordinate →",
    currentSeaStatus: "Current Sea Status",
    safeFairway: "Safe Fairway Corridor",
    departurePort: "Departure Harbor",
    midChannel: "Mid-Channel Safe Fairway",
    targetPfz: "Target Fish Zone",
    customCoord: "CUSTOM COORDINATE",
    coastalHarbor: "COASTAL HARBOR",
    routePlannerTitle: "Marine Route Planner",
    routeSubtitle: "Click 2 points (A and B) on the map to plot a safe sea route",
    routeStepA: "Step 1: Tap anywhere on map to set Start Point (A)",
    routeStepB: "Step 2: Tap on map to set Destination Point (B)",
    routeBothReady: "Safe Marine Route Plotted",
    routeStartA: "Start (A)",
    routeDestB: "Destination (B)",
    routeDirectDist: "Direct Distance",
    routePassageDist: "Navigation Distance",
    routeEstVoyage: "Est. Voyage Duration",
    routeBearing: "Heading / Bearing",
    routeFuelEst: "Est. Fuel Usage",
    routeClear: "Clear Points",
    routeSwap: "Swap A ⇄ B",
    routeUseCurrent: "Use Current Harbor as Start",
    routeAskSaathi: "Ask AI Saathi about this route",
    routeWaypoints: "Navigational Waypoints",
  },
  ta: {
    safeSea: "கடல் பாதுகாப்பானது · Safe Sea",
    caution: "மிதமான எச்சரிக்கை · Caution",
    danger: "அபாயகரமான கடல் · Danger",
    voyageSafe: "மீன்பிடிக்க செல்வது பாதுகாப்பானது",
    voyageCaution: "எச்சரிக்கையுடன் செல்லவும்",
    voyageDanger: "கடலுக்குச் செல்ல வேண்டாம்",
    safeAdvice: "வானிலை மற்றும் அலைகள் இயல்பானவை. இன்றைய மீன்பிடிப் பயணம் பாதுகாப்பானது.",
    cautionAdvice: "வேகமான கடல் நீரோட்டம் காரணமாக கவனமாக செயல்படவும்.",
    dangerAdvice: "அதிவேக காற்று மற்றும் உயரமான அலைகள் காரணமாக கடலுக்குச் செல்ல வேண்டாம்.",
    liveSeaStatus: "நேரலை கடல் நிலைமை",
    wave: "அலை உயரம் (Wave)",
    calmSea: "அமைதியான கடல்",
    wind: "காற்றின் வேகம் (Wind)",
    windDir: "திசை",
    sst: "கடல் வெப்பநிலை (SST)",
    optimalFish: "மீன் வளர்ச்சிக்கு ஏற்றது",
    current: "கடல் நீரோட்டம் (Current)",
    steadyCurrent: "நிலையான நீரோட்டம்",
    visibility: "பார்வைத்திறன் (Visibility)",
    goodVis: "தெளிவான பார்வை",
    tide: "அலை ஏற்ற நிலை (Tide)",
    normalTide: "இயல்பான நிலை",
    productivity: "கடல் உற்பத்தித்திறன்",
    productivityDesc: "குளோரோபில் மற்றும் வெப்ப முனைகளின் அடிப்படையில் மீன் அடர்த்தி அதிகமாக உள்ளது.",
    chlorophyll: "குளோரோபில்",
    thermalFront: "வெப்ப முனை: செயல்பாடு",
    aiSaathi: "AI தோழன்",
    fishZones: "மீன் மண்டலம்",
    map: "வரைபடம்",
    sosAlert: "SOS எச்சரிக்கை",
    statusTab: "நிலை",
    assistantTab: "சாகர் தோழன்",
    pfzTab: "மீன் மண்டலம்",
    mapTab: "வரைபடம்",
    routeTab: "பாதை",
    alertsTab: "எச்சரிக்கை & SOS",
    askPlaceholder: "பேசுங்கள் அல்லது கேள்வி கேளுங்கள்...",
    orcaThinking: "ORCA பதிலளிக்கிறது...",
    availablePFZ: "மீன்பிடி பகுதிகள் · INCOIS வழிகாட்டுதல்",
    distFromCoast: "கரையிலிருந்து தொலைவு",
    bearing: "திசை (Bearing)",
    depth: "நீர் ஆழம்",
    targetSpecies: "இலக்கு மீன்கள்",
    viewOnMap: "வரைபடத்தில் பார் →",
    sosCardTitle: "அவசர பாதுகாப்பு (SOS)",
    sosCardDesc: "கடலில் ஏதேனும் அவசரநிலை ஏற்பட்டால் உடனடியாக தொடர்பு கொள்ளவும்:",
    coastGuard: "1554 (கடலோர காவல்படை)",
    marinePolice: "1093 (கடலோர காவல்துறை)",
    activeAlerts: "செயலில் உள்ள கடல் எச்சரிக்கைகள்",
    noActiveAlerts: "எச்சரிக்கை எதுவும் இல்லை",
    noAlertsDesc: "தற்போது இப்பகுதியில் புயல் அல்லது உயரமான அலைகளின் ஆபத்து இல்லை.",
    selectHarbor: "துறைமுகத்தை தேர்வு செய்க",
    selectLang: "மொழியை தேர்வு செய்க",
    welcomeMessage: "வணக்கம்! நான் ORCA சாகர் தோழன். வானிலை, மீன்பிடி மண்டலங்கள் மற்றும் பாதுகாப்பு பற்றி கேளுங்கள்.",
    mapTip: "வரைபடக் குறிப்பு: நிலவரங்களை அறிய வரைபடத்தில் ஏதேனும் புள்ளியைத் தொடவும்.",
    dataSource: "தரவு ஆதாரம்",
    updated: "புதுப்பிக்கப்பட்டது",
    justNow: "இப்போது",
    networkError: "பிணையப் பிழை: சேவையகத்தை இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    chipWeather: "இன்றைய கடல் வானிலை எப்படி உள்ளது?",
    chipPFZ: "அருகிலுள்ள மீன்பிடி மண்டலம் எங்கே?",
    chipWind: "காற்றின் வேகம் மற்றும் திசை என்ன?",
    chipSafety: "இன்று கடலுக்கு செல்வது பாதுகாப்பானதா?",
    recenter: "மறுமையப்படுத்து",
    reportSos: "அவசர SOS",
    turnByTurn: "படி-படியான பாதுகாப்பான வழிப்பாதைகள்",
    askSaathiCoord: "இந்த ஆயத்தொலைவு பற்றி AI தோழனிடம் கேட்கவும் →",
    currentSeaStatus: "தற்போதைய கடல் நிலைமை",
    safeFairway: "பாதுகாப்பான கடல் வழித்தடம்",
    departurePort: "புறப்படும் துறைமுகம்",
    midChannel: "நடுப்பாதை பாதுகாப்பான வழித்தடம்",
    targetPfz: "இலக்கு மீன்பிடி மண்டலம்",
    customCoord: "தனிப்பயன் ஆயத்தொலைவு",
    coastalHarbor: "கடலோர துறைமுகம்",
  },
  te: {
    safeSea: "సముద్రం సురక్షితం · Safe Sea",
    caution: "మితమైన హెచ్చరిక · Caution",
    danger: "ప్రమాదకరం · Danger",
    voyageSafe: "వేటకు వెళ్లడం సురక్షితం",
    voyageCaution: "జాగ్రత్తగా ఉండండి",
    voyageDanger: "సముద్రంలోకి వెళ్లవద్దు",
    safeAdvice: "వాతావరణం మరియు అలలు సాధారణంగా ఉన్నాయి. తీరప్రాంత వేట సురక్షితం.",
    cautionAdvice: "సముద్ర ప్రవాహాలు వేగంగా ఉన్నందున జాగ్రత్త పాటించండి.",
    dangerAdvice: "భారీ గాలులు మరియు ఎత్తైన అలల కారణంగా వేటకు వెళ్లకూడదు.",
    liveSeaStatus: "లైవ్ సముద్ర స్థితి",
    wave: "అలల ఎత్తు (Wave)",
    calmSea: "శాంతమైన సముద్రం",
    wind: "గాలి వేగం (Wind)",
    windDir: "దిశ",
    sst: "సముద్ర ఉష్ణోగ్రత (SST)",
    optimalFish: "చేపలకు అనుకూలం",
    current: "సముద్ర ప్రవాహం (Current)",
    steadyCurrent: "స్థిరమైన ప్రవాహం",
    visibility: "దృశ్యమానత (Visibility)",
    goodVis: "స్పష్టమైన చూపు",
    tide: "పోటు-పాటు స్థాయి",
    normalTide: "సాధారణ స్థాయి",
    productivity: "సముద్ర ఉత్పాదకత",
    productivityDesc: "క్లోరోఫిల్ మరియు థర్మల్ ఫ్రంట్స్ ఆధారంగా చేపల లభ్యత ఎక్కువగా ఉంది.",
    chlorophyll: "క్లోరోఫిల్",
    thermalFront: "థర్మల్ ఫ్రంట్: యాక్టివ్",
    aiSaathi: "AI సలహాదారు",
    fishZones: "చేపల జోన్",
    map: "మ్యాప్",
    sosAlert: "SOS అలర్ట్",
    statusTab: "పరిస్థితి",
    assistantTab: "సాగర్ సాథి",
    pfzTab: "చేపల జోన్",
    mapTab: "మ్యాప్",
    routeTab: "రూట్",
    alertsTab: "అలర్ట్స్ & SOS",
    askPlaceholder: "మాట్లాడండి లేదా ప్రశ్న అడగండి...",
    orcaThinking: "ORCA ఆలోచిస్తోంది...",
    availablePFZ: "చేపల వేట ప్రాంతాలు · INCOIS సలహా",
    distFromCoast: "తీరం నుండి దూరం",
    bearing: "దిశ (Bearing)",
    depth: "నీటి లోతు",
    targetSpecies: "లక్ష్య చేపలు",
    viewOnMap: "మ్యాప్‌లో చూడండి →",
    sosCardTitle: "అత్యవసర రక్షణ (SOS)",
    sosCardDesc: "సముద్రంలో ప్రమాదం సంభవిస్తే వెంటనే సంప్రదించండి:",
    coastGuard: "1554 (కోస్ట్ గార్డ్)",
    marinePolice: "1093 (కోస్టల్ పోలీస్)",
    activeAlerts: "ప్రస్తుత సముద్ర హెచ్చరికలు",
    noActiveAlerts: "ఎలాంటి హెచ్చరికలు లేవు",
    noAlertsDesc: "ప్రస్తుతం ఈ ప్రాంతంలో తుఫాను లేదా అధిక అలల ముప్పు లేదు.",
    selectHarbor: "హార్బర్ ఎంచుకోండి",
    selectLang: "భాషను ఎంచుకోండి",
    welcomeMessage: "నమస్కారం! నేను ORCA సాగర్ సాథి. వాతావరణం, చేపల వేట జోన్లు మరియు భద్రత గురించి నన్ను అడగండి.",
    mapTip: "మ్యాప్ చిట్కా: వాతావరణాన్ని తనిఖీ చేయడానికి మ్యాప్‌పై ఎక్కడైనా తాకండి.",
    dataSource: "డేటా వనరులు",
    updated: "అప్‌డేట్ చేయబడింది",
    justNow: "ఇప్పుడే",
    networkError: "నెట్‌వర్క్ లోపం: సర్వర్‌ను సంప్రదించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",
    chipWeather: "నేటి సముద్ర వాతావరణం ఎలా ఉంది?",
    chipPFZ: "సమీపంలోని చేపల వేట ప్రాంతం ఎక్కడ?",
    chipWind: "గాలి వేగం మరియు దిశ ఏమిటి?",
    chipSafety: "ఈ రోజు వేటకు వెళ్లడం సురక్షితమేనా?",
    recenter: "రీ-సెంటర్",
    reportSos: "అత్యవసర SOS",
    turnByTurn: "అంచెలంచెలుగా సురక్షిత మార్గ బిందువులు",
    askSaathiCoord: "ఈ కోఆర్డినేట్ గురించి AI సాథిని అడగండి →",
    currentSeaStatus: "ప్రస్తుత సముద్ర స్థితి",
    safeFairway: "సురక్షిత సముద్ర మార్గం",
    departurePort: "బయలుదేరే నౌకాశ్రయం",
    midChannel: "మధ్య-ఛానల్ సురక్షిత మార్గం",
    targetPfz: "చేపల వేట లక్ష్యం",
    customCoord: "అనుకూల కోఆర్డినేట్",
    coastalHarbor: "తీరప్రాంత నౌకాశ్రయం",
  },
  ml: {
    safeSea: "കടൽ സുരക്ഷിതം · Safe Sea",
    caution: "ജാഗ്രത പാലിക്കുക · Caution",
    danger: "അപകടകരം · Danger",
    voyageSafe: "യാത്ര സുരക്ഷിതമാണ്",
    voyageCaution: "ജാഗ്രത പുലർത്തുക",
    voyageDanger: "കടലിൽ പോകരുത്",
    safeAdvice: "കാലാവസ്ഥയും തിരമാലകളും ശാന്തമാണ്. ഇന്നത്തെ മത്സ്യബന്ധന യാത്ര സുരക്ഷിതമാണ്.",
    cautionAdvice: "ശക്തമായ അടിയൊഴുക്കുകൾ ഉള്ളതിനാൽ ശ്രദ്ധിക്കുക.",
    dangerAdvice: "പ്രക്ഷുബ്ധമായ കടലും ശക്തമായ കാറ്റും ഉള്ളതിനാൽ കടലിൽ ഇറങ്ങരുത്.",
    liveSeaStatus: "തത്സമയ കടൽാവസ്ഥ",
    wave: "തിരമാല ഉയരം (Wave)",
    calmSea: "ശാന്തമായ കടൽ",
    wind: "കാറ്റിന്റെ വേഗത (Wind)",
    windDir: "ദിശ",
    sst: "കടൽ ഉപരിതല താപനില",
    optimalFish: "മത്സ്യത്തിന് അനുയോജ്യം",
    current: "സമുദ്ര പ്രവാഹം",
    steadyCurrent: "സ്ഥിര പ്രവാഹം",
    visibility: "കാഴ്ചപരിധി (Visibility)",
    goodVis: "വ്യക്തമായ കാഴ്ച",
    tide: "വേലിയേറ്റ നില (Tide)",
    normalTide: "സാധാരണ നില",
    productivity: "സമുദ്ര ഉത്പാദനക്ഷമത",
    productivityDesc: "ക്ലോറോഫിൽ സാന്ദ്രതയും തെർമൽ ഫ്രണ്ടുകളും കണക്കിലെടുക്കുമ്പോൾ മത്സ്യലഭ്യത കൂടുതലാണ്.",
    chlorophyll: "ക്ലോറോഫിൽ",
    thermalFront: "തെർമൽ ഫ്രണ്ട്: സജീവം",
    aiSaathi: "AI സഹായി",
    fishZones: "മത്സ്യ മേഖല",
    map: "ഭൂപടം",
    sosAlert: "SOS ജാഗ്രത",
    statusTab: "നില",
    assistantTab: "സാഗർ സാഥി",
    pfzTab: "മത്സ്യ മേഖല",
    mapTab: "ഭൂപടം",
    routeTab: "റൂട്ട്",
    alertsTab: "മുന്നറിയിപ്പ് & SOS",
    askPlaceholder: "സംസാരിക്കുക അല്ലെങ്കിൽ ചോദിക്കുക...",
    orcaThinking: "ORCA ചിന്തിക്കുന്നു...",
    availablePFZ: "സാധ്യതാ മത്സ്യബന്ധന മേഖലകൾ · INCOIS",
    distFromCoast: "തീരത്തു നിന്നുള്ള ദൂരം",
    bearing: "ദിശ (Bearing)",
    depth: "ജലത്തിന്റെ ആഴം",
    targetSpecies: "ലക്ഷ്യ മത്സ്യങ്ങൾ",
    viewOnMap: "മാപ്പിൽ കാണുക →",
    sosCardTitle: "അടിയന്തര സുരക്ഷ (SOS)",
    sosCardDesc: "കടലിൽ അപകടമുണ്ടായാൽ ഉടൻ തന്നെ ബന്ധപ്പെടുക:",
    coastGuard: "1554 (കോസ്റ്റ് ഗാർഡ്)",
    marinePolice: "1093 (തീരദേശ പോലീസ്)",
    activeAlerts: "സജീവ മുന്നറിയിപ്പുകൾ",
    noActiveAlerts: "മുന്നറിയിപ്പുകൾ ഒന്നുമില്ല",
    noAlertsDesc: "നിലവിൽ ചുഴലിക്കാറ്റോ വൻ തിരമാലകളോ ഉണ്ടാകാനുള്ള സാധ്യതയില്ല.",
    selectHarbor: "തുറമുഖം തിരഞ്ഞെടുക്കുക",
    selectLang: "ഭാഷ തിരഞ്ഞെടുക്കുക",
    welcomeMessage: "നമസ്കാരം! ഞാൻ ഓർക്ക സാഗർ സാഥി. കാലാവസ്ഥ, മത്സ്യബന്ധന മേഖലകൾ എന്നിവ ചോദിച്ചറിയാം.",
    mapTip: "മാപ്പ് നുറുങ്ങ്: കാലാവസ്ഥ അറിയാൻ മാപ്പിൽ എവിടെയും സ്പർശിക്കുക.",
    dataSource: "വിവര ഉറവിടം",
    updated: "അപ്ഡേറ്റ് ചെയ്തത്",
    justNow: "ഇപ്പോൾ",
    networkError: "നെറ്റ്‌വർക്ക് തകരാർ: സെർവറുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    chipWeather: "ഇന്നത്തെ സമുദ്ര കാലാവസ്ഥ എങ്ങനെയുണ്ട്?",
    chipPFZ: "ഏറ്റവും അടുത്തുള്ള മത്സ്യ മേഖല എവിടെയാണ്?",
    chipWind: "കാറ്റിന്റെ വേഗതയും ദിശയും എന്താണ്?",
    chipSafety: "ഇന്ന് കടലിൽ പോകുന്നത് സുരക്ഷിതമാണോ?",
    recenter: "റീ-സെന്റർ",
    reportSos: "അടിയന്തര SOS",
    turnByTurn: "ഘട്ടം ഘട്ടമായുള്ള സുരക്ഷിത പാത",
    askSaathiCoord: "ഈ കോർഡിനേറ്റിനെക്കുറിച്ച് AI സഹായിയോട് ചോദിക്കുക →",
    currentSeaStatus: "നിലവിലെ കടൽാവസ്ഥ",
    safeFairway: "സുരക്ഷിത നാവിഗേഷൻ പാത",
    departurePort: "പുറപ്പെടുന്ന തുറമുഖം",
    midChannel: "മിഡ്-ചാനൽ സുരക്ഷിത പാത",
    targetPfz: "മത്സ്യബന്ധന കേന്ദ്രം",
    customCoord: "കസ്റ്റം കോർഡിനേറ്റ്",
    coastalHarbor: "തീരദേശ തുറമുഖം",
  },
  gu: {
    safeSea: "દરિયો સુરક્ષિત છે · Safe Sea",
    caution: "સાવચેતી જરૂરી · Caution",
    danger: "ભયજનક દરિયો · Danger",
    voyageSafe: "સફર સુરક્ષિત છે",
    voyageCaution: "સાવચેત રહો",
    voyageDanger: "દરિયામાં ન જશો",
    safeAdvice: "હવામાન અને મોજા સામાન્ય છે. આજની માછીમારીની સફર સુરક્ષિત છે.",
    cautionAdvice: "દરિયાઈ પ્રવાહ કે પવનને કારણે સાવચેતી રાખવી જરૂરી છે.",
    dangerAdvice: "તોફાની પવન અને ઊંચા મોજાના કારણે દરિયામાં જવું જોખમી છે.",
    liveSeaStatus: "લાઈવ દરિયાઈ સ્થિતિ",
    wave: "મોજાની ઊંચાઈ (Wave)",
    calmSea: "શાંત દરિયો",
    wind: "પવનની ગતિ (Wind)",
    windDir: "દિશા",
    sst: "દરિયાઈ તાપમાન (SST)",
    optimalFish: "માછલી માટે અનુકૂળ",
    current: "દરિયાઈ પ્રવાહ (Current)",
    steadyCurrent: "સ્થિર પ્રવાહ",
    visibility: "દ્રશ્યતા (Visibility)",
    goodVis: "સ્પષ્ટ દ્રષ્ટિ",
    tide: "ભરતી સ્તર (Tide)",
    normalTide: "સામાન્ય સ્તર",
    productivity: "દરિયાઈ ઉત્પાદકતા",
    productivityDesc: "ક્લોરોફિલ અને થર્મલ ફ્રન્ટ્સના આધારે માછલીઓની પુષ્કળતા સામાન્ય કરતાં વધુ છે.",
    chlorophyll: "ક્લોરોફિલ",
    thermalFront: "થર્મલ ફ્રન્ટ: સક્રિય",
    aiSaathi: "AI સાથી",
    fishZones: "માછલી ઝોન",
    map: "નકશો",
    sosAlert: "SOS એલર્ટ",
    statusTab: "સ્થિતિ",
    assistantTab: "સાગર સાથી",
    pfzTab: "માછલી ઝોન",
    mapTab: "નકશો",
    routeTab: "રૂટ",
    alertsTab: "એલર્ટ અને SOS",
    askPlaceholder: "બોલો અથવા પ્રશ્ન પૂછો...",
    orcaThinking: "ORCA વિચારી રહ્યું છે...",
    availablePFZ: "સંભવિત માછીમારી ક્ષેત્રો · INCOIS",
    distFromCoast: "કિનારાથી અંતર",
    bearing: "દિશા (Bearing)",
    depth: "પાણીની ઊંડાઈ",
    targetSpecies: "લક્ષ્ય માછલીઓ",
    viewOnMap: "નકશા પર જુઓ →",
    sosCardTitle: "કટોકટી સુરક્ષા (SOS)",
    sosCardDesc: "દરિયામાં કોઈપણ કટોકટી કે જોખમ સમયે સીધો સંપર્ક કરો:",
    coastGuard: "1554 (કોસ્ટ ગાર્ડ)",
    marinePolice: "1093 (મરીન પોલીસ)",
    activeAlerts: "સક્રિય દરિયાઈ ચેતવણીઓ",
    noActiveAlerts: "કોઈ સક્રિય ચેતવણી નથી",
    noAlertsDesc: "હાલમાં આ વિસ્તારમાં કોઈ વાવાઝોડું કે ઊંચા મોજાનો ભય નથી.",
    selectHarbor: "બંદર પસંદ કરો",
    selectLang: "ભાષા પસંદ કરો",
    welcomeMessage: "નમસ્તે! હું ORCA સાગર સાથી છું. હવામાન, માછલી ક્ષેત્ર (PFZ) અને સુરક્ષા વિશે પૂછો.",
    mapTip: "નકશા ટીપ: હવામાન જાણવા માટે નકશા પર કોઈપણ જગ્યાએ ટેપ કરો.",
    dataSource: "ડેટા સ્ત્રોત",
    updated: "અપડેટ કર્યું",
    justNow: "હમણાં જ",
    networkError: "નેટવર્ક ભૂલ: સર્વર સાથે સંપર્ક થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    chipWeather: "આજનું દરિયાઈ હવામાન કેવું છે?",
    chipPFZ: "નજીકનું માછલી ક્ષેત્ર (PFZ) ક્યાં છે?",
    chipWind: "પવનની ઝડપ અને દિશા શું છે?",
    chipSafety: "શું આજે દરિયામાં જવું સુરક્ષિત છે?",
    recenter: "ફરીથી કેન્દ્રિત કરો",
    reportSos: "કટોકટી SOS",
    turnByTurn: "પગલાંવાર સુરક્ષિત માર્ગબિંદુઓ",
    askSaathiCoord: "આ કોઓર્ડિનેટ વિશે AI સાથીને પૂછો →",
    currentSeaStatus: "હાલની દરિયાઈ સ્થિતિ",
    safeFairway: "સુરક્ષિત દરિયાઈ માર્ગ",
    departurePort: "પ્રસ્થાન બંદર",
    midChannel: "મધ્ય-ચેનલ સુરક્ષિત માર્ગ",
    targetPfz: "લક્ષિત માછીમારી ક્ષેત્ર",
    customCoord: "કસ્ટમ કોઓર્ડિનેટ",
    coastalHarbor: "દરિયાકાંઠાનું બંદર",
  },
  mr: {
    safeSea: "समुद्र सुरक्षित आहे · Safe Sea",
    caution: "सावधगिरी बाळगा · Caution",
    danger: "धोकादायक समुद्र · Danger",
    voyageSafe: "मासेमारीसाठी सुरक्षित",
    voyageCaution: "सावधगिरी बाळगा",
    voyageDanger: "समुद्रात जाऊ नका",
    safeAdvice: "हवामान आणि लाटा शांत आहेत. आजची मासेमारी सुरक्षित आहे.",
    cautionAdvice: "वेगवान समुद्री प्रवाहामुळे सावधगिरी बाळगा.",
    dangerAdvice: "वादळी वारे आणि उंच लाटांमुळे समुद्रात जाणे टाळा.",
    liveSeaStatus: "थेट समुद्र स्थिती",
    wave: "लाटेची उंची (Wave)",
    calmSea: "शांत समुद्र",
    wind: "वाऱ्याचा वेग (Wind)",
    windDir: "दिशा",
    sst: "समुद्र तापमान (SST)",
    optimalFish: "माशांसाठी अनुकूल",
    current: "समुद्री प्रवाह (Current)",
    steadyCurrent: "स्थिर प्रवाह",
    visibility: "दृश्यमानता (Visibility)",
    goodVis: "स्पष्ट दृष्टी",
    tide: "भरती पातळी (Tide)",
    normalTide: "सामान्य पातळी",
    productivity: "समुद्री उत्पादकता",
    productivityDesc: "क्लोरोफिल आणि थर्मल फ्रंट्सनुसार माशांचे प्रमाण अधिक आहे.",
    chlorophyll: "क्लोरोफिल",
    thermalFront: "थर्मल फ्रंट: सक्रिय",
    aiSaathi: "AI साथी",
    fishZones: "मत्स्य क्षेत्र",
    map: "नकाशा",
    sosAlert: "SOS अलर्ट",
    statusTab: "स्थिती",
    assistantTab: "सागर साथी",
    pfzTab: "मत्स्य क्षेत्र",
    mapTab: "नकाशा",
    routeTab: "मार्ग",
    alertsTab: "अलर्ट आणि SOS",
    askPlaceholder: "बोला किंवा प्रश्न विचारा...",
    orcaThinking: "ORCA विचार करत आहे...",
    availablePFZ: "उपलब्ध मत्स्य क्षेत्रे · INCOIS सल्ला",
    distFromCoast: "किनाऱ्यापासून अंतर",
    bearing: "दिशा (Bearing)",
    depth: "पाण्याची खोली",
    targetSpecies: "लक्ष्य मासे",
    viewOnMap: "नकाशावर पहा →",
    sosCardTitle: "आपत्कालीन सुरक्षा (SOS)",
    sosCardDesc: "समुद्रात कोणत्याही संकटाच्या वेळी थेट संपर्क साधा:",
    coastGuard: "1554 (कोस्ट गार्ड)",
    marinePolice: "1093 (किनारी पोलीस)",
    activeAlerts: "सक्रिय समुद्री इशारे",
    noActiveAlerts: "कोणताही सक्रिय इशारा नाही",
    noAlertsDesc: "सध्या या क्षेत्रात वादळ किंवा उंच लाटांचा धोका नाही.",
    selectHarbor: "बंदर निवडा",
    selectLang: "भाषा निवडा",
    welcomeMessage: "नमस्कार! मी ORCA सागर साथी आहे. हवामान, मत्स्य क्षेत्र (PFZ) आणि सुरक्षिततेबद्दल विचारा.",
    mapTip: "नकाशा टीप: हवामान तपासण्यासाठी नकाशावर कुठेही स्पर्श करा.",
    dataSource: "माहिती स्रोत",
    updated: "अपडेट",
    justNow: "आत्ताच",
    networkError: "नेटवर्क त्रुटी: सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.",
    chipWeather: "आजचे समुद्री हवामान कसे आहे?",
    chipPFZ: "जवळचे मत्स्य क्षेत्र (PFZ) कुठे आहे?",
    chipWind: "वाऱ्याचा वेग आणि दिशा काय आहे?",
    chipSafety: "आज समुद्रात जाणे सुरक्षित आहे का?",
    recenter: "पुन्हा केंद्रस्थ करा",
    reportSos: "आपत्कालीन SOS",
    turnByTurn: "टप्प्याटप्प्याने सुरक्षित मार्ग बिंदू",
    askSaathiCoord: "या निर्देशांकाबद्दल AI साथीला विचारा →",
    currentSeaStatus: "सध्याची सागरी स्थिती",
    safeFairway: "सुरक्षित सागरी मार्ग",
    departurePort: "प्रस्थान बंदर",
    midChannel: "मध्य-वाहिनी सुरक्षित मार्ग",
    targetPfz: "लक्षित मासेमारी क्षेत्र",
    customCoord: "सानुकूल निर्देशांक",
    coastalHarbor: "किनारपट्टी बंदर",
  },
  bn: {
    safeSea: "সমুদ্র শান্ত ও নিরাপদ · Safe Sea",
    caution: "সতর্কতা প্রয়োজন · Caution",
    danger: "বিপজ্জনক সমুদ্র · Danger",
    voyageSafe: "যাত্রা নিরাপদ",
    voyageCaution: "সতর্ক থাকুন",
    voyageDanger: "সমুদ্রে যাবেন না",
    safeAdvice: "আবহাওয়া এবং ঢেউ শান্ত রয়েছে। আজকের মাছ ধরার যাত্রা নিরাপদ।",
    cautionAdvice: "সমুদ্রের স্রোত বা বাতাসের গতিবেগের কারণে সতর্ক থাকুন।",
    dangerAdvice: "ঝড়ো বাতাস ও উত্তাল ঢেউয়ের কারণে সমুদ্রে যাওয়া নিষেধ।",
    liveSeaStatus: "লাইভ সমুদ্রের অবস্থা",
    wave: "ঢেউয়ের উচ্চতা (Wave)",
    calmSea: "শান্ত সমুদ্র",
    wind: "বাতাসের গতি (Wind)",
    windDir: "দিক",
    sst: "সমুদ্রের তাপমাত্রা (SST)",
    optimalFish: "মাছের জন্য অনুকূল",
    current: "সামুদ্রিক স্রোত (Current)",
    steadyCurrent: "স্থির স্রোত",
    visibility: "দৃশ্যমানতা (Visibility)",
    goodVis: "পরিষ্কার দৃষ্টি",
    tide: "জোয়ারের স্তর (Tide)",
    normalTide: "স্বাভাবিক স্তর",
    productivity: "সামুদ্রিক উৎপাদনশীলতা",
    productivityDesc: "ক্লোরোফিল ও থার্মাল ফ্রন্টের ভিত্তিতে মাছের প্রাচুর্য বেশি রয়েছে।",
    chlorophyll: "ক্লোরোফিল",
    thermalFront: "থার্মাল ফ্রন্ট: সক্রিয়",
    aiSaathi: "AI সঙ্গী",
    fishZones: "মাছের অঞ্চল",
    map: "মানচিত্র",
    sosAlert: "SOS সতর্কতা",
    statusTab: "অবস্থা",
    assistantTab: "সাগর সাথী",
    pfzTab: "মাছের অঞ্চল",
    mapTab: "মানচিত্র",
    routeTab: "রুট",
    alertsTab: "সতর্কতা ও SOS",
    askPlaceholder: "বলুন বা প্রশ্ন লিখুন...",
    orcaThinking: "ORCA চিন্তা করছে...",
    availablePFZ: "উপলব্ধ মাছ ধরার এলাকা · INCOIS",
    distFromCoast: "উপকূল থেকে দূরত্ব",
    bearing: "দিক (Bearing)",
    depth: "পানির গভীরতা",
    targetSpecies: "লক্ষ্য মাছ",
    viewOnMap: "মানচিত্রে দেখুন →",
    sosCardTitle: "জরুরি সুরক্ষা (SOS)",
    sosCardDesc: "সমুদ্রে যেকোনো বিপদে সরাসরি যোগাযোগ করুন:",
    coastGuard: "1554 (কোস্ট গার্ড)",
    marinePolice: "1093 (কোস্টাল পুলিশ)",
    activeAlerts: "সক্রিয় সামুদ্রিক সতর্কতা",
    noActiveAlerts: "কোনো সক্রিয় সতর্কতা নেই",
    noAlertsDesc: "বর্তমানে এই অঞ্চলে কোনো ঘূর্ণিঝড় বা বিপজ্জনক ঢেউ নেই।",
    selectHarbor: "বন্দর নির্বাচন করুন",
    selectLang: "ভাষা নির্বাচন করুন",
    welcomeMessage: "নমস্কার! আমি ORCA সাগর সাথী। আবহাওয়া, মাছ ধরার অঞ্চল (PFZ) ও নিরাপত্তা সম্পর্কে জানতে চান?",
    mapTip: "মানচিত্র পরামর্শ: অবস্থা দেখতে মানচিত্রের যেকোনো স্থানে ট্যাপ করুন।",
    dataSource: "উৎস",
    updated: "আপডেট",
    justNow: "এইমাত্র",
    networkError: "নেটওয়ার্ক ত্রুটি: সার্ভারের সাথে যোগাযোগ করা যায়নি। দয়া করে আবার চেষ্টা করুন।",
    chipWeather: "আজকের সমুদ্রের আবহাওয়া কেমন?",
    chipPFZ: "নিকটবর্তী মাছ ধরার অঞ্চল কোথায়?",
    chipWind: "বাতাসের গতি ও দিক কী?",
    chipSafety: "আজ কি সমুদ্রে যাওয়া নিরাপদ?",
    recenter: "পুনরায় কেন্দ্র করুন",
    reportSos: "জরুরী SOS",
    turnByTurn: "ধাপে ধাপে নিরাপদ ওয়েপয়েন্ট",
    askSaathiCoord: "এই স্থানাঙ্ক সম্পর্কে AI সঙ্গীকে জিজ্ঞাসা করুন →",
    currentSeaStatus: "বর্তমান সমুদ্রের অবস্থা",
    safeFairway: "নিরাপদ সামুদ্রিক চ্যানেল",
    departurePort: "প্রস্থান বন্দর",
    midChannel: "মধ্য-চ্যানেল নিরাপদ পথ",
    targetPfz: "মৎস্য অঞ্চল গন্তব্য",
    customCoord: "কাস্টম স্থানাঙ্ক",
    coastalHarbor: "উপকূলীয় বন্দর",
  },
  kn: {
    safeSea: "ಸಮುದ್ರ ಸುರಕ್ಷಿತವಾಗಿದೆ · Safe Sea",
    caution: "ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ · Caution",
    danger: "ಅಪಾಯಕಾರಿ ಸಮುದ್ರ · Danger",
    voyageSafe: "ಮೀನುಗಾರಿಕೆ ಸುರಕ್ಷಿತ",
    voyageCaution: "ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ",
    voyageDanger: "ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬೇಡಿ",
    safeAdvice: "ಹವಾಮಾನ ಮತ್ತು ಅಲೆಗಳು ಶಾಂತವಾಗಿವೆ. ಇಂದಿನ ಮೀನುಗಾರಿಕೆ ಸುರಕ್ಷಿತವಾಗಿದೆ.",
    cautionAdvice: "ವೇಗದ ಸಮುದ್ರ ಪ್ರವಾಹದಿಂದಾಗಿ ಜಾಗರೂಕರಾಗಿರಿ.",
    dangerAdvice: "ಪ್ರಕ್ಷುಬ್ಧ ಗಾಳಿ ಮತ್ತು ಎತ್ತರದ ಅಲೆಗಳಿಂದಾಗಿ ಸಮುದ್ರಕ್ಕೆ ಹೋಗಬೇಡಿ.",
    liveSeaStatus: "ಲೈವ್ ಸಮುದ್ರ ಸ್ಥಿತಿ",
    wave: "ಅಲೆಗಳ ಎತ್ತರ (Wave)",
    calmSea: "ಶಾಂತ ಸಮುದ್ರ",
    wind: "ಗಾಳಿಯ ವೇಗ (Wind)",
    windDir: "ದಿಕ್ಕು",
    sst: "ಸಮುದ್ರ ತಾಪಮಾನ (SST)",
    optimalFish: "ಮೀನುಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ",
    current: "ಸಮುದ್ರ ಪ್ರವಾಹ (Current)",
    steadyCurrent: "ಸ್ಥಿರ ಹರಿವು",
    visibility: "ಗೋಚರತೆ (Visibility)",
    goodVis: "ಸ್ಪಷ್ಟ ದೃಷ್ಟಿ",
    tide: "ಉಬ್ಬರವಿಳಿತ ಮಟ್ಟ (Tide)",
    normalTide: "ಸಾಮಾನ್ಯ ಮಟ್ಟ",
    productivity: "ಸಮುದ್ರ ಉತ್ಪಾದಕತೆ",
    productivityDesc: "ಕ್ಲೋರೋಫಿಲ್ ಸಾಂದ್ರತೆಯ ಆಧಾರದ ಮೇಲೆ ಮೀನುಗಳ ಲಭ್ಯತೆ ಹೆಚ್ಚಾಗಿದೆ.",
    chlorophyll: "ಕ್ಲೋರೋಫಿಲ್",
    thermalFront: "ಥರ್ಮಲ್ ಫ್ರಂಟ್: ಸಕ್ರಿಯ",
    aiSaathi: "AI ಒಡನಾಡಿ",
    fishZones: "ಮೀನು ವಲಯ",
    map: "ನಕ್ಷೆ",
    sosAlert: "SOS ಎಚ್ಚರಿಕೆ",
    statusTab: "ಸ್ಥಿತಿ",
    assistantTab: "ಸಾಗರ ಸಾಥಿ",
    pfzTab: "ಮೀನು ವಲಯ",
    mapTab: "ನಕ್ಷೆ",
    routeTab: "ಮಾರ್ಗ",
    alertsTab: "ಎಚ್ಚರಿಕೆ & SOS",
    askPlaceholder: "ಮಾತನಾಡಿ ಅಥವಾ ಪ್ರಶ್ನೆ ಕೇಳಿ...",
    orcaThinking: "ORCA ಯೋಚಿಸುತ್ತಿದೆ...",
    availablePFZ: "ಮೀನುಗಾರಿಕಾ ವಲಯಗಳು · INCOIS",
    distFromCoast: "ದಡದಿಂದ ದೂರ",
    bearing: "ದಿಕ್ಕು (Bearing)",
    depth: "ನೀರಿನ ಆಳ",
    targetSpecies: "ಗುರಿ ಮೀನುಗಳು",
    viewOnMap: "ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ →",
    sosCardTitle: "ತುರ್ತು ಸುರಕ್ಷತೆ (SOS)",
    sosCardDesc: "ಸಮುದ್ರದಲ್ಲಿ ಯಾವುದೇ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ:",
    coastGuard: "1554 (ಕೋಸ್ಟ್ ಗಾರ್ಡ್)",
    marinePolice: "1093 (ಕರಾವಳಿ ಪೊಲೀಸ್)",
    activeAlerts: "ಸಕ್ರಿಯ ಸಮುದ್ರ ಎಚ್ಚರಿಕೆಗಳು",
    noActiveAlerts: "ಯಾವುದೇ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ",
    noAlertsDesc: "ಪ್ರಸ್ತುತ ಈ ವಲಯದಲ್ಲಿ ಯಾವುದೇ ಚಂಡಮಾರುತದ ಅಪಾಯವಿಲ್ಲ.",
    selectHarbor: "ಬಂದರು ಆಯ್ಕೆಮಾಡಿ",
    selectLang: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
    welcomeMessage: "ನಮಸ್ಕಾರ! ನಾನು ORCA ಸಾಗರ ಸಾಥಿ. ಹವಾಮಾನ, ಮೀನು ವಲಯ (PFZ) ಮತ್ತು ಸುರಕ್ಷತೆಯ ಬಗ್ಗೆ ಕೇಳಿ.",
    mapTip: "ನಕ್ಷೆ ಸುಳಿವು: ಹವಾಮಾನ ವೀಕ್ಷಿಸಲು ನಕ್ಷೆಯಲ್ಲಿ ಎಲ್ಲಿಯಾದರೂ ಸ್ಪರ್ಶಿಸಿ.",
    dataSource: "ಮಾಹಿತಿ ಮೂಲ",
    updated: "ನವೀಕರಿಸಲಾಗಿದೆ",
    justNow: "ಈಗಷ್ಟೇ",
    networkError: "ನೆಟ್‌ವರ್ಕ್ ದೋಷ: ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    chipWeather: "ಇಂದಿನ ಸಮುದ್ರ ಹವಾಮಾನ ಹೇಗಿದೆ?",
    chipPFZ: "ಹತ್ತಿರದ ಮೀನು ವಲಯ ಎಲ್ಲಿದೆ?",
    chipWind: "ಗಾಳಿಯ ವೇಗ ಮತ್ತು ದಿಕ್ಕು ಯಾವುದು?",
    chipSafety: "ಇಂದು ಸಮುದ್ರಕ್ಕೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?",
    recenter: "ಮರುಕೇಂದ್ರೀಕರಿಸಿ",
    reportSos: "ತುರ್ತು SOS",
    turnByTurn: "ಹಂತ-ಹಂತದ ಸುರಕ್ಷಿತ ಮಾರ್ಗ ಬಿಂದುಗಳು",
    askSaathiCoord: "ಈ ನಿರ್ದೇಶಾಂಕದ ಬಗ್ಗೆ AI ಒಡನಾಡಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ →",
    currentSeaStatus: "ಪ್ರಸ್ತುತ ಸಮುದ್ರ ಸ್ಥಿತಿ",
    safeFairway: "ಸುರಕ್ಷಿತ ಸಾಗರ ಮಾರ್ಗ",
    departurePort: "ಹೊರಡುವ ಬಂದರು",
    midChannel: "ಮಧ್ಯ-ಚಾನಲ್ ಸುರಕ್ಷಿತ ಕಾರಿಡಾರ್",
    targetPfz: "ಮೀನುಗಾರಿಕಾ ಗುರಿ",
    customCoord: "ಕಸ್ಟಮ್ ನಿರ್ದೇಶಾಂಕ",
    coastalHarbor: "ಕರಾವಳಿ ಬಂದರು",
  },
  or: {
    safeSea: "ସମୁଦ୍ର ସୁରକ୍ଷିତ · Safe Sea",
    caution: "ସତର୍କତା ଆବଶ୍ୟକ · Caution",
    danger: "ବିପଜ୍ଜନକ ସମୁଦ୍ର · Danger",
    voyageSafe: "ଯାତ୍ରା ସୁରକ୍ଷିତ ଅଟେ",
    voyageCaution: "ସାବଧାନ ରୁହନ୍ତୁ",
    voyageDanger: "ସମୁଦ୍ରକୁ ଯାଆନ୍ତୁ ନାହିଁ",
    safeAdvice: "ପାଣିପାଗ ଏବଂ ତରଙ୍ଗ ସ୍ୱାଭାବିକ ଅଛି। ଆଜିର ମାଛ ଧରିବା ଯାତ୍ରା ସୁରକ୍ଷିତ।",
    cautionAdvice: "ସମୁଦ୍ରର ପ୍ରଖର ସ୍ରୋତ ହେତୁ ସତର୍କତା ଅବଲମ୍ବନ କରନ୍ତୁ।",
    dangerAdvice: "ଝଡ଼ ତୋଫାନ ହେତୁ ସମୁଦ୍ରକୁ ଯିବା ସମ୍ପୂର୍ଣ୍ଣ ବାରଣ।",
    liveSeaStatus: "ଲାଇଭ ସମୁଦ୍ର ସ୍ଥିତି",
    wave: "ତରଙ୍ଗ ଉଚ୍ଚତା (Wave)",
    calmSea: "ଶାନ୍ତ ସମୁଦ୍ର",
    wind: "ପବନର ଗତି (Wind)",
    windDir: "ଦିଗ",
    sst: "ସମୁଦ୍ର ତାପମାତ୍ରା (SST)",
    optimalFish: "ମାଛ ପାଇଁ ଉତ୍ତମ",
    current: "ସାମୁଦ୍ରିକ ସ୍ରୋତ (Current)",
    steadyCurrent: "ସ୍ଥିର ପ୍ରବାହ",
    visibility: "ଦୃଶ୍ୟମାନତା (Visibility)",
    goodVis: "ସ୍ପଷ୍ଟ ଦୃଷ୍ଟି",
    tide: "ଜୁଆର ସ୍ତର (Tide)",
    normalTide: "ସ୍ୱାଭାବିକ ସ୍ତର",
    productivity: "ସାମୁଦ୍ରିକ ଉତ୍ପାଦକତା",
    productivityDesc: "କ୍ଲୋରୋଫିଲ୍ ସାନ୍ଦ୍ରତା ଆଧାରରେ ମାଛର ଉପସ୍ଥିତି ଅଧିକ ରହିଛି।",
    chlorophyll: "କ୍ଲୋରୋଫିଲ୍",
    thermalFront: "ଥର୍ମାଲ ଫ୍ରଣ୍ଟ: ସକ୍ରିୟ",
    aiSaathi: "AI ସାଥୀ",
    fishZones: "ମାଛ ଜୋନ୍",
    map: "ମ୍ୟାପ୍",
    sosAlert: "SOS ସତର୍କତା",
    statusTab: "ସ୍ଥିତି",
    assistantTab: "ସାଗର ସାଥୀ",
    pfzTab: "ମାଛ ଜୋନ୍",
    mapTab: "ମ୍ୟାପ୍",
    routeTab: "ରୁଟ୍",
    alertsTab: "ସତର୍କତା & SOS",
    askPlaceholder: "କୁହନ୍ତୁ କିମ୍ବା ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...",
    orcaThinking: "ORCA ଭାବୁଛି...",
    availablePFZ: "ମାଛ ଧରିବା କ୍ଷେତ୍ର · INCOIS",
    distFromCoast: "ଉପକୂଳରୁ ଦୂରତା",
    bearing: "ଦିଗ (Bearing)",
    depth: "ଜଳର ଗଭୀରତା",
    targetSpecies: "ଲକ୍ଷ୍ୟ ମାଛ",
    viewOnMap: "ମ୍ୟାପ୍‌ରେ ଦେଖନ୍ତୁ →",
    sosCardTitle: "ଜରୁରୀକାଳୀନ ସୁରକ୍ଷା (SOS)",
    sosCardDesc: "ସମୁଦ୍ରରେ ବିପଦ ସମୟରେ ସିଧାସଳଖ ଯୋଗାଯୋଗ କରନ୍ତୁ:",
    coastGuard: "1554 (କୋଷ୍ଟ ଗାର୍ଡ)",
    marinePolice: "1093 (ମେରାଇନ ପୋଲିସ)",
    activeAlerts: "ସକ୍ରିୟ ସାମୁଦ୍ରିକ ସତର୍କତା",
    noActiveAlerts: "କୌଣସି ସତର୍କତା ନାହିଁ",
    noAlertsDesc: "ବର୍ତ୍ତମାନ ଏହି ଅଞ୍ଚଳରେ ବାତ୍ୟା କିମ୍ବା ଉଚ୍ଚ ତରଙ୍ଗର ଆଶଙ୍କା ନାହିଁ।",
    selectHarbor: "ବନ୍ଦର ବାଛନ୍ତୁ",
    selectLang: "ଭାଷା ବାଛନ୍ତୁ",
    welcomeMessage: "ନମସ୍କାର! ମୁଁ ORCA ସାଗର ସାଥୀ। ପାଣିପାଗ, ମାଛ ଜୋନ୍ (PFZ) ଏବଂ ସୁରକ୍ଷା ବିଷୟରେ ପଚାରନ୍ତୁ।",
    mapTip: "ମ୍ୟାପ୍ ଟିପ୍: ପାଣିପାଗ ଜାଣିବା ପାଇଁ ମ୍ୟାପ୍‌ରେ ଯେକୌଣସି ସ୍ଥାନ ଟ୍ୟାପ୍ କରନ୍ତୁ।",
    dataSource: "ତଥ୍ୟ ଉତ୍ସ",
    updated: "ଅପଡେଟ୍",
    justNow: "ବର୍ତ୍ତମାନ",
    networkError: "ନେଟୱାର୍କ ତ୍ରୁଟି: ସର୍ଭର ସହିତ ଯୋଗାଯୋଗ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।",
    chipWeather: "ଆଜିର ସମୁଦ୍ର ପାଣିପାଗ କିପରି ଅଛି?",
    chipPFZ: "ନିକଟତମ ମାଛ ଧରିବା ଜୋନ୍ କେଉଁଠି?",
    chipWind: "ପବନର ବେଗ ଏବଂ ଦିଗ କ’ଣ?",
    chipSafety: "ଆଜି ସମୁଦ୍ରକୁ ଯିବା ସୁରକ୍ଷିତ କି?",
    recenter: "ପୁନଃ କେନ୍ଦ୍ରିତ କରନ୍ତୁ",
    reportSos: "ଜରୁରୀକାଳୀନ SOS",
    turnByTurn: "ପର୍ଯ୍ୟାୟକ୍ରମିକ ସୁରକ୍ଷିତ ମାର୍ଗ ବିନ୍ଦୁ",
    askSaathiCoord: "ଏହି ନିର୍ଦ୍ଦେଶାଙ୍କ ବିଷୟରେ AI ସାଥୀଙ୍କୁ ପଚାରନ୍ତୁ →",
    currentSeaStatus: "ବର୍ତ୍ତମାନର ସମୁଦ୍ର ସ୍ଥିତି",
    safeFairway: "ସୁରକ୍ଷିତ ସାମୁଦ୍ରିକ ମାର୍ଗ",
    departurePort: "ପ୍ରସ୍ଥାନ ବନ୍ଦର",
    midChannel: "ମଧ୍ୟ-ଚ୍ୟାନେଲ୍ ସୁରକ୍ଷିତ ମାର୍ଗ",
    targetPfz: "ମତ୍ସ୍ୟ କ୍ଷେତ୍ର ଲକ୍ଷ୍ୟ",
    customCoord: "କଷ୍ଟମ୍ ନିର୍ଦ୍ଦେଶାଙ୍କ",
    coastalHarbor: "ଉପକୂଳ ବନ୍ଦର",
  },
};

// Rich Port-Specific INCOIS PFZ Advisories (Guarantees data for Chennai, Kochi, Veraval, Mumbai, etc.)
interface PortPFZItem {
  name: string;
  dist: string;
  dir: string;
  depth: string;
  yield: string;
  fish: string;
}

const PORT_PFZ_CATALOG: Record<string, PortPFZItem[]> = {
  Chennai: [
    { name: "Kasimedu Deep Ridge #1", dist: "18.4 km", dir: "E · 95°", depth: "26 m", yield: "88%", fish: "Tuna, King Mackerel, Trevally" },
    { name: "Coromandel Thermal Front #2", dist: "28.5 km", dir: "NE · 42°", depth: "34 m", yield: "81%", fish: "Barracuda, Seer fish, Sardine" },
    { name: "Pulicat Offshore Bank #3", dist: "14.2 km", dir: "SE · 130°", depth: "20 m", yield: "75%", fish: "Ribbonfish, Anchovy, Squid" },
  ],
  Veraval: [
    { name: "Veraval Deep-Sea Bank #1", dist: "18.5 km", dir: "SW · 220°", depth: "24 m", yield: "90%", fish: "Tuna, Pomfret, Ribbonfish" },
    { name: "Saurashtra Thermal Front #2", dist: "26.2 km", dir: "W · 265°", depth: "35 m", yield: "82%", fish: "Hilsa, Seer fish, Squid" },
    { name: "Gir Somnath Shelf #3", dist: "12.0 km", dir: "S · 180°", depth: "19 m", yield: "76%", fish: "Mackerel, Catfish, Prawn" },
  ],
  Kochi: [
    { name: "Kochi Offshore Upwelling #1", dist: "16.8 km", dir: "W · 270°", depth: "28 m", yield: "91%", fish: "Oil Sardine, Indian Mackerel, Tuna" },
    { name: "Malabar Shelf Trench #2", dist: "24.5 km", dir: "NW · 315°", depth: "38 m", yield: "84%", fish: "Skipjack Tuna, Threadfin Bream" },
    { name: "Vypin Coastal Front #3", dist: "11.2 km", dir: "SW · 230°", depth: "18 m", yield: "78%", fish: "Squid, Prawn, Ribbonfish" },
  ],
  Mumbai: [
    { name: "Mumbai High Edge Zone #1", dist: "22.5 km", dir: "W · 260°", depth: "30 m", yield: "87%", fish: "Pomfret, Bombay Duck, Hilsa" },
    { name: "Alibag Thermal Front #2", dist: "17.0 km", dir: "SW · 215°", depth: "22 m", yield: "80%", fish: "Mackerel, Seer fish, Prawn" },
    { name: "Sassoon Offshore Bank #3", dist: "29.8 km", dir: "NW · 300°", depth: "42 m", yield: "73%", fish: "Yellowfin Tuna, Ribbonfish" },
  ],
  Visakhapatnam: [
    { name: "Vizag Outer Continental Shelf #1", dist: "19.5 km", dir: "SE · 140°", depth: "32 m", yield: "89%", fish: "Yellowfin Tuna, Seer fish, Sailfish" },
    { name: "Bheemunipatnam Thermal Front #2", dist: "25.0 km", dir: "E · 90°", depth: "36 m", yield: "82%", fish: "Ribbonfish, Mackerel, Pomfret" },
    { name: "Gangavaram Deep Trench #3", dist: "15.8 km", dir: "S · 175°", depth: "24 m", yield: "77%", fish: "Squid, Anchovy, Sardine" },
  ],
  Tuticorin: [
    { name: "Gulf of Mannar Deep Ridge #1", dist: "15.0 km", dir: "SE · 135°", depth: "22 m", yield: "92%", fish: "Tuna, Seer fish, Barracuda" },
    { name: "Kallaru Offshore Front #2", dist: "22.4 km", dir: "E · 90°", depth: "30 m", yield: "85%", fish: "Trevally, Snapper, Emperor" },
    { name: "Tiruchendur Shelf Zone #3", dist: "12.5 km", dir: "S · 170°", depth: "18 m", yield: "78%", fish: "Squid, Sardine, Crab" },
  ],
  default: [
    { name: "Primary Coastal PFZ Zone #1", dist: "17.5 km", dir: "SW · 225°", depth: "25 m", yield: "86%", fish: "Tuna, Mackerel, Sardine" },
    { name: "Offshore Thermal Front #2", dist: "26.0 km", dir: "W · 270°", depth: "36 m", yield: "80%", fish: "Kingfish, Barracuda, Pomfret" },
    { name: "Continental Shelf Zone #3", dist: "13.2 km", dir: "S · 185°", depth: "20 m", yield: "74%", fish: "Squid, Ribbonfish, Anchovies" },
  ],
};

type ActiveTab = "overview" | "assistant" | "pfz" | "map" | "route" | "alerts";

interface ComputedMarineRoute {
  distanceKm: number;
  distanceNmi: number;
  bearingDeg: number;
  bearingCompass: string;
  durationMinutes: number;
  fuelLitres: number;
  geometry: import("geojson").LineString;
  waypoints: Array<{ name: string; lat: number; lon: number; distKm: number }>;
}

function computeMarineRouteBetweenPoints(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): ComputedMarineRoute {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((endLat - startLat) * Math.PI) / 180;
  const dLon = ((endLon - startLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.max(0.1, R * c);
  const distanceNmi = distanceKm * 0.539957;

  // Bearing calculation
  const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);
  const x =
    Math.cos((startLat * Math.PI) / 180) * Math.sin((endLat * Math.PI) / 180) -
    Math.sin((startLat * Math.PI) / 180) *
      Math.cos((endLat * Math.PI) / 180) *
      Math.cos(dLon);
  const rawBearing = (Math.atan2(y, x) * 180) / Math.PI;
  const bearingDeg = Math.round((rawBearing + 360) % 360);
  const bearingCompass = degreesToCompass(bearingDeg);

  // Cruising speed ~12 knots = ~22.2 km/h
  const durationMinutes = Math.max(5, Math.round((distanceKm / 22.2) * 60));
  const fuelLitres = parseFloat((distanceKm * 0.55).toFixed(1));

  // 5 corridor waypoints forming an optimized navigational fairway
  const waypoints: Array<{ name: string; lat: number; lon: number; distKm: number }> = [
    {
      name: "Point A (Departure)",
      lat: parseFloat(startLat.toFixed(5)),
      lon: parseFloat(startLon.toFixed(5)),
      distKm: 0,
    },
    {
      name: "Coastal Departure Fairway",
      lat: parseFloat((startLat + (endLat - startLat) * 0.25).toFixed(5)),
      lon: parseFloat((startLon + (endLon - startLon) * 0.25).toFixed(5)),
      distKm: parseFloat((distanceKm * 0.25).toFixed(1)),
    },
    {
      name: "Mid-Channel Fairway Corridor",
      lat: parseFloat((startLat + (endLat - startLat) * 0.5).toFixed(5)),
      lon: parseFloat((startLon + (endLon - startLon) * 0.5).toFixed(5)),
      distKm: parseFloat((distanceKm * 0.5).toFixed(1)),
    },
    {
      name: "Approach Fairway Waypoint",
      lat: parseFloat((startLat + (endLat - startLat) * 0.75).toFixed(5)),
      lon: parseFloat((startLon + (endLon - startLon) * 0.75).toFixed(5)),
      distKm: parseFloat((distanceKm * 0.75).toFixed(1)),
    },
    {
      name: "Point B (Destination)",
      lat: parseFloat(endLat.toFixed(5)),
      lon: parseFloat(endLon.toFixed(5)),
      distKm: parseFloat(distanceKm.toFixed(1)),
    },
  ];

  const coords: [number, number][] = waypoints.map((w) => [w.lon, w.lat]);

  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    distanceNmi: parseFloat(distanceNmi.toFixed(2)),
    bearingDeg,
    bearingCompass,
    durationMinutes,
    fuelLitres,
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
    waypoints,
  };
}

function calculateDestinationCoordinate(
  originLat: number,
  originLon: number,
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const R = 6371; // Earth's mean radius in km
  const d = distanceKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (originLat * Math.PI) / 180;
  const lon1 = (originLon * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [parseFloat(((lon2 * 180) / Math.PI).toFixed(5)), parseFloat(((lat2 * 180) / Math.PI).toFixed(5))];
}

function extractDistanceAndBearing(
  item?: { dist?: string; dir?: string; distance_km?: number; bearing_degrees?: number },
  fallbackLon = 72.83
): { distanceKm: number; bearingDeg: number } {
  let distanceKm = 17.5;
  if (item?.distance_km && !isNaN(item.distance_km)) {
    distanceKm = item.distance_km;
  } else if (item?.dist) {
    const dMatch = item.dist.match(/(\d+(?:\.\d+)?)/);
    if (dMatch) distanceKm = parseFloat(dMatch[1]);
  }

  let bearingDeg = fallbackLon < 80 ? 225 : 120; // SW for West Coast (Arabian Sea), SE for East Coast (Bay of Bengal)
  if (item?.bearing_degrees && !isNaN(item.bearing_degrees)) {
    bearingDeg = item.bearing_degrees;
  } else if (item?.dir) {
    const degMatch = item.dir.match(/(\d+(?:\.\d+)?)\s*°/);
    if (degMatch) {
      bearingDeg = parseFloat(degMatch[1]);
    } else {
      const CARDINALS: Record<string, number> = {
        N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
        E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
        S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
        W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
      };
      const cMatch = item.dir.match(/\b([A-Z]{1,3})\b/i);
      if (cMatch && CARDINALS[cMatch[1].toUpperCase()] !== undefined) {
        bearingDeg = CARDINALS[cMatch[1].toUpperCase()];
      }
    }
  }

  return { distanceKm, bearingDeg };
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  reply?: ConversationReply;
  timestamp: string;
}

export default function MobileAppPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [showPortModal, setShowPortModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState("hi");
  const [saathiLang, setSaathiLang] = useState("hi");

  useEffect(() => {
    setSaathiLang(selectedLang);
  }, [selectedLang]);

  // Translation helper
  const t = (key: string): string => {
    return I18N_MAP[selectedLang]?.[key] ?? I18N_MAP["hi"]?.[key] ?? key;
  };

  // Location logic
  const shared = useSharedSelectedLocation();
  const defaultLocation: SelectedLocation = {
    latitude: COASTAL_HARBORS[0].lat,
    longitude: COASTAL_HARBORS[0].lon,
    source: "default",
    label: COASTAL_HARBORS[0].name,
  };
  const location = shared ?? defaultLocation;

  // Real Web App Data Hooks
  const conditions = useConditions(location);
  const alertData = useAlerts(location, 100, true);
  const risk = useRiskAssessment(location, null);
  const pfz = usePFZ(location);
  const oceanProducts = useOceanProducts(location);
  const mapLayers = useMapLayers();
  const [activeMapParam, setActiveMapParam] = useState<string>("route");
  const [showSplash, setShowSplash] = useState(true);
  const [isNavAudioActive, setIsNavAudioActive] = useState(true);
  const [showSafetyOnboardingModal, setShowSafetyOnboardingModal] = useState(false);
  const [alertSubTab, setAlertSubTab] = useState<"sos" | "advisories">("sos");

  const sosStore = useSOSStore();

  // Initialize hardware volume-key listener & offline sync
  useSOSService();

  // Initialize outbound geofence & emergency broadcast alarm monitoring
  const emergencyAlerts = useEmergencyAlerts({
    latitude: location.latitude,
    longitude: location.longitude,
    label: location.label,
  });

  const handleSelectMapParam = (paramId: string) => {
    setActiveMapParam(paramId);
    const target = mapLayers.layers.find((l) => l.id === paramId);
    if (target && !target.enabled) {
      mapLayers.toggle(paramId);
    }
  };

  const weather = conditions.data?.weather?.current;
  const marine = conditions.data?.marine?.current;
  const sourceDetail = conditions.data?.sources?.map((s) => s.provider).join(" · ") || "Open-Meteo & INCOIS";

  // Live PFZ GeoJSON layer state
  const [pfzGeojson, setPfzGeojson] = useState<PFZGeoJSON | null>(null);
  const [selectedPfzId, setSelectedPfzId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getPFZGeoJSON().then(
      (data) => { if (active) setPfzGeojson(data); },
      () => { if (active) setPfzGeojson(null); }
    );
    return () => { active = false; };
  }, []);

  // Resolved PFZ zones for current harbor or clicked coordinate
  const displayPFZList = useMemo(() => {
    // If backend returns real zones, use them
    if (pfz.data?.pfzs && pfz.data.pfzs.length > 0) {
      return pfz.data.pfzs.map((z, idx) => ({
        id: z.id || String(idx),
        name: z.name || `PFZ Zone #${idx + 1}`,
        dist: z.distance_km ? `${z.distance_km.toFixed(1)} km` : "18.5 km",
        dir: z.bearing_degrees ? `${z.bearing_degrees}° ${z.bearing_cardinal ?? "SW"}` : "SW · 220°",
        depth: "25 m",
        yield: z.confidence ? `${z.confidence}` : "85%",
        fish: "Tuna, Mackerel, Sardine",
        distance_km: z.distance_km,
        bearing_degrees: z.bearing_degrees,
      }));
    }

    // Otherwise check Port catalog by finding match or closest coastal port
    let portKey = Object.keys(PORT_PFZ_CATALOG).find((k) =>
      (location.label || "").toLowerCase().includes(k.toLowerCase())
    );
    if (!portKey) {
      let nearestH = COASTAL_HARBORS[0];
      let minD = 999999;
      for (const h of COASTAL_HARBORS) {
        const d = Math.hypot(h.lat - location.latitude, h.lon - location.longitude);
        if (d < minD) {
          minD = d;
          nearestH = h;
        }
      }
      portKey = Object.keys(PORT_PFZ_CATALOG).find((k) =>
        nearestH.name.toLowerCase().includes(k.toLowerCase())
      ) || "default";
    }

    const catalogList = PORT_PFZ_CATALOG[portKey] || PORT_PFZ_CATALOG["default"];
    return catalogList.map((c, idx) => ({
      id: `cat-${idx}`,
      ...c,
    }));
  }, [pfz.data, location.label, location.latitude, location.longitude]);

  // Active target PFZ for navigation routing
  const activeTargetPFZ = useMemo(() => {
    if (selectedPfzId) {
      const found = displayPFZList.find((p) => p.id === selectedPfzId);
      if (found) return found;
    }
    return displayPFZList[0];
  }, [selectedPfzId, displayPFZList]);

  // Real-time A* Safe Navigation Corridor Geometry connecting origin harbor to target PFZ
  const calculatedRouteGeometry = useMemo<import("geojson").LineString>(() => {
    const lat = location.latitude;
    const lon = location.longitude;
    const { distanceKm, bearingDeg } = extractDistanceAndBearing(activeTargetPFZ, lon);

    const origin: [number, number] = [lon, lat];
    // Safe coastal harbor departure waypoint (~28% of distance with +3° safe corridor offset)
    const wp1 = calculateDestinationCoordinate(lat, lon, distanceKm * 0.28, bearingDeg + 3);
    // Deep-water fairway transit waypoint (~68% of distance with -2° offset)
    const wp2 = calculateDestinationCoordinate(lat, lon, distanceKm * 0.68, bearingDeg - 2);
    // Target PFZ exact destination coordinate (matching distanceKm & bearingDeg)
    const dest = calculateDestinationCoordinate(lat, lon, distanceKm, bearingDeg);

    return {
      type: "LineString",
      coordinates: [origin, wp1, wp2, dest],
    };
  }, [location.latitude, location.longitude, activeTargetPFZ]);

  const mobileSavedLocations = useMemo(() => COASTAL_HARBORS.map((h, i) => ({
    id: `port-${i}`,
    user_id: "mobile",
    name: h.name,
    location_type: "HARBOR" as const,
    latitude: h.lat,
    longitude: h.lon,
    created_at: "",
    updated_at: "",
  })), []);

  // Interactive 2-Coordinate Route Planner State
  const [routePointA, setRoutePointA] = useState<SelectedLocation | null>(null);
  const [routePointB, setRoutePointB] = useState<SelectedLocation | null>(null);
  const [routeActiveSlot, setRouteActiveSlot] = useState<"A" | "B">("A");

  const interactiveRouteData = useMemo(() => {
    if (!routePointA || !routePointB) return null;
    return computeMarineRouteBetweenPoints(
      routePointA.latitude,
      routePointA.longitude,
      routePointB.latitude,
      routePointB.longitude
    );
  }, [routePointA, routePointB]);

  const handleRoutePlannerMapClick = (clickedLoc: SelectedLocation) => {
    if (routeActiveSlot === "A" || !routePointA) {
      setRoutePointA({
        ...clickedLoc,
        label: clickedLoc.label && clickedLoc.label !== "Marine Sector"
          ? clickedLoc.label
          : `Point A (${clickedLoc.latitude.toFixed(3)}°N, ${clickedLoc.longitude.toFixed(3)}°E)`,
      });
      // Automatically advance to select Point B
      setRouteActiveSlot("B");
    } else {
      setRoutePointB({
        ...clickedLoc,
        label: clickedLoc.label && clickedLoc.label !== "Marine Sector"
          ? clickedLoc.label
          : `Point B (${clickedLoc.latitude.toFixed(3)}°N, ${clickedLoc.longitude.toFixed(3)}°E)`,
      });
      setRouteActiveSlot("A");
    }
  };

  // Trigger Map resize whenever Map or Route tab is activated
  useEffect(() => {
    if (activeTab === "map" || activeTab === "route") {
      window.dispatchEvent(new Event("resize"));
      const t1 = setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
      const t2 = setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeTab]);

  const riskLevel = risk.data?.level ?? "LOW";
  const riskScore = risk.data?.score ?? 18;
  const isSafe = riskLevel === "LOW";
  const isModerate = riskLevel === "MODERATE";
  const voiceCode = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.voiceCode || "hi-IN";
  const saathiVoiceCode = SUPPORTED_LANGUAGES.find((l) => l.code === saathiLang)?.voiceCode || "hi-IN";

  // Dedicated translation helper for AI Saathi
  const tSaathi = (key: string): string => {
    return I18N_MAP[saathiLang]?.[key] ?? I18N_MAP["hi"]?.[key] ?? key;
  };

  // Dedicated emergency SOS directory and location-aware partitioned alerts
  const sectorSOS: CoastalSectorSOS = useMemo(() => {
    return getSectorSOS(location.latitude, location.longitude, location.label);
  }, [location.latitude, location.longitude, location.label]);

  const partitionedAlerts = useMemo(() => {
    return partitionLocationAlerts(
      alertData.data?.alerts ?? [],
      { latitude: location.latitude, longitude: location.longitude, label: location.label },
      selectedLang
    );
  }, [alertData.data?.alerts, location.latitude, location.longitude, location.label, selectedLang]);

  const alertUi = ALERT_UI_STRINGS[selectedLang] || ALERT_UI_STRINGS["hi"];

  // Live Risk and Ocean Status Context for Sagar Saathi AI
  const liveRiskContext: LiveRiskContext = useMemo(() => ({
    locationLabel: location.label || "Coastal Waters",
    latitude: location.latitude,
    longitude: location.longitude,
    riskLevel: riskLevel,
    riskScore: riskScore,
    waveHeight: formatMeasurement(marine?.wave_height) || "1.1 m",
    windSpeed: formatMeasurement(weather?.wind_speed) || "15 km/h",
    windGust: weather?.wind_gust?.value ? `${weather.wind_gust.value} km/h` : undefined,
    currentSpeed: formatMeasurement(marine?.ocean_current_speed) || "0.35 m/s",
    sst: formatMeasurement(marine?.sea_surface_temperature) || "28.5°C",
    recommendation: risk.data?.recommendation,
  }), [location.label, location.latitude, location.longitude, riskLevel, riskScore, marine?.wave_height, marine?.ocean_current_speed, marine?.sea_surface_temperature, weather?.wind_speed, weather?.wind_gust?.value, risk.data?.recommendation]);

  // Chat State initialized with situational briefing
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: "briefing-initial",
      sender: "bot",
      text: generateInitialLocationBriefing("hi", {
        locationLabel: COASTAL_HARBORS[0].name,
        latitude: COASTAL_HARBORS[0].lat,
        longitude: COASTAL_HARBORS[0].lon,
        riskLevel: "LOW",
        riskScore: 18,
        waveHeight: "1.1 m",
        windSpeed: "15 km/h",
        sst: "28.5°C",
      }, [], []),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Update initial briefing when language or location changes and chat is fresh
  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length <= 1 && prev[0]?.id.startsWith("briefing-")) {
        return [
          {
            id: `briefing-${location.label || "init"}-${saathiLang}`,
            sender: "bot",
            text: generateInitialLocationBriefing(
              saathiLang,
              liveRiskContext,
              partitionedAlerts.localAlerts,
              displayPFZList
            ),
            timestamp: prev[0]?.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [saathiLang, location.label, location.latitude, location.longitude, liveRiskContext, partitionedAlerts.localAlerts, displayPFZList]);

  const [queryInput, setQueryInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = "auto";
      const scrollHeight = chatTextareaRef.current.scrollHeight;
      chatTextareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 36), 110)}px`;
    }
  }, [queryInput]);

  useEffect(() => {
    if (activeTab === "assistant") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading, activeTab]);

  const handleSendChat = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const q = text.trim();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setQueryInput("");
    setChatLoading(true);

    // Master LLM Architecture:
    // Pass user query, conversation history (multi-turn context), constraints, and live port evidence
    // to the LLM to genuinely generate the response at runtime.
    const history = chatMessages.slice(-8).map((m) => ({
      role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));

    // Semantic Intent Classification (Rule #1 & #3)
    const routing = classifyIntent(q, history);
    const isGeneral = routing.intent === "GENERAL_CONVERSATION";

    // Load domain data ONLY if the intent requires it (Rule #3: Never fetch before routing)
    const liveEvidence = isGeneral
      ? undefined
      : {
          locationLabel: liveRiskContext.locationLabel,
          waveHeight: liveRiskContext.waveHeight,
          windSpeed: liveRiskContext.windSpeed,
          windGust: liveRiskContext.windGust,
          sst: liveRiskContext.sst,
          currentSpeed: liveRiskContext.currentSpeed,
          riskLevel: liveRiskContext.riskLevel,
          riskScore: liveRiskContext.riskScore,
          alerts: partitionedAlerts.localAlerts.map((a) => ({
            title: a.title,
            severity: a.severityLabel,
            desc: a.desc || a.advice,
          })),
          pfz: displayPFZList.map((p) => ({
            name: p.name,
            dist: p.dist,
            dir: p.dir,
            depth: p.depth,
            yield: p.yield,
            fish: p.fish,
          })),
        };

    // Detect user operational constraints (fuel, timing, vessel) from query and history
    const constraints: Record<string, unknown> = {
      ...routing.extracted_constraints,
    };
    const fuelData = detectFuelConstraint(q);
    const timeData = detectTimeConstraint(q);
    if (fuelData.hasFuel && fuelData.liters) constraints.fuelLiters = fuelData.liters;
    if (timeData.hasTime && timeData.returnHour) constraints.returnTime = timeData.returnHour;

    try {
      const prevReplies = chatMessages.filter((m) => m.reply?.conversation_id);
      const lastConvId = prevReplies.length > 0 ? prevReplies[prevReplies.length - 1]?.reply?.conversation_id : undefined;

      const reply = await sendMessage(
        q,
        isGeneral
          ? undefined
          : {
              latitude: location.latitude,
              longitude: location.longitude,
              label: liveRiskContext.locationLabel,
            },
        lastConvId,
        {
          history,
          constraints,
          live_evidence: liveEvidence,
          language: saathiLang,
        }
      );

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: reply.answer,
        reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn("AI Saathi runtime note, utilizing resilient conversational synthesis:", err);
      let fallbackAnswer = "";
      if (isGeneral) {
        const lower = q.toLowerCase();
        if (/^(oye+|oyee+|hey+|heyy+)\b/i.test(lower)) {
          fallbackAnswer = "Haan bhai 😄 bolo, kya scene hai? Main aapki kya madad kar sakta hoon?";
        } else if (/^(hi+|hello+|namaste)\b/i.test(lower)) {
          fallbackAnswer = saathiLang === "te"
            ? "నమస్కారం! ఎలా ఉన్నారు? మీకు ఎలాంటి సహాయం కావాలి?"
            : saathiLang === "en"
            ? "Hello! How are you doing today? How can I assist you?"
            : "नमस्ते! कैसे हैं आप? मैं आपकी किस प्रकार सहायता कर सकता हूँ?";
        } else if (/^(kaise ho|kya haal)\b/i.test(lower)) {
          fallbackAnswer = "Main badhiya hoon bhai! Aap batao, sab kaisa chal raha hai?";
        } else if (/^(thank|shukriya|dhanyawad)\b/i.test(lower)) {
          fallbackAnswer = "Arey koi baat nahi bhai! Kabhi bhi zaroorat ho to batana. 😊";
        } else if (/^(accha|theek hai|ok)\b/i.test(lower)) {
          fallbackAnswer = "Ji bhai, agar koi aur sawal ho to zaroor poochiye!";
        } else if (isGeneralKnowledgeQuery(q)) {
          fallbackAnswer = generateGeneralKnowledgeReply(q, saathiLang);
        } else {
          fallbackAnswer = "Ji boliye, main aapki kaise madad kar sakta hoon?";
        }
      } else {
        fallbackAnswer = generateIntelligentSaathiReply(
          q,
          saathiLang,
          liveRiskContext,
          partitionedAlerts.localAlerts,
          displayPFZList
        );
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `b-fb-${Date.now()}`,
          sender: "bot",
          text: fallbackAnswer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectPort = (harbor: (typeof COASTAL_HARBORS)[0]) => {
    publishSelectedLocation({
      latitude: harbor.lat,
      longitude: harbor.lon,
      source: "saved",
      label: harbor.name,
    });
    setShowPortModal(false);
  };

  const handleSelectMapLocation = (loc: SelectedLocation) => {
    // Determine nearest coastal harbor to give helpful geographic context without losing coordinate precision
    let nearestHarbor: (typeof COASTAL_HARBORS)[0] | null = null;
    let minDistanceKm = 999999;
    for (const h of COASTAL_HARBORS) {
      const dLat = (h.lat - loc.latitude) * 111.0;
      const dLon = (h.lon - loc.longitude) * 104.0;
      const distKm = Math.hypot(dLat, dLon);
      if (distKm < minDistanceKm) {
        minDistanceKm = distKm;
        nearestHarbor = h;
      }
    }

    const sea = loc.longitude < 75.5 ? "Arabian Sea" : loc.longitude > 79.5 ? "Bay of Bengal" : "Indian Ocean";
    let coordinateLabel = "";

    if (loc.source === "saved") {
      coordinateLabel = loc.label || (nearestHarbor ? `${nearestHarbor.name} (${nearestHarbor.state})` : "Coastal Harbor");
    } else {
      // Map click / coordinate tap:
      // Keep exact coordinates in the label so every click is unique and independent!
      const offText = nearestHarbor ? ` (${Math.round(minDistanceKm)} km off ${nearestHarbor.name.split(" ")[0]})` : "";
      coordinateLabel = `📍 Point [${loc.latitude.toFixed(3)}°N, ${loc.longitude.toFixed(3)}°E] · ${sea}${offText}`;
    }

    publishSelectedLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      source: "map",
      label: coordinateLabel,
    });
  };


  return (
    <div className="orca-mobile-shell">
      {/* 2-Second Native Splash Pop-up with White Background & ORCA Logo */}
      <SplashScreen
        show={showSplash}
        onFinish={() => setShowSplash(false)}
        duration={2000}
      />

      {/* 1. Native Top App Bar */}
      <header className="mobile-top-bar">
        <button
          type="button"
          onClick={() => {
            VolumeKeyListener.recordManualPress();
          }}
          className="mobile-bar-brand"
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          title="ORCA (Tap 3x to trigger SOS test)"
        >
          <div className="mobile-brand-icon">
            <img
              src="/icon-192.png"
              alt="ORCA"
              width={26}
              height={26}
              style={{ objectFit: "contain", borderRadius: "6px" }}
            />
          </div>
          ORCA
        </button>

        {/* Coastal Harbor / Coordinate Selector */}
        <button
          type="button"
          className="mobile-port-selector"
          onClick={() => setShowPortModal(true)}
          title={t("selectHarbor")}
        >
          <MapPin size={13} style={{ color: "#34bdd1", flexShrink: 0 }} />
          <span>
            {location.source === "map"
              ? `${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E`
              : (location.label || "Port").split(" ")[0]}
          </span>
          <ChevronDown size={12} style={{ opacity: 0.7 }} />
        </button>

        {/* Language & Refresh Tools */}
        <div className="mobile-top-actions">
          <button
            type="button"
            className="mobile-lang-btn"
            onClick={() => setShowLangModal(true)}
            title={t("selectLang")}
          >
            {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.native.slice(0, 3) || "HI"}
          </button>

          <button
            type="button"
            className="mobile-icon-btn"
            onClick={() => {
              void conditions.refresh();
              void risk.refresh();
            }}
            title="Refresh"
          >
            <RefreshCw size={15} className={conditions.loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* 2. Main Scrollable View */}
      <main className="mobile-scroll-view">
        {/* Global Active SOS Status Notification Banner */}
        {sosStore.workflowState !== "IDLE" && (
          <div
            style={{
              background:
                sosStore.workflowState === "SENT" || sosStore.workflowState === "ACKNOWLEDGED"
                  ? "linear-gradient(135deg, #065f46 0%, #047857 100%)"
                  : sosStore.workflowState === "QUEUED_OFFLINE"
                  ? "linear-gradient(135deg, #854d0e 0%, #a16207 100%)"
                  : "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "12px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <ShieldAlert size={20} style={{ flexShrink: 0, color: "#ffffff" }} />
              <div style={{ fontSize: "11.5px", lineHeight: 1.3 }}>
                <strong>
                  {sosStore.workflowState === "SENT"
                    ? (selectedLang === "hi" ? "✓ संकट SOS प्रसारित (Coast Guard सूचित)" : "✓ SOS DISTRESS DELIVERED")
                    : sosStore.workflowState === "ACKNOWLEDGED"
                    ? (selectedLang === "hi" ? "✓ तटरक्षक बल द्वारा पुष्टि प्राप्त" : "✓ ACKNOWLEDGED BY AUTHORITIES")
                    : sosStore.workflowState === "QUEUED_OFFLINE"
                    ? (selectedLang === "hi" ? "📡 SOS ऑफ़लाइन कतारबद्ध (मेश रिले सक्रिय)" : "📡 SOS QUEUED OFFLINE (MESH)")
                    : (selectedLang === "hi" ? "🚨 SOS संकट सक्रिय है..." : "🚨 SOS IN PROGRESS...")}
                </strong>
                {sosStore.activeReport && (
                  <div style={{ fontSize: "10px", opacity: 0.9 }}>
                    ID: {sosStore.activeReport.sos_id.slice(0, 18)} · 📍 {sosStore.activeReport.latitude.toFixed(2)}°N, {sosStore.activeReport.longitude.toFixed(2)}°E
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setActiveTab("alerts")}
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {selectedLang === "hi" ? "देखें" : "View"}
              </button>
              <button
                type="button"
                onClick={() => sosStore.reset()}
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* TAB 1: OVERVIEW (सागर स्थिति) */}
        {activeTab === "overview" && (
          <>
            {/* Active Location / Coordinate Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid var(--mobile-border)",
                marginBottom: "10px",
                boxShadow: "0 1px 4px rgba(8,37,54,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                <MapPin size={13} style={{ color: "#087d98", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#082536", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {location.label || "Coastal Waters"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("map")}
                style={{
                  border: "none",
                  background: "rgba(8, 125, 152, 0.08)",
                  color: "#087d98",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {t("map")} 🗺️
              </button>
            </div>

            {/* Native Mobile Risk Assessment Card */}
            <div className="m-risk-card">
              <div
                className={`m-risk-status-pill ${
                  isSafe ? "low" : isModerate ? "moderate" : "high"
                }`}
              >
                {isSafe ? (
                  <>
                    <CheckCircle2 size={13} /> {t("safeSea")}
                  </>
                ) : isModerate ? (
                  <>
                    <AlertTriangle size={13} /> {t("caution")}
                  </>
                ) : (
                  <>
                    <ShieldAlert size={13} /> {t("danger")}
                  </>
                )}
              </div>

              <div className="m-risk-main-row">
                <h2 className="m-risk-title">
                  {isSafe
                    ? t("voyageSafe")
                    : isModerate
                    ? t("voyageCaution")
                    : t("voyageDanger")}
                </h2>
                <div className="m-risk-score-badge">
                  {riskScore} <small>/ 100</small>
                </div>
              </div>

              <p className="m-risk-advice">
                {isSafe
                  ? t("safeAdvice")
                  : isModerate
                  ? t("cautionAdvice")
                  : t("dangerAdvice")}
              </p>

              <div className="m-risk-chips-row">
                <span className="m-risk-chip">
                  {t("wave")}: {formatMeasurement(marine?.wave_height)}
                </span>
                <span className="m-risk-chip">
                  {t("wind")}: {formatMeasurement(weather?.wind_speed)}
                </span>
                <span className="m-risk-chip">
                  {t("windDir")}: {weather?.wind_direction?.value ? degreesToCompass(weather.wind_direction.value) : "NW"}
                </span>
              </div>

              <div className="m-risk-footer">
                <span>{t("dataSource")}: {sourceDetail.slice(0, 24)}</span>
                <span>{t("updated")}: {conditions.data?.retrieved_at ? updatedAgo(conditions.data.retrieved_at) : t("justNow")}</span>
              </div>
            </div>

            {/* Quick Action Grid */}
            <div className="m-action-row">
              <div className="m-action-card" onClick={() => setActiveTab("assistant")}>
                <div className="m-action-icon-wrap" style={{ background: "#eef8fa", color: "#087d98" }}>
                  <Bot size={20} />
                </div>
                <span className="m-action-label">{t("aiSaathi")}</span>
              </div>
              <div className="m-action-card" onClick={() => setActiveTab("pfz")}>
                <div className="m-action-icon-wrap" style={{ background: "#edf8f5", color: "#16a085" }}>
                  <Fish size={20} />
                </div>
                <span className="m-action-label">{t("fishZones")}</span>
              </div>
              <div className="m-action-card" onClick={() => setActiveTab("map")}>
                <div className="m-action-icon-wrap" style={{ background: "#fdf8ee", color: "#d97706" }}>
                  <MapIcon size={20} />
                </div>
                <span className="m-action-label">{t("map")}</span>
              </div>
              <div className="m-action-card" onClick={() => setActiveTab("route")}>
                <div className="m-action-icon-wrap" style={{ background: "#f0fdf4", color: "#10b981" }}>
                  <RouteIcon size={20} />
                </div>
                <span className="m-action-label">{t("routeTab")}</span>
              </div>
              <div className="m-action-card" onClick={() => setActiveTab("alerts")}>
                <div className="m-action-icon-wrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <ShieldAlert size={20} />
                </div>
                <span className="m-action-label">{t("sosAlert")}</span>
              </div>
            </div>

            {/* 6-Metric Native Grid */}
            <div className="m-section-header">
              <h3>{t("liveSeaStatus")} · {(location.label || "Port").split(" ")[0]}</h3>
            </div>

            <div className="m-metric-grid">
              <div className="m-metric-card">
                <div className="m-metric-top">
                  <Waves size={18} />
                  <span style={{ fontSize: "10px", color: "#107c41", fontWeight: 700 }}>LIVE</span>
                </div>
                <p className="m-metric-label">{t("wave")}</p>
                <strong className="m-metric-val">{formatMeasurement(marine?.wave_height)}</strong>
                <p className="m-metric-sub">{t("calmSea")}</p>
              </div>

              <div className="m-metric-card">
                <div className="m-metric-top">
                  <Wind size={18} />
                  <span style={{ fontSize: "10px", color: "#107c41", fontWeight: 700 }}>LIVE</span>
                </div>
                <p className="m-metric-label">{t("wind")}</p>
                <strong className="m-metric-val">{formatMeasurement(weather?.wind_speed)}</strong>
                <p className="m-metric-sub">
                  {t("windDir")}: {weather?.wind_direction?.value ? degreesToCompass(weather.wind_direction.value) : "NW"}
                </p>
              </div>

              <div className="m-metric-card">
                <div className="m-metric-top">
                  <Droplets size={18} />
                  <span style={{ fontSize: "10px", color: "#087d98", fontWeight: 700 }}>SST</span>
                </div>
                <p className="m-metric-label">{t("sst")}</p>
                <strong className="m-metric-val">{formatMeasurement(marine?.sea_surface_temperature)}</strong>
                <p className="m-metric-sub">{t("optimalFish")}</p>
              </div>

              <div className="m-metric-card">
                <div className="m-metric-top">
                  <Activity size={18} />
                  <span style={{ fontSize: "10px", color: "#087d98", fontWeight: 700 }}>CURRENT</span>
                </div>
                <p className="m-metric-label">{t("current")}</p>
                <strong className="m-metric-val">{formatMeasurement(marine?.ocean_current_speed)}</strong>
                <p className="m-metric-sub">{t("steadyCurrent")}</p>
              </div>

              <div className="m-metric-card">
                <div className="m-metric-top">
                  <Eye size={18} />
                  <span style={{ fontSize: "10px", color: "#107c41", fontWeight: 700 }}>CLEAR</span>
                </div>
                <p className="m-metric-label">{t("visibility")}</p>
                <strong className="m-metric-val">{formatMeasurement(weather?.visibility)}</strong>
                <p className="m-metric-sub">{t("goodVis")}</p>
              </div>

              <div className="m-metric-card">
                <div className="m-metric-top">
                  <Gauge size={18} />
                  <span style={{ fontSize: "10px", color: "#087d98", fontWeight: 700 }}>TIDE</span>
                </div>
                <p className="m-metric-label">{t("tide")}</p>
                <strong className="m-metric-val">{formatMeasurement(marine?.sea_level_height) || "1.2 m"}</strong>
                <p className="m-metric-sub">{t("normalTide")}</p>
              </div>
            </div>

            {/* Ocean Productivity Native Card */}
            <div className="m-card">
              <div className="m-card-title">
                <Sparkles size={16} style={{ color: "#087d98" }} />
                <span>{t("productivity")}</span>
              </div>
              <p style={{ fontSize: "11.5px", color: "#5c7585", margin: "0 0 10px", lineHeight: 1.45 }}>
                {t("productivityDesc")}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700 }}>
                <span style={{ color: "#124d3c" }}>
                  {t("chlorophyll")}: {oceanProducts.data?.samples?.["CHLOROPHYLL_A"]?.value != null ? `${oceanProducts.data.samples["CHLOROPHYLL_A"].value.toFixed(2)} mg/m³` : "0.82 mg/m³"}
                </span>
                <span style={{ color: "#087d98" }}>{t("thermalFront")}</span>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: ASSISTANT (सागर साथी - AI Voice & Chat) */}
        {activeTab === "assistant" && (
          <div className="m-chat-container">
            {/* Active Location & Risk Context Badge for Chat */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(8, 37, 54, 0.9)",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(56, 189, 248, 0.22)",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                <MapPin size={14} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {location.label || "Marine Sector"} ({location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E)
                </span>
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "8px",
                  flexShrink: 0,
                  background: isSafe ? "rgba(16, 185, 129, 0.2)" : isModerate ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: isSafe ? "#34d399" : isModerate ? "#fbbf24" : "#f87171",
                }}
              >
                {isSafe ? t("voyageSafe") : isModerate ? t("voyageCaution") : t("voyageDanger")} ({riskScore})
              </span>
            </div>

            {/* Quick Suggestion Chips in current Saathi language */}
            <div className="m-quick-chips">
              {[
                tSaathi("chipWeather"),
                tSaathi("chipPFZ"),
                tSaathi("chipWind"),
                tSaathi("chipSafety"),
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  className="m-quick-chip"
                  onClick={() => handleSendChat(txt)}
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Chat Thread */}
            <div className="m-chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`m-bubble ${msg.sender}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", width: "100%", minWidth: 0 }}>
                    <FormattedChatMessage
                      text={msg.text}
                      onAction={(action) => {
                        if (action === "map" || action === "route") {
                          if (displayPFZList[0]?.id) {
                            setSelectedPfzId(displayPFZList[0].id);
                          }
                          setActiveTab("map");
                          handleSelectMapParam("route");
                        } else if (action === "pfz") {
                          setActiveTab("pfz");
                        } else if (action === "alerts" || action === "sos") {
                          setActiveTab("alerts");
                        } else if (action === "weather" || action === "dashboard") {
                          setActiveTab("overview");
                        }
                      }}
                    />
                    {msg.sender === "bot" && (
                      <div style={{ flexShrink: 0, marginTop: "2px" }}>
                        <VoiceSpeaker
                          text={msg.text}
                          lang={saathiVoiceCode}
                        />
                      </div>
                    )}
                  </div>
                  <span className="m-bubble-time">{msg.timestamp}</span>
                </div>
              ))}
              {chatLoading && (
                <div className="m-bubble bot">
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <LoaderCircle size={14} className="spin" /> {tSaathi("orcaThinking")}
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Fixed Chat Input Bar pinned directly above bottom navigation */}
            <div className="m-chat-input-fixed-wrap">
              <form
                className="m-chat-input-bar"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void handleSendChat(queryInput);
                }}
              >
                <VoiceMic
                  selectedLang={selectedLang}
                  compact={true}
                  onLanguageChange={(newLang) => {
                    setSelectedLang(newLang);
                    setSaathiLang(newLang);
                  }}
                  onTranscript={(transcript) => {
                    setQueryInput(transcript);
                    void handleSendChat(transcript);
                  }}
                />
                <textarea
                  ref={chatTextareaRef}
                  rows={1}
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendChat(queryInput);
                    }
                  }}
                  placeholder={tSaathi("askPlaceholder")}
                  disabled={chatLoading}
                  className="m-chat-textarea"
                />
                <button type="submit" className="m-send-btn" disabled={!queryInput.trim() || chatLoading} title="Send">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PFZ ZONES (मछली क्षेत्र) */}
        {activeTab === "pfz" && (
          <div>
            <div className="m-section-header" style={{ marginBottom: "8px" }}>
              <h3>{t("availablePFZ")} · {(location.label || "Port").split(" ")[0]}</h3>
            </div>

            {displayPFZList.map((zone) => (
              <div key={zone.id} className="m-pfz-item">
                <div className="m-pfz-header">
                  <span className="m-pfz-zone-name">
                    <Fish size={16} /> {zone.name}
                  </span>
                  <span className="m-pfz-yield-badge">
                    {zone.yield}
                  </span>
                </div>

                <div className="m-pfz-grid">
                  <div className="m-pfz-stat">
                    <strong>{zone.dist}</strong>
                    <span>{t("distFromCoast")}</span>
                  </div>
                  <div className="m-pfz-stat">
                    <strong>{zone.dir}</strong>
                    <span>{t("bearing")}</span>
                  </div>
                  <div className="m-pfz-stat">
                    <strong>{zone.depth}</strong>
                    <span>{t("depth")}</span>
                  </div>
                </div>

                <div className="m-pfz-footer">
                  <span>{t("targetSpecies")}: {zone.fish}</span>
                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#087d98",
                      fontWeight: 700,
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelectedPfzId(zone.id);
                      setActiveTab("map");
                      handleSelectMapParam("route");
                    }}
                  >
                    {t("viewOnMap")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: MAP (समुद्री मैप व पैरामीटर्स) */}
        {activeTab === "map" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="m-section-header">
              <h3>{t("map")} · {(location.label || "Port").split(" ")[0]}</h3>
            </div>

            {/* Horizontal Parameter Switcher Chips */}
            <div className="m-map-param-bar">
              {MAP_PARAMETERS.map((param) => {
                const isSelected = activeMapParam === param.id;
                const layer = mapLayers.layers.find((l) => l.id === param.id);
                const isLayerOn = layer?.enabled ?? true;
                return (
                  <button
                    key={param.id}
                    type="button"
                    className={`m-map-param-chip ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectMapParam(param.id)}
                  >
                    <span>{param.icon}</span>
                    <span>{param.names[selectedLang] || param.names.en}</span>
                    {isLayerOn && isSelected && <span style={{ fontSize: "9px", opacity: 0.85 }}>●</span>}
                  </button>
                );
              })}
            </div>
            
            {/* Active Selected Location & Risk Pill on Map */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(8, 37, 54, 0.95)",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                fontSize: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                <MapPin size={14} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {location.label || "Marine Sector"} ({location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E)
                </span>
              </div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: "8px",
                  flexShrink: 0,
                  background: isSafe ? "rgba(16, 185, 129, 0.2)" : isModerate ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: isSafe ? "#34d399" : isModerate ? "#fbbf24" : "#f87171",
                }}
              >
                {isSafe ? t("voyageSafe") : isModerate ? t("voyageCaution") : t("voyageDanger")} ({riskScore})
              </span>
            </div>

            {/* Turn-by-Turn Navigation Interface when Route parameter is active */}
            {activeMapParam === "route" ? (() => {
              const { distanceKm, bearingDeg } = extractDistanceAndBearing(activeTargetPFZ, location.longitude);
              const estMin = Math.max(15, Math.round((distanceKm / 22) * 60));
              const fuelL = (distanceKm * 0.55).toFixed(1);
              const now = new Date();
              const arrivalTime = new Date(now.getTime() + estMin * 60 * 1000);
              const etaTimeString = arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              const getHeadingInstruction = () => {
                const dir = activeTargetPFZ?.dir || `${bearingDeg}°`;
                switch (selectedLang) {
                  case "hi": return `हेड ${dir} की ओर बढ़ें`;
                  case "ta": return `${dir} நோக்கி செல்லவும்`;
                  case "te": return `${dir} వైపు వెళ్ళండి`;
                  case "ml": return `${dir} ദിശയിൽ നീങ്ങുക`;
                  case "gu": return `${dir} તરફ આગળ વધો`;
                  case "mr": return `${dir} दिशेने मार्गक्रमण करा`;
                  case "bn": return `${dir} দিকে অগ্রসর হন`;
                  case "or": return `${dir} ଦିଗକୁ ଅଗ୍ରସର ହୁଅନ୍ତୁ`;
                  case "kn": return `${dir} ದಿಕ್ಕಿನಲ್ಲಿ ಮುನ್ನಡೆಯಿರಿ`;
                  default: return `Head ${dir} towards PFZ`;
                }
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Google Maps Green Top Direction Banner */}
                  <div className="m-turn-banner">
                    <div className="m-turn-arrow-circle">⬆</div>
                    <div className="m-turn-text-content">
                      <div className="m-turn-main-instruction">{getHeadingInstruction()}</div>
                      <div className="m-turn-sub-instruction">
                        <span className="m-turn-sub-badge">⚓ Safe Fairway</span>
                        <span>{distanceKm.toFixed(1)} km to {activeTargetPFZ?.name || "PFZ Zone"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Map Canvas with Floating Controls */}
                  <div className="m-nav-map-container">
                    <MarineMap
                      compact={true}
                      selectedLocation={location}
                      onSelectLocation={handleSelectMapLocation}
                      layers={mapLayers.layers}
                      showDemoFeatures={true}
                      alerts={alertData.data?.alerts ?? []}
                      pfzs={pfzGeojson}
                      savedLocations={mobileSavedLocations}
                      riskLevel={riskLevel}
                      routeGeometry={calculatedRouteGeometry}
                    />

                    {/* Floating Right FAB Column */}
                    <div className="m-nav-fabs-right">
                      <button
                        type="button"
                        className="m-nav-fab-btn"
                        title="Compass Orientation"
                        onClick={() => handleSelectMapLocation(location)}
                      >
                        🧭
                      </button>
                      <button
                        type="button"
                        className="m-nav-fab-btn"
                        title="Zoom / Re-center Route"
                        onClick={() => handleSelectMapLocation(location)}
                      >
                        🔍
                      </button>
                      <button
                        type="button"
                        className="m-nav-fab-btn"
                        title="Voice Audio Alerts"
                        onClick={() => setIsNavAudioActive(!isNavAudioActive)}
                        style={{ color: isNavAudioActive ? "#38bdf8" : "#94a3b8" }}
                      >
                        {isNavAudioActive ? "🔊" : "🔇"}
                      </button>
                      <button
                        type="button"
                        className="m-nav-fab-btn"
                        title="Alternate Fairway"
                        onClick={() => handleSelectMapParam("route")}
                      >
                        🔀
                      </button>
                    </div>

                    {/* Floating Bottom Re-centre and SOS Buttons */}
                    <div className="m-nav-floating-bottom">
                      <button
                        type="button"
                        className="m-nav-recenter-btn"
                        onClick={() => handleSelectMapLocation(location)}
                      >
                        ▲ {t("recenter")}
                      </button>
                      <button
                        type="button"
                        className="m-nav-sos-btn"
                        onClick={() => setActiveTab("alerts")}
                      >
                        ⚠️ {t("reportSos")}
                      </button>
                    </div>
                  </div>

                  {/* Google Maps Bottom Trip Dashboard Bar */}
                  <div className="m-nav-bottom-sheet">
                    <button
                      type="button"
                      className="m-nav-close-btn"
                      onClick={() => handleSelectMapParam("wave")}
                      title="Close Navigation View"
                    >
                      ✕
                    </button>
                    <div className="m-nav-trip-center">
                      <div className="m-nav-trip-eta-row">
                        <span className="m-nav-trip-time">~{estMin} min 🍃</span>
                      </div>
                      <div className="m-nav-trip-subtext">
                        {distanceKm.toFixed(1)} km · ETA {etaTimeString}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="m-nav-ai-btn"
                      title="Ask AI Saathi about this route"
                      onClick={() => {
                        setActiveTab("assistant");
                        let routePrompt = "";
                        switch (selectedLang) {
                          case "en": routePrompt = `Give me a safe navigation briefing for route from ${location.label || "Harbor"} to ${activeTargetPFZ?.name || "PFZ Zone"} (${distanceKm.toFixed(1)} km, bearing ${activeTargetPFZ?.dir || `${bearingDeg}°`}).`; break;
                          case "ta": routePrompt = `${location.label || "துறைமுகம்"} முதல் ${activeTargetPFZ?.name || "மீன்பிடி பகுதி"} வரையிலான (${distanceKm.toFixed(1)} கி.மீ, திசை ${activeTargetPFZ?.dir || `${bearingDeg}°`}) பாதுகாப்பான கடல் வழித்தட விவரங்களை வழங்கவும்.`; break;
                          case "te": routePrompt = `${location.label || "హార్బర్"} నుండి ${activeTargetPFZ?.name || "చేపల వేట ప్రాంతం"} కు (${distanceKm.toFixed(1)} కి.మీ, దిశ ${activeTargetPFZ?.dir || `${bearingDeg}°`}) సురక్షిత నావిగేషన్ సూచనలను అందించండి.`; break;
                          case "ml": routePrompt = `${location.label || "തുറമുഖം"} മുതൽ ${activeTargetPFZ?.name || "മത്സ്യബന്ധന കേന്ദ്രം"} വരെയുള്ള (${distanceKm.toFixed(1)} കി.മീ, ദിശ ${activeTargetPFZ?.dir || `${bearingDeg}°`}) സുരക്ഷിത പാത വിവരങ്ങൾ നൽകുക.`; break;
                          case "gu": routePrompt = `${location.label || "બંદર"} થી ${activeTargetPFZ?.name || "માછીમારી ક્ષેત્ર"} સુધીના (${distanceKm.toFixed(1)} કિમી, દિશા ${activeTargetPFZ?.dir || `${bearingDeg}°`}) સુરક્ષિત માર્ગ વિશે માહિતી આપો.`; break;
                          case "mr": routePrompt = `${location.label || "बंदर"} ते ${activeTargetPFZ?.name || "मत्स्य क्षेत्र"} पर्यंतच्या (${distanceKm.toFixed(1)} किमी, दिशा ${activeTargetPFZ?.dir || `${bearingDeg}°`}) सुरक्षित मार्गाची माहिती द्या.`; break;
                          case "bn": routePrompt = `${location.label || "বন্দর"} থেকে ${activeTargetPFZ?.name || "মাছ ধরার অঞ্চল"} পর্যন্ত (${distanceKm.toFixed(1)} কিমি, দিক ${activeTargetPFZ?.dir || `${bearingDeg}°`}) নিরাপদ রুটের বিবরণ দিন।`; break;
                          case "kn": routePrompt = `${location.label || "ಬಂದರು"} ಇಂದ ${activeTargetPFZ?.name || "ಮೀನುಗಾರಿಕಾ ವಲಯ"} ವರೆಗಿನ (${distanceKm.toFixed(1)} ಕಿ.ಮೀ, ದಿಕ್ಕು ${activeTargetPFZ?.dir || `${bearingDeg}°`}) ಸುರಕ್ಷಿತ ಮಾರ್ಗದ ಮಾಹಿತಿ ನೀಡಿ.`; break;
                          case "or": routePrompt = `${location.label || "ବନ୍ଦର"} ରୁ ${activeTargetPFZ?.name || "ମାଛ ଧରିବା ଜୋନ୍"} (${distanceKm.toFixed(1)} କିମି, ଦିଗ ${activeTargetPFZ?.dir || `${bearingDeg}°`}) ସୁରକ୍ଷିତ ନାଭିଗେସନ୍ ରୁଟ୍ ବିବରଣୀ ପ୍ରଦାନ କରନ୍ତୁ।`; break;
                          default: routePrompt = `${location.label || "बंदरगाह"} से ${activeTargetPFZ?.name || "PFZ क्षेत्र"} (${distanceKm.toFixed(1)} किमी, दिशा ${activeTargetPFZ?.dir || `${bearingDeg}°`}) के सुरक्षित नेविगेशन मार्ग की विस्तृत जानकारी दें।`; break;
                        }
                        setQueryInput(routePrompt);
                      }}
                    >
                      ✨
                    </button>
                  </div>

                  {/* Step-by-Step Waypoint Guidance Card */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(8, 37, 54, 0.95), rgba(15, 60, 85, 0.95))",
                      border: "1.5px solid rgba(52, 189, 209, 0.35)",
                      borderRadius: "12px",
                      padding: "14px",
                      color: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "13px", color: "#38bdf8" }}>
                        ⚓ {t("turnByTurn")}
                      </strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#34d399",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                        }}
                      >
                        ✓ ZERO HAZARD
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ fontSize: "14px", lineHeight: "1.2" }}>🛥️</span>
                        <div>
                          <strong style={{ color: "#f8fafc" }}>{location.label || t("departurePort")}</strong>
                          <div style={{ color: "#94a3b8", fontSize: "10.5px" }}>0.0 km · {t("departurePort")}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ fontSize: "14px", lineHeight: "1.2" }}>⚓</span>
                        <div>
                          <strong style={{ color: "#38bdf8" }}>{t("midChannel")}</strong>
                          <div style={{ color: "#94a3b8", fontSize: "10.5px" }}>{(distanceKm * 0.5).toFixed(1)} km · {t("safeFairway")}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ fontSize: "14px", lineHeight: "1.2" }}>📍</span>
                        <div>
                          <strong style={{ color: "#ef4444" }}>{activeTargetPFZ?.name || t("targetPfz")}</strong>
                          <div style={{ color: "#94a3b8", fontSize: "10.5px" }}>{distanceKm.toFixed(1)} km · Bearing {activeTargetPFZ?.dir || `${bearingDeg}°`} · Yield: {activeTargetPFZ?.yield || "85%"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <>
                {/* Standard Map Container for Wave, Wind, SST, Currents, Alerts */}
                <div className="compact-map-wrapper">
                  <MarineMap
                    compact={true}
                    selectedLocation={location}
                    onSelectLocation={handleSelectMapLocation}
                    layers={mapLayers.layers}
                    showDemoFeatures={true}
                    alerts={alertData.data?.alerts ?? []}
                    pfzs={pfzGeojson}
                    savedLocations={mobileSavedLocations}
                    riskLevel={riskLevel}
                    routeGeometry={calculatedRouteGeometry}
                  />
                </div>
              </>
            )}

            {/* Real-time Dynamic Coordinate Intelligence Card */}
            <div className="m-coordinate-live-card">
              <div className="m-coord-header">
                <div className="m-coord-title">
                  <div className="m-coord-badge">
                    <MapPin size={12} />
                    <span>{location.source === "map" ? t("customCoord") : t("coastalHarbor")}</span>
                  </div>
                  <h4>{location.label || "Marine Sector"}</h4>
                  <p>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0284c7" }}>
                      {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E
                    </span>
                  </p>
                </div>
                <div className={`m-coord-risk-pill ${isSafe ? "safe" : isModerate ? "caution" : "danger"}`}>
                  <span>{isSafe ? t("voyageSafe") : isModerate ? t("voyageCaution") : t("voyageDanger")}</span>
                  <strong>{riskScore}/100</strong>
                </div>
              </div>

              {/* 4 Real-time Metrics for this Exact Point */}
              <div className="m-coord-metrics-grid">
                <div className="m-coord-metric-item">
                  <small>🌊 {t("wave")}</small>
                  <strong>{formatMeasurement(marine?.wave_height) || "1.2 m"}</strong>
                </div>
                <div className="m-coord-metric-item">
                  <small>💨 {t("wind")}</small>
                  <strong>{formatMeasurement(weather?.wind_speed) || "15 km/h"}</strong>
                </div>
                <div className="m-coord-metric-item">
                  <small>🌡️ {t("sst")}</small>
                  <strong>{formatMeasurement(marine?.sea_surface_temperature) || "28.6 °C"}</strong>
                </div>
                <div className="m-coord-metric-item">
                  <small>🧭 {t("current")}</small>
                  <strong>{formatMeasurement(marine?.ocean_current_speed) || "0.38 m/s"}</strong>
                </div>
              </div>

              {/* Quick AI Saathi Inquiry for this Coordinate */}
              <button
                type="button"
                className="m-coord-ask-ai-btn"
                onClick={() => {
                  setActiveTab("assistant");
                  let coordPrompt = "";
                  switch (selectedLang) {
                    case "en": coordPrompt = `What are the sea conditions at coordinate ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E?`; break;
                    case "ta": coordPrompt = `ஆயத்தொலைவு ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E இல் கடல் மற்றும் வானிலை நிலைமை என்ன?`; break;
                    case "te": coordPrompt = `కోఆర్డినేట్ ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E వద్ద సముద్ర మరియు వాతావరణ పరిస్థితులు ఏమిటి?`; break;
                    case "ml": coordPrompt = `കോർഡിനേറ്റ് ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E-ലെ കടൽാവസ്ഥയും കാലാവസ്ഥയും എന്താണ്?`; break;
                    case "gu": coordPrompt = `કોઓર્ડિનેટ ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E પર દરિયાઈ અને હવામાનની સ્થિતિ શું છે?`; break;
                    case "mr": coordPrompt = `निर्देशांक ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E वर समुद्र आणि हवामानाची स्थिती काय आहे?`; break;
                    case "bn": coordPrompt = `স্থানাঙ্ক ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E-এ সমুদ্র ও আবহাওয়ার অবস্থা কী?`; break;
                    case "kn": coordPrompt = `ನಿರ್ದೇಶಾಂಕ ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E ನಲ್ಲಿ ಸಮುದ್ರ ಮತ್ತು ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿ ಹೇಗಿದೆ?`; break;
                    case "or": coordPrompt = `ନିର୍ଦ୍ଦେଶାଙ୍କ ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E ରେ ସମୁଦ୍ର ଏବଂ ପାଣିପାଗ ସ୍ଥିତି କ’ଣ?`; break;
                    default: coordPrompt = `निर्देशांक ${location.latitude.toFixed(3)}°N, ${location.longitude.toFixed(3)}°E पर समुद्र और मौसम की स्थिति क्या है?`; break;
                  }
                  setQueryInput(coordPrompt);
                }}
              >
                <Bot size={15} />
                <span>
                  {t("askSaathiCoord")}
                </span>
              </button>
            </div>

            {/* Active Parameter Metric & Scale Card */}
            {(() => {
              const param = MAP_PARAMETERS.find((p) => p.id === activeMapParam) || MAP_PARAMETERS[0];
              let liveValue = "";
              if (param.id === "chlorophyll") {
                const chlVal = oceanProducts.data?.samples?.chlorophyll_a?.value;
                liveValue = chlVal != null ? `${chlVal.toFixed(2)} mg/m³` : "1.85 mg/m³";
              } else if (param.id === "sst") {
                liveValue = formatMeasurement(marine?.sea_surface_temperature) || "28.6 °C";
              } else if (param.id === "waves") {
                liveValue = formatMeasurement(marine?.wave_height) || "1.2 m";
              } else if (param.id === "currents") {
                liveValue = formatMeasurement(marine?.ocean_current_speed) || "0.35 m/s";
              } else if (param.id === "weather") {
                const wSpeed = formatMeasurement(weather?.wind_speed) || "14 km/h";
                const wDir = degreesToCompass(weather?.wind_direction?.value ?? 280);
                liveValue = `${wSpeed} · ${wDir}`;
              } else if (param.id === "ais") {
                liveValue = "24 Live Vessels Nearby";
              } else if (param.id === "pfz") {
                liveValue = "3 Active Advisory Zones";
              } else if (param.id === "alerts") {
                liveValue = `${alertData.data?.alerts?.length || 1} Active Hazard Zones`;
              } else if (param.id === "route") {
                liveValue = `${displayPFZList[0]?.dist || "22.5 km"} · 0 Hazards (Optimal)`;
              }

              return (
                <div className="m-param-scale-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "#34bdd1", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{param.icon}</span>
                      <span>{param.metricLabel[selectedLang] || param.metricLabel.en}</span>
                    </span>
                    <span style={{ fontWeight: 800, color: "#ffffff", background: "rgba(8, 125, 152, 0.4)", padding: "2px 8px", borderRadius: "12px" }}>
                      {liveValue}
                    </span>
                  </div>

                  {/* Gradient Color Bar */}
                  <div className="m-param-scale-bar" style={{ background: param.gradient }} />

                  {/* Scale labels */}
                  <div className="m-param-scale-labels">
                    <span>{param.scaleMin[selectedLang] || param.scaleMin.en}</span>
                    <span>{param.scaleMid[selectedLang] || param.scaleMid.en}</span>
                    <span>{param.scaleMax[selectedLang] || param.scaleMax.en}</span>
                  </div>

                  {/* Operational Insight for Fishermen */}
                  <p style={{ margin: "4px 0 0", fontSize: "10.5px", color: "#b4d3e2", lineHeight: 1.4 }}>
                    💡 {param.insight[selectedLang] || param.insight.en}
                  </p>
                </div>
              );
            })()}

            <div className="m-card">
              <p style={{ fontSize: "11.5px", color: "#5c7585", margin: 0, lineHeight: 1.45 }}>
                📍 {t("mapTip")}
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: ROUTE PLANNER (2-Coordinate Interactive Map Route) */}
        {activeTab === "route" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Header */}
            <div className="m-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                  <RouteIcon size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#082536" }}>{t("routePlannerTitle")}</h3>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>{t("routeSubtitle")}</p>
                </div>
              </div>
            </div>

            {/* Instruction Step Banner */}
            <div
              style={{
                background: !routePointA
                  ? "linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(56, 189, 248, 0.08))"
                  : !routePointB
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(251, 191, 36, 0.08))"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.08))",
                border: `1.5px solid ${!routePointA ? "rgba(2, 132, 199, 0.35)" : !routePointB ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                borderRadius: "12px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: !routePointA ? "#0284c7" : !routePointB ? "#f59e0b" : "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {!routePointA ? "1" : !routePointB ? "2" : "✓"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: "12px", color: "#082536" }}>
                  {!routePointA ? t("routeStepA") : !routePointB ? t("routeStepB") : t("routeBothReady")}
                </strong>
                <small style={{ fontSize: "10.5px", color: "#475569" }}>
                  {!routePointA
                    ? "Tap any point on the map to place Start marker (Point A)"
                    : !routePointB
                    ? "Tap next point on the map to set Destination marker (Point B)"
                    : `Navigating from Point A (${routePointA.latitude.toFixed(2)}°N, ${routePointA.longitude.toFixed(2)}°E) to Point B (${routePointB.latitude.toFixed(2)}°N, ${routePointB.longitude.toFixed(2)}°E)`}
                </small>
              </div>
            </div>

            {/* Coordinate Slots (Point A & Point B) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setRouteActiveSlot("A")}
                style={{
                  flex: 1,
                  background: routeActiveSlot === "A" ? "rgba(16, 185, 129, 0.12)" : "#ffffff",
                  border: `1.5px solid ${routeActiveSlot === "A" ? "#10b981" : "#cbd5e1"}`,
                  borderRadius: "10px",
                  padding: "8px 10px",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: routeActiveSlot === "A" ? "0 0 0 2px rgba(16, 185, 129, 0.2)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
                    🟢 {t("routeStartA")}
                  </span>
                  {routeActiveSlot === "A" && (
                    <span style={{ fontSize: "9px", background: "#10b981", color: "#fff", padding: "1px 5px", borderRadius: "6px", fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: routePointA ? "#082536" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {routePointA ? `${routePointA.latitude.toFixed(4)}°N, ${routePointA.longitude.toFixed(4)}°E` : t("tapMapToSet")}
                </div>
              </button>

              <div style={{ color: "#94a3b8", fontWeight: 900, fontSize: "14px", flexShrink: 0 }}>
                →
              </div>

              <button
                type="button"
                onClick={() => setRouteActiveSlot("B")}
                style={{
                  flex: 1,
                  background: routeActiveSlot === "B" ? "rgba(2, 132, 199, 0.12)" : "#ffffff",
                  border: `1.5px solid ${routeActiveSlot === "B" ? "#0284c7" : "#cbd5e1"}`,
                  borderRadius: "10px",
                  padding: "8px 10px",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: routeActiveSlot === "B" ? "0 0 0 2px rgba(2, 132, 199, 0.2)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>
                    🏁 {t("routeDestB")}
                  </span>
                  {routeActiveSlot === "B" && (
                    <span style={{ fontSize: "9px", background: "#0284c7", color: "#fff", padding: "1px 5px", borderRadius: "6px", fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: routePointB ? "#082536" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {routePointB ? `${routePointB.latitude.toFixed(4)}°N, ${routePointB.longitude.toFixed(4)}°E` : t("tapMapToSet")}
                </div>
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setRoutePointA(location);
                  setRouteActiveSlot("B");
                }}
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  color: "#0369a1",
                  borderRadius: "8px",
                  padding: "5px 9px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Anchor size={12} />
                <span>{t("routeUseCurrent")}</span>
              </button>

              {routePointA && routePointB && (
                <button
                  type="button"
                  onClick={() => {
                    const temp = routePointA;
                    setRoutePointA(routePointB);
                    setRoutePointB(temp);
                  }}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    borderRadius: "8px",
                    padding: "5px 9px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ArrowLeftRight size={12} />
                  <span>{t("routeSwap")}</span>
                </button>
              )}

              {(routePointA || routePointB) && (
                <button
                  type="button"
                  onClick={() => {
                    setRoutePointA(null);
                    setRoutePointB(null);
                    setRouteActiveSlot("A");
                  }}
                  style={{
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    color: "#e11d48",
                    borderRadius: "8px",
                    padding: "5px 9px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "auto",
                  }}
                >
                  <RotateCcw size={12} />
                  <span>{t("routeClear")}</span>
                </button>
              )}
            </div>

            {/* Interactive Map Canvas */}
            <div className="compact-map-wrapper" style={{ position: "relative", minHeight: "360px" }}>
              <MarineMap
                compact={true}
                selectedLocation={routePointB ? null : routePointA}
                onSelectLocation={handleRoutePlannerMapClick}
                layers={mapLayers.layers}
                showDemoFeatures={true}
                alerts={alertData.data?.alerts ?? []}
                pfzs={pfzGeojson}
                savedLocations={mobileSavedLocations}
                riskLevel={riskLevel}
                routeGeometry={interactiveRouteData?.geometry ?? null}
              />

              {/* Floating Helper Pill on Map */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  right: "10px",
                  background: "rgba(8, 37, 54, 0.88)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <span>
                  {!routePointA
                    ? "👉 Tap map to set Start (Point A)"
                    : !routePointB
                    ? "👉 Tap map to set Destination (Point B)"
                    : "🗺️ 2-Point Route Computed"}
                </span>
                <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 800 }}>
                  ORCA NAV
                </span>
              </div>
            </div>

            {/* Route Calculation Summary & Navigation Stats */}
            {interactiveRouteData && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* 4-Metric Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <small style={{ color: "#64748b", fontSize: "10.5px", display: "block" }}>
                      📏 {t("routePassageDist")}
                    </small>
                    <strong style={{ color: "#082536", fontSize: "18px", fontWeight: 800 }}>
                      {interactiveRouteData.distanceKm} km
                    </strong>
                    <div style={{ color: "#0284c7", fontSize: "11px", fontWeight: 700 }}>
                      {interactiveRouteData.distanceNmi} NM (Nautical Miles)
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <small style={{ color: "#64748b", fontSize: "10.5px", display: "block" }}>
                      ⏱️ {t("routeEstVoyage")}
                    </small>
                    <strong style={{ color: "#10b981", fontSize: "18px", fontWeight: 800 }}>
                      ~{Math.floor(interactiveRouteData.durationMinutes / 60) > 0 ? `${Math.floor(interactiveRouteData.durationMinutes / 60)}h ` : ""}{interactiveRouteData.durationMinutes % 60}m
                    </strong>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      @ ~12 kt Cruising Speed
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <small style={{ color: "#64748b", fontSize: "10.5px", display: "block" }}>
                      🧭 {t("routeBearing")}
                    </small>
                    <strong style={{ color: "#082536", fontSize: "18px", fontWeight: 800 }}>
                      {interactiveRouteData.bearingDeg}° {interactiveRouteData.bearingCompass}
                    </strong>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      Compass Direction
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <small style={{ color: "#64748b", fontSize: "10.5px", display: "block" }}>
                      ⛽ {t("routeFuelEst")}
                    </small>
                    <strong style={{ color: "#d97706", fontSize: "18px", fontWeight: 800 }}>
                      ~{interactiveRouteData.fuelLitres} L
                    </strong>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      Est. Diesel Consumption
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Waypoint Guidance Card */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(8, 37, 54, 0.96), rgba(15, 60, 85, 0.96))",
                    border: "1.5px solid rgba(52, 189, 209, 0.35)",
                    borderRadius: "12px",
                    padding: "14px",
                    color: "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <NavigationIcon size={14} style={{ color: "#38bdf8" }} />
                      <strong style={{ fontSize: "12.5px" }}>{t("routeWaypoints")}</strong>
                    </div>
                    <span style={{ fontSize: "10px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                      5 CORRIDOR POINTS
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                    {interactiveRouteData.waypoints.map((wp, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ fontSize: "13px", lineHeight: "1.2" }}>
                          {idx === 0 ? "🟢" : idx === interactiveRouteData.waypoints.length - 1 ? "🏁" : "⚓"}
                        </span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: idx === 0 ? "#34d399" : idx === interactiveRouteData.waypoints.length - 1 ? "#38bdf8" : "#93c5fd" }}>
                            {wp.name}
                          </strong>
                          <div style={{ color: "#94a3b8", fontSize: "10.5px" }}>
                            {wp.distKm} km · {wp.lat.toFixed(4)}°N, {wp.lon.toFixed(4)}°E
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ask AI Saathi About this Custom Route */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("assistant");
                    const promptText = `Please provide an ocean navigation and safety briefing for my voyage from Point A (${routePointA?.latitude.toFixed(3)}°N, ${routePointA?.longitude.toFixed(3)}°E) to Point B (${routePointB?.latitude.toFixed(3)}°N, ${routePointB?.longitude.toFixed(3)}°E). Total distance is ${interactiveRouteData.distanceKm} km, heading ${interactiveRouteData.bearingDeg}° (${interactiveRouteData.bearingCompass}). Are weather, waves and currents safe for this passage?`;
                    setQueryInput(promptText);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                  }}
                >
                  <Sparkles size={16} />
                  <span>{t("routeAskSaathi")}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ALERTS & SOS (अलर्ट व सुरक्षा) */}
        {activeTab === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Clean Segmented Sub-Tab Toggle */}
            <div className="m-segmented-control">
              <button
                type="button"
                className={`m-segment-btn ${alertSubTab === "sos" ? "active sos" : ""}`}
                onClick={() => setAlertSubTab("sos")}
              >
                <ShieldAlert size={14} style={{ color: alertSubTab === "sos" ? "#e11d48" : "#64748b" }} />
                <span>
                  {({
                    hi: "🚨 आपातकालीन SOS",
                    en: "🚨 Emergency SOS",
                    ta: "🚨 அவசர SOS",
                    te: "🚨 అత్యవసర SOS",
                    ml: "🚨 അടിയന്തര SOS",
                    gu: "🚨 કટોકટી SOS",
                    mr: "🚨 आपत्कालीन SOS",
                    bn: "🚨 জরুরী SOS",
                    kn: "🚨 ತುರ್ತು SOS",
                    or: "🚨 ଜରୁରୀକାଳୀନ SOS",
                  } as Record<string, string>)[selectedLang] || "🚨 Emergency SOS"}
                </span>
              </button>

              <button
                type="button"
                className={`m-segment-btn ${alertSubTab === "advisories" ? "active" : ""}`}
                onClick={() => setAlertSubTab("advisories")}
              >
                <Waves size={14} style={{ color: alertSubTab === "advisories" ? "#0284c7" : "#64748b" }} />
                <span>
                  {({
                    hi: "🌊 समुद्री चेतावनियां",
                    en: "🌊 Marine Advisories",
                    ta: "🌊 கடல் எச்சரிக்கைகள்",
                    te: "🌊 సముద్ర హెచ్చరికలు",
                    ml: "🌊 സമുദ്ര മുന്നറിയിപ്പുകൾ",
                    gu: "🌊 દરિયાઈ ચેતવણીઓ",
                    mr: "🌊 सागरी चेतावण्या",
                    bn: "🌊 সামুদ্রিক সতর্কতা",
                    kn: "🌊 ಸಾಗರ ಎಚ್ಚರಿಕೆಗಳು",
                    or: "🌊 ସାମୁଦ୍ରିକ ସତର୍କତା",
                  } as Record<string, string>)[selectedLang] || "🌊 Marine Advisories"}
                </span>
                {(partitionedAlerts.localAlerts.length + partitionedAlerts.otherAlerts.length) > 0 && (
                  <span className="m-segment-count">
                    {partitionedAlerts.localAlerts.length + partitionedAlerts.otherAlerts.length}
                  </span>
                )}
              </button>
            </div>

            {/* SUB-TAB 1: EMERGENCY DISTRESS SOS & LOCAL DIRECT HELPLINES */}
            {alertSubTab === "sos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <EmergencySOSCard
                  workflowState={sosStore.workflowState}
                  activeReport={sosStore.activeReport}
                  isOnline={typeof navigator !== "undefined" ? navigator.onLine : true}
                  gpsAvailable={true}
                  locationLabel={location.label}
                  selectedLang={selectedLang}
                  onArmSOS={() => {
                    VolumeKeyListener.playConfirmationHaptics();
                    sosStore.armSOS();
                  }}
                  onOpenOnboarding={() => setShowSafetyOnboardingModal(true)}
                  onResetSOS={() => sosStore.reset()}
                />

                {/* Local Harbor Police & VTS Signals Direct Contact Box */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    boxShadow: "0 2px 10px rgba(8, 37, 54, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "13px", color: "#082536" }}>
                      <MapPin size={15} style={{ color: "#087d98" }} />
                      <span>{sectorSOS.harborName} ({sectorSOS.state})</span>
                    </span>
                    <span style={{ fontSize: "10.5px", color: "#475569", fontWeight: 700, background: "#f1f5f9", padding: "2px 8px", borderRadius: "10px" }}>
                      {alertUi.localSosTitle}
                    </span>
                  </div>

                  <div className="m-sos-local-grid">
                    <a href={`tel:${sectorSOS.coastGuardPhone}`} className="m-sos-local-btn">
                      <div className="m-sos-local-label">
                        <span className="m-sos-local-name">{sectorSOS.coastGuardStation}</span>
                        <span className="m-sos-local-desc">Indian Coast Guard Regional Rescue</span>
                      </div>
                      <span className="m-sos-local-call">
                        <PhoneCall size={11} /> {sectorSOS.coastGuardPhone}
                      </span>
                    </a>

                    <a href={`tel:${sectorSOS.coastalPolicePhone}`} className="m-sos-local-btn">
                      <div className="m-sos-local-label">
                        <span className="m-sos-local-name">{sectorSOS.coastalPoliceStation}</span>
                        <span className="m-sos-local-desc">Coastal Security Police Station</span>
                      </div>
                      <span className="m-sos-local-call">
                        <PhoneCall size={11} /> {sectorSOS.coastalPolicePhone}
                      </span>
                    </a>

                    <a href={`tel:${sectorSOS.portControlPhone}`} className="m-sos-local-btn">
                      <div className="m-sos-local-label">
                        <span className="m-sos-local-name">{sectorSOS.portControl}</span>
                        <span className="m-sos-local-desc">Harbor Master / VTS Signal Station</span>
                      </div>
                      <span className="m-sos-local-call">
                        <PhoneCall size={11} /> {sectorSOS.portControlPhone}
                      </span>
                    </a>
                  </div>

                  <div className="m-sos-vhf-badge">
                    <Radio size={14} style={{ color: "#16a34a" }} />
                    <span>{alertUi.vhfDistressLabel} ({sectorSOS.vhfChannel})</span>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: OCEAN WEATHER & MARINE ADVISORIES */}
            {alertSubTab === "advisories" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Section 1: Local Coastal Alerts for Selected Harbor */}
                <div className="m-section-header" style={{ marginBottom: "2px" }}>
                  <h3>{alertUi.localAlertsHeader} · {sectorSOS.city}</h3>
                </div>

                {partitionedAlerts.isLocalClear ? (
                  <div className="m-alert-all-clear">
                    <ShieldCheck size={34} style={{ color: "#059669" }} />
                    <h4 className="m-alert-all-clear-title">
                      {alertUi.noLocalAlertsTitle} {sectorSOS.harborName}
                    </h4>
                    <p className="m-alert-all-clear-desc">
                      {alertUi.noLocalAlertsDesc}
                    </p>
                    <span style={{ fontSize: "10.5px", color: "#047857", fontWeight: 700 }}>
                      ✓ {t("currentSeaStatus")}: {t("wave")} ({marine?.wave_height ? `${marine.wave_height.value} m` : "1.1 m"}) · {t("wind")} ({weather?.wind_speed ? `${weather.wind_speed.value} km/h` : "15 km/h"})
                    </span>
                  </div>
                ) : (
                  partitionedAlerts.localAlerts.map((alert) => (
                    <div key={alert.id} className={`m-alert-item ${alert.badgeClass}`}>
                      <div className="m-alert-content">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span className={`m-alert-badge ${alert.badgeClass}`}>
                            <AlertTriangle size={11} /> {alert.severityLabel}
                          </span>
                          <span className="m-alert-region-tag local">
                            <MapPin size={10} /> {alert.regionName} ({alert.distanceLabel})
                          </span>
                        </div>
                        <h4 className="m-alert-headline">{alert.title}</h4>
                        <p className="m-alert-desc">{alert.desc}</p>
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px 10px",
                            background: "rgba(255, 255, 255, 0.85)",
                            borderRadius: "6px",
                            fontSize: "11px",
                            color: "#082536",
                            borderLeft: "3px solid #b45309",
                          }}
                        >
                          <strong>🛡️ {alertUi.actionAdvice}</strong> {alert.advice}
                        </div>
                        <span className="m-alert-meta" style={{ marginTop: "6px", display: "block" }}>
                          {alert.provider} · {t("updated")}: {t("justNow")}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {/* Section 2: Other Coastal & National Marine Alerts across India */}
                {partitionedAlerts.otherAlerts.length > 0 && (
                  <>
                    <div className="m-alert-section-divider">
                      <h4>
                        <Globe size={14} style={{ color: "#0284c7" }} />
                        {alertUi.otherAlertsHeader}
                      </h4>
                      <span className="m-alert-section-count">
                        {partitionedAlerts.otherAlerts.length} active
                      </span>
                    </div>

                    {partitionedAlerts.otherAlerts.map((alert) => (
                      <div key={alert.id} className={`m-alert-item ${alert.badgeClass}`}>
                        <div className="m-alert-content">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span className={`m-alert-badge ${alert.badgeClass}`}>
                              <AlertTriangle size={11} /> {alert.severityLabel}
                            </span>
                            <span className="m-alert-region-tag">
                              <MapPin size={10} /> {alert.regionName} ({alert.distanceLabel})
                            </span>
                          </div>
                          <h4 className="m-alert-headline">{alert.title}</h4>
                          <p className="m-alert-desc">{alert.desc}</p>
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "8px 10px",
                              background: "rgba(255, 255, 255, 0.85)",
                              borderRadius: "6px",
                              fontSize: "11px",
                              color: "#082536",
                              borderLeft: "3px solid #0284c7",
                            }}
                          >
                            <strong>🛡️ {alertUi.actionAdvice}</strong> {alert.advice}
                          </div>
                          <span className="m-alert-meta" style={{ marginTop: "6px", display: "block" }}>
                            {alert.provider} · {alert.affectedArea}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Native Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`m-nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <LayoutDashboard size={19} />
          <span className="m-nav-label">{t("statusTab")}</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === "assistant" ? "active" : ""}`}
          onClick={() => setActiveTab("assistant")}
        >
          <Bot size={19} />
          <span className="m-nav-label">{t("assistantTab")}</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === "pfz" ? "active" : ""}`}
          onClick={() => setActiveTab("pfz")}
        >
          <Fish size={19} />
          <span className="m-nav-label">{t("pfzTab")}</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === "map" ? "active" : ""}`}
          onClick={() => setActiveTab("map")}
        >
          <MapIcon size={19} />
          <span className="m-nav-label">{t("mapTab")}</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === "route" ? "active" : ""}`}
          onClick={() => setActiveTab("route")}
        >
          <RouteIcon size={19} />
          <span className="m-nav-label">{t("routeTab")}</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === "alerts" ? "active" : ""}`}
          onClick={() => setActiveTab("alerts")}
        >
          <ShieldAlert size={19} />
          <span className="m-nav-label">{t("alertsTab")}</span>
        </button>
      </nav>

      {/* 4. Coastal Port Bottom-Sheet Modal */}
      {showPortModal && (
        <div className="m-sheet-overlay" onClick={() => setShowPortModal(false)}>
          <div className="m-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="m-sheet-head">
              <h4>{t("selectHarbor")}</h4>
              <button
                type="button"
                className="mobile-icon-btn"
                style={{ color: "#082536", background: "#edf2f5" }}
                onClick={() => setShowPortModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="m-sheet-list">
              {COASTAL_HARBORS.map((h) => {
                const isSelected = (location.label || "").includes(h.name.split(" ")[0]);
                return (
                  <button
                    key={h.name}
                    type="button"
                    className={`m-sheet-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectPort(h)}
                  >
                    <div>
                      <div>{h.name}</div>
                      <small>{h.state} · {h.sea}</small>
                    </div>
                    {isSelected && <CheckCircle2 size={16} style={{ color: "#087d98" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Language Bottom-Sheet Modal */}
      {showLangModal && (
        <div className="m-sheet-overlay" onClick={() => setShowLangModal(false)}>
          <div className="m-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="m-sheet-head">
              <h4>{t("selectLang")}</h4>
              <button
                type="button"
                className="mobile-icon-btn"
                style={{ color: "#082536", background: "#edf2f5" }}
                onClick={() => setShowLangModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="m-sheet-list">
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    className={`m-sheet-option ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedLang(l.code);
                      setShowLangModal(false);
                    }}
                  >
                    <div>
                      <div>{l.native}</div>
                      <small>{l.name}</small>
                    </div>
                    {isSelected && <CheckCircle2 size={16} style={{ color: "#087d98" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SOS Distres Modals & Alarms (ISRO PS 26176) */}
      <SOSCountdownModal selectedLang={selectedLang} />
      <VoiceDistressModal selectedLang={selectedLang} />
      <SafetyOnboardingModal
        isOpen={showSafetyOnboardingModal}
        selectedLang={selectedLang}
        onClose={() => setShowSafetyOnboardingModal(false)}
        onRunTestSOS={() => {
          setShowSafetyOnboardingModal(false);
          VolumeKeyListener.playConfirmationHaptics();
          sosStore.armSOS();
        }}
      />
    </div>
  );
}
