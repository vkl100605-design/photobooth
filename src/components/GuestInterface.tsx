"use client";

import React, { useState, useEffect } from "react";
import { useBooth } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { Camera, Smile, Type, Check, Wifi, AlertCircle } from "lucide-react";
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
    resetSession
  } = useBooth();

  const [textVal, setTextVal] = useState<string>("");
  const [textFont, setTextFont] = useState<string>("Pacifico");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"sticker" | "text">("sticker");

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
      style={{ touchAction: "none" }} // Prevents viewport bounces on mobile browsers
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

      {/* Main UI body */}
      <div className="flex-1 flex flex-col justify-center items-center py-4 w-full">
        <AnimatePresence mode="wait">
          
          {/* STEP: Camera Remote Shutter Trigger */}
          {step === "camera" && (
            <motion.div
              key="camera-trigger"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Host Camera Feed Ready</span>
                <h3 className="text-xl font-serif font-bold text-stone-200 mt-1">Tap Shutter to Trigger</h3>
              </div>

              {/* Big Shutter Trigger Button */}
              <button
                onClick={handleShutterTrigger}
                className="w-36 h-36 rounded-full bg-red-600 hover:bg-red-500 border-8 border-stone-900 shadow-[0_10px_35px_rgba(220,38,38,0.3)] active:scale-95 transition-all transform flex items-center justify-center cursor-pointer group"
              >
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-red-200/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-700">
                  <Camera className="w-10 h-10 text-red-50" />
                </div>
              </button>

              {/* Film Roll Capture status */}
              <div className="w-full bg-stone-900/40 border border-stone-850 rounded-2xl p-4 flex flex-col gap-2.5">
                <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">
                  Roll Captures ({photos.length} / {layout.photoCount})
                </span>
                
                {photos.length === 0 ? (
                  <div className="py-6 border border-dashed border-stone-800/80 rounded-xl text-center text-[10px] text-stone-600 font-medium">
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

          {/* STEP: Waiting default screens */}
          {step !== "camera" && step !== "edit" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 flex flex-col items-center"
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
          className="text-stone-500 hover:text-stone-350 transition-colors text-[10px] font-semibold underline cursor-pointer"
        >
          Disconnect Remote Controls
        </button>
        <span className="text-[9px] text-stone-600 font-medium">Offline Local WebRTC Connection Platform</span>
      </div>
      
    </div>
  );
}
