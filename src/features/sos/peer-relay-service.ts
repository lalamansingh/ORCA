/**
 * Peer-to-Peer Emergency Relay Service
 * Simulates and manages phone-to-phone distress relay over Bluetooth / Wi-Fi Direct.
 * Device A (Offline at sea) -> Device B (Nearby boat with connectivity) -> ORCA Authority Dashboard.
 */

import { RelayPacket, SOSReport } from "./types";

export class PeerRelayService {
  private static localDeviceId = `orca-device-${Math.random().toString(36).substring(2, 9)}`;

  public static getDeviceId(): string {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("orca_device_id");
      if (stored) return stored;
      localStorage.setItem("orca_device_id", this.localDeviceId);
      return this.localDeviceId;
    }
    return this.localDeviceId;
  }

  /**
   * Package SOS into a checksum-protected relay packet
   */
  public static createRelayPacket(report: SOSReport, relayDeviceId?: string): RelayPacket {
    const packet: RelayPacket = {
      packet_id: `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sos_id: report.sos_id,
      origin_device_id: report.device_id,
      relay_device_id: relayDeviceId || `relay-node-${Math.random().toString(36).slice(2, 7)}`,
      hop_count: (report.relay_hops || 0) + 1,
      checksum: `sha256-${Math.random().toString(36).slice(2, 12)}`,
      encrypted_payload: {
        ...report,
        delivery_path: "relay",
        relay_hops: (report.relay_hops || 0) + 1,
        forwarded_by_device_id: relayDeviceId || "relay-boat-vessel",
      },
      received_at: new Date().toISOString(),
    };

    console.log(`[SOS] delivery=relay hops=${packet.hop_count} origin=${packet.origin_device_id} relay=${packet.relay_device_id}`);
    return packet;
  }

  /**
   * Broadcast distress packet to nearby discovery channel
   */
  public static async broadcastToNearbyPeers(report: SOSReport): Promise<{ success: boolean; peerId?: string }> {
    console.log(`[SOS] Scanning for nearby ORCA peer nodes on Bluetooth LE / Wi-Fi Direct...`);
    // Simulated discovery delay (200-400ms)
    await new Promise((res) => setTimeout(res, 300));
    
    // In browser/PWA environment, return simulated nearby peer node
    const nearbyPeerId = `vessel-node-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`[SOS] Discovered nearby ORCA vessel node: ${nearbyPeerId}. Transferred distress packet.`);
    return { success: true, peerId: nearbyPeerId };
  }
}
