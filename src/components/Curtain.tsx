"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useAnimation, PanInfo } from "framer-motion";
import { sounds } from "@/lib/sounds";
import { Volume2, VolumeX } from "lucide-react";
import { useBooth } from "@/contexts/BoothContext";

interface CurtainProps {
  onOpened: () => void;
  onClosed?: () => void;
  isOpenInitial?: boolean;
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

export default function Curtain({
  onOpened,
  onClosed,
  isOpenInitial = false,
  title = "Capture Memories That Feel Real.",
  subtitle = "Step into a virtual vintage photo booth experience.",
  ctaText = "Pull the curtain to enter",
}: CurtainProps) {
  const { isMuted, toggleMuted } = useBooth();
  const [width, setWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isFullyOpened, setIsFullyOpened] = useState(isOpenInitial);

  // Read container width for drag constraints
  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync initial state
  useEffect(() => {
    if (isOpenInitial) {
      x.set(-width);
      setIsFullyOpened(true);
    } else {
      x.set(0);
      setIsFullyOpened(false);
    }
  }, [isOpenInitial, width, x]);

  // Procedural audio triggers on drag
  const handleDragStart = () => {
    sounds.playCurtain();
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragOffset = info.offset.x;
    const velocity = info.velocity.x;

    // If dragged more than 30% or thrown fast to the left
    if (dragOffset < -width * 0.3 || velocity < -200) {
      sounds.playCurtain();
      await controls.start({
        x: -width,
        transition: { type: "spring", stiffness: 150, damping: 25 },
      });
      setIsFullyOpened(true);
      onOpened();
    } else {
      // Snap back
      sounds.playCurtain();
      await controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 200, damping: 20 },
      });
      setIsFullyOpened(false);
      if (onClosed) onClosed();
    }
  };

  const triggerOpenKeyboard = async () => {
    sounds.playCurtain();
    await controls.start({
      x: -width,
      transition: { type: "spring", stiffness: 100, damping: 22 },
    });
    setIsFullyOpened(true);
    onOpened();
  };

  const triggerCloseKeyboard = async () => {
    sounds.playCurtain();
    await controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 100, damping: 22 },
    });
    setIsFullyOpened(false);
    if (onClosed) onClosed();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-stone-950 flex flex-col items-center justify-between"
      style={{ minHeight: "100dvh" }}
    >
      {/* Background/Booth Interior visible behind curtain */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black">
        {/* Soft yellow ambient glow simulating the photobooth interior light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        
        {/* Ambient grid texture */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Accessibility Controls */}
      <button
        onClick={isFullyOpened ? triggerCloseKeyboard : triggerOpenKeyboard}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-lg border-2 border-stone-850 shadow-md focus:outline-none"
      >
        {isFullyOpened ? "Close Curtain" : "Pull Curtain to Enter Booth"}
      </button>

      {/* Mute Button */}
      <button
        onClick={() => {
          sounds.playClick();
          toggleMuted();
        }}
        className="absolute top-4 right-4 z-20 p-3 rounded-full bg-stone-900/80 border border-stone-800 text-stone-300 hover:bg-stone-850 transition-colors shadow-lg cursor-pointer"
        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Front-Facing Curtain Panel */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -width, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        style={{ x }}
        animate={controls}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="absolute inset-y-0 right-0 z-10 w-full cursor-grab active:cursor-grabbing flex shadow-2xl border-l border-amber-950/20"
      >
        {/* Fabric Simulation via CSS gradients */}
        <div 
          className="w-full h-full relative"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                #991b1b 0px,
                #7f1d1d 20px,
                #b91c1c 40px,
                #991b1b 60px,
                #7f1d1d 80px,
                #dc2626 100px,
                #991b1b 120px
              )
            `,
            boxShadow: "inset -10px 0 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Shadow folds overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30 pointer-events-none" />

          {/* Curtain rod ring indicators at the top */}
          <div className="absolute top-0 inset-x-0 h-4 flex justify-around opacity-40 pointer-events-none">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="w-3 h-3 rounded-full border border-yellow-700 bg-yellow-600/70 shadow-sm" />
            ))}
          </div>

          {/* Brass grommet track line */}
          <div className="absolute top-1.5 inset-x-0 h-[2px] bg-yellow-700/60 pointer-events-none" />

          {/* Gold Tie String in middle height */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col items-center">
            <div className="w-12 h-2 rounded bg-amber-500 border border-yellow-600 shadow-md animate-pulse pointer-events-none" />
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-serif font-bold mt-1 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
              PULL
            </span>
          </div>

          {/* Intro text on the curtain */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-100 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight max-w-lg mb-4">
              {title}
            </h1>
            <p className="text-sm md:text-base text-stone-200 tracking-wide font-sans font-light drop-shadow-md max-w-sm mb-12">
              {subtitle}
            </p>
            <div className="flex flex-col items-center gap-2">
              {/* Pulsing indicator */}
              <div className="w-8 h-8 rounded-full border-2 border-amber-300/40 flex items-center justify-center animate-bounce">
                <div className="w-2 h-2 bg-amber-300 rounded-full" />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-300/80 drop-shadow">
                {ctaText}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
