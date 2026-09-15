'use client';

import React, { useState } from 'react';
import { SOSReport, DistressResolution, SOSStatus } from '@/features/sos/types';
import {
  X,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  Battery,
  Shield,
  Volume2,
  CheckCircle2,
  Phone,
  Send,
  User,
  Anchor,
  Activity,
  Layers,
  FileText
} from 'lucide-react';

interface SOSIncidentDrawerProps {
  report: SOSReport | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (reportId: string, note?: string) => Promise<void>;
  onUpdateStatus: (reportId: string, status: SOSStatus, resolution?: DistressResolution) => Promise<void>;
}

export const SOSIncidentDrawer: React.FC<SOSIncidentDrawerProps> = ({
  report,
  isOpen,
  onClose,
  onAcknowledge,
  onUpdateStatus
}) => {
  const [authorityNote, setAuthorityNote] = useState('');
  const [dispatchUnit, setDispatchUnit] = useState('ICG Interceptor C-438');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !report) return null;

  const getStatusBadge = (status: SOSStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            🔴 NEW DISTRESS (UNACKNOWLEDGED)
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
            🟠 ACKNOWLEDGED (COMMAND NOTIFIED)
          </span>
        );
      case 'RESPONDING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-spin" /> RESCUE ASSETS DISPATCHED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            🟢 INCIDENT RESOLVED & SAFE
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-700 text-slate-300">
            ⚪ CANCELLED / FALSE ALARM
          </span>
        );
      default:
        return null;
    }
  };

  const handleAcknowledgeClick = async () => {
    try {
      setIsSubmitting(true);
      await onAcknowledge(report.sos_id, authorityNote || 'Indian Coast Guard Maritime Rescue Coordination Centre has acknowledged distress.');
      setAuthorityNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchRescue = async () => {
    try {
      setIsSubmitting(true);
      await onUpdateStatus(report.sos_id, 'RESPONDING', {
        resolvedAt: new Date().toISOString(),
        resolvedBy: `Authority MRCC [Dispatched: ${dispatchUnit}]`,
        outcome: 'assisted',
        summary: `Dispatched ${dispatchUnit}. ETA to coordinates ~25 mins.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveIncident = async () => {
    try {
      setIsSubmitting(true);
      await onUpdateStatus(report.sos_id, 'RESOLVED', {
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Coast Guard Command Officer',
        outcome: 'safe',
        summary: resolutionSummary || 'Vessel and all crew accounted for and escorted to harbour safely.'
      });
      setResolutionSummary('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 shadow-2xl h-full flex flex-col text-slate-100 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  INCIDENT #{report.sos_id.toUpperCase().slice(-8)}
                </h2>
                {getStatusBadge(report.status)}
              </div>
              <p className="text-xs text-slate-400">
                Logged at: {new Date(report.captured_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1">
          {/* Priority & Triage Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border border-red-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 block mb-0.5">
                TRIAGE PRIORITY
              </span>
              <span className="text-lg font-black text-red-200">
                LEVEL 1 — IMMEDIATE ACTION REQUIRED
              </span>
              <p className="text-xs text-slate-300 mt-1">
                Network Mode: <span className="font-semibold uppercase text-cyan-300">{report.network_status}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Delivery Path
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                {report.delivery_path.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Spoken Distress Message & Transcript */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Fisherman Spoken Distress Transcript</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                Lang: {report.language}
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-sm text-slate-100 font-medium italic">
              &quot;{report.transcript || 'No voice transcript provided (Hardware button trigger)'}&quot;
            </div>

            {report.linked_hazard_id && (
              <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" /> Linked Hazard Advisory: {report.linked_hazard_id}
              </p>
            )}
          </div>

          {/* Vessel & Fisherman Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Anchor className="w-3.5 h-3.5" /> Vessel Information
              </div>
              <div className="text-sm font-semibold text-white">
                {report.reporter_name || 'Matsya Sagar - AP 09 V 8821'}
              </div>
              <div className="text-xs text-slate-400">
                Device: <span className="text-slate-200 font-mono">{report.device_id}</span>
              </div>
              <div className="text-xs text-slate-400">
                Reporter: <span className="text-slate-200">{report.reporter_id}</span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" /> Emergency Contact
              </div>
              <div className="text-sm font-semibold text-white">
                Captain / Boat Master
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="text-slate-200 font-mono">+91 98480 22334 (VHF 16)</span>
              </div>
              <div className="text-xs text-slate-400">
                Language: <span className="text-slate-200 uppercase">{report.language}</span>
              </div>
            </div>
          </div>

          {/* Geospatial Coordinates & Telemetry */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" /> Live Distress Location & Telemetry
              </div>
              <a
                href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
              >
                External Satellite Map ↗
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Latitude</span>
                <span className="font-mono font-semibold text-white">{report.latitude.toFixed(5)}° N</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Longitude</span>
                <span className="font-mono font-semibold text-white">{report.longitude.toFixed(5)}° E</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">GPS Accuracy</span>
                <span className="font-semibold text-white">±{report.accuracy_meters.toFixed(0)}m</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Device Battery</span>
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <Battery className="w-3 h-3" />
                  {report.battery_percentage != null ? `${report.battery_percentage}%` : '85%'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Incident Audit Timeline
            </div>
            <div className="space-y-2 text-xs">
              {(report.timeline || []).map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white capitalize">{entry.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </span>
                    </div>
                    {entry.note && <p className="text-slate-400 text-[11px] mt-0.5">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authority Response Actions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-4">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Authority Command Actions
            </h3>

            {report.status !== 'ACKNOWLEDGED' && report.status !== 'RESPONDING' && report.status !== 'RESOLVED' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Add custom acknowledgement note for fisherman..."
                  value={authorityNote}
                  onChange={(e) => setAuthorityNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAcknowledgeClick}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Transmitting Acknowledgment...' : 'Acknowledge Distress & Push Confirmation to Vessel'}
                </button>
              </div>
            )}

            {/* Dispatch Rescue unit */}
            {report.status === 'ACKNOWLEDGED' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Rescue unit name (e.g. ICG Interceptor C-438)"
                    value={dispatchUnit}
                    onChange={(e) => setDispatchUnit(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleDispatchRescue}
                    disabled={isSubmitting}
                    className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Asset
                  </button>
                </div>
              </div>
            )}

            {/* Resolve Incident */}
            {report.status !== 'RESOLVED' && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Resolution summary (e.g., Vessel safely towed to port)..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleResolveIncident}
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Incident as Resolved & Safe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
