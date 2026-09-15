/**
 * Persistent Offline SOS Queue
 * Ensures distress reports captured at sea are never lost when offline.
 * Automatically retries transmission upon connectivity restoration.
 */

import { OfflineQueueItem, SOSReport } from "./types";

const QUEUE_STORAGE_KEY = "orca_pending_sos_reports_v1";
const COOLDOWN_MS = 45000; // 45s cooldown against accidental duplicate floods

export class OfflineSOSQueue {
  private static lastSubmittedTimestamp: number = 0;
  private static lastSubmittedCoordinates: { lat: number; lon: number } | null = null;

  /**
   * Check if recent identical SOS was submitted within cooldown window
   */
  public static isDuplicateSuppressed(lat: number, lon: number): boolean {
    const now = Date.now();
    if (this.lastSubmittedCoordinates && now - this.lastSubmittedTimestamp < COOLDOWN_MS) {
      const dLat = Math.abs(this.lastSubmittedCoordinates.lat - lat);
      const dLon = Math.abs(this.lastSubmittedCoordinates.lon - lon);
      // If within ~50 meters and under cooldown
      if (dLat < 0.0005 && dLon < 0.0005) {
        return true;
      }
    }
    return false;
  }

  /**
   * Register successful submission timestamp for cooldown
   */
  public static recordSubmission(lat: number, lon: number): void {
    this.lastSubmittedTimestamp = Date.now();
    this.lastSubmittedCoordinates = { lat, lon };
  }

  /**
   * Retrieve all pending queued items from local storage
   */
  public static getQueue(): OfflineQueueItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as OfflineQueueItem[];
    } catch (e) {
      console.error("[SOS] Failed to read offline queue from storage:", e);
      return [];
    }
  }

  /**
   * Count pending items in queue
   */
  public static getQueueLength(): number {
    return this.getQueue().length;
  }

  /**
   * Enqueue a distress report for offline delivery
   */
  public static enqueue(report: SOSReport): OfflineQueueItem {
    const queue = this.getQueue();
    // Check if sos_id already queued
    const existingIndex = queue.findIndex((item) => item.sos_id === report.sos_id);
    const item: OfflineQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sos_id: report.sos_id,
      payload: report,
      created_at: new Date().toISOString(),
      retry_count: existingIndex >= 0 ? queue[existingIndex].retry_count + 1 : 0,
      delivery_status: "pending",
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = item;
    } else {
      queue.push(item);
    }

    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      console.log(`[SOS] delivery=offline_queue sos_id=${report.sos_id} queue_size=${queue.length}`);
    } catch (e) {
      console.error("[SOS] Failed to persist offline SOS item:", e);
    }
    return item;
  }

  /**
   * Remove delivered item from queue
   */
  public static remove(sos_id: string): void {
    const queue = this.getQueue().filter((item) => item.sos_id !== sos_id);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      console.log(`[SOS] delivery=direct_confirmed_removed sos_id=${sos_id}`);
    } catch (e) {
      console.error("[SOS] Failed to update offline queue:", e);
    }
  }

  /**
   * Process all queued items by attempting transmission to backend API
   */
  public static async processQueue(
    sendFn: (report: SOSReport) => Promise<boolean>
  ): Promise<{ delivered: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { delivered: 0, failed: 0 };

    let delivered = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        console.log(`[SOS] Attempting auto-retry for queued SOS ${item.sos_id} (retry #${item.retry_count})`);
        const success = await sendFn(item.payload);
        if (success) {
          this.remove(item.sos_id);
          delivered++;
        } else {
          item.retry_count += 1;
          item.last_attempt = new Date().toISOString();
          failed++;
        }
      } catch (err) {
        console.warn(`[SOS] Auto-retry failed for SOS ${item.sos_id}:`, err);
        item.retry_count += 1;
        failed++;
      }
    }

    return { delivered, failed };
  }
}
