/**
 * Outbound Hazard Alert Broadcaster & Delivery Tracker
 * Correlates Risk Assessment Agent hazards with user GPS coordinates.
 */

import { Hazard, HazardAlertDelivery, UserLocationRecord } from "./types";
import { GeofenceMatcher } from "./geofence-matcher";

export class HazardAlertBroadcaster {
  private static userLocations: Map<string, UserLocationRecord> = new Map();
  private static activeHazards: Hazard[] = [
    {
      hazard_id: "haz-mumbai-high-waves",
      type: "HIGH_WAVES",
      title: "HIGH WAVE & SWELL SURGE WARNING",
      severity: "severe",
      headline: "Dangerous wave heights (3.2m - 3.8m) detected along Coastal Maharashtra.",
      description: "Severe swell surge and rough breaking waves observed. Small motorized craft and fiber boats are advised to return immediately to harbor.",
      recommended_action: "Return toward the nearest safe harbor. Avoid moving farther offshore into shipping channels.",
      issued_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      source_provider: "INCOIS / ORCA RISK AGENT",
      is_active: true,
      metrics: {
        wave_height_m: 3.4,
        wind_speed_kmh: 42,
        gust_kmh: 58,
      },
      affected_zone: {
        zone_id: "zone-mumbai-shelf",
        hazard_type: "HIGH_WAVES",
        severity: "severe",
        center_lat: 18.95,
        center_lon: 72.82,
        radius_km: 45,
        safety_buffer_km: 8,
      },
    },
    {
      hazard_id: "haz-gujarat-extreme-wind",
      type: "EXTREME_WIND",
      title: "GALE FORCE WIND ADVISORY",
      severity: "warning",
      headline: "Squally wind speeds reaching 45–55 km/h with gusts up to 65 km/h.",
      description: "Deep pressure gradient over Arabian Sea causing high turbulence.",
      recommended_action: "Reduce cruising speed. Secure fishing nets and heavy gear on deck.",
      issued_at: new Date(Date.now() - 7200000).toISOString(),
      expires_at: new Date(Date.now() + 43200000).toISOString(),
      source_provider: "IMD / INCOIS",
      is_active: true,
      metrics: {
        wind_speed_kmh: 52,
        gust_kmh: 66,
      },
      affected_zone: {
        zone_id: "zone-porbandar-coast",
        hazard_type: "EXTREME_WIND",
        severity: "warning",
        center_lat: 21.64,
        center_lon: 69.60,
        radius_km: 60,
        safety_buffer_km: 10,
      },
    },
  ];

  private static deliveries: Map<string, HazardAlertDelivery> = new Map();

  /**
   * Register or update a user's latest known coordinate
   */
  public static updateUserLocation(record: UserLocationRecord): void {
    this.userLocations.set(record.user_id, {
      ...record,
      updated_at: new Date().toISOString(),
      is_stale: false,
    });
  }

  public static getActiveHazards(): Hazard[] {
    return this.activeHazards.filter((h) => h.is_active);
  }

  public static addHazard(hazard: Hazard): void {
    this.activeHazards.unshift(hazard);
  }

  /**
   * Evaluate which active hazards impact a specific GPS coordinate
   */
  public static matchHazardsForCoordinate(lat: number, lon: number): Hazard[] {
    const active = this.getActiveHazards();
    const matches: Hazard[] = [];

    for (const hazard of active) {
      const match = GeofenceMatcher.evaluateGeofence(lat, lon, hazard.affected_zone);
      if (match.is_within_buffer) {
        matches.push(hazard);
      }
    }

    return matches;
  }

  /**
   * Run the hazard match pipeline for all registered users
   */
  public static broadcastHazard(hazardId: string): { matchedUsers: string[]; alertCount: number } {
    const hazard = this.activeHazards.find((h) => h.hazard_id === hazardId);
    if (!hazard) return { matchedUsers: [], alertCount: 0 };

    const matchedUsers: string[] = [];

    this.userLocations.forEach((userLoc, userId) => {
      const match = GeofenceMatcher.evaluateGeofence(
        userLoc.latitude,
        userLoc.longitude,
        hazard.affected_zone
      );

      if (match.is_within_buffer) {
        matchedUsers.push(userId);
        const deliveryId = `del-${hazard.hazard_id}-${userId}`;
        this.deliveries.set(deliveryId, {
          alert_id: deliveryId,
          hazard_id: hazard.hazard_id,
          user_id: userId,
          sent_at: new Date().toISOString(),
          status: "sent",
        });
      }
    });

    console.log(`[HAZARD] hazard_id=${hazardId} matched_users=${matchedUsers.length}`);
    return { matchedUsers, alertCount: matchedUsers.length };
  }

  /**
   * Record user acknowledgment or response
   */
  public static recordResponse(
    hazardId: string,
    userId: string,
    response: "SAFE" | "NEED_HELP" | "VIEWED_ROUTE" | "DISMISSED"
  ): void {
    const deliveryId = `del-${hazardId}-${userId}`;
    const existing = this.deliveries.get(deliveryId) || {
      alert_id: deliveryId,
      hazard_id: hazardId,
      user_id: userId,
      sent_at: new Date().toISOString(),
      status: "delivered",
    };

    existing.response = response;
    existing.response_at = new Date().toISOString();
    existing.status = "acknowledged";
    this.deliveries.set(deliveryId, existing);

    console.log(`[HAZARD] response_recorded user=${userId} hazard=${hazardId} response=${response}`);
  }
}
