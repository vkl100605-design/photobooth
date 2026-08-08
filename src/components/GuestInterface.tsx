"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBooth } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { Camera, Smile, Type, Check, Wifi, AlertCircle, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["❤️", "💖", "✨", "⭐", "🕶️", "👑", "🎩", "🎀", "💬", "🎈", "🎉", "🌸", "👽", "🐱", "🐶", "🦄"];
const FONTS = [
  { id: "Georgia", name: "Serif" },
  { id: "Pacifico", name: "Cursive" },
  { id: "Courier New", name: "Typewriter" },
];

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
  } = useBooth();

  const [textVal, setTextVal] = useState<string>("");
  const [textFont, setTextFont] = useState<string>("Pacifico");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"sticker" | "text">("sticker");

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

  const handleSendSticker = (emoji: string) => {
    sounds.playClick();
    sendGuestAction({
      type: "ADD_STICKER_COOP",
      annoType: "sticker",
      value: emoji,
    });
  };

  const handleSendText = () => {
    if (!textVal.trim()) return;
    sounds.playClick();
    sendGuestAction({
      type: "ADD_STICKER_COOP",
      annoType: "text",
      value: textVal.trim(),
      font: textFont,
      color: textColor,
    });
    setTextVal("");
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
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Cooperative Video Pose</span>
                <h3 className="text-xl font-serif font-bold text-stone-200 mt-1">Dual Video Active</h3>
              </div>

              {/* Side-by-side Video Previews */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm aspect-[4/3] bg-stone-900 p-2.5 rounded-2xl border border-stone-850">
                {/* Host Feed */}
                <div className="relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center">
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
                      <span className="text-[8px] font-bold uppercase tracking-wider">Host Camera Loading...</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-stone-950/80 px-2 py-0.5 rounded text-[8px] font-bold text-stone-400">Host (Cabin)</span>
                </div>

                {/* Local Guest Feed */}
                <div className="relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 flex items-center justify-center">
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
                  <span className="absolute bottom-2 left-2 bg-stone-950/80 px-2 py-0.5 rounded text-[8px] font-bold text-stone-400">You (Guest)</span>
                </div>
              </div>

              {/* Big Shutter Trigger Button */}
              <button
                onClick={handleShutterTrigger}
                className="w-28 h-28 rounded-full bg-red-600 hover:bg-red-500 border-8 border-stone-900 shadow-[0_10px_35px_rgba(220,38,38,0.3)] active:scale-95 transition-all transform flex items-center justify-center cursor-pointer group"
              >
                <div className="w-18 h-18 rounded-full border-4 border-dashed border-red-200/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                  <Camera className="w-8 h-8 text-red-550" />
                </div>
              </button>

              {/* Film Roll Capture status */}
              <div className="w-full bg-stone-900/40 border border-stone-850 rounded-2xl p-4 flex flex-col gap-2.5">
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

          {/* STEP: Cooperative Editor annotations */}
          {step === "edit" && (
            <motion.div
              key="coop-editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col gap-4"
            >
              <div className="text-center mb-1">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Co-Op Scrapbook Mode</span>
                <h3 className="text-xl font-serif font-bold text-stone-200 mt-1">Inject Stickers & Text</h3>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 bg-stone-950 border border-stone-850 p-1.5 rounded-xl">
                <button
                  onClick={() => setActiveTab("sticker")}
                  className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors flex justify-center items-center gap-1.5 ${
                    activeTab === "sticker" ? "bg-stone-900 text-amber-400" : "text-stone-500"
                  }`}
                >
                  <Smile className="w-4 h-4" /> Stickers
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors flex justify-center items-center gap-1.5 ${
                    activeTab === "text" ? "bg-stone-900 text-amber-400" : "text-stone-500"
                  }`}
                >
                  <Type className="w-4 h-4" /> Letters
                </button>
              </div>

              {/* Tab contents */}
              {activeTab === "sticker" ? (
                <div className="grid grid-cols-4 gap-2 bg-stone-900/40 border border-stone-850 p-4 rounded-2xl">
                  {EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendSticker(emoji)}
                      className="aspect-square rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-850 text-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-2xl flex flex-col gap-3.5">
                  <input
                    type="text"
                    placeholder="Enter message..."
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 rounded-xl p-3 text-xs text-stone-100 placeholder:text-stone-700 focus:outline-none focus:border-amber-500"
                  />

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider">Font Style</span>
                      <select
                        value={textFont}
                        onChange={(e) => setTextFont(e.target.value)}
                        className="bg-stone-950 border border-stone-850 text-stone-300 p-2 rounded-lg text-[10px] focus:outline-none"
                      >
                        {FONTS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider">Letters Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-6.5 h-6.5 rounded bg-transparent border border-stone-850 cursor-pointer"
                        />
                        <span className="text-[9px] font-mono text-stone-400 uppercase">{textColor}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSendText}
                    disabled={!textVal.trim()}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" /> Insert on Main Canvas
                  </button>
                </div>
              )}
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

          {/* STEP: Waiting default screens (for layout/bg steps) */}
          {step !== "landing" && step !== "camera" && step !== "edit" && (
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
