/**
 * Geospatial Geofence Matcher
 * Uses Ray-casting Point-in-Polygon & Haversine Distance
 * to match active hazard polygons with vessel GPS coordinates.
 */

import { HazardZone, GeofenceMatchResult } from "./types";

export class GeofenceMatcher {
  /**
   * Calculate distance in kilometers between two GPS coordinates using Haversine formula
   */
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Ray-casting algorithm to test if a GPS point is inside a polygon
   */
  public static isPointInPolygon(
    lat: number,
    lon: number,
    polygonCoordinates: number[][]
  ): boolean {
    let inside = false;
    for (
      let i = 0, j = polygonCoordinates.length - 1;
      i < polygonCoordinates.length;
      j = i++
    ) {
      const xi = polygonCoordinates[i][0]; // lon
      const yi = polygonCoordinates[i][1]; // lat
      const xj = polygonCoordinates[j][0];
      const yj = polygonCoordinates[j][1];

      const intersect =
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Evaluates whether a user coordinate falls within a hazard zone (or safety buffer)
   */
  public static evaluateGeofence(
    userLat: number,
    userLon: number,
    zone: HazardZone
  ): GeofenceMatchResult {
    // 1. If polygon boundary provided, check Ray-casting
    if (zone.boundary && zone.boundary.coordinates.length > 0) {
      const ring = (zone.boundary.coordinates[0] as unknown) as number[][];
      const isInside = this.isPointInPolygon(userLat, userLon, ring);
      const centerDist = this.calculateDistanceKm(
        userLat,
        userLon,
        zone.center_lat,
        zone.center_lon
      );

      const bufferKm = zone.safety_buffer_km || 5;
      const isWithinBuffer = isInside || centerDist <= (zone.radius_km || 20) + bufferKm;

      return {
        is_inside: isInside,
        distance_km: Math.round(centerDist * 10) / 10,
        is_within_buffer: isWithinBuffer,
        hazard_id: zone.zone_id,
      };
    }

    // 2. Circular zone fallback with center coordinate and radius
    const dist = this.calculateDistanceKm(
      userLat,
      userLon,
      zone.center_lat,
      zone.center_lon
    );
    const radius = zone.radius_km || 25;
    const buffer = zone.safety_buffer_km || 5;

    const isInside = dist <= radius;
    const isWithinBuffer = dist <= radius + buffer;

    return {
      is_inside: isInside,
      distance_km: Math.round(dist * 10) / 10,
      is_within_buffer: isWithinBuffer,
      hazard_id: zone.zone_id,
    };
  }
}
