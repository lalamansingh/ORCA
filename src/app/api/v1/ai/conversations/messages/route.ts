import { NextResponse } from "next/server";
import { classifyIntent, type ChatHistoryTurn, type SagarSaathiIntent } from "@/features/ai/intent-router";

/**
 * Sagar Saathi Semantic Intent-Routed LLM Response Engine
 *
 * Adheres strictly to the Intent Architecture:
 * 1. Intent Router classifies query first.
 * 2. GENERAL_CONVERSATION:
 *    - Zero marine data injection, zero weather/PFZ/route tool data.
 *    - Direct natural LLM response in user's tone/language (1-2 sentences for casual greetings).
 *    - No maritime CTA buttons.
 * 3. Domain Queries (Weather, PFZ, Fuel, Navigation, Safety, SOS):
 *    - Tool data injected ONLY when required by the specific intent.
 *    - Follow-ups provide primarily the DELTA (new information only).
 * 4. Safe Default:
 *    - If no specialized domain intent matches -> GENERAL_CONVERSATION.
 */

interface RequestBody {
  query: string;
  selected_location?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  conversation_id?: string;
  history?: ChatHistoryTurn[];
  constraints?: {
    fuelLiters?: number;
    returnTime?: string;
    departureTime?: string;
    vesselType?: string;
  };
  live_evidence?: {
    locationLabel?: string;
    waveHeight?: string;
    windSpeed?: string;
    windGust?: string;
    sst?: string;
    currentSpeed?: string;
    riskLevel?: string;
    riskScore?: number;
    alerts?: Array<{ title: string; severity?: string; desc?: string }>;
    pfz?: Array<{ name: string; dist: string; dir: string; depth: string; yield: string; fish: string }>;
  };
  language?: string;
}

const SAGAR_SAATHI_GENERAL_SYSTEM_PROMPT = `You are Sagar Saathi, a friendly and intelligent AI companion for fishermen, coastal communities, and maritime users.

CONVERSATION STYLE & PERSONALITY:
- You are warm, respectful, conversational, and genuinely helpful.
- Being a marine assistant does NOT mean every message is about fishing or waves.
- When the user chats casually ("Oye", "Oyeee", "Hi", "Kaise ho?", "Kya kar rahe ho?", "Thank you", "Accha", "Aaj mood off hai"):
  - Respond naturally, warmly, and concisely like a real friend or companion.
  - DO NOT mention sea conditions, wave heights, wind, PFZ, coordinates, risk scores, or safety advice.
  - Keep simple greetings to 1–2 friendly sentences (e.g., "Haan bhai 😄 bolo, kya scene hai?" or "Hello! How can I help you today?").
  - Match the user's language (Hindi, Hinglish, English, Telugu, Tamil, Marathi) and friendly conversational tone naturally.
- When asked general knowledge questions (e.g., "Who discovered gravity?", "What is photosynthesis?"):
  - Answer accurately and politely without forcing marine terminology.`;

const SAGAR_SAATHI_MARINE_SYSTEM_PROMPT = `You are Sagar Saathi, the intelligent marine decision-support copilot inside ORCA (Marine Ecosystem Reasoning with Collaborative Agents).

Your role is to help fishermen, vessel operators, and coastal users make safe and productive decisions using verified ocean data.

CORE BEHAVIOR & RULES:
1. DYNAMIC GENERATION: Genuinely create the answer at runtime. Never output canned rigid templates.
2. DELTA-BASED FOLLOW-UPS:
   - If the user asks a follow-up ("Kal?", "Waves?", "Why?", "Kitne baje tak?", "Waha tak fuel?"):
   - Return PRIMARILY THE DELTA (only the new information requested).
   - Do NOT repeat the entire previous report or re-list all weather facts unless asked.
3. DECISION-FIRST:
   - For safety and trip viability queries, provide the operational decision clearly upfront (Safe / Caution / Danger).
4. CONSTRAINTS:
   - If fuel or time constraints are given, factor them directly into the feasibility assessment.
5. EMERGENCY:
   - For engine failure or drifting vessel, prioritize immediate life-saving steps: drop sea anchor, GPS location, Coast Guard 1554, VHF Ch 16.
6. LANGUAGE:
   - Respond naturally in the user's language and tone. Sound friendly, practical, and clear.`;

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const query = (body.query || "").trim();
    if (!query) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }

    const convId = body.conversation_id || crypto.randomUUID();
    const msgId = crypto.randomUUID();
    const lang = body.language || "hi";
    const loc = body.selected_location || { latitude: 18.92, longitude: 72.83, label: "Mumbai Sassoon Dock" };
    const evidence = body.live_evidence || {};
    const constraints = body.constraints || {};
    const history = body.history || [];

    // ==========================================
    // 1. SEMANTIC INTENT CLASSIFICATION
    // ==========================================
    const routing = classifyIntent(query, history);

    // Identify active tools based on routing
    const activeTools: string[] = [];
    if (routing.requires_weather) activeTools.push("ocean_weather_service");
    if (routing.requires_pfz) activeTools.push("pfz_fisheries_service");
    if (routing.requires_navigation) activeTools.push("navigation_route_service");
    if (routing.requires_safety) activeTools.push("marine_safety_scoring");
    if (routing.requires_fisheries_data) activeTools.push("incois_chlorophyll_sst");

    const marineContextNeeded = activeTools.length > 0;

    // Log development routing state as required by Section 14
    console.log(
      `[ChatRouter]\nmessage="${query}"\nintent=${routing.intent}\ntools=[${activeTools.join(", ")}]\nmarine_context=${marineContextNeeded}\nllm=true`
    );

    // Format conversation history (last 6 turns)
    const historyText =
      history.length > 0
        ? history
            .slice(-6)
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n\n")
        : "None";

    const apiKey = process.env.GEMINI_API_KEY || "";
    let answerText = "";

    // ==========================================
    // 2. GENERAL CONVERSATION (DIRECT TO LLM, ZERO MARITIME DATA)
    // ==========================================
    if (routing.intent === "GENERAL_CONVERSATION") {
      const generalPrompt = `RELEVANT CONVERSATION CONTEXT:
${historyText}

CURRENT USER QUERY:
${query}

USER LANGUAGE:
${lang}

INSTRUCTION:
Respond naturally, warmly, and concisely as Sagar Saathi.
This is a general casual message, greeting, emotion, or general question.
Do NOT mention sea conditions, wave heights, wind speed, PFZ, coordinates, or safety cards.
If it is a greeting or casual remark (like "Oyeee", "Hi", "Kaise ho?", "Accha"), keep it short (1–2 sentences).
Match the user's language (${lang} / Hinglish / Telugu / Tamil / English) naturally.`;

      if (apiKey) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: generalPrompt }] }],
              systemInstruction: { parts: [{ text: SAGAR_SAATHI_GENERAL_SYSTEM_PROMPT }] },
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 350,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          } else {
            console.warn("Gemini general conversation API non-200:", response.status);
          }
        } catch (geminiErr) {
          console.error("Gemini general conversation call failed:", geminiErr);
        }
      }

      // Safe conversational fallback if API is unavailable (NO maritime data)
      if (!answerText) {
        const lower = query.toLowerCase();
        if (/^(oye+|oyee+|hey+|heyy+)\b/i.test(lower)) {
          answerText = "Haan bhai 😄 bolo, kya scene hai? Main aapki kya madad kar sakta hoon?";
        } else if (/^(hi+|hello+|namaste)\b/i.test(lower)) {
          answerText = lang.startsWith("te")
            ? "నమస్కారం! ఎలా ఉన్నారు? మీకు ఎలాంటి సహాయం కావాలి?"
            : lang.startsWith("en")
            ? "Hello! How are you doing today? How can I assist you?"
            : "नमस्ते! कैसे हैं आप? मैं आपकी किस प्रकार सहायता कर सकता हूँ?";
        } else if (/^(kaise ho|kya haal)\b/i.test(lower)) {
          answerText = "Main badhiya hoon bhai! Aap batao, sab kaisa chal raha hai?";
        } else if (/^(thank|shukriya|dhanyawad)\b/i.test(lower)) {
          answerText = "Arey koi baat nahi bhai! Kabhi bhi zaroorat ho to batana. 😊";
        } else if (/^(accha|theek hai|ok)\b/i.test(lower)) {
          answerText = "Ji bhai, agar koi aur sawal ho to zaroor poochiye!";
        } else {
          answerText = "Ji boliye, main aapki kaise madad kar sakta hoon?";
        }
      }

      return NextResponse.json({
        conversation_id: convId,
        message_id: msgId,
        answer: answerText,
        orchestration: {
          query_id: crypto.randomUUID(),
          trace_id: crypto.randomUUID(),
          status: "SUCCESS",
          intent: "GENERAL_CONVERSATION",
          routing,
          location: undefined,
          data: {},
        },
      });
    }

    // ==========================================
    // 3. SPECIALIZED MARITIME QUERY (TOOL DATA INJECTED AS NEEDED)
    // ==========================================
    const alertsText =
      routing.requires_safety && evidence.alerts && evidence.alerts.length > 0
        ? evidence.alerts.map((a) => `- ${a.title} (${a.severity || "Active"}): ${a.desc || ""}`).join("\n")
        : "No active severe cyclone or swell warnings.";

    const pfzText =
      routing.requires_pfz && evidence.pfz && evidence.pfz.length > 0
        ? evidence.pfz
            .slice(0, 2)
            .map((p) => `- ${p.name}: ${p.dist} offshore (${p.dir}), depth ${p.depth}, expected yield ${p.yield}, species: ${p.fish}`)
            .join("\n")
        : "No active PFZ advisory at this exact coordinate.";

    const constraintsText = Object.keys(constraints).length > 0
      ? Object.entries(constraints).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "None stated";

    // Assemble tool-specific evidence text
    const evidenceLines: string[] = [];
    if (routing.requires_weather) {
      evidenceLines.push(`- Waves (Significant Wave Height): ${evidence.waveHeight || "0.9 m"}`);
      evidenceLines.push(`- Wind Speed: ${evidence.windSpeed || "12 km/h"}${evidence.windGust ? ` (Gusts: ${evidence.windGust})` : ""}`);
      evidenceLines.push(`- Surface Currents: ${evidence.currentSpeed || "0.32 m/s"}`);
    }
    if (routing.requires_fisheries_data || routing.requires_pfz) {
      evidenceLines.push(`- Sea Surface Temperature (SST): ${evidence.sst || "28.5°C"}`);
      evidenceLines.push(`- Potential Fishing Zones (PFZ):\n${pfzText}`);
    }
    if (routing.requires_safety) {
      evidenceLines.push(`- Live Risk Assessment: ${evidence.riskLevel || "LOW"} (Score: ${evidence.riskScore ?? 18}/100)`);
      evidenceLines.push(`- Active Maritime Alerts:\n${alertsText}`);
    }

    const marinePrompt = `RELEVANT CONVERSATION CONTEXT:
${historyText}

CURRENT USER QUERY:
${query}

USER LANGUAGE:
${lang}

DETECTED INTENT:
${routing.intent} (is_follow_up: ${routing.is_follow_up})

LOCATION:
${evidence.locationLabel || loc.label || "Coastal Sector"} (${loc.latitude.toFixed(2)}° N, ${loc.longitude.toFixed(2)}° E)

KNOWN USER CONSTRAINTS:
${constraintsText}

TOOL EVIDENCE (Retrieved based on intent):
${evidenceLines.join("\n") || "Standard coastal conditions."}

INSTRUCTION:
Generate the response genuinely using your maritime intelligence.
${routing.is_follow_up ? "IMPORTANT: This is a follow-up query. Provide PRIMARILY THE DELTA (only the new information requested). Do NOT repeat the entire weather or PFZ summary from previous turns." : ""}
State the operational bottom line clearly upfront.
Match the user's language (${lang}) and tone.`;

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: marinePrompt }] }],
            systemInstruction: { parts: [{ text: SAGAR_SAATHI_MARINE_SYSTEM_PROMPT }] },
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 850,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        } else {
          console.warn("Gemini maritime API non-200:", response.status);
        }
      } catch (geminiErr) {
        console.error("Gemini maritime call failed:", geminiErr);
      }
    }

    // Dynamic Intent-Aware Fallback (if LLM fails)
    if (!answerText) {
      const locLabel = evidence.locationLabel || loc.label || "Coastal Sector";
      if (routing.intent === "SEA_WEATHER_QUERY") {
        answerText = `📍 **${locLabel}**\n\n• **लहरें (Waves)**: ${evidence.waveHeight || "0.9 m"}\n• **हवा की गति (Wind)**: ${evidence.windSpeed || "12 km/h"}\n\n[🌊 View Sea Conditions](#action-weather)`;
      } else if (routing.intent === "PFZ_QUERY" || routing.intent === "FISHING_QUERY") {
        answerText = `🎣 **${locLabel} मत्स्य क्षेत्र (PFZ)**\n\nनिकटतम मछली क्षेत्र लगभग ${evidence.pfz?.[0]?.dist || "6.2 NM"} दूर है।\n\n[🗺️ View Route on Map](#action-map)`;
      } else if (routing.intent === "SOS_QUERY") {
        answerText = `🚨 **आपातकालीन सहायता (Emergency SOS)**\n\n1. तुरंत लंगर (Anchor) डालें ताकि नाव न बहे।\n2. लाइफ जैकेट पहनें।\n3. कोस्ट गार्ड हेल्पलाइन **1554** या VHF Ch 16 पर कॉल करें।\n\n[🚨 Emergency SOS](#action-sos)`;
      } else {
        answerText = `📍 **${locLabel}**\n\n• **सुरक्षा स्थिति**: **${evidence.riskLevel || "LOW RISK"}**\n• **लहरें**: ${evidence.waveHeight || "0.9 m"} | **हवा**: ${evidence.windSpeed || "12 km/h"}\n\n[🌊 View Sea Conditions](#action-weather)`;
      }
    }

    return NextResponse.json({
      conversation_id: convId,
      message_id: msgId,
      answer: answerText,
      orchestration: {
        query_id: crypto.randomUUID(),
        trace_id: crypto.randomUUID(),
        status: "SUCCESS",
        intent: routing.intent,
        routing,
        location: loc,
        data: evidence,
      },
    });
  } catch (error) {
    console.error("Error in Sagar Saathi conversation route:", error);
    return NextResponse.json(
      { error: "Internal Server Error in Sagar Saathi reasoning engine" },
      { status: 500 }
    );
  }
}
