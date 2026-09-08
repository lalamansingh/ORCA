"use client";
import { Droplets, Satellite, Thermometer } from "lucide-react";
import type { OceanSampleResponse } from "@/features/ocean-products/types";
import { DataFreshnessBadge } from "@/components/ui";

export function OceanProductivityCard({ data, error }: { data: OceanSampleResponse | null; error: string | null }) {
  const sst = data?.samples.sst;
  const chl = data?.samples.chlorophyll;
  return (
    <section className="chart-card">
      <div className="chart-head">
        <div>
          <p className="card-label">SATELLITE OCEAN OBSERVATIONS</p>
          <h3>Copernicus & Sentinel-3 Context</h3>
        </div>
        <DataFreshnessBadge>Copernicus Live</DataFreshnessBadge>
      </div>
      {error ? (
        <p>Satellite ocean-product service unavailable. Check network connectivity.</p>
      ) : !data ? (
        <p>Select a marine location to sample Sentinel-3 satellite observations.</p>
      ) : (
        <div className="pfz-stats">
          <div>
            <Thermometer size={15} />
            <strong>{sst?.value != null ? `${sst.value} ${sst.unit}` : "No data"}</strong>
            <span>Sea Surface Temp (SST)</span>
          </div>
          <div>
            <Droplets size={15} />
            <strong>{chl?.value != null ? `${chl.value} ${chl.unit}` : "No data"}</strong>
            <span>Chlorophyll-a Biomass</span>
          </div>
          <div>
            <Satellite size={15} />
            <strong>{chl?.quality ?? "GOOD"}</strong>
            <span>Satellite Quality</span>
          </div>
        </div>
      )}
      <p>Chlorophyll-a indicates phytoplankton biomass; it is not a fish-availability prediction.</p>
    </section>
  );
}

