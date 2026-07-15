"use client";

import React from "react";
import { useBooth, FRAME_LAYOUTS, FrameLayout } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { ArrowRight, Film } from "lucide-react";

export default function FrameSelector({ onNext }: { onNext: () => void }) {
  const { layout, setLayout } = useBooth();

  const handleSelect = (selected: FrameLayout) => {
    sounds.playClick();
    setLayout(selected);
  };

  const handleConfirm = () => {
    sounds.playClick();
    onNext();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[85vh]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Film className="w-3.5 h-3.5" /> Step 1: Layout Selection
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-100 tracking-tight">
          Choose Your Photo Frame
        </h2>
        <p className="text-stone-400 text-sm md:text-base mt-2 max-w-md mx-auto">
          Select the vintage format for your photobooth session. This will determine the quantity of snapshots.
        </p>
      </div>

      {/* Grid of Layouts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full mb-10">
        {FRAME_LAYOUTS.map((item) => {
          const isSelected = layout.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`group flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "bg-amber-950/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-850"
              }`}
            >
              {/* Visual Strip Preview Representing the shape */}
              <div className="w-20 h-32 flex items-center justify-center bg-stone-950 border border-stone-800 rounded p-1 mb-4 shadow-inner group-hover:scale-105 transition-transform duration-300">
                {item.id === "strip-3" && (
                  <div className="w-6 h-full flex flex-col gap-1 py-0.5 justify-around bg-stone-100">
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                  </div>
                )}
                {item.id === "strip-4" && (
                  <div className="w-5 h-full flex flex-col gap-0.5 py-0.5 justify-around bg-stone-100">
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                    <div className="w-full aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                  </div>
                )}
                {item.id === "strip-6" && (
                  <div className="w-12 h-full flex flex-col gap-0.5 py-0.5 justify-around bg-stone-100 p-0.5">
                    <div className="grid grid-cols-2 gap-0.5 w-full">
                      <div className="aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-[4/3] bg-stone-400/50 border border-stone-300" />
                    </div>
                  </div>
                )}
                {item.id === "polaroid" && (
                  <div className="w-14 aspect-[1/1.2] flex flex-col bg-stone-100 p-1 justify-between shadow-sm">
                    <div className="w-full aspect-square bg-stone-400/50 border border-stone-300" />
                    <div className="h-2 w-8 bg-stone-300/40 rounded-sm self-center" />
                  </div>
                )}
                {item.id === "grid-square" && (
                  <div className="w-14 aspect-square flex flex-col bg-stone-100 p-1 justify-around shadow-sm">
                    <div className="grid grid-cols-2 gap-0.5 w-full">
                      <div className="aspect-square bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-square bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-square bg-stone-400/50 border border-stone-300" />
                      <div className="aspect-square bg-stone-400/50 border border-stone-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="text-center">
                <span className={`block font-semibold text-sm ${isSelected ? "text-amber-400" : "text-stone-200"}`}>
                  {item.name}
                </span>
                <span className="block text-[10px] text-stone-500 mt-1 uppercase font-semibold">
                  {item.photoCount} Snapshots
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        onClick={handleConfirm}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] cursor-pointer"
      >
        Choose Background <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
