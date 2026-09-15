'use client';

import React, { useState, useEffect } from 'react';
import { SOSReport, DistressResolution, SOSStatus } from '@/features/sos/types';
import { Hazard, HazardType, HazardSeverity } from '@/features/hazards/types';
import { SOSIncidentDrawer } from './sos-incident-drawer';
import {
  ShieldAlert,
  Radio,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Send,
  MapPin,
  Clock,
  Compass,
  Volume2,
  ChevronRight,
  Activity,
  Layers,
  Wind
} from 'lucide-react';

export const MarineSafetyCommandCenter: React.FC = () => {
  const [reports, setReports] = useState<SOSReport[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SOSReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBroadcastingHazard, setIsBroadcastingHazard] = useState(false);

  // New Hazard Form state
  const [newHazardType, setNewHazardType] = useState<HazardType>('CYCLONE');
  const [newHazardTitle, setNewHazardTitle] = useState('');
  const [newHazardSeverity, setNewHazardSeverity] = useState<HazardSeverity>('critical');
  const [newHazardDescription, setNewHazardDescription] = useState('');
  const [newHazardAction, setNewHazardAction] = useState('');

  const fetchCommandData = async () => {
    try {
      setIsLoading(true);
      const [sosRes, hazardRes] = await Promise.all([
        fetch('/api/v1/sos').then((r) => r.json()),
        fetch('/api/v1/hazards').then((r) => r.json())
      ]);

      if (sosRes.success && Array.isArray(sosRes.reports)) {
        setReports(sosRes.reports);
      }
      if (hazardRes.success && Array.isArray(hazardRes.hazards)) {
        setHazards(hazardRes.hazards);
      }
    } catch (err) {
      console.error('Failed to fetch command center data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandData();
    const interval = setInterval(fetchCommandData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (reportId: string, note?: string) => {
    try {
      const res = await fetch(`/api/v1/sos/${reportId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorityId: 'ICG_MRCC_VIZAG',
          note: note || 'Distress acknowledged by Maritime Rescue Coordination Centre'
        })
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r.sos_id === reportId ? data.report : r))
        );
        if (selectedReport?.sos_id === reportId) {
          setSelectedReport(data.report);
        }
      }
    } catch (err) {
      console.error('Failed to acknowledge distress:', err);
    }
  };

  const handleUpdateStatus = async (
    reportId: string,
    status: SOSStatus,
    resolution?: DistressResolution
  ) => {
    try {
      const res = await fetch(`/api/v1/sos/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolution,
          updatedBy: 'MRCC Officer'
        })
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r.sos_id === reportId ? data.report : r))
        );
        if (selectedReport?.sos_id === reportId) {
          setSelectedReport(data.report);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleBroadcastNewHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHazardTitle) return;

    try {
      const payload: Partial<Hazard> = {
        type: newHazardType,
        title: newHazardTitle,
        headline: newHazardTitle,
        description: newHazardDescription || 'Marine danger warning issued by Maritime Safety Authority.',
        severity: newHazardSeverity,
        source_provider: 'Indian Coast Guard / INCOIS Joint Advisory',
        affected_zone: {
          zone_id: `zone_${Date.now()}`,
          hazard_type: newHazardType,
          severity: newHazardSeverity,
          center_lat: 17.65,
          center_lon: 83.35,
          radius_km: 25,
          safety_buffer_km: 5
        },
        recommended_action: newHazardAction || 'Steer directly away from coordinates toward harbour shelter.'
      };

      const res = await fetch('/api/v1/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setHazards((prev) => [data.hazard, ...prev]);
        setIsBroadcastingHazard(false);
        setNewHazardTitle('');
        setNewHazardDescription('');
        setNewHazardAction('');
      }
    } catch (err) {
      console.error('Failed to broadcast hazard:', err);
    }
  };

  // Filter calculations
  const filteredReports = reports.filter((r) => {
    // Status filter
    if (statusFilter === 'new' && r.status !== 'NEW') return false;
    if (statusFilter === 'in_progress' && r.status !== 'ACKNOWLEDGED' && r.status !== 'RESPONDING') return false;
    if (statusFilter === 'resolved' && r.status !== 'RESOLVED' && r.status !== 'CANCELLED') return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchVessel = (r.reporter_name || '').toLowerCase().includes(q);
      const matchId = (r.sos_id || '').toLowerCase().includes(q);
      const matchDev = (r.device_id || '').toLowerCase().includes(q);
      const matchVoice = (r.transcript || '').toLowerCase().includes(q);
      return matchVessel || matchId || matchDev || matchVoice;
    }

    return true;
  });

  const countNew = reports.filter((r) => r.status === 'NEW').length;
  const countInProgress = reports.filter((r) => r.status === 'ACKNOWLEDGED' || r.status === 'RESPONDING').length;
  const countResolved = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                ISRO PS 26176 / SIH 2026
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MRCC Command Console
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-red-500" />
              Marine Safety & Distress Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time Inbound Distress SOS triage, Voice Speech-to-Text intelligence, vessel telemetry, and Outbound Geofenced Hazard Broadcast dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchCommandData}
              disabled={isLoading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsBroadcastingHazard(!isBroadcastingHazard)}
              className="py-2.5 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-red-900/40 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Wind className="w-4 h-4" />
              <span>Broadcast Hazard Alert</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-red-500/30 p-4 rounded-xl">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
              🔴 Active New SOS
            </span>
            <div className="text-2xl font-black text-white mt-1 flex items-center justify-between">
              <span>{countNew}</span>
              {countNew > 0 && <span className="text-xs font-normal text-red-400 animate-pulse">Action Req.</span>}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/30 p-4 rounded-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              🟠 Rescue In-Progress
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {countInProgress}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/30 p-4 rounded-xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              🟢 Resolved Incidents
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {countResolved}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-cyan-500/30 p-4 rounded-xl">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              🌊 Active Hazard Zones
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {hazards.length}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Hazard Modal Form */}
      {isBroadcastingHazard && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Issue Outbound Geofenced Marine Hazard Broadcast</h3>
            </div>
            <button
              onClick={() => setIsBroadcastingHazard(false)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleBroadcastNewHazard} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Hazard Type</label>
                <select
                  value={newHazardType}
                  onChange={(e) => setNewHazardType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="CYCLONE">Cyclone / Severe Squall</option>
                  <option value="HIGH_WAVES">High Waves / Rogue Swell</option>
                  <option value="LIGHTNING">Severe Lightning Storm</option>
                  <option value="EXTREME_WIND">Extreme Gale Wind (&gt;50 kts)</option>
                  <option value="GEOFENCE_BREACH">International Maritime Boundary (IMBL)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Severity</label>
                <select
                  value={newHazardSeverity}
                  onChange={(e) => setNewHazardSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="critical">Extreme / Critical (Red Alert)</option>
                  <option value="severe">Severe Warning (Orange Warning)</option>
                  <option value="warning">Moderate Caution (Yellow Caution)</option>
                  <option value="advisory">Advisory Notice</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Hazard Title / Code</label>
                <input
                  type="text"
                  placeholder="e.g. Cyclone Alert: Deep Depression Bay of Bengal"
                  value={newHazardTitle}
                  onChange={(e) => setNewHazardTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Description & Meteorological Notice</label>
              <textarea
                rows={2}
                placeholder="Details of wind speeds, wave heights, and affected maritime sectors..."
                value={newHazardDescription}
                onChange={(e) => setNewHazardDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBroadcastingHazard(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-600/30"
              >
                <Send className="w-3.5 h-3.5" /> Transmit Broadcast to Geofenced Vessels
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Incident Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search vessel, registration, spoken text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'new'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              🔴 New ({countNew})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              🟠 Responding ({countInProgress})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              🟢 Resolved ({countResolved})
            </button>
          </div>
        </div>

        {/* Incident List */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            No active distress incidents matching current filter criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => {
              const isNew = report.status === 'NEW';
              return (
                <div
                  key={report.sos_id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                    isNew
                      ? 'bg-red-950/20 border-red-500/40 hover:border-red-500 hover:bg-red-950/30'
                      : report.status === 'ACKNOWLEDGED' || report.status === 'RESPONDING'
                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-white">
                        #{report.sos_id.toUpperCase().slice(-8)}
                      </span>
                      {isNew ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse">
                          🔴 UNACKNOWLEDGED DISTRESS
                        </span>
                      ) : report.status === 'ACKNOWLEDGED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          🟠 ACKNOWLEDGED
                        </span>
                      ) : report.status === 'RESPONDING' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          🔵 ASSET DISPATCHED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          🟢 RESOLVED
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-semibold">
                        {report.reporter_name || 'Matsya Sagar'} ({report.device_id})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        • {new Date(report.captured_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                      </span>
                    </div>

                    {/* Spoken transcript summary */}
                    <div className="flex items-start gap-2 text-xs">
                      <Volume2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-200 font-medium italic line-clamp-1">
                        &quot;{report.transcript || 'No voice message recorded (Hardware SOS)'}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E (±{report.accuracy_meters.toFixed(0)}m)
                      </span>
                      <span>Source: <strong className="text-slate-300 capitalize">{report.location_source}</strong></span>
                      <span>Relay: <strong className="text-emerald-400 uppercase">{report.delivery_path}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isNew && (
                      <button
                        onClick={() => handleAcknowledge(report.sos_id)}
                        className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quick Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incident Detail Drawer */}
      <SOSIncidentDrawer
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onAcknowledge={handleAcknowledge}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
