"use client";

import React, { useState, useEffect } from "react";
import { useBooth } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import Curtain from "@/components/Curtain";
import FrameSelector from "@/components/FrameSelector";
import BackgroundSelector from "@/components/BackgroundSelector";
import CameraFeed from "@/components/CameraFeed";
import FilterPreview from "@/components/FilterPreview";
import PrinterAnimation from "@/components/PrinterAnimation";
import Editor from "@/components/Editor";
import ConnectManager from "@/components/ConnectManager";
import GuestInterface from "@/components/GuestInterface";
import GuestSimulator from "@/components/GuestSimulator";
import { Camera, Users, VolumeX, Volume2, Disc } from "lucide-react";
import { motion } from "framer-motion";

type PagePhase = "landing" | "entering" | "entering-connect" | "booth" | "exiting";

export default function Home() {
  const {
    step,
    setStep,
    isMuted,
    toggleMuted,
    resetSession,
    multiplayerRole,
    setMultiplayerRole,
    isSimulatedMultiplayer,
  } = useBooth();

  const [phase, setPhase] = useState<PagePhase>("landing");
  const [joinHostId, setJoinHostId] = useState<string | null>(null);
  const [musicActive, setMusicActive] = useState<boolean>(false);

  // Stop background music if page gets unmounted
  useEffect(() => {
    return () => {
      sounds.stopVinylSoundtrack();
    };
  }, []);

  // Extract query joining parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const joinId = params.get("join");
      if (joinId) {
        setJoinHostId(joinId);
      }
    }
  }, []);

  const handleToggleMute = () => {
    sounds.playClick();
    toggleMuted();
  };

  const handleToggleMusic = () => {
    sounds.playClick();
    if (musicActive) {
      sounds.stopVinylSoundtrack();
      setMusicActive(false);
    } else {
      sounds.startVinylSoundtrack();
      setMusicActive(true);
    }
  };

  // 1. Landing -> Solo curtain enter flow
  const handleSelectSolo = () => {
    sounds.playClick();
    setPhase("entering");
  };

  // 1.2 Landing -> Connect curtain enter flow
  const handleSelectConnect = () => {
    sounds.playClick();
    setPhase("entering-connect");
  };

  // 2. Curtain Enter Animation Completed -> Enter Booth Interior (Solo)
  const handleCurtainEntered = () => {
    setPhase("booth");
    setStep("frame-select");
  };

  // 2.2 Curtain Enter Animation Completed -> Setup Connect manager (Host)
  const handleCurtainConnectEntered = () => {
    setPhase("booth");
    setStep("landing"); // ConnectManager renders on landing step under host role
    setMultiplayerRole("host");
  };

  // 3. Exit Booth Flow
  const handleExitBooth = () => {
    setPhase("exiting");
  };

  // 4. Exit Curtain Pull Complete -> Return to landing
  const handleCurtainExited = () => {
    resetSession();
    setPhase("landing");
  };

  // Mobile Guest device overlay routing
  if (joinHostId) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-2">
        <GuestInterface hostId={joinHostId} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500 selection:text-stone-950">
      
      {/* 1. Landing Phase View */}
      {phase === "landing" && (
        <>
          {/* Header */}
          <header className="w-full max-w-6xl mx-auto px-6 py-5 flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center font-serif text-stone-950 font-black text-lg shadow-md border border-yellow-400">
                P
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-amber-100">
                Photobooth
              </span>
            </div>

            {/* Soundtrack & Mute Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleMusic}
                className={`p-2.5 rounded-full border shadow cursor-pointer transition-all flex items-center justify-center ${
                  musicActive 
                    ? "bg-amber-500 border-amber-500 text-stone-950" 
                    : "bg-stone-900 border-stone-850 text-stone-400 hover:bg-stone-800"
                }`}
                aria-label="Toggle Vinyl Soundtrack"
              >
                <Disc className={`w-4 h-4 ${musicActive ? "animate-[spin_4s_linear_infinite]" : ""}`} />
              </button>

              <button
                onClick={handleToggleMute}
                className="p-2.5 rounded-full bg-stone-900 border border-stone-850 text-stone-400 hover:bg-stone-800 transition-colors shadow cursor-pointer"
                aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Landing Selection Cabinets */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col justify-center items-center gap-10 z-10">
            
            {/* Visual Intro Brand Slate */}
            <div className="text-center max-w-xl">
              <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-amber-100 tracking-tight leading-tight">
                Step Into the Curtain
              </h1>
              <p className="text-stone-400 text-sm mt-3 leading-relaxed">
                Recreate the nostalgic chemistry of chemical-developing photostrips. Take snapshots, apply vintage filters, draw custom doodles, and save your memories.
              </p>
            </div>

            {/* Cabin Options grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              
              {/* Booth 1: Solo Classic Cabinet */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl cursor-pointer"
                onClick={handleSelectSolo}
              >
                {/* Gold banner */}
                <div className="absolute top-0 inset-x-0 h-2 bg-amber-500" />
                
                {/* Wood reflection detail */}
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />

                <div>
                  {/* Icon and glowing indicator */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-900/30 flex items-center justify-center text-amber-500">
                      <Camera className="w-6 h-6" />
                    </div>
                    {/* Glowing Solo status */}
                    <div className="flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-1.5 rounded-full border border-amber-900/30">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span className="text-[8px] text-amber-500 uppercase tracking-widest font-bold">SOLO CABIN</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-stone-100 group-hover:text-amber-500 transition-colors flex items-center gap-2">
                    Solo Experience
                  </h3>
                  <p className="text-stone-400 text-xs mt-2 leading-relaxed">
                    Step inside for a private vertical photo strip shoot. Setup lighting options, apply black-and-white filters, and customize with sticker drawings.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-stone-800/80 flex justify-between items-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Procedural Audio</span>
                  <div className="px-4 py-1.5 rounded-full bg-amber-500 text-stone-950 font-bold text-xs transition-transform group-hover:translate-x-1">
                    Enter Cabin &rarr;
                  </div>
                </div>
              </motion.div>

              {/* Booth 2: Connect Booth Cabinet */}
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl cursor-pointer"
                onClick={handleSelectConnect}
              >
                {/* Blue/Cyan banner */}
                <div className="absolute top-0 inset-x-0 h-2 bg-cyan-700" />
                
                {/* Cyber reflection detail */}
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />

                <div>
                  {/* Icon and Glowing Indicator */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-900/30 flex items-center justify-center text-cyan-400">
                      <Users className="w-6 h-6" />
                    </div>
                    {/* Glowing Connect status */}
                    <div className="flex items-center gap-1.5 bg-cyan-950/40 px-2.5 py-1.5 rounded-full border border-cyan-900/30">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                      <span className="text-[8px] text-cyan-400 uppercase tracking-widest font-bold">CONNECT</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-stone-100 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                    Connect Mode Booth
                  </h3>
                  <p className="text-stone-400 text-xs mt-2 leading-relaxed">
                    Share a virtual session real-time with local guests. Connect multiple phones as remote shutter triggers and co-doodle on a shared canvas.
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-stone-800/80 flex justify-between items-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">Cooperative Play</span>
                  <div className="px-4 py-1.5 rounded-full bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-900/50 font-bold text-xs transition-colors">
                    Join Session &rarr;
                  </div>
                </div>
              </motion.div>

            </div>
          </main>

          {/* Mode-Specific Privacy Footer */}
          <footer className="w-full text-center py-6 border-t border-stone-900/80 text-stone-500 text-[11px] px-6 select-none bg-stone-950">
            <p className="max-w-md mx-auto leading-relaxed">
              Your photos never leave your device. Nothing is stored. Everything is processed only during your session.
            </p>
          </footer>
        </>
      )}

      {/* 2. Entering Curtain Pull Phase (Solo) */}
      {phase === "entering" && (
        <Curtain
          onOpened={handleCurtainEntered}
          title="Classic Solo Booth"
          subtitle="Pull the curtain to step inside the private photo cabin."
          ctaText="Slide curtain left to enter"
        />
      )}

      {/* 2.2 Entering Connect Curtain Pull Phase (Host) */}
      {phase === "entering-connect" && (
        <Curtain
          onOpened={handleCurtainConnectEntered}
          title="Connect Mode Cabin"
          subtitle="Pull the curtain to setup your cooperative photobooth room."
          ctaText="Slide curtain left to enter"
        />
      )}

      {/* 3. Inside Booth Interior Phase (With split pane simulator capability) */}
      {phase === "booth" && (
        <div className="flex-1 flex w-full relative h-full overflow-hidden">
          
          {/* Main Cabinet Workspace layout */}
          <div className="flex-1 flex flex-col justify-between w-full relative h-full">
            
            {/* Ambient flashing flash node container */}
            <div className="absolute inset-0 bg-stone-950 z-0 pointer-events-none" />

            <header className="relative w-full max-w-5xl mx-auto px-6 py-4 flex justify-between items-center border-b border-stone-900 bg-stone-950/70 backdrop-blur z-10">
              <span className="font-serif font-bold text-stone-300 text-sm tracking-widest uppercase">
                {multiplayerRole === "host" ? "Group Cabin Host" : "Solo Cabin Interior"}
              </span>
              
              {/* Controls and indicators */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleToggleMusic}
                  className={`p-2 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                    musicActive 
                      ? "bg-amber-500 border-amber-500 text-stone-950" 
                      : "bg-stone-900 border-stone-850 text-stone-400 hover:bg-stone-800"
                  }`}
                  title="Toggle Vinyl Soundtrack"
                >
                  <Disc className={`w-3.5 h-3.5 ${musicActive ? "animate-[spin_4s_linear_infinite]" : ""}`} />
                </button>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-400" />
                  <span className="text-[9px] font-bold text-red-500 tracking-wider uppercase">RECORDING ON</span>
                </div>
              </div>
            </header>

            <main className="flex-1 relative z-10 w-full flex items-center justify-center">
              {step === "landing" && multiplayerRole === "host" && (
                <ConnectManager onBack={handleExitBooth} />
              )}
              {step === "frame-select" && <FrameSelector onNext={() => setStep("bg-select")} />}
              {step === "bg-select" && (
                <BackgroundSelector
                  onBack={() => {
                    if (multiplayerRole === "host") {
                      setStep("landing");
                    } else {
                      setStep("frame-select");
                    }
                  }}
                  onNext={() => setStep("camera")}
                />
              )}
              {step === "camera" && (
                <CameraFeed
                  onBack={() => setStep("bg-select")}
                  onNext={() => setStep("filters")}
                />
              )}
              {step === "filters" && <FilterPreview onNext={() => setStep("edit")} />}
              {step === "edit" && (
                <Editor
                  onBack={() => setStep("filters")}
                  onNext={() => setStep("print")}
                />
              )}
              {step === "print" && <PrinterAnimation onExit={handleExitBooth} />}
            </main>

            <footer className="relative w-full text-center py-4 border-t border-stone-900 text-stone-500 text-[10px] z-10 bg-stone-950/70 backdrop-blur">
              <p>Your photos never leave your device. Processing locally in memory.</p>
            </footer>
          </div>

          {/* Guest phone simulator slideout sidebar panel */}
          {isSimulatedMultiplayer && <GuestSimulator />}
        </div>
      )}

      {/* 4. Exiting Curtain Pull Phase */}
      {phase === "exiting" && (
        <Curtain
          onOpened={handleCurtainExited}
          title="Leaving Photobooth"
          subtitle="Pull the curtain to leave the cabin and return to the main square."
          ctaText="Slide curtain left to exit"
        />
      )}
      
    </div>
  );
}
