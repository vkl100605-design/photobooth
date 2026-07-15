"use client";

import React, { useState, useEffect } from "react";
import { useBooth } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { QRCodeSVG } from "qrcode.react";
import { Wifi, Users, Smartphone, ArrowRight, Info, Copy, Check } from "lucide-react";

export default function ConnectManager({
  onBack,
}: {
  onBack: () => void;
}) {
  const {
    peerId,
    connectedGuestsCount,
    setStep,
    setIsSimulatedMultiplayer,
  } = useBooth();

  const [lanIp, setLanIp] = useState<string>("");
  const [customIpInput, setCustomIpInput] = useState<string>("");
  const [isEditingIp, setIsEditingIp] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const isPublicDeployment = !!(lanIp && 
    lanIp !== "localhost" && 
    lanIp !== "127.0.0.1" && 
    !lanIp.startsWith("192.168.") && 
    !lanIp.startsWith("10.") && 
    !lanIp.startsWith("172."));

  // Guess the hostname or IP on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        // Leave LAN IP empty so the user is prompted to enter their local IP
        setLanIp("");
      } else {
        setLanIp(hostname);
      }
    }
  }, []);

  const handleSaveIp = () => {
    sounds.playClick();
    if (customIpInput.trim()) {
      setLanIp(customIpInput.trim());
      setIsEditingIp(false);
    }
  };

  const getJoinUrl = () => {
    if (typeof window === "undefined" || !peerId) return "";
    const activePort = window.location.port ? `:${window.location.port}` : "";
    const ip = lanIp || "localhost";
    return `${window.location.protocol}//${ip}${activePort}?join=${peerId}`;
  };

  const handleCopyLink = () => {
    sounds.playClick();
    const url = getJoinUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startBoothHost = () => {
    sounds.playClick();
    setStep("frame-select");
  };

  const startSimulationMode = () => {
    sounds.playClick();
    setIsSimulatedMultiplayer(true);
    setStep("frame-select");
  };

  const joinUrl = getJoinUrl();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 flex flex-col items-center justify-start min-h-[85vh]">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-stone-400 hover:text-stone-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          &larr; Exit Connect Mode
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 border border-stone-850 rounded-full">
          <Wifi className={`w-3.5 h-3.5 ${peerId ? "text-green-500 animate-pulse" : "text-stone-500"}`} />
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-300">
            {peerId ? "Server Active" : "Initializing..."}
          </span>
        </div>
      </div>

      {/* Main Connection Panel */}
      <div className="w-full bg-stone-900/40 border border-stone-850 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* QR Section (left-5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center text-center">
          {peerId ? (
            <div className="bg-white p-4 rounded-2xl shadow-lg border-4 border-stone-800 flex flex-col items-center justify-center aspect-square w-52 h-52">
              <QRCodeSVG value={joinUrl} size={180} />
            </div>
          ) : (
            <div className="w-52 h-52 bg-stone-950 border border-stone-800 rounded-2xl flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-stone-800 border-t-amber-500 animate-spin mb-3" />
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Generating QR...</span>
            </div>
          )}

          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black mt-4 block">
            Scan to Join Cabinet
          </span>
        </div>

        {/* Info & Setup Section (right-7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-serif font-bold text-amber-100 mb-1.5">
              {isPublicDeployment ? "Group Connection Deck (Public)" : "Group Connection Deck"}
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              {isPublicDeployment
                ? "Scan this QR code with guest mobile devices from anywhere in the world to connect them as remote triggers and cooperative decorators."
                : "Scan this QR code with guest mobile devices on the same Wi-Fi network to connect them as remote triggers and cooperative decorators."}
            </p>
          </div>

          {/* Network Local IP Helper */}
          <div className="bg-stone-950/70 border border-stone-850 p-4 rounded-2xl flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-500" />{" "}
                {isPublicDeployment ? "Public Cloud Deployment Active" : "LAN Wi-Fi Address Setup"}
              </span>
              {!isEditingIp && lanIp && !isPublicDeployment && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsEditingIp(true);
                  }}
                  className="text-[10px] text-amber-500 font-bold hover:underline cursor-pointer"
                >
                  Change IP
                </button>
              )}
            </div>

            {(!lanIp || isEditingIp) ? (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  Guests on other devices can&apos;t connect to `localhost`. Please enter your host computer&apos;s local network IP (e.g. `192.168.1.15`):
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.15"
                    value={customIpInput}
                    onChange={(e) => setCustomIpInput(e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-850 rounded-xl px-3 py-1.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSaveIp}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-300 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-850 truncate max-w-[220px]">
                  {joinUrl.substring(0, 35)}...
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-850 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Connected Roster Counter */}
          <div className="flex items-center gap-6 mt-2 border-t border-stone-850 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-200">{connectedGuestsCount} Connected</span>
                <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Active Guest Sockets</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-stone-200">Mobile Ready</span>
                <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Shutter Controls Ready</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Connection Mode Options */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        
        {/* P2P Start host */}
        <button
          onClick={startBoothHost}
          disabled={!peerId}
          className="flex items-center justify-between p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 border border-amber-500 transition-all font-bold text-sm shadow-[0_4px_20px_rgba(245,158,11,0.15)] group cursor-pointer disabled:opacity-40"
        >
          <div className="flex flex-col items-start text-left gap-0.5">
            <span>Enter Main Booth Cabin</span>
            <span className="text-[10px] font-medium text-stone-900/60">Launch photobooth with active WebRTC connections</span>
          </div>
          <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Local Simulator */}
        <button
          onClick={startSimulationMode}
          className="flex items-center justify-between p-4 rounded-2xl bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 hover:border-stone-750 transition-all font-bold text-sm shadow-md group cursor-pointer"
        >
          <div className="flex flex-col items-start text-left gap-0.5">
            <span>Launch Local Simulator (Offline)</span>
            <span className="text-[10px] font-medium text-stone-500">Test multiplayer on a single screen without extra devices</span>
          </div>
          <Smartphone className="w-4.5 h-4.5 group-hover:scale-110 transition-transform text-amber-500" />
        </button>

      </div>
    </div>
  );
}
