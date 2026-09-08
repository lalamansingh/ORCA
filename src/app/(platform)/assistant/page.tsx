"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, LoaderCircle, MapPin, Send, Sparkles } from "lucide-react";
import { MarineMap } from "@/components/marine-map";
import { PageHeader } from "@/components/ui";
import { EvidenceFacts, ServiceFacts } from "@/components/evidence-facts";
import { sendMessage, type ConversationReply } from "@/lib/api/ai";
import { publishSelectedLocation, useSharedSelectedLocation } from "@/features/map/location-store";
import { VoiceMic, VoiceSpeaker } from "@/components/voice-mic";
import "../demo-polish.css";

export default function AssistantPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ query: string; reply: ConversationReply }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useSharedSelectedLocation();

  const handleQuery = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const text = textToSend.trim();
      const locToSend = location
        ? { latitude: location.latitude, longitude: location.longitude }
        : { latitude: 18.92, longitude: 72.83 };
      const reply = await sendMessage(
        text,
        locToSend,
        messages.at(-1)?.reply.conversation_id
      );
      setMessages((items) => [...items, { query: text, reply }]);
      setQuery("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistant is unavailable. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) {
      void handleQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await handleQuery(query);
  };

  return (
    <div className="page assistant-page">
      <PageHeader
        eyebrow="INTELLIGENT MARINE ASSISTANT · MULTILINGUAL"
        title="Ask ORCA (Ocean AI)"
        subtitle="Natural language questions, real-time satellite reasoning, deterministic safety rules, and source evidence."
      />
      <div className="assistant-layout">
        <section className="chat-panel">
          <div className="chat-welcome">
            <span>
              <Bot size={20} />
            </span>
            <h2>How can ORCA assist your voyage today?</h2>
            <p>
              Ask in <b>English, Hindi, or Hinglish</b> about potential fishing zones, wave hazards, weather forecasts, or maritime restrictions.
            </p>
          </div>

          <div className="prompt-row">
            {[
              "Show nearest PFZ and check safety",
              "Kya samundar me jaana safe hai?",
              "Assess current marine risk & waves",
              "Show live AIS vessel traffic",
              "Show SST and chlorophyll layers",
              "Check coastal weather and alerts",
            ].map((text) => (
              <button className="map-control" key={text} onClick={() => void handleQuery(text)}>
                <Sparkles size={13} style={{ color: "#38bdf8" }} />
                {text}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {messages.map(({ query: question, reply }) => (
              <article className="assistant-result" key={reply.message_id}>
                <p className="question-text">{question}</p>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", background: "rgba(15, 23, 42, 0.6)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "13.5px", color: "#f8fafc", flex: 1 }}>
                    {reply.answer}
                  </div>
                  <VoiceSpeaker text={reply.answer} />
                </div>
                <p className="result-warning" style={{ marginTop: "10px" }}>
                  {JSON.stringify(reply.orchestration.data).match(/demo|fixture/i)
                    ? "DEMO / MIXED DATA — includes prototype fixtures. Check source evidence."
                    : "Real-time validated evidence from connected marine sources."}
                </p>
                <strong className="result-status">{reply.orchestration.status.replaceAll("_", " ")}</strong>
                {reply.orchestration.warnings.map((warning, index) => (
                  <p role="alert" className="result-warning" key={index}>
                    {warning}
                  </p>
                ))}
                {Object.entries(reply.orchestration.data).map(([name, facts]) => (
                  <ServiceFacts key={name} name={name} value={facts} />
                ))}
                {reply.orchestration.errors.length > 0 && (
                  <div role="alert">
                    <h4>Some data could not be checked</h4>
                    <EvidenceFacts value={reply.orchestration.errors} />
                  </div>
                )}
                <details className="conditions-evidence">
                  <summary>Source evidence · {reply.orchestration.evidence.length} records</summary>
                  <EvidenceFacts value={reply.orchestration.evidence} />
                </details>
                <details className="agent-activity">
                  <summary>Completed agent activity</summary>
                  <ol>
                    {reply.orchestration.step_results.map((step) => (
                      <li key={step.step_id}>
                        {step.agent} · {step.status}
                      </li>
                    ))}
                  </ol>
                </details>
              </article>
            ))}
          </div>

          {loading && (
            <p role="status">
              <LoaderCircle className="spin" size={16} /> Reasoning with collaborative marine agents…
            </p>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <form className="assistant-input" onSubmit={submit}>
            <VoiceMic onTranscript={(text) => setQuery(text)} disabled={loading} />
            <input
              aria-label="Marine query"
              maxLength={4000}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask in English or Hindi (or click the Mic to speak)..."
            />
            <button disabled={loading || !query.trim()} aria-label="Send query">
              {loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
            </button>
          </form>
        </section>

        <aside className="context-panel">
          <div className="context-title">
            <div>
              <p className="eyebrow">SELECTED LOCATION</p>
              <h3>{location?.label ?? "Choose a coastal location"}</h3>
            </div>
            <MapPin size={19} />
          </div>
          <MarineMap selectedLocation={location} showDemoFeatures={false} selectMode onSelectLocation={publishSelectedLocation} />
          <div className="context-facts">
            <p>
              {location
                ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                : "Select a point on the marine map or pick a coastal sector:"}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "8px 0" }}>
              {[
                { name: "Chennai (Bay of Bengal)", lat: 13.08, lon: 80.27 },
                { name: "Mumbai (Arabian Sea)", lat: 18.92, lon: 72.83 },
                { name: "Porbandar (Gujarat)", lat: 21.64, lon: 69.60 },
                { name: "Kochi (Kerala)", lat: 9.93, lon: 76.26 },
                { name: "Vizag (Andhra)", lat: 17.68, lon: 83.21 },
              ].map((loc) => (
                <button
                  key={loc.name}
                  className="map-control"
                  style={{ fontSize: "11px", padding: "3px 8px" }}
                  onClick={() =>
                    publishSelectedLocation({
                      latitude: loc.lat,
                      longitude: loc.lon,
                      source: "default",
                      label: `${loc.name} Sector`,
                    })
                  }
                >
                  📍 {loc.name}
                </button>
              ))}
            </div>

            <Link href="/map">Open full satellite map & layers</Link>
            <p>
              Risk is computed deterministically by ORCA rules. LOW is not a guarantee of safety. Always observe official port clearances.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
