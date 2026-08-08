"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBooth, BACKGROUNDS } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { Camera, Wifi, AlertCircle, Video, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PrinterAnimation from "@/components/PrinterAnimation";
import Editor from "@/components/Editor";

export default function GuestInterface({
  hostId,
}: {
  hostId: string;
}) {
  const {
    step,
    photos,
    layout,
    connectToHost,
    sendGuestAction,
    resetSession,
    localStream,
    setLocalStream,
    remoteStream,
    hostLobbyName,
    hostLobbyColor,
    hostLobbyReady,
    guestLobbyName,
    setGuestLobbyName,
    guestLobbyColor,
    setGuestLobbyColor,
    guestLobbyReady,
    setGuestLobbyReady,
    selectedFilter,
    setSelectedFilter,
    background,
    setBackground,
    removeBackground,
    setRemoveBackground,
    activeProp,
    setActiveProp,
    guestCountdown,
    guestFlashActive,
  } = useBooth();

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const syncGuestLobby = (name: string, color: string, ready: boolean) => {
    setGuestLobbyName(name);
    setGuestLobbyColor(color);
    setGuestLobbyReady(ready);
    sendGuestAction({
      type: "GUEST_LOBBY_UPDATE",
      name,
      color,
      ready,
    });
  };

  // Connect guest peer on mount
  useEffect(() => {
    if (hostId && hostId !== "simulator") {
      connectToHost(hostId);
      setIsConnected(true);
    } else if (hostId === "simulator") {
      setIsConnected(true);
    }
    return () => {
      setIsConnected(false);
    };
  }, [hostId, connectToHost]);

  // Send initial guest lobby data when connected
  useEffect(() => {
    if (isConnected) {
      sendGuestAction({
        type: "GUEST_LOBBY_UPDATE",
        name: guestLobbyName,
        color: guestLobbyColor,
        ready: guestLobbyReady,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Request camera track access on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (typeof window !== "undefined") {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          activeStream = stream;
          setLocalStream(stream);
        })
        .catch((err) => {
          console.warn("Guest camera access denied:", err);
        });
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setLocalStream(null);
    };
  }, [setLocalStream]);

  const activeRemoteStream = remoteStream || (hostId === "simulator" ? localStream : null);

  // Stream attachments
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, step]);

  useEffect(() => {
    if (remoteVideoRef.current && activeRemoteStream) {
      remoteVideoRef.current.srcObject = activeRemoteStream;
    }
  }, [activeRemoteStream, step]);

  const handleShutterTrigger = () => {
    sounds.playClick();
    sendGuestAction({
      type: "TRIGGER_SHUTTER",
    });
  };



  return (
    <div 
      className="w-full max-w-md mx-auto min-h-[92vh] flex flex-col justify-between bg-stone-950 text-stone-100 p-5 shadow-2xl relative select-none"
      style={{ touchAction: "none" }}
    >
      
      {/* Top Navbar */}
      <div className="flex justify-between items-center border-b border-stone-900 pb-4 mb-4">
        <div className="flex flex-col">
          <span className="font-serif font-bold text-amber-200 text-sm tracking-wide">Vintage Guest Controller</span>
          <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Cabinet Client Mode</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-850 text-[10px] font-bold text-stone-400">
          <Wifi className={`w-3.5 h-3.5 ${isConnected ? "text-green-500 animate-pulse" : "text-stone-500"}`} />
          {isConnected ? "Connected" : "Linking..."}
        </div>
      </div>

      {/* Floating self webcam bubble preview when not in capture screen */}
      {step !== "camera" && localStream && (
        <div className="absolute top-16 right-5 w-16 h-16 rounded-full border-2 border-amber-500 bg-stone-950 overflow-hidden shadow-lg z-30">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        </div>
      )}

      {/* Main UI body */}
      <div className="flex-1 flex flex-col justify-center items-center py-4 w-full">
        <AnimatePresence mode="wait">
          {/* STEP: Camera Remote Shutter Trigger with Dual feeds */}
          {step === "camera" && (
            <motion.div
              key="camera-trigger"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center gap-5"
            >
              {/* Photo Counter */}
              <div className="text-sm font-mono tracking-widest text-stone-400">
                {photos.length} / {layout.photoCount}
              </div>

              {/* Aspect ratio frame container */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-stone-950 border border-stone-850 shadow-2xl p-3 grid grid-cols-2 gap-3 bg-stone-900/60">
                {/* Host Preview (Remote Stream) */}
                <div className="relative rounded-xl overflow-hidden border border-stone-850 bg-stone-950 flex items-center justify-center">
                  {activeRemoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${hostId === "simulator" ? "filter sepia-[0.5] hue-rotate-[90deg] contrast-[1.2]" : ""}`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 text-stone-600">
                      <Video className="w-5 h-5 mb-1.5 animate-pulse text-amber-500/50" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Awaiting Video...</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md">
                    {hostLobbyName}
                  </span>
                </div>

                {/* Guest Preview (Local Stream) */}
                <div className="relative rounded-xl overflow-hidden border border-stone-850 bg-stone-950 flex items-center justify-center">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2 text-stone-600">
                      <Video className="w-5 h-5 mb-1.5 animate-pulse text-amber-500/50" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">Loading...</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md">
                    {guestLobbyName}
                  </span>
                </div>

                {/* Countdown Overlay numbers */}
                <AnimatePresence>
                  {guestCountdown !== null && (
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none z-30"
                    >
                      <span className="text-8xl font-serif font-black text-amber-400">
                        {guestCountdown}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Flash overlay */}
                <AnimatePresence>
                  {guestFlashActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 bg-white z-40"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* CIRCULAR SELECTOR CONTROLS TRAY */}
              <div className="w-full flex flex-col gap-4 mt-2 bg-stone-900/30 border border-stone-850 p-4.5 rounded-2xl shadow-xl">
                
                {/* Background selection row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-stone-500">Background</span>
                  <div className="flex gap-2.5 overflow-x-auto py-1 pr-1 items-center justify-start scrollbar-thin">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setRemoveBackground(false);
                        sendGuestAction({ type: "UPDATE_BACKGROUND", removeBackground: false, background: "" });
                      }}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 select-none ${
                        !removeBackground 
                          ? "border-amber-500 bg-amber-500 text-stone-950 font-black shadow-md scale-105" 
                          : "border-stone-850 bg-stone-950 text-stone-450 hover:border-stone-700"
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {BACKGROUNDS.map((item) => {
                      const isSelected = removeBackground && background === item.value;
                      const styleObject: React.CSSProperties =
                        item.type === "pattern"
                          ? { backgroundImage: item.value, backgroundSize: "10px 10px" }
                          : item.type === "gradient"
                          ? { backgroundImage: item.value }
                          : { backgroundColor: item.value };

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            sounds.playClick();
                            setRemoveBackground(true);
                            setBackground(item.value);
                            sendGuestAction({ type: "UPDATE_BACKGROUND", removeBackground: true, background: item.value });
                          }}
                          className={`w-9 h-9 rounded-full border transition-all flex-shrink-0 select-none cursor-pointer ${
                            isSelected 
                              ? "border-amber-500 ring-2 ring-amber-500 shadow-md scale-105" 
                              : "border-stone-805 hover:border-stone-700"
                          }`}
                          style={styleObject}
                          title={item.name}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Filter and prop overlay selection row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-stone-500">Props & Color</span>
                  <div className="flex gap-2.5 overflow-x-auto py-1 pr-1 items-center justify-start scrollbar-thin">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setActiveProp(null);
                        setSelectedFilter("original");
                        sendGuestAction({ type: "UPDATE_PROP", prop: null });
                        sendGuestAction({ type: "UPDATE_FILTER", filter: "original" });
                      }}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 select-none ${
                        !activeProp && selectedFilter === "original"
                          ? "border-amber-500 bg-amber-500 text-stone-950 font-black shadow-md scale-105"
                          : "border-stone-800 bg-stone-950 text-stone-450 hover:border-stone-700"
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {[
                      { id: "cat", label: "🐱", name: "Cat Ears" },
                      { id: "bunny", label: "🐰", name: "Bunny Ears" },
                      { id: "glasses", label: "🕶️", name: "Sunglasses" },
                      { id: "crown", label: "👑", name: "Crown" },
                    ].map((p) => {
                      const isSelected = activeProp === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            sounds.playClick();
                            setActiveProp(p.id);
                            sendGuestAction({ type: "UPDATE_PROP", prop: p.id });
                          }}
                          className={`w-9 h-9 rounded-full border bg-stone-950 flex items-center justify-center text-md transition-all flex-shrink-0 select-none cursor-pointer ${
                            isSelected
                              ? "border-amber-500 ring-2 ring-amber-500 shadow-md scale-105"
                              : "border-stone-800 hover:border-stone-700"
                          }`}
                          title={p.name}
                        >
                          {p.label}
                        </button>
                      );
                    })}

                    {[
                      { id: "kodachrome", label: "🎞️ KDK", name: "Kodachrome" },
                      { id: "fuji", label: "🎞️ FUJ", name: "Fuji Superia" },
                      { id: "cyanotype", label: "🎞️ CYN", name: "Cyanotype" },
                      { id: "bw", label: "🎞️ B&W", name: "Retro Mono" },
                    ].map((f) => {
                      const isSelected = selectedFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            sounds.playClick();
                            setSelectedFilter(f.id);
                            sendGuestAction({ type: "UPDATE_FILTER", filter: f.id });
                          }}
                          className={`w-9 h-9 rounded-full border bg-stone-950 flex flex-col items-center justify-center transition-all flex-shrink-0 select-none cursor-pointer ${
                            isSelected
                              ? "border-amber-500 ring-2 ring-amber-500 shadow-md scale-105"
                              : "border-stone-800 hover:border-stone-700"
                          }`}
                          title={f.name}
                        >
                          <span className="text-[10px] font-sans">🎞️</span>
                          <span className="text-[6px] font-mono font-bold tracking-tight text-stone-400 mt-0.5">{f.id.substring(0, 3).toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Shutter button */}
              <button
                onClick={handleShutterTrigger}
                className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 border-6 border-stone-900 shadow-[0_10px_35px_rgba(220,38,38,0.3)] active:scale-95 transition-all transform flex items-center justify-center cursor-pointer group mt-2"
              >
                <div className="w-14 h-14 rounded-full border-4 border-dashed border-red-200/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                  <Camera className="w-6 h-6 text-red-50" />
                </div>
              </button>

              {/* Bottom Horizontal captured photos reel */}
              <div className="w-full bg-stone-900/10 border border-stone-850 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">
                  Roll Captures ({photos.length} / {layout.photoCount})
                </span>
                
                {photos.length === 0 ? (
                  <div className="py-4 border border-dashed border-stone-800/80 rounded-xl text-center text-[10px] text-stone-600 font-medium">
                    No pictures captured yet.
                  </div>
                ) : (
                  <div className="flex gap-2.5 overflow-x-auto py-1">
                    {photos.map((p, idx) => (
                      <div key={idx} className="w-16 h-12 rounded overflow-hidden border border-stone-800 bg-stone-950 flex-shrink-0">
                        <img src={p} alt={`capture-${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP: Cooperative Editor */}
          {step === "edit" && (
            <motion.div
              key="coop-editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <Editor
                onBack={() => {}}
                onNext={(compiledUrl) => {
                  if (compiledUrl) {
                    sendGuestAction({ type: "FINISH_EDITING", editedStripUrl: compiledUrl });
                  }
                }}
              />
            </motion.div>
          )}

          {/* STEP: Lobby Waiting Room inside landing step */}
          {step === "landing" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col gap-6"
            >
              {/* Pinterest Clean Lobby Card */}
              <div className="w-full bg-white text-stone-900 rounded-3xl p-6 shadow-xl flex flex-col gap-6 border border-stone-200 mt-2">
                
                {/* YOU Section */}
                <div className="flex flex-col items-center text-center w-full">
                  <span className="text-[9px] uppercase font-black tracking-widest text-stone-400 mb-1.5">YOU</span>
                  
                  <input
                    type="text"
                    value={guestLobbyName}
                    onChange={(e) => {
                      const val = e.target.value.substring(0, 12);
                      syncGuestLobby(val, guestLobbyColor, guestLobbyReady);
                    }}
                    placeholder="Enter name..."
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-center text-md font-bold shadow-sm focus:outline-none focus:border-stone-400"
                  />

                  {/* Colors picker */}
                  <div className="flex gap-3.5 justify-center items-center mt-3">
                    {["#f472b6", "#60a5fa", "#fbbf24", "#34d399"].map((color) => {
                      const isSelected = guestLobbyColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            sounds.playClick();
                            syncGuestLobby(guestLobbyName, color, guestLobbyReady);
                          }}
                          className="w-8.5 h-8.5 rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow"
                          style={{
                            backgroundColor: color,
                            border: isSelected ? "3.5px solid #1c1917" : "1px solid rgba(0,0,0,0.15)",
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Ready Toggle button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      syncGuestLobby(guestLobbyName, guestLobbyColor, !guestLobbyReady);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer mt-4 flex items-center justify-center gap-1.5 border-2 ${
                      guestLobbyReady
                        ? "bg-emerald-800 border-emerald-800 text-white hover:bg-emerald-700"
                        : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <span>{guestLobbyReady ? "ready ✓" : "mark ready"}</span>
                  </button>
                </div>

                <div className="w-full border-t border-stone-100" />

                {/* PARTNER Section */}
                <div className="flex flex-col items-center text-center w-full">
                  <span className="text-[9px] uppercase font-black tracking-widest text-stone-400 mb-1.5">PARTNER</span>
                  
                  <div className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl py-2 text-center text-md font-bold flex items-center justify-center gap-2">
                    <span>{hostLobbyName}</span>
                    {hostLobbyReady && <span className="text-emerald-600 text-xs font-black">✓</span>}
                  </div>

                  {/* Partner color dot */}
                  <div className="flex gap-2 justify-center items-center mt-2.5">
                    <div
                      className="w-8.5 h-8.5 rounded-full border border-stone-200 shadow"
                      style={{
                        backgroundColor: hostLobbyColor,
                      }}
                    />
                  </div>

                  <span className={`text-[9px] uppercase font-bold tracking-wider mt-3 ${hostLobbyReady ? "text-emerald-600 animate-pulse" : "text-stone-400"}`}>
                    {hostLobbyReady ? "ready ✓" : "waiting for partner..."}
                  </span>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP: Cooperative Print / Chemical development stage */}
          {step === "print" && (
            <motion.div
              key="coop-print"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <PrinterAnimation onExit={() => resetSession()} />
            </motion.div>
          )}

          {/* STEP: Waiting default screens (for layout/bg steps) */}
          {step !== "landing" && step !== "camera" && step !== "edit" && step !== "print" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 flex flex-col items-center animate-in fade-in"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse mb-4">
                <AlertCircle className="w-5 h-5" />
              </div>
              
              <h3 className="text-lg font-serif font-bold text-stone-300">Wait for Cabinet Host</h3>
              <p className="text-xs text-stone-500 max-w-[200px] mx-auto mt-2 leading-relaxed">
                The booth steps are coordinated by the main screen. Waiting for step changes...
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer Exit details */}
      <div className="border-t border-stone-900 pt-4 flex flex-col items-center gap-2">
        <button
          onClick={() => {
            sounds.playClick();
            resetSession();
          }}
          className="text-stone-500 hover:text-stone-355 transition-colors text-[10px] font-semibold underline cursor-pointer"
        >
          Disconnect Remote Controls
        </button>
        <span className="text-[9px] text-stone-600 font-medium">Offline Local WebRTC Connection Platform</span>
      </div>
      
    </div>
  );
}
