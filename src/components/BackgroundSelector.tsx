"use client";

import React, { useRef, useState } from "react";
import { useBooth, BACKGROUNDS, BackgroundPreset } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { ArrowLeft, ArrowRight, Image as ImageIcon, Upload, Check } from "lucide-react";

export default function BackgroundSelector({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const { background, setBackground } = useBooth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customBg, setCustomBg] = useState<string | null>(null);

  const handleSelectPreset = (preset: BackgroundPreset) => {
    sounds.playClick();
    setBackground(preset.value);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sounds.playClick();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setCustomBg(dataUrl);
          setBackground(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUploadClick = () => {
    sounds.playClick();
    fileInputRef.current?.click();
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
          <ImageIcon className="w-3.5 h-3.5" /> Step 2: Backdrop Selection
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-100 tracking-tight">
          Choose Booth Backdrop
        </h2>
        <p className="text-stone-400 text-sm md:text-base mt-2 max-w-md mx-auto">
          Choose a vintage pattern, warm gradient, or upload a custom photo to serve as your virtual background.
        </p>
      </div>

      {/* Selector Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-10">
        {BACKGROUNDS.map((item) => {
          const isSelected = background === item.value;
          const styleObject: React.CSSProperties =
            item.type === "pattern"
              ? { backgroundImage: item.value, backgroundSize: "30px 30px" }
              : item.type === "gradient"
              ? { backgroundImage: item.value }
              : { backgroundColor: item.value };

          return (
            <button
              key={item.id}
              onClick={() => handleSelectPreset(item)}
              className={`group flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "bg-amber-950/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-850"
              }`}
            >
              {/* Backdrop Circle Preview */}
              <div
                style={styleObject}
                className="w-16 h-16 rounded-full border border-stone-800 mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300 relative flex items-center justify-center"
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-stone-900/40 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-amber-400 drop-shadow" />
                  </div>
                )}
              </div>

              <span className={`text-sm font-semibold ${isSelected ? "text-amber-400" : "text-stone-200"}`}>
                {item.name}
              </span>
            </button>
          );
        })}

        {/* Custom Upload Card */}
        <button
          onClick={customBg ? () => setBackground(customBg) : triggerUploadClick}
          className={`group flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
            customBg && background === customBg
              ? "bg-amber-950/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              : "bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-850"
          }`}
        >
          {customBg ? (
            <div
              style={{ backgroundImage: `url(${customBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
              className="w-16 h-16 rounded-full border border-stone-800 mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300 relative"
            >
              {background === customBg && (
                <div className="absolute inset-0 bg-stone-900/40 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-amber-400 drop-shadow" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone-700 flex items-center justify-center mb-3 group-hover:border-amber-500/50 transition-colors">
              <Upload className="w-5 h-5 text-stone-500 group-hover:text-amber-400 transition-colors" />
            </div>
          )}

          <span className={`text-sm font-semibold ${customBg && background === customBg ? "text-amber-400" : "text-stone-300"}`}>
            {customBg ? "Custom Backdrop" : "Upload Custom"}
          </span>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomUpload}
            accept="image/*"
            className="hidden"
          />
        </button>
      </div>

      {/* Quick Preview Area */}
      <div className="w-full max-w-md bg-stone-900/40 border border-stone-800/80 rounded-xl p-4 flex flex-col items-center mb-10 shadow-inner">
        <span className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-2">Backdrop Preview</span>
        <div
          style={
            background.startsWith("data:") || background.startsWith("blob:") || background.startsWith("http")
              ? { backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center" }
              : background.startsWith("repeating-")
              ? { backgroundImage: background, backgroundSize: "30px 30px" }
              : background.startsWith("linear-")
              ? { backgroundImage: background }
              : { backgroundColor: background }
          }
          className="w-full h-28 rounded-lg border border-stone-850 shadow-md relative"
        >
          {/* Booth visual guidelines inside */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="text-[10px] uppercase font-semibold text-stone-200/40 tracking-widest border border-stone-200/20 px-2 py-1 rounded bg-black/20">
              Camera Field
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-300 font-bold transition-all transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Layout
        </button>

        <button
          onClick={handleConfirm}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] cursor-pointer"
        >
          Enter Camera <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
