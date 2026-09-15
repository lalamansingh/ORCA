"use client";

import { MarineSafetyCommandCenter } from "@/components/authority/marine-safety-command-center";
import { PageHeader } from "@/components/ui";

export default function SOSCommandCenterPage() {
  return (
    <div className="page sos-command-page space-y-6">
      <MarineSafetyCommandCenter />
    </div>
  );
}
