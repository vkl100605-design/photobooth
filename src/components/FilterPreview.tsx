"use client";

import React from "react";
import { useBooth, FILTERS } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { Sparkles, ArrowRight } from "lucide-react";

export default function FilterPreview({ onNext }: { onNext: () => void }) {
  const { photos, selectedFilter, setSelectedFilter } = useBooth();

  // Find currently active filter preset
  const activeFilter = FILTERS.find((f) => f.id === selectedFilter) || FILTERS[0];

  const handleSelectFilter = (filterId: string) => {
    sounds.playClick();
    setSelectedFilter(filterId);
  };

  const handleConfirm = () => {
    sounds.playClick();
    onNext();
  };

  // Use the first captured photo as the preview image for the selector tiles
  const samplePhoto = photos[0] || "";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[85vh]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Step 3: Color Grading
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-100 tracking-tight">
          Select Photo Filter
        </h2>
        <p className="text-stone-400 text-sm md:text-base mt-2 max-w-md mx-auto">
          Choose a vintage filter tone. This will be non-destructively layered onto all your captured snapshots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch mb-10">
        
        {/* Large Live Preview (left side/column) */}
        <div className="md:col-span-2 flex flex-col items-center justify-center bg-stone-900/30 border border-stone-850 p-6 rounded-2xl">
          <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-4">Live Layout View</span>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
            {photos.slice(0, 4).map((photo, idx) => (
              <div
                key={idx}
                className="aspect-[4/3] rounded-xl overflow-hidden border border-stone-850 bg-stone-950 shadow-md relative"
              >
                <img
                  src={photo}
                  alt={`Capture preview ${idx + 1}`}
                  style={{ filter: activeFilter.cssFilter }}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-stone-500 font-medium">
              Tone applied: <strong className="text-amber-500">{activeFilter.name}</strong>
            </span>
          </div>
        </div>

        {/* Filters List (right side/column) */}
        <div className="md:col-span-1 flex flex-col gap-3 overflow-y-auto max-h-[50vh] pr-1">
          {FILTERS.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => handleSelectFilter(f.id)}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  isSelected
                    ? "bg-amber-950/20 border-amber-500"
                    : "bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-850"
                }`}
              >
                {/* Tiny filtered thumbnail */}
                {samplePhoto ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-800/80 bg-stone-950 flex-shrink-0">
                    <img
                      src={samplePhoto}
                      alt={f.name}
                      style={{ filter: f.cssFilter }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-stone-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className={`block font-semibold text-xs ${isSelected ? "text-amber-400" : "text-stone-200"}`}>
                    {f.name}
                  </span>
                  <span className="block text-[9px] text-stone-500 mt-0.5 truncate uppercase">
                    {f.id === "original" ? "No Filter" : f.id}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Step Button */}
      <button
        onClick={handleConfirm}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] cursor-pointer"
      >
        Go to Printing <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
