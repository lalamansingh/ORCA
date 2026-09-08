import {apiClient} from "@/lib/api/client";
import {API_V1_PREFIX} from "@/lib/api/config";
import type {ExecutionPlan,QueryExtraction,OrchestrationResult} from "@/features/ai/types";
export const extractQuery=(query:string)=>apiClient<QueryExtraction>(`${API_V1_PREFIX}/ai/extract-query`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),timeoutMs:30_000});
export const planQuery=(query:string)=>apiClient<ExecutionPlan>(`${API_V1_PREFIX}/ai/plan`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query}),timeoutMs:30_000});
export const executeQuery=(query:string,selected_location?:Record<string,unknown>)=>apiClient<OrchestrationResult>(`${API_V1_PREFIX}/ai/execute`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query,selected_location}),timeoutMs:60_000});

export type ConversationReply = {conversation_id:string;message_id:string;answer:string;orchestration:OrchestrationResult};
export const sendMessage=(query:string,selected_location?:Record<string,unknown>,conversation_id?:string)=>apiClient<ConversationReply>(`${API_V1_PREFIX}/ai/conversations/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query,selected_location,conversation_id}),timeoutMs:65_000});
