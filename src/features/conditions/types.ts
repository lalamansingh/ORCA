export type DataFreshness = "CURRENT" | "RECENT" | "STALE" | "UNAVAILABLE";
export interface Measurement { value:number; unit:string }
export interface Coordinates { latitude:number; longitude:number }
export interface DataSource { provider:string; dataset:string; source_url:string|null; provider_location:Coordinates|null }
export interface EvidenceItem { parameter:string; value:number; unit:string; source:string; source_url:string|null; observed_at:string|null; retrieved_at:string; freshness:DataFreshness; confidence:string|null; quality_flag:string|null }
export interface WeatherConditions { observed_at:string; temperature:Measurement|null; apparent_temperature:Measurement|null; humidity:Measurement|null; precipitation:Measurement|null; rain:Measurement|null; visibility:Measurement|null; wind_speed:Measurement|null; wind_direction:Measurement|null; wind_gust:Measurement|null; weather_code:number|null; weather_description:string|null; cloud_cover:Measurement|null; pressure:Measurement|null }
export type WeatherForecastPoint = WeatherConditions;
export interface WeatherResponse { location:Coordinates; current:WeatherConditions|null; hourly:WeatherForecastPoint[]; timezone:string; source:DataSource; retrieved_at:string; freshness:DataFreshness; evidence:EvidenceItem[] }
export interface MarineConditions { observed_at:string; wave_height:Measurement|null; wave_direction:Measurement|null; wave_period:Measurement|null; wave_peak_period:Measurement|null; wind_wave_height:Measurement|null; wind_wave_direction:Measurement|null; wind_wave_period:Measurement|null; swell_height:Measurement|null; swell_direction:Measurement|null; swell_period:Measurement|null; sea_surface_temperature:Measurement|null; ocean_current_speed:Measurement|null; ocean_current_direction:Measurement|null; sea_level_height:Measurement|null }
export type MarineForecastPoint = MarineConditions;
export interface MarineDailySummary { date:string; wave_height_max:Measurement|null; wave_direction_dominant:Measurement|null; wave_period_max:Measurement|null; swell_height_max:Measurement|null }
export interface MarineResponse { location:Coordinates; current:MarineConditions|null; hourly:MarineForecastPoint[]; daily:MarineDailySummary[]; timezone:string; source:DataSource; retrieved_at:string; freshness:DataFreshness; evidence:EvidenceItem[]; limitations:string[] }
export interface CombinedConditions { location:Coordinates; weather:WeatherResponse|null; marine:MarineResponse|null; sources:DataSource[]; retrieved_at:string; status:"complete"|"partial"|"unavailable"; errors:Record<string,string> }
