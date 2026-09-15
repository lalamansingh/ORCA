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

export interface IntentClassificationResult {
  intent: SagarSaathiIntent;
  confidence: number;
  requires_weather: boolean;
  requires_pfz: boolean;
  requires_navigation: boolean;
  requires_safety: boolean;
  requires_fisheries_data: boolean;
  is_follow_up: boolean;
  language: string;
}

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

// Casual greetings & chit-chat patterns (Hindi, Hinglish, English, Telugu, Tamil, Marathi)
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

// General knowledge query patterns (science, history, facts, non-marine)
const GENERAL_KNOWLEDGE_PATTERNS = [
  /\b(who discovered gravity|what is photosynthesis|apj abdul kalam|who was|who is|what is gravity|capital of|distance between earth and sun|speed of light)\b/i,
  /\b(weather of delhi|delhi ka mausam|delhi weather|patna|jaipur|lucknow|bhopal|punjab|haryana|up|bihar|rajasthan)\b/i,
];

// Emergency / SOS distress patterns
const SOS_PATTERNS = [
  /\b(pani aa raha|boat me pani|engine band|engine fail|engine kharab|doob|doob rahe|help boat sinking|mayday|sos|bachao|boat drift|drift ho rahe|emergency|rescue)\b/i,
  /\b(नाव बुडत आहे|इंजिन बंद|पाणी भरत आहे|మునిగిపోతుంది|రక్షించండి|காப்பாற்றுங்கள்)\b/i,
];

// Fuel query patterns
const FUEL_PATTERNS = [
  /\b(diesel|fuel|kitna diesel|kitna tel|fuel lagega|fuel kitna|kitne litre|kitna petrol|mileage|burn rate|tank)\b/i,
  /\b(డీజిల్|ఇంధనం|डिझेल|எரிபொருள்|डीजल)\b/i,
];

// Navigation / Route patterns
const NAVIGATION_PATTERNS = [
  /\b(ghar wapas|harbor wapas|wapas jana|port rasta|route to|harbor ka rasta|direction to|bearing to|navigation|kis disha|heading|kaise laute)\b/i,
  /\b(తిరిగి వెళ్ళాలి|रस्ता|దారి|வழி)\b/i,
];

// PFZ (Potential Fishing Zone) patterns
const PFZ_PATTERNS = [
  /\b(pfz|potential fishing zone|fishing zone|machhli kaha|machli kahan|kaha milegi machhli|fish zone|best zone|nearest pfz|fish spots|pomfret kaha|surmai kaha)\b/i,
  /\b(మత్స్య క్షేత్రం|మాసేమారీ క్షేత్ర|మీன்பிடி மண்டலம்|मछली क्षेत्र)\b/i,
];

// Sea & Weather patterns
const SEA_WEATHER_PATTERNS = [
  /\b(wave|waves|swell|wind|wind speed|lahrein|lehar|hawa ki gati|hawa|currents|tide|tides|water temp|samundar ka mausam|samundar kaisa|sea state|sea condition)\b/i,
  /\b(అలలు|గాలి|लाटा|वारे|அலைகள்|காற்று|लहरें|हवा)\b/i,
];

// Safety / Departure patterns
const SAFETY_PATTERNS = [
  /\b(safe hai|ja sakte hain|samundar jana sahi|cyclone|warning|alert|danger|khatra|kya main ja sakta|kya hum ja sakte|risk kitna|surakshit hai)\b/i,
  /\b(సురక్షితమా|सुरक्षित आहे का|பாதுகாப்பானதா|सुरक्षित है)\b/i,
];

// Follow-up delta triggers
const FOLLOW_UP_DELTA_PATTERNS = [
  /^(kal\??|kal ka batao\??|tomorrow\??|aur kal\??)$/i,
  /^(waves\??|aur waves\??|lahrein\??|hawa\??|wind\??)$/i,
  /^(kitna door hai\??|kitni door hai\??|how far\??|distance\??)$/i,
  /^(waha tak kitna fuel lagega\??|fuel kitna lagega\??|kitna diesel lagega\??)$/i,
  /^(why\??|kyun\??|kyu\??|kyu nahi ja sakte\??|reason\??)$/i,
  /^(kitne baje tak\??|kitne baje wapas\??|what time\??|kab tak\??)$/i,
  /^(accha\??|acha\??|theek hai\??|ok\??|thanks\??|thanks bhai\??)$/i,
];

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

  // Detect language mode (for lightweight logging and instruction)
  const isTelugu = /[\u0C00-\u0C7F]/.test(query);
  const isTamil = /[\u0B80-\u0BFF]/.test(query);
  const isDevanagari = /[\u0900-\u097F]/.test(query);
  const detectedLang = isTelugu ? "Telugu" : isTamil ? "Tamil" : isDevanagari ? "Hindi/Marathi" : "Hinglish/English";

  // 1. High Priority: Emergency SOS
  if (SOS_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "SOS_QUERY",
      confidence: 0.99,
      requires_weather: true,
      requires_pfz: false,
      requires_navigation: true,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // 2. Check for Casual Acknowledgements / Greetings
  // Single-word casual phrases like "Oyeee", "Hi", "Hello", "Accha", "Thanks bhai" MUST be GENERAL_CONVERSATION
  const isSingleWordCasual = /^(oye+|oyee+|hi+|hii+|hello+|namaste|accha|acha|ok|okay|theek|thik|thanks|shukriya)$/i.test(query.replace(/[!.,?]+$/, ""));
  if (isSingleWordCasual) {
    return {
      intent: "GENERAL_CONVERSATION",
      confidence: 0.98,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // 3. Multi-turn Follow-Up Delta Check
  const isShortFollowUp = FOLLOW_UP_DELTA_PATTERNS.some((p) => p.test(query)) || (query.split(" ").length <= 4 && query.endsWith("?"));

  if (isShortFollowUp && history.length > 0) {
    // Check if it's just a casual acknowledgement
    if (/^(accha|acha|theek hai|ok|thanks|thanks bhai|shukriya|dhanyawad)\b/i.test(lower)) {
      return {
        intent: "GENERAL_CONVERSATION",
        confidence: 0.95,
        requires_weather: false,
        requires_pfz: false,
        requires_navigation: false,
        requires_safety: false,
        requires_fisheries_data: false,
        is_follow_up: true,
        language: detectedLang,
      };
    }

    // "Kal?" or "Waves?" inherits weather/safety
    if (/^(kal\??|waves\??|lahrein\??|wind\??|hawa\??|kitne baje tak\??)/i.test(lower)) {
      return {
        intent: "SEA_WEATHER_QUERY",
        confidence: 0.94,
        requires_weather: true,
        requires_pfz: false,
        requires_navigation: false,
        requires_safety: true,
        requires_fisheries_data: false,
        is_follow_up: true,
        language: detectedLang,
      };
    }

    // "Kitna door hai?" or "Waha tak kitna fuel lagega?" inherits previous PFZ target
    if (/^(kitna door|waha tak|distance|rasta)/i.test(lower) || FUEL_PATTERNS.some((p) => p.test(query))) {
      return {
        intent: FUEL_PATTERNS.some((p) => p.test(query)) ? "FUEL_QUERY" : "NAVIGATION_QUERY",
        confidence: 0.93,
        requires_weather: false,
        requires_pfz: true,
        requires_navigation: true,
        requires_safety: false,
        requires_fisheries_data: true,
        is_follow_up: true,
        language: detectedLang,
      };
    }

    // "Why?" or "Kyun?" inherits previous decision reasoning
    if (/^(why\??|kyun\??|kyu\??)/i.test(lower)) {
      return {
        intent: "SAFETY_QUERY",
        confidence: 0.92,
        requires_weather: true,
        requires_pfz: false,
        requires_navigation: false,
        requires_safety: true,
        requires_fisheries_data: false,
        is_follow_up: true,
        language: detectedLang,
      };
    }
  }

  // 4. Casual Greetings & Chit-chat Patterns
  if (CASUAL_GREETINGS.some((p) => p.test(query))) {
    return {
      intent: "GENERAL_CONVERSATION",
      confidence: 0.96,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // 5. General Knowledge / Inland Queries
  if (GENERAL_KNOWLEDGE_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "GENERAL_CONVERSATION",
      confidence: 0.95,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // 6. Specialized Domain Queries

  // Fuel Query
  if (FUEL_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "FUEL_QUERY",
      confidence: 0.92,
      requires_weather: false,
      requires_pfz: true,
      requires_navigation: true,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // Navigation Query
  if (NAVIGATION_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "NAVIGATION_QUERY",
      confidence: 0.92,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: true,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // PFZ Query
  if (PFZ_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "PFZ_QUERY",
      confidence: 0.94,
      requires_weather: false,
      requires_pfz: true,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: true,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // Safety Query (Is it safe to go? Risk?)
  if (SAFETY_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "SAFETY_QUERY",
      confidence: 0.93,
      requires_weather: true,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: true,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // Sea & Weather Query
  if (SEA_WEATHER_PATTERNS.some((p) => p.test(query))) {
    return {
      intent: "SEA_WEATHER_QUERY",
      confidence: 0.91,
      requires_weather: true,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // App Help
  if (/\b(app kaise|settings|language change|help with app|features of orca)\b/i.test(query)) {
    return {
      intent: "APP_HELP_QUERY",
      confidence: 0.9,
      requires_weather: false,
      requires_pfz: false,
      requires_navigation: false,
      requires_safety: false,
      requires_fisheries_data: false,
      is_follow_up: false,
      language: detectedLang,
    };
  }

  // 7. SAFE DEFAULT (Rule #4)
  // If no specialized intent matched: intent = GENERAL_CONVERSATION
  return {
    intent: "GENERAL_CONVERSATION",
    confidence: 0.85,
    requires_weather: false,
    requires_pfz: false,
    requires_navigation: false,
    requires_safety: false,
    requires_fisheries_data: false,
    is_follow_up: false,
    language: detectedLang,
  };
}
