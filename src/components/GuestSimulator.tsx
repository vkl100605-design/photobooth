"use client";

import React from "react";
import { useBooth } from "@/contexts/BoothContext";
import GuestInterface from "./GuestInterface";
import { X, Smartphone } from "lucide-react";

export default function GuestSimulator() {
  const { isSimulatedMultiplayer, setIsSimulatedMultiplayer } = useBooth();

  if (!isSimulatedMultiplayer) return null;

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col items-center border-l border-stone-850 bg-stone-950 shadow-2xl h-full animate-in slide-in-from-right duration-350 z-20">
      
      {/* Simulator top header */}
      <div className="w-full bg-stone-900 border-b border-stone-850 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300">
            Guest Phone Mockup
          </span>
        </div>
        <button
          onClick={() => setIsSimulatedMultiplayer(false)}
          className="p-1 rounded bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          title="Close Simulator"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Simulator body */}
      <div className="flex-1 w-full overflow-y-auto bg-stone-950 flex justify-center py-4 px-2">
        {/* Smartphone Bezel */}
        <div className="w-full max-w-[320px] bg-stone-900 rounded-[36px] p-3 border-4 border-stone-800 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col relative aspect-[9/19] h-[640px] overflow-hidden my-auto">
          
          {/* Speaker Bezel Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-stone-800 rounded-b-xl z-20 flex items-center justify-center">
            <div className="w-10 h-1 bg-stone-900 rounded-full" />
          </div>

          {/* Screen Content Wrapper */}
          <div className="flex-1 w-full rounded-[28px] overflow-hidden border border-stone-950 bg-stone-950 relative flex flex-col mt-2">
            <GuestInterface hostId="simulator" />
          </div>

          {/* Home Button Bar Bezel */}
          <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-stone-800 rounded-full z-20" />
        </div>
      </div>
      
    </div>
  );
}
