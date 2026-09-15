"use client";

import { MarineSafetyCommandCenter } from "@/components/authority/marine-safety-command-center";
import { DemoSimulatorBar } from "@/components/sos/demo-simulator-bar";

export default function SOSCommandCenterPage() {
  return (
    <div className="page sos-command-page space-y-6">
      <DemoSimulatorBar />
      <MarineSafetyCommandCenter />
    </div>
  );
}
