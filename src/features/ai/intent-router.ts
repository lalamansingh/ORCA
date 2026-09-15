/**
 * Sagar Saathi Semantic Intent Router
 *
 * Implements strict intent classification before any tool calls or LLM prompts:
 * - GENERAL_CONVERSATION: Casual messages, greetings, feelings, jokes, chit-chat, general knowledge.
 *   -> ZERO maritime data, ZERO tool calls, direct natural LLM conversation.
 * - FISHING_QUERY: Fisheries advice, gear, catch viability.
 * - SEA_WEATHER_QUERY: Wave height, wind speed, currents, sea state.
 * - PFZ_QUERY: Potential Fishing Zones, target coordinates, species.
 * - NAVIGATION_QUERY: Returning to harbor, heading, safe passage.
 * - FUEL_QUERY: Diesel estimation, range, consumption calculation.
 * - SAFETY_QUERY: Maritime risk assessment, departure safety, advisories.
 * - SOS_QUERY: Emergency, sinking, engine breakdown, drift, distress.
 * - APP_HELP_QUERY: Application navigation, language switching, settings.
 *
 * Default Rule: If no specialized intent matched -> GENERAL_CONVERSATION.
 */

export type SagarSaathiIntent =
  | "GENERAL_CONVERSATION"
  | "FISHING_QUERY"
  | "SEA_WEATHER_QUERY"
  | "PFZ_QUERY"
  | "NAVIGATION_QUERY"
  | "FUEL_QUERY"
  | "SAFETY_QUERY"
  | "SOS_QUERY"
  | "APP_HELP_QUERY";

export type QueryDepthCategory =
  | "SIMPLE_FACT"
  | "EXPLANATION"
  | "DECISION"
  | "COMPARISON"
  | "PLANNING"
  | "EMERGENCY";

export interface ExtractedConstraints {
  [key: string]: unknown;
  fuelLiters?: number;
  returnTime?: string;
  departureTime?: string;
  vesselType?: string;
  targetLat?: number;
  targetLon?: number;
}

export interface IntentClassificationResult {
  intent: SagarSaathiIntent;
  depth_category: QueryDepthCategory;
  confidence: number;
  requires_weather: boolean;
  requires_pfz: boolean;
  requires_navigation: boolean;
  requires_safety: boolean;
  requires_fisheries_data: boolean;
  is_follow_up: boolean;
  language: string;
  extracted_constraints: ExtractedConstraints;
}

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

// Casual greetings & chit-chat patterns (ONLY true casual conversation without marine terms)
const CASUAL_GREETINGS = [
  /^(oye+|oyee+|oye bhai|oye saathi|hey+|heyy+|hi+|hii+|hello+|hola|namaste|namaskar|pranam|vanakkam|kem cho|kasa kay|adaab|radhe radhe|ram ram|jai shri ram|salaam)\b/i,
  /^(good\s*(morning|afternoon|evening|night)|subh\s*(prabhat|ratri))\b/i,
  /^(kaise ho|kya haal|kya kar rahe ho|kya scene hai|sab theek|kya chal raha hai|sab kaisa hai|kaisa chal raha|aur batao|kya chal rha)\b/i,
  /^(how are you|how do you do|what('s|s) up|sup|how('s|s) it going|whats up)\b/i,
  /^(aaj mood off hai|aaj khush hoon|bore ho raha hoon|kuch baat karo|mood kharab hai|dil nahi lag raha)\b/i,
  /^(thank you|thanks|thanks bhai|thank u|dhanyawad|shukriya|nandri|dhanyavadalu)\b/i,
  /^(accha|acha|theek hai|thik hai|haan bhai|ha bhai|haan|sahi hai|ok|okay|got it|samajh gaya|alright|cool)\b/i,
  /^(kya tum meri help karoge|can you help me|meri madad karo|help chahiye thi|kuch poochna tha|suno bhai|ek baat batao)\b/i,
  /^(who are you|tum kaun ho|aap kaun ho|who made you|tumhe kisne banaya|what is your name|apna naam batao)\b/i,
  /^(tell me a joke|koi joke sunao|chutkula sunao|kuch mazedaar batao)\b/i,
];

// General knowledge non-marine query patterns
const GENERAL_KNOWLEDGE_PATTERNS = [
  /\b(who discovered gravity|what is photosynthesis|apj abdul kalam|who was|who is|what is gravity|capital of|distance between earth and sun|speed of light)\b/i,
  /\b(weather of delhi|delhi ka mausam|delhi weather|patna|jaipur|lucknow|bhopal|punjab|haryana|up|bihar|rajasthan)\b/i,
];

// Emergency / SOS distress patterns (Latin and Indic scripts without \b boundary issues)
const SOS_PATTERNS = [
  /\b(pani aa raha|boat me pani|engine band|engine fail|engine kharab|doob|doob rahe|boat sinking|mayday|sos|bachao|boat drift|drift ho rahe|emergency|rescue)\b/i,
  /(नाव बुडत आहे|इंजिन बंद|पाणी भरत आहे|మునిగిపోతుంది|రక్షించండి|కాపాడండి|కాపాడండి|కాப்பாற்றுங்கள்|ஆபத்து|डूब रही है|इंजन खराब)/i,
];

// Fuel query patterns
const FUEL_PATTERNS = [
  /\b(diesel|fuel|kitna diesel|kitna tel|fuel lagega|fuel kitna|kitne litre|kitna petrol|mileage|burn rate|tank|usable fuel)\b/i,
  /(డీజిల్|ఇంధనం|డిझेल|எரிபொருள்|डीजल|ईंधन)/i,
];

// Navigation / Route patterns
const NAVIGATION_PATTERNS = [
  /\b(ghar wapas|harbor wapas|wapas jana|port rasta|route to|harbor ka rasta|direction to|bearing to|navigation|kis disha|heading|kaise laute|route|compass|safe passage|safe corridor|waypoint|fairway|distance to|how far|nautical miles?|bearing|briefing for route|safe navigation)\b/i,
  /(తిరిగి వెళ్ళాలి|రస్తా|దారి|வழி|रस्ता|दिशा|वापसी|मार्ग|ദിശ)/i,
];

// PFZ (Potential Fishing Zone) patterns
const PFZ_PATTERNS = [
  /\b(pfz|potential fishing zone|potential fishing zones|fishing zone|fishing zones|machhli|machli|macchi|fish|fishes|fishing|catch|pomfret|surmai|tuna|mackerel|ribbonfish|hilsa|sardine|prawns|shrimp|jhinga|chlorophyll|sst front|fish productivity|where to fish|good catch|yield)\b/i,
  /(మత్స్య క్షేత్రం|చేపలు ఎక్కడ|చేపల వేట|మీன்பிடி மண்டலம்|மச்சலி|मछली क्षेत्र|मछली कहाँ|मछली किधर|मछली|മത്സ്യ)/i,
];

// Sea & Weather patterns
const SEA_WEATHER_PATTERNS = [
  /\b(wave|waves|swell|wind|winds|wind speed|wind direction|gust|gusts|current|currents|tide|tides|high tide|low tide|water temp|water temperature|sea temp|sea temperature|sst|sea state|sea conditions?|sea weather|sea status|ocean state|ocean conditions?|ocean weather|marine conditions?|marine weather|weather conditions?|weather at|weather in|weather today|weather forecast|live weather|sea|ocean|marine|lahrein|lehar|hawa ki gati|hawa|samundar ka mausam|samundar kaisa|samundar status|samudra|kaisa mausam|conditions? at|conditions?)\b/i,
  /(అలలు|గాలి|తరంగాలు|ఉష్ణోగ్రత|లాటా|वारे|அலைகள்|காற்று|लहरें|हवा|ज्वार|भाटा|समुद्र|मौसम|వాతావరణం|வானிலை|हवामान)/i,
];

// Safety / Departure patterns
const SAFETY_PATTERNS = [
  /\b(safe hai|ja sakte hain|samundar jana sahi|cyclone|warning|alert|danger|khatra|kya main ja sakta|kya hum ja sakte|risk kitna|surakshit hai|kal safe|safe to go|should i go|jana chahiye|jana sahi hoga|is it safe|can i go|safe for fishing|safety assessment|voyage safe|risk score)\b/i,
  /(సురక్షితమా|భద్రతా|सुरक्षित आहे का|பாதுகாப்பானதா|सुरक्षित है|जाना सही है|जाना सुरक्षित|സുരക്ഷിതമാണോ|સુરક્ષિત)/i,
];

// Comprehensive ORCA Domain Keyword Matcher (Rule 14)
const ORCA_DOMAIN_PATTERNS = [
  /\b(fishing|fishermen|fisherman|pfz|machli|machhli|macchi|jhinga|shikaar|sea|sea\s*state|sea\s*conditions?|sea\s*weather|ocean|ocean\s*conditions?|marine|marine\s*conditions?|coastal|tide|tides|high\s*tide|low\s*tide|wave|waves|swell|wind|winds|current|currents|harbour|harbor|jetty|port|dock|coast|inshore|offshore|cyclone|lightning|vessel|trawler|boat|boats|catamaran|dinghy|navigation|corridor|fairway|waypoint|boundary|boundaries|geofencing|route|fish|fishes|catch|yield|chlorophyll|sst|productivity|satellite|diesel|fuel|coordinate|coordinates|coords?|latitude|longitude|lat|lon|degrees?|conditions?|weather|voyage|sail|sailing)\b/i,
  /\d{1,2}(?:\.\d+)?\s*°?\s*[NSns]\s*[,/ ]+\s*\d{1,3}(?:\.\d+)?\s*°?\s*[EWew]/i,
  /(मछली|मत्स्य|समुद्र|समंदर|लहर|लहरें|हवा|चक्रवात|नाव|बंदरगाह|डीजल|ईंधन|निर्देशांक|చేపలు|మత్స్య|సముద్రం|అలలు|గాలి|బోటు|తుఫాను|డీజిల్|ఇంధనం|మీన్|మీன்பிடி|கடல்|அலைகள்|காற்று|படகு|புயல்|எரிபொருள்|மாसे|लाटा|वारे|बोट|वादळ)/i,
];

// Follow-up delta triggers
const FOLLOW_UP_DELTA_PATTERNS = [
  /^(kal\??|kal ka batao\??|tomorrow\??|aur kal\??)$/i,
  /^(waves\??|aur waves\??|lahrein\??|hawa\??|wind\??)$/i,
  /^(kitna door hai\??|kitni door hai\??|how far\??|distance\??)$/i,
  /^(waha tak kitna fuel lagega\??|fuel kitna lagega\??|kitna diesel lagega\??)$/i,
  /^(why\??|kyun\??|kyu\??|kyu nahi ja sakte\??|reason\??|pfz-\d+\s*(kyun|kyu|why)\??)$/i,
  /^(kitne baje tak\??|kitne baje wapas\??|what time\??|kab tak\??|6 baje\??|7 baje\??)$/i,
  /^(pfz-\d+\??|zone-\d+\??)$/i,
  /^(accha\??|acha\??|theek hai\??|ok\??|thanks\??|thanks bhai\??)$/i,
];

/**
 * Extracts operational user constraints and coordinates from query text and conversation history
 */
export function extractConstraintsFromText(
  query: string,
  history: ChatHistoryTurn[] = []
): ExtractedConstraints {
  const allTexts = [...history.map((h) => h.content), query].join(" ");
  const constraints: ExtractedConstraints = {};

  // GPS coordinates parsing: e.g. "18.988°N, 72.943°E" or "15.400°N, 73.800°E" or "18.988, 72.943"
  const coordMatch = allTexts.match(/(\d{1,2}(?:\.\d+)?)\s*°?\s*([NSns])?\s*[,/ ]+\s*(\d{1,3}(?:\.\d+)?)\s*°?\s*([EWew])?/);
  if (coordMatch) {
    let lat = parseFloat(coordMatch[1]);
    let lon = parseFloat(coordMatch[3]);
    if (coordMatch[2] && coordMatch[2].toUpperCase() === "S") lat = -lat;
    if (coordMatch[4] && coordMatch[4].toUpperCase() === "W") lon = -lon;
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      constraints.targetLat = lat;
      constraints.targetLon = lon;
    }
  }

  // Fuel liters: e.g. "18L", "18 litre", "15 liters", "20 ltr", "18 लीटर"
  const fuelMatch = allTexts.match(/(\d+(\.\d+)?)\s*(l|litre|litres|liter|liters|ltr|लीटर|లీటర్|லிட்டர்)\b/i);
  if (fuelMatch) {
    constraints.fuelLiters = parseFloat(fuelMatch[1]);
  }

  // Return time: e.g. "12 baje tak wapas", "by 12:00 PM", "11:30 tak"
  const returnMatch = allTexts.match(/(?:wapas|return|lautna|వరకు|முன்|तक)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?)|(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?)\s*(?:tak|wapas|return|వరకు)/i);
  if (returnMatch) {
    constraints.returnTime = (returnMatch[1] || returnMatch[2] || "").trim();
  }

  // Departure time: e.g. "5 baje nikle", "depart at 5:30 AM", "subah 6 baje"
  const depMatch = allTexts.match(/(?:nikalna|depart|subah|morning)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?)|(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?)\s*(?:ko nikle|par nikle)/i);
  if (depMatch) {
    constraints.departureTime = (depMatch[1] || depMatch[2] || "").trim();
  }

  // Vessel type: small boat, fiber boat, trawler, catamaran, etc.
  const vesselMatch = allTexts.match(/\b(small boat|chhoti boat|fiber boat|fibre boat|country craft|motor boat|trawler|catamaran|dinghy|donga|canoe)\b/i);
  if (vesselMatch) {
    constraints.vesselType = vesselMatch[1];
  }

  return constraints;
}

/**
 * Classifies a user query into a precise SagarSaathiIntent.
 * Adheres strictly to the rule:
 * If no specialized domain intent matches, default to GENERAL_CONVERSATION.
 */
export function classifyIntent(
  rawQuery: string,
  history: ChatHistoryTurn[] = []
): IntentClassificationResult {
  const query = rawQuery.trim();
  const lower = query.toLowerCase();

  // Extract constraints from query + multi-turn history
  const extractedConstraints = extractConstraintsFromText(query, history);

  // Detect language mode (for lightweight logging and instruction)
  const isTelugu = /[\u0C00-\u0C7F]/.test(query);
  const isTamil = /[\u0B80-\u0BFF]/.test(query);
  const isDevanagari = /[\u0900-\u097F]/.test(query);
  const detectedLang = isTelugu ? "Telugu" : isTamil ? "Tamil" : isDevanagari ? "Hindi/Marathi" : "Hinglish/English";

  // Check if query mentions any ORCA / Marine / Ocean domain concepts (Rule 14)
  const isOrcaDomain = ORCA_DOMAIN_PATTERNS.some((p) => p.test(query));

  // Helper to determine depth category (Rule 16)
  const determineDepth = (intent: SagarSaathiIntent): QueryDepthCategory => {
    if (intent === "SOS_QUERY") return "EMERGENCY";
    
    // Planning: Has operational constraints (fuel, timings) or planning keywords
    if (
      extractedConstraints.fuelLiters !== undefined ||
      extractedConstraints.returnTime !== undefined ||
      /\b(plan|schedule|route planning|best time to depart|kab niklun|kab tak|wapas kab|round trip)\b/i.test(query)
    ) {
      return "PLANNING";
    }

    // Comparison: "PFZ-2 kyun", "PFZ-3?", "which is better", "A vs B"
    if (
      /\b(kyun|kyu|why|better|difference|compare|vs|versus|kaunsa better|kaunsa accha|alternative)\b/i.test(lower) ||
      /^pfz-\d+\??/i.test(lower)
    ) {
      return "COMPARISON";
    }

    // Decision: "Safe hai?", "Ja sakte hain?", "Should I go?", "Jana sahi hoga?", "Fuel enough hai?"
    if (
      /\b(safe|surakshit|ja sakte|should i|jana chahiye|jana sahi|feasible|enough|avoid|go or not)\b/i.test(lower) ||
      /(సురక్షితమా|सुरक्षित|பாதுகாப்பானதா)/i.test(query) ||
      intent === "SAFETY_QUERY"
    ) {
      return "DECISION";
    }

    // Explanation: "What is", "How does", "Explain", "Kyun hota hai"
    if (/\b(what is|what are|how does|explain|meaning of|kya hota hai|samjhao|karan|reason)\b/i.test(lower)) {
      return "EXPLANATION";
    }

    // Simple Fact: direct inquiries like "Wave kitni hai?", "High tide kab hai?"
    if (
      /\b(kitna|kitni|kitne|what is the wave|wind speed|high tide|low tide|distance|bearing|temperature)\b/i.test(lower) ||
      /(ఎంత|ఎప్పుడు|எவ்வளவு|கிலோமீட்டர்)/i.test(query)
    ) {
      return "SIMPLE_FACT";
    }

    return "DECISION";
  };

  // 1. High Priority: Emergency SOS
  if (SOS_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "SOS_QUERY",
      depth_category: "EMERGENCY",
      confidence: 0.99,
      requires_weather: true,
      requires_pfz: false,
      requires_navigation: true,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // 2. Check for Casual Acknowledgements / Greetings ONLY if NO marine domain keywords are present
  const isSingleWordCasual =
    !isOrcaDomain &&
    /^(oye+|oyee+|hi+|hii+|hello+|namaste|accha|acha|ok|okay|theek|thik|thanks|shukriya)$/i.test(
      query.replace(/[!.,?]+$/, "")
    );
  if (isSingleWordCasual) {
    return {
      intent: "GENERAL_CONVERSATION",
      depth_category: "SIMPLE_FACT",
      confidence: 0.98,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // 3. Multi-turn Follow-Up Delta Check (Rule 11 & 12)
  const isShortFollowUp =
    FOLLOW_UP_DELTA_PATTERNS.some((p) => p.test(query)) ||
    (query.split(" ").length <= 4 && query.endsWith("?"));

  if (isShortFollowUp && history.length > 0) {
    // Check if it's just a casual acknowledgement
    if (/^(accha|acha|theek hai|ok|thanks|thanks bhai|shukriya|dhanyawad)\b/i.test(lower)) {
      return {
        intent: "GENERAL_CONVERSATION",
        depth_category: "SIMPLE_FACT",
        confidence: 0.95,
        requires_weather: false,
        requires_pfz: false,
        requires_navigation: false,
        requires_safety: false,
        requires_fisheries_data: false,
        is_follow_up: true,
        language: detectedLang,
        extracted_constraints: extractedConstraints,
      };
    }

    // "Kal?" or "Waves?" or "6 baje?" inherits weather/safety
    if (/^(kal\??|waves\??|lahrein\??|wind\??|hawa\??|kitne baje|6 baje|7 baje)/i.test(lower)) {
      return {
        intent: "SEA_WEATHER_QUERY",
        depth_category: "DECISION",
        confidence: 0.95,
        requires_weather: true,
        requires_pfz: false,
        requires_navigation: false,
        requires_safety: true,
        requires_fisheries_data: false,
        is_follow_up: true,
        language: detectedLang,
        extracted_constraints: extractedConstraints,
      };
    }

    // "Kitna door hai?" or "Waha tak kitna fuel lagega?" inherits previous PFZ target
    if (/^(kitna door|waha tak|distance|rasta)/i.test(lower) || FUEL_PATTERNS.some((p) => p.test(query))) {
      return {
        intent: FUEL_PATTERNS.some((p) => p.test(query)) ? "FUEL_QUERY" : "NAVIGATION_QUERY",
        depth_category: "PLANNING",
        confidence: 0.94,
        requires_weather: false,
        requires_pfz: true,
        requires_navigation: true,
        requires_safety: false,
        requires_fisheries_data: true,
        is_follow_up: true,
        language: detectedLang,
        extracted_constraints: extractedConstraints,
      };
    }

    // "Why?" or "PFZ-2 kyun?" inherits comparison/decision
    if (/^(why\??|kyun\??|kyu\??|pfz-\d+\s*(kyun|kyu|why)\??)/i.test(lower)) {
      return {
        intent: "PFZ_QUERY",
        depth_category: "COMPARISON",
        confidence: 0.95,
        requires_weather: true,
        requires_pfz: true,
        requires_navigation: true,
        requires_safety: true,
        requires_fisheries_data: true,
        is_follow_up: true,
        language: detectedLang,
        extracted_constraints: extractedConstraints,
      };
    }
  }

  // 4. Casual Greetings & Chit-chat Patterns (ONLY if no marine domain concept is present)
  if (!isOrcaDomain && CASUAL_GREETINGS.some((p) => p.test(query))) {
    return {
      intent: "GENERAL_CONVERSATION",
      depth_category: "SIMPLE_FACT",
      confidence: 0.96,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // 5. General Knowledge Non-Marine Queries
  if (!isOrcaDomain && GENERAL_KNOWLEDGE_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "GENERAL_CONVERSATION",
      depth_category: "EXPLANATION",
      confidence: 0.95,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // 6. Specialized Domain Queries

  // Fuel & Trip Viability Query
  if (FUEL_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "FUEL_QUERY",
      depth_category: determineDepth("FUEL_QUERY"),
      confidence: 0.93,
      requires_weather: true,
      requires_pfz: true,
      requires_navigation: true,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // Navigation & Route Query
  if (NAVIGATION_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "NAVIGATION_QUERY",
      depth_category: determineDepth("NAVIGATION_QUERY"),
      confidence: 0.93,
      requires_weather: true,
      requires_pfz: true,
      requires_navigation: true,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // PFZ (Potential Fishing Zones) & Catch Query
  if (PFZ_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "PFZ_QUERY",
      depth_category: determineDepth("PFZ_QUERY"),
      confidence: 0.95,
      requires_weather: true,
      requires_pfz: true,
      requires_navigation: true,
      requires_safety: true,
      requires_fisheries_data: true,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // Safety & Voyage Viability Query (Is it safe? Can I go? Risk?)
  if (SAFETY_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "SAFETY_QUERY",
      depth_category: determineDepth("SAFETY_QUERY"),
      confidence: 0.95,
      requires_weather: true,
      requires_pfz: true,
      requires_navigation: false,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // Sea State & Weather Query
  if (SEA_WEATHER_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "SEA_WEATHER_QUERY",
      depth_category: determineDepth("SEA_WEATHER_QUERY"),
      confidence: 0.93,
      requires_weather: true,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // App Navigation Help
  if (/\b(app kaise|settings|language change|help with app|features of orca)\b/i.test(query)) {
    return {
      intent: "APP_HELP_QUERY",
      depth_category: "SIMPLE_FACT",
      confidence: 0.9,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // 7. General Marine Domain Fallback (Rule 14: If any marine term exists, ALWAYS inject marine context)
  if (isOrcaDomain) {
    return {
      intent: "FISHING_QUERY",
      depth_category: determineDepth("FISHING_QUERY"),
      confidence: 0.91,
      requires_weather: true,
      requires_pfz: true,
      requires_navigation: true,
      requires_safety: true,
      requires_fisheries_data: true,
      is_follow_up: false,
      language: detectedLang,
      extracted_constraints: extractedConstraints,
    };
  }

  // 8. Safe Default for genuine non-marine conversation
  return {
    intent: "GENERAL_CONVERSATION",
    depth_category: determineDepth("GENERAL_CONVERSATION"),
    confidence: 0.85,
    requires_weather: false,
    requires_pfz: false,
    requires_navigation: false,
    requires_safety: false,
    requires_fisheries_data: false,
    is_follow_up: false,
    language: detectedLang,
    extracted_constraints: extractedConstraints,
  };
}
