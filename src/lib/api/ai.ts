import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
import type { ExecutionPlan, QueryExtraction, OrchestrationResult } from "@/features/ai/types";

export const extractQuery = (query: string) =>
  apiClient<QueryExtraction>(`${API_V1_PREFIX}/ai/extract-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    timeoutMs: 30_000,
  });

export const planQuery = (query: string) =>
  apiClient<ExecutionPlan>(`${API_V1_PREFIX}/ai/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    timeoutMs: 30_000,
  });

export const executeQuery = (query: string, selected_location?: Record<string, unknown>) =>
  apiClient<OrchestrationResult>(`${API_V1_PREFIX}/ai/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, selected_location }),
    timeoutMs: 60_000,
  });

export interface ConversationHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface SendMessageOptions {
  history?: ConversationHistoryItem[];
  constraints?: Record<string, unknown>;
  live_evidence?: Record<string, unknown>;
  language?: string;
}

export type ConversationReply = {
  conversation_id: string;
  message_id: string;
  answer: string;
  orchestration: OrchestrationResult;
};

export const sendMessage = async (
  query: string,
  selected_location?: Record<string, unknown>,
  conversation_id?: string,
  options?: SendMessageOptions
): Promise<ConversationReply> => {
  const payload = {
    query,
    selected_location,
    conversation_id,
    history: options?.history,
    constraints: options?.constraints,
    live_evidence: options?.live_evidence,
    language: options?.language,
  };

  // Try direct Next.js App Router serverless route first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65_000);
    const res = await fetch("/api/v1/ai/conversations/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      return (await res.json()) as ConversationReply;
    }
  } catch (directErr) {
    console.warn("Direct route fetch notice, using fallback apiClient:", directErr);
  }

  return apiClient<ConversationReply>(`${API_V1_PREFIX}/ai/conversations/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 65_000,
  });
};

