"use client";

import React, { useState } from "react";
import { useBooth, BACKGROUNDS, BackgroundPreset } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { ChevronLeft } from "lucide-react";

export default function BackgroundSelector({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const { background, setBackground } = useBooth();
  const [selectedPack, setSelectedPack] = useState<"patterns" | "simple" | null>(null);

  // Group presets into categories
  const patternPresets = BACKGROUNDS.filter((b) => b.type === "pattern" || b.type === "gradient");
  const simplePresets = BACKGROUNDS.filter((b) => b.type === "solid");

  const handleSelectPreset = (preset: BackgroundPreset) => {
    sounds.playClick();
    setBackground(preset.value);
  };

  const handleConfirm = () => {
    sounds.playClick();
    onNext();
  };

  // Renders the horizontal strip mockup
  const renderMockupStrip = (item: BackgroundPreset) => {
    const isSelected = background === item.value;
    const styleObject: React.CSSProperties =
      item.type === "pattern"
        ? { backgroundImage: item.value, backgroundSize: "20px 20px" }
        : item.type === "gradient"
        ? { backgroundImage: item.value }
        : { backgroundColor: item.value };

    return (
      <button
        key={item.id}
        onClick={() => handleSelectPreset(item)}
        className="flex flex-col items-center flex-shrink-0 cursor-pointer transition-all duration-300 transform active:scale-95 group focus:outline-none select-none"
      >
        {/* Strip container with border, background, and transparent inner frames */}
        <div 
          className={`w-[115px] h-[280px] bg-white rounded-lg p-2 flex flex-col justify-between shadow-md transition-all duration-300 ${
            isSelected 
              ? "ring-4 ring-stone-900 scale-102 shadow-2xl" 
              : "border border-stone-200 hover:shadow-lg hover:scale-101"
          }`}
          style={styleObject}
        >
          <div className="w-full aspect-[4/3] bg-white/70 border border-stone-300/40 rounded-xs" />
          <div className="w-full aspect-[4/3] bg-white/70 border border-stone-300/40 rounded-xs" />
          <div className="w-full aspect-[4/3] bg-white/70 border border-stone-300/40 rounded-xs" />
          <div className="w-full aspect-[4/3] bg-white/70 border border-stone-300/40 rounded-xs" />
        </div>

        {/* Text Label */}
        <span className={`text-[11px] font-mono tracking-wide lowercase mt-3 transition-colors ${
          isSelected ? "text-stone-900 font-bold" : "text-stone-400 group-hover:text-stone-600"
        }`}>
          {item.name}
        </span>
      </button>
    );
  };

  // 1. Render Category Selection ("Packs")
  if (!selectedPack) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[75vh]">
        {/* Header */}
        <div className="text-center mb-10 w-full flex flex-col items-center">
          <span className="font-sans text-xs tracking-widest text-stone-400 uppercase font-black">Step 2</span>
          <h2 className="text-2xl font-serif font-black text-stone-100 uppercase tracking-wider mt-1.5">
            Select Theme Pack
          </h2>
        </div>

        {/* Category Cards (Pinterest style) */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {/* Patterns Card */}
          <button
            onClick={() => {
              sounds.playClick();
              setSelectedPack("patterns");
            }}
            className="aspect-[4/5] rounded-3xl bg-stone-900 border border-stone-850 hover:border-stone-700 hover:bg-stone-850 shadow-xl flex flex-col items-center justify-between p-6 transition-all duration-300 cursor-pointer text-center group"
          >
            <div className="w-16 h-28 bg-gradient-to-tr from-amber-500/25 via-pink-500/10 to-transparent border border-stone-800 rounded-lg p-1.5 flex flex-col justify-between opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="w-full aspect-[4/3] bg-stone-900/60 rounded-xs" />
              <div className="w-full aspect-[4/3] bg-stone-900/60 rounded-xs" />
              <div className="w-full aspect-[4/3] bg-stone-900/60 rounded-xs" />
            </div>
            <div className="flex flex-col gap-0.5 mt-4">
              <span className="text-[12px] font-sans font-bold uppercase tracking-widest text-stone-200">Patterns</span>
              <span className="text-[9px] text-stone-500 font-bold uppercase">Stripes & Gradients</span>
            </div>
          </button>

          {/* Simple Solid Card */}
          <button
            onClick={() => {
              sounds.playClick();
              setSelectedPack("simple");
            }}
            className="aspect-[4/5] rounded-3xl bg-stone-900 border border-stone-850 hover:border-stone-700 hover:bg-stone-850 shadow-xl flex flex-col items-center justify-between p-6 transition-all duration-300 cursor-pointer text-center group"
          >
            <div className="w-16 h-28 bg-stone-200 border border-stone-300 rounded-lg p-1.5 flex flex-col justify-between opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="w-full aspect-[4/3] bg-stone-100 rounded-xs" />
              <div className="w-full aspect-[4/3] bg-stone-100 rounded-xs" />
              <div className="w-full aspect-[4/3] bg-stone-100 rounded-xs" />
            </div>
            <div className="flex flex-col gap-0.5 mt-4">
              <span className="text-[12px] font-sans font-bold uppercase tracking-widest text-stone-200">Simple</span>
              <span className="text-[9px] text-stone-500 font-bold uppercase">Minimalist Solids</span>
            </div>
          </button>
        </div>

        {/* Back option */}
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="mt-12 text-stone-500 hover:text-stone-300 transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer underline"
        >
          &larr; Back to layouts
        </button>
      </div>
    );
  }

  // 2. Render Selection Carousel inside Category Pack
  const activePresets = selectedPack === "patterns" ? patternPresets : simplePresets;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[75vh]">
      {/* Category Header Title */}
      <h2 className="text-sm font-sans tracking-widest font-bold text-stone-400 uppercase text-center mb-6">
        {selectedPack === "patterns" ? "Patterns Themes" : "Simple Themes"}
      </h2>

      {/* Back to packs button */}
      <button
        onClick={() => {
          sounds.playClick();
          setSelectedPack(null);
        }}
        className="px-4 py-2 border border-stone-800 hover:bg-stone-900 rounded-lg text-xs font-mono tracking-wider font-bold text-stone-300 flex items-center gap-1 cursor-pointer bg-stone-950 mb-8"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> packs
      </button>

      {/* Horizontal Carousel Preview */}
      <div className="w-full overflow-x-auto py-6 flex gap-6 px-4 justify-start sm:justify-center items-center scrollbar-thin">
        {activePresets.map((item) => renderMockupStrip(item))}
      </div>

      {/* Dots Indicator */}
      <div className="flex gap-1.5 mt-8 justify-center">
        {activePresets.map((item) => {
          const isSelected = background === item.value;
          return (
            <div
              key={item.id}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isSelected ? "bg-stone-300 w-3" : "bg-stone-750"
              }`}
            />
          );
        })}
      </div>

      {/* Next Button at bottom */}
      <button
        onClick={handleConfirm}
        className="mt-10 px-8 py-3 rounded-lg bg-stone-750 hover:bg-stone-600 text-stone-100 border border-stone-600 font-mono text-xs uppercase tracking-widest font-bold cursor-pointer transition-colors shadow flex items-center justify-center gap-1 focus:outline-none"
      >
        <span>next ▷</span>
      </button>
    </div>
  );
}
