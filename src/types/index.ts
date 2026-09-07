export type RiskLevel = "safe" | "moderate" | "high" | "critical";
export interface MarineConditions { waveHeight: number; windSpeed: number; windDirection: string; seaSurfaceTemperature: number; currentSpeed: number; currentDirection: string; visibility: number; tide: string; nextHighTide: string; }
export interface WeatherConditions { windSpeed: number; direction: string; visibility: number; summary: string; }
export interface OceanConditions { seaSurfaceTemperature: number; waveHeight: number; currentSpeed: number; chlorophyll: number; }
export interface RiskAssessment { score: number; level: RiskLevel; recommendation: string; factors: string[]; }
export interface PFZ { id: string; distance: number; direction: string; travelMinutes: number; confidence: "High" | "Medium" | "Low"; coordinates: [number, number]; }
export interface Evidence { parameter: string; value: string; source: string; updated: string; }
export interface Message { id: string; role: "user" | "orca"; text: string; timestamp: string; }
export interface Conversation { id: string; title: string; date: string; location: string; type: string; risk?: RiskLevel; }
export interface Route { distance: string; duration: string; risk: RiskLevel; exposure: string; restrictedIntersections: number; }
export interface MapLayer { id: string; label: string; enabled: boolean; color: string; }
export interface SavedLocation { name: string; coordinates: string; }
