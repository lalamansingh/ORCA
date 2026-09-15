'use client';

import React, { useState } from 'react';
import { useSOSStore } from '@/features/sos/sos-store';
import { useEmergencyAlerts } from '@/features/hazards/hooks/use-emergency-alerts';
import { Hazard } from '@/features/hazards/types';
import { Volume2, Radio, Wind, AlertTriangle, RefreshCw, Send, CheckCircle2, Wifi, WifiOff, ChevronUp, ChevronDown } from 'lucide-react';

interface DemoSimulatorBarProps {
  onShowOnboarding?: () => void;
  selectedLang?: string;
}

export const DemoSimulatorBar: React.FC<DemoSimulatorBarProps> = ({
  onShowOnboarding,
  selectedLang = "hi",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [simulatedActionMessage, setSimulatedActionMessage] = useState<string | null>(null);

  const {
    state: sosState,
    triggerDistress,
    manualCancel,
    pendingQueueCount,
    lastSentReport
  } = useSOSStore();

  const emergencyAlerts = useEmergencyAlerts({
    latitude: 17.68,
    longitude: 83.21,
    label: "Visakhapatnam Harbor"
  });

  const showNotification = (msg: string) => {
    setSimulatedActionMessage(msg);
    setTimeout(() => setSimulatedActionMessage(null), 3500);
  };

  const simulateHardwareTriplePress = () => {
    showNotification('⚡ Simulated: 3x Volume-Down Hardware Key Press Detected');
    triggerDistress('hardware_key');
  };

  const simulateCycloneBroadcast = async () => {
    showNotification('🚨 Simulating Authority Cyclone Hazard Broadcast to your Vessel');
    const cycloneHazard: Partial<Hazard> = {
      type: 'CYCLONE',
      title: 'Very Severe Cyclonic Storm "ASANI" Warning',
      headline: 'Wind speeds exceeding 65 knots with squalls up to 85 knots.',
      description: 'Extremely rough sea conditions. Immediate shelter in closest harbour mandated by IMD / INCOIS.',
      severity: 'critical',
      source_provider: 'INCOIS / IMD Marine Safety Unit',
      affected_zone: {
        zone_id: `zone_sim_${Date.now()}`,
        hazard_type: 'CYCLONE',
        severity: 'critical',
        center_lat: 17.68,
        center_lon: 83.21,
        radius_km: 40,
        safety_buffer_km: 10
      },
      recommended_action: 'Mandatory Immediate Evacuation to Safe Port. Suspend all trawling operations.'
    };

    try {
      await fetch('/api/v1/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycloneHazard)
      });
      await emergencyAlerts.refreshHazards();
    } catch (e) {
      console.warn("Failed to broadcast simulated hazard:", e);
    }
  };

  const simulateHighWavesBroadcast = async () => {
    showNotification('🌊 Simulating High Wave & Surge Swell Warning');
    const waveHazard: Partial<Hazard> = {
      type: 'HIGH_WAVES',
      title: 'INCOIS High Wave & Rogue Swell Alert (4.8m - 6.2m)',
      headline: 'Surge waves accompanied by high spring tides along the shelf break.',
      description: 'Small mechanized boats at high capsizing risk.',
      severity: 'severe',
      source_provider: 'INCOIS Ocean State Forecast',
      affected_zone: {
        zone_id: `zone_sim_wave_${Date.now()}`,
        hazard_type: 'HIGH_WAVES',
        severity: 'severe',
        center_lat: 17.68,
        center_lon: 83.21,
        radius_km: 30,
        safety_buffer_km: 8
      },
      recommended_action: 'Steer vessel bow directly into swells at 4-6 knots. Avoid beam-on drift.'
    };

    try {
      await fetch('/api/v1/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waveHazard)
      });
      await emergencyAlerts.refreshHazards();
    } catch (e) {
      console.warn("Failed to broadcast simulated wave alert:", e);
    }
  };

  const simulateOfflineToggle = () => {
    const next = !isSimulatingOffline;
    setIsSimulatingOffline(next);
    showNotification(next ? '📡 Network toggled to OFFLINE (SOS will queue in IndexedDB & use Peer Relay)' : '📶 Network restored to ONLINE (Auto-syncing pending emergency queues)');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(next ? 'offline' : 'online'));
    }
  };

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-amber-500/30 bg-slate-900/90 shadow-md">
      {/* Toggle pill bar */}
      <div className="flex items-center justify-between bg-slate-950/90 border-b border-amber-500/20 text-white px-3.5 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300">
            ISRO PS 26176 DEMO SIMULATOR
          </span>
          <span className="text-[9.5px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
            State: <strong className="text-cyan-300">{sosState}</strong>
          </span>
          {pendingQueueCount > 0 && (
            <span className="text-[9.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
              Queue: {pendingQueueCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onShowOnboarding && (
            <button
              onClick={onShowOnboarding}
              className="text-[10px] text-slate-400 hover:text-white underline underline-offset-2 transition-colors mr-1"
            >
              Setup
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-2 py-1 rounded transition-colors font-medium"
          >
            <span>{isOpen ? 'Hide Scenarios' : 'Test Scenarios'}</span>
            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {simulatedActionMessage && (
        <div className="bg-cyan-950/90 border-b border-cyan-500/40 text-cyan-200 text-xs px-3.5 py-2 font-medium flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{simulatedActionMessage}</span>
        </div>
      )}

      {/* Expanded simulation control drawer */}
      {isOpen && (
        <div className="p-3.5 space-y-3 text-white">
          <div className="grid grid-cols-2 gap-2">
            {/* Trigger 1: Hardware key simulation */}
            <button
              onClick={simulateHardwareTriplePress}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold mb-1">
                <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>3x Vol-Down SOS</span>
              </div>
              <span className="text-[10px] text-slate-400 text-center leading-tight">
                Simulates triple hardware click (F1 / Alt+V)
              </span>
            </button>

            {/* Trigger 2: Cyclone Hazard Simulation */}
            <button
              onClick={simulateCycloneBroadcast}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 hover:border-amber-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <Wind className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Cyclone Warning</span>
              </div>
              <span className="text-[10px] text-slate-400 text-center leading-tight">
                Triggers full-screen marine alarm overlay
              </span>
            </button>

            {/* Trigger 3: High Wave Warning */}
            <button
              onClick={simulateHighWavesBroadcast}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/40 hover:border-blue-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-1">
                <AlertTriangle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>High Wave Alert</span>
              </div>
              <span className="text-[10px] text-slate-400 text-center leading-tight">
                Simulates INCOIS 5m+ surge hazard
              </span>
            </button>

            {/* Trigger 4: Offline Toggle Simulation */}
            <button
              onClick={simulateOfflineToggle}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all text-left group ${
                isSimulatingOffline
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                {isSimulatingOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isSimulatingOffline ? 'Mode: Offline' : 'Mode: Online'}</span>
              </div>
              <span className="text-[10px] text-slate-400 text-center leading-tight">
                {isSimulatingOffline ? 'Queueing in IndexedDB' : 'Direct cellular/satellite'}
              </span>
            </button>
          </div>

          {/* Quick status & reset bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              {lastSentReport ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Last SOS: {lastSentReport.sos_id.slice(-6)} ({lastSentReport.status})
                </span>
              ) : (
                <span>No active SOS transmitted</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sosState !== 'IDLE' && (
                <button
                  onClick={manualCancel}
                  className="text-red-400 hover:text-red-300 font-semibold underline text-[11px]"
                >
                  Reset SOS
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
