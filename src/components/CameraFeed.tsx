"use client";

import React, { useEffect, useRef, useState } from "react";
import { useBooth, BACKGROUNDS } from "@/contexts/BoothContext";
import { useCamera } from "@/hooks/useCamera";
import { sounds } from "@/lib/sounds";
import { Camera, Volume2, VolumeX, RefreshCw, AlertTriangle, Disc, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraFeed({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const {
    layout,
    background,
    setBackground,
    removeBackground,
    setRemoveBackground,
    setPhotos,
    selectedFilter,
    setSelectedFilter,
    isMuted,
    toggleMuted,
    shutterTriggeredFromGuest,
    multiplayerRole,
    setLocalStream,
    remoteStream,
    isSimulatedMultiplayer,
    hostLobbyName,
    guestLobbyName,
    broadcastToGuests,
  } = useBooth();
  const { stream, error, startCamera, stopCamera } = useCamera();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const simulatedVideoRef = useRef<HTMLVideoElement>(null);
  
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [capturedPhotos, setLocalPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownDuration = 3; // default 3s
  const voiceEnabled = false; // default false
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [shakeActive, setShakeActive] = useState<boolean>(false);
  const [isFeedReady, setIsFeedReady] = useState<boolean>(false);
  const [activeProp, setActiveProp] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [segmentation, setSegmentation] = useState<any>(null);
  const [segLoading, setSegLoading] = useState<boolean>(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Initialize camera stream
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle stream assignment to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Sync host camera stream to localStream context
  useEffect(() => {
    if (stream) {
      setLocalStream(stream);
    }
    return () => {
      setLocalStream(null);
    };
  }, [stream, setLocalStream]);

  // Handle remote WebRTC stream assignment
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle simulated stream copy for local offline testing
  useEffect(() => {
    if (simulatedVideoRef.current && stream && isSimulatedMultiplayer) {
      simulatedVideoRef.current.srcObject = stream;
    }
  }, [stream, isSimulatedMultiplayer]);

  // Listen for guest remote shutter triggers reactively
  useEffect(() => {
    if (shutterTriggeredFromGuest > 0 && !isCapturing && isFeedReady) {
      startCaptureSequence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shutterTriggeredFromGuest]);

  // Dynamically load MediaPipe package on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSegLoading(true);
      import("@mediapipe/selfie_segmentation")
        .then((mod) => {
          const seg = new mod.SelfieSegmentation({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            },
          });
          seg.setOptions({
            modelSelection: 1, // 1 = landscape (faster, lower CPU cost)
          });
          setSegmentation(seg);
          setSegLoading(false);
        })
        .catch((err) => {
          console.warn("Failed to load MediaPipe Selfie Segmentation:", err);
          setSegLoading(false);
        });
    }
  }, []);

  // Pre-load and cache backdrop image if it's an image asset URL
  useEffect(() => {
    if (background.startsWith("data:") || background.startsWith("blob:") || background.startsWith("http")) {
      const img = new Image();
      if (background.startsWith("http")) {
        img.crossOrigin = "anonymous";
      }
      img.src = background;
      img.onload = () => {
        setBgImage(img);
      };
    } else {
      setBgImage(null);
    }
  }, [background]);

  // Set up MediaPipe segmentation results callback
  useEffect(() => {
    if (!segmentation) return;

    const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (bgImage) {
        const scale = Math.max(w / bgImage.width, h / bgImage.height);
        const x = (w - bgImage.width * scale) / 2;
        const y = (h - bgImage.height * scale) / 2;
        ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
      } else if (background.startsWith("repeating-")) {
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#704214";
        for (let i = 0; i < w; i += 60) {
          ctx.fillRect(i, 0, 30, h);
        }
      } else if (background.startsWith("linear-")) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        if (background.includes("#2c1a11")) { // cafe
          grad.addColorStop(0, "#2c1a11");
          grad.addColorStop(1, "#4a3321");
        } else if (background.includes("#ffd1dc")) { // cherry
          grad.addColorStop(0, "#ffd1dc");
          grad.addColorStop(1, "#ffb7c5");
        } else if (background.includes("#ff7e5f")) { // sunset
          grad.addColorStop(0, "#ff7e5f");
          grad.addColorStop(1, "#feb47b");
        } else { // cyber/neon
          grad.addColorStop(0, "#0f0c20");
          grad.addColorStop(1, "#240b36");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    segmentation.onResults((results: any) => {
      const canvas = canvasPreviewRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Selected Backdrop
      drawBackground(ctx, width, height);

      // 2. Draw user silhouette with alpha mask intersection
      const bufferCanvas = document.createElement("canvas");
      bufferCanvas.width = width;
      bufferCanvas.height = height;
      const bufferCtx = bufferCanvas.getContext("2d")!;

      bufferCtx.drawImage(results.segmentationMask, 0, 0, width, height);
      bufferCtx.globalCompositeOperation = "source-in";
      bufferCtx.drawImage(results.image, 0, 0, width, height);

      ctx.drawImage(bufferCanvas, 0, 0, width, height);
      ctx.restore();
    });
  }, [segmentation, bgImage, background]);

  // Real-time canvas processing loop
  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.play().catch((e) => console.warn(e));

      let active = true;
      const renderLoop = async () => {
        if (!active) return;

        const canvas = canvasPreviewRef.current;
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            setIsFeedReady(true);
          }

          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (removeBackground && segmentation) {
              try {
                await segmentation.send({ image: video });
              } catch {
                // Fail-safe: draw standard webcam feed
                drawRawFrame(ctx, video, canvas.width, canvas.height);
              }
            } else {
              drawRawFrame(ctx, video, canvas.width, canvas.height);
            }

            // Draw real-time props overlays on local preview
            if (activeProp) {
              ctx.save();
              ctx.font = "60px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              let emoji = "";
              let emojiY = 0;
              if (activeProp === "cat") { emoji = "🐱"; emojiY = 130; }
              else if (activeProp === "bunny") { emoji = "🐰"; emojiY = 90; }
              else if (activeProp === "glasses") { emoji = "🕶️"; emojiY = 190; }
              else if (activeProp === "crown") { emoji = "👑"; emojiY = 100; }
              
              if (emoji) {
                ctx.fillText(emoji, canvas.width / 2, emojiY);
              }
              ctx.restore();
            }
          }
        }

        requestAnimationFrame(renderLoop);
      };

      const drawRawFrame = (ctx: CanvasRenderingContext2D, vid: HTMLVideoElement, w: number, h: number) => {
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(vid, 0, 0, w, h);
        ctx.restore();
      };

      requestAnimationFrame(renderLoop);

      return () => {
        active = false;
      };
    }
  }, [stream, removeBackground, segmentation, activeProp]);

  // Center crop image drawing helper for grid stitching
  const drawCenterCropped = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    destX: number,
    destY: number,
    destW: number,
    destH: number
  ) => {
    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;
    const targetAspect = destW / destH;
    const sourceAspect = videoW / videoH;
    let srcX = 0;
    let srcY = 0;
    let srcW = videoW;
    let srcH = videoH;

    if (sourceAspect > targetAspect) {
      srcW = videoH * targetAspect;
      srcX = (videoW - srcW) / 2;
    } else {
      srcH = videoW / targetAspect;
      srcY = (videoH - srcH) / 2;
    }

    ctx.drawImage(video, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
  };

  // Speech helper
  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.3;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Beep sound
  const playBeep = (freq = 800, duration = 0.08) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn(e);
    }
  };

  // Grabs base64 frame from active composite canvas or raw video
  const captureSnapshot = () => {
    const video = videoRef.current;
    const previewCanvas = canvasPreviewRef.current;
    const remoteVideo = remoteVideoRef.current;

    const canvas = document.createElement("canvas");
    
    // If in multiplayer connect mode, stitch both video call feeds side-by-side
    if (multiplayerRole === "host") {
      canvas.width = 1200; // 600px each half
      canvas.height = 800; // 800px height
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      ctx.fillStyle = "#1c1917"; // Slate dark divider backdrop card
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Host Feed on the Left (0 to 600)
      if (video) {
        ctx.save();
        ctx.translate(600, 0);
        ctx.scale(-1, 1);
        drawCenterCropped(ctx, video, 0, 0, 600, 800);
        ctx.restore();
      }

      // 2. Draw Guest Feed on the Right (600 to 1200)
      if (remoteVideo) {
        ctx.save();
        drawCenterCropped(ctx, remoteVideo, 600, 0, 600, 800);
        ctx.restore();
      } else if (isSimulatedMultiplayer && video) {
        // Simulation offset feed: draw mirror offset with vintage color filter
        ctx.save();
        ctx.translate(1200, 0);
        ctx.scale(-1, 1);
        ctx.filter = "sepia(0.5) hue-rotate(90deg) contrast(1.2)";
        drawCenterCropped(ctx, video, 0, 0, 600, 800);
        ctx.restore();
      }

      // Draw custom props inside high-res snapshots
      if (activeProp) {
        ctx.save();
        ctx.font = "80px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let hostEmoji = "";
        let hostY = 0;
        if (activeProp === "cat") { hostEmoji = "🐱"; hostY = 240; }
        else if (activeProp === "bunny") { hostEmoji = "🐰"; hostY = 190; }
        else if (activeProp === "glasses") { hostEmoji = "🕶️"; hostY = 320; }
        else if (activeProp === "crown") { hostEmoji = "👑"; hostY = 200; }
        
        if (hostEmoji) {
          ctx.fillText(hostEmoji, 300, hostY);
          ctx.fillText(hostEmoji, 900, hostY);
        }
        ctx.restore();
      }

      return canvas.toDataURL("image/png");
    }

    // Normal solo capture
    canvas.width = video?.videoWidth || 640;
    canvas.height = video?.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Mirror image drawing (since the CSS mirrors the screen visually)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    if (removeBackground && previewCanvas) {
      // Capture canvas that has background replacement drawn in
      ctx.drawImage(previewCanvas, 0, 0, canvas.width, canvas.height);
    } else if (video) {
      // Capture raw camera stream
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    if (activeProp) {
      ctx.save();
      ctx.font = "60px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let emoji = "";
      let emojiY = 0;
      if (activeProp === "cat") { emoji = "🐱"; emojiY = 130; }
      else if (activeProp === "bunny") { emoji = "🐰"; emojiY = 90; }
      else if (activeProp === "glasses") { emoji = "🕶️"; emojiY = 190; }
      else if (activeProp === "crown") { emoji = "👑"; emojiY = 100; }
      
      if (emoji) {
        ctx.fillText(emoji, canvas.width / 2, emojiY);
      }
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
  };

  // Multi-shot sequence
  const startCaptureSequence = async () => {
    if (isCapturing || !stream) return;
    setIsCapturing(true);
    setCapturedCount(0);
    const tempPhotos: string[] = [];
    setLocalPhotos([]);

    for (let i = 0; i < layout.photoCount; i++) {
      speak(`Photo ${i + 1}`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      for (let count = countdownDuration; count > 0; count--) {
        setCountdown(count);
        broadcastToGuests({ type: "COUNTDOWN_UPDATE", value: count });
        playBeep(800, 0.08);
        speak(count.toString());
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setCountdown(null);
      broadcastToGuests({ type: "COUNTDOWN_UPDATE", value: null });

      // Shutter Trigger
      setFlashActive(true);
      broadcastToGuests({ type: "FLASH_TRIGGER" });
      setShakeActive(true);
      sounds.playShutter();

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(150);
      }

      const photoUrl = captureSnapshot();
      if (photoUrl) {
        tempPhotos.push(photoUrl);
        setLocalPhotos([...tempPhotos]);
        setCapturedCount(tempPhotos.length);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      setFlashActive(false);
      setShakeActive(false);

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    setIsCapturing(false);
    setPhotos(tempPhotos);
    onNext();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[88vh] relative">
      <AnimatePresence>
        {flashActive && (
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
            {/* Main magnesium burst expander */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.2, 2.5], opacity: [1, 1, 0] }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,1)_0%,rgba(253,224,71,0.8)_40%,rgba(251,146,60,0.1)_70%,transparent_100%)] filter blur-md"
            />
            {/* Outer flash blast lens flare lines */}
            <motion.div
              initial={{ opacity: 1, scaleX: 0 }}
              animate={{ opacity: [1, 0], scaleX: [0, 3] }}
              transition={{ duration: 0.5 }}
              className="absolute w-full h-2 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-[15deg] filter blur-sm"
            />
            <motion.div
              initial={{ opacity: 1, scaleX: 0 }}
              animate={{ opacity: [1, 0], scaleX: [0, 3] }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="absolute w-full h-2 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-[-45deg] filter blur-sm"
            />
            {/* Screen-wide white glow overlay */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0.9, 0] }}
              transition={{ duration: 0.9 }}
              className="absolute inset-0 bg-white/70"
            />
            {/* Residual lens-burn tint overlay */}
            <motion.div
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 0] }}
              transition={{ duration: 0.8, ease: "easeIn" }}
              className="absolute inset-0 bg-amber-500/10 mix-blend-color"
            />
          </div>
        )}
      </AnimatePresence>

      <div className="w-full flex justify-between items-center mb-4">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          disabled={isCapturing}
          className="text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50 text-sm font-semibold cursor-pointer"
        >
          &larr; Back
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {layout.name}
          </span>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            toggleMuted();
          }}
          className="p-2 rounded-lg bg-stone-900 border border-stone-850 text-stone-400 hover:bg-stone-800 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {error ? (
        <div className="w-full max-w-md bg-stone-900 border border-red-500/30 p-6 rounded-xl flex flex-col items-center text-center shadow-lg my-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-stone-200">Camera Access Required</h3>
          <p className="text-stone-400 text-sm mt-2">{error}</p>
          <button
            onClick={() => {
              sounds.playClick();
              startCamera();
            }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 font-bold rounded-full transition-all text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try Access Again
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
          {/* Counter "2 / 6" */}
          <div className="text-xl font-light font-mono tracking-widest text-stone-400 mb-6">
            {isCapturing 
              ? `${capturedCount + 1} / ${layout.photoCount}` 
              : `${capturedPhotos.length} / ${layout.photoCount}`}
          </div>

          {/* Camera Viewport Container */}
          <motion.div
            animate={shakeActive ? { x: [-5, 5, -5, 5, 0], y: [-3, 3, -3, 3, 0] } : {}}
            transition={{ duration: 0.15 }}
            className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-stone-950 border border-stone-850 shadow-2xl flex items-center justify-center"
          >
            {/* Hidden Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-0 left-0 w-[1px] h-[1px] opacity-0 pointer-events-none"
            />

            {multiplayerRole === "host" ? (
              <div className="grid grid-cols-2 gap-3.5 w-full h-full p-3 bg-stone-900/60">
                {/* Host Preview Canvas */}
                <div className="relative rounded-xl overflow-hidden border border-stone-850 bg-stone-950 flex items-center justify-center">
                  <canvas
                    ref={canvasPreviewRef}
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <span className="absolute bottom-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md">
                    {hostLobbyName}
                  </span>
                </div>

                {/* Remote Guest Preview Video */}
                <div className="relative rounded-xl overflow-hidden border border-stone-850 bg-stone-950 flex items-center justify-center">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover animate-in fade-in"
                    />
                  ) : isSimulatedMultiplayer ? (
                    <video
                      ref={simulatedVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100 filter sepia-[0.5] hue-rotate-[90deg] contrast-[1.2]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="w-6 h-6 rounded-full border border-stone-850 border-t-amber-500 animate-spin mb-2" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 animate-pulse">Awaiting Video...</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md">
                    {guestLobbyName}
                  </span>
                </div>
              </div>
            ) : (
              /* Render canvas preview directly (Solo Mode) */
              <canvas
                ref={canvasPreviewRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            )}

            {/* Countdown Overlay numbers */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none z-10"
                >
                  <span className="text-8xl md:text-9xl font-serif font-black text-amber-400">
                    {countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expanded Flash bulb overlays */}
            <AnimatePresence>
              {flashActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-white z-30"
                />
              )}
            </AnimatePresence>

            {isCapturing && countdown === null && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-650/85 border border-red-500 text-red-50 text-[10px] font-bold uppercase tracking-wider animate-pulse z-10">
                <Disc className="w-3.5 h-3.5 fill-red-50" /> CAPTURING {capturedCount + 1}/{layout.photoCount}
              </div>
            )}
          </motion.div>

          {/* Real-time Settings Tray below viewport */}
          {!isCapturing && (
            <div className="w-full flex flex-col gap-5 mt-8 bg-stone-900/30 border border-stone-850 p-6 rounded-3xl shadow-xl">
              
              {/* BACKGROUND ROW */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-stone-500">Background</span>
                <div className="flex gap-3 overflow-x-auto py-1 pr-1 items-center justify-start scrollbar-thin">
                  {/* Deselect background button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setRemoveBackground(false);
                    }}
                    className={`w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 select-none ${
                      !removeBackground 
                        ? "border-amber-500 bg-amber-500 text-stone-950 font-black shadow-md scale-105" 
                        : "border-stone-850 bg-stone-950 text-stone-450 hover:border-stone-700"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Preset Background Circles */}
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
                        }}
                        className={`w-11 h-11 rounded-full border transition-all flex-shrink-0 select-none cursor-pointer ${
                          isSelected 
                            ? "border-amber-500 ring-2 ring-amber-500 shadow-md scale-105" 
                            : "border-stone-800 hover:border-stone-700"
                        }`}
                        style={styleObject}
                        title={item.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* FILTER / PROP ROW */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-stone-500">Props & Color Filter</span>
                <div className="flex gap-3 overflow-x-auto py-1 pr-1 items-center justify-start scrollbar-thin">
                  {/* Deselect props / filters */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setActiveProp(null);
                      setSelectedFilter("original");
                    }}
                    className={`w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 select-none ${
                      !activeProp && selectedFilter === "original"
                        ? "border-amber-500 bg-amber-500 text-stone-950 font-black shadow-md scale-105"
                        : "border-stone-800 bg-stone-950 text-stone-450 hover:border-stone-700"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Props Option Buttons */}
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
                        }}
                        className={`w-11 h-11 rounded-full border bg-stone-950 flex items-center justify-center text-xl transition-all flex-shrink-0 select-none cursor-pointer ${
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

                  {/* Color Film Stocks Option Buttons */}
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
                        }}
                        className={`w-11 h-11 rounded-full border bg-stone-950 flex flex-col items-center justify-center transition-all flex-shrink-0 select-none cursor-pointer ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-500 shadow-md scale-105"
                            : "border-stone-800 hover:border-stone-700"
                        }`}
                        title={f.name}
                      >
                        <span className="text-[12px] font-sans">🎞️</span>
                        <span className="text-[7px] font-mono font-bold tracking-tight text-stone-400 mt-0.5">{f.id.substring(0, 3).toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Capture triggers */}
          {!isCapturing && (
            <button
              onClick={startCaptureSequence}
              disabled={!isFeedReady}
              className="mt-8 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.2)] flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-mono tracking-widest uppercase"
            >
              <Camera className="w-4.5 h-4.5" /> Start snaps
            </button>
          )}

          {/* Captured Photos horizontal reel preview at bottom */}
          <div className="w-full flex gap-3 overflow-x-auto justify-start sm:justify-center py-4 px-2 bg-stone-900/10 rounded-2xl border border-stone-850/60 max-w-md mx-auto mt-6 scrollbar-thin">
            {capturedPhotos.length === 0 ? (
              <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider py-1.5 select-none w-full text-center">
                snaps will appear here
              </span>
            ) : (
              capturedPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="relative w-16 h-12 rounded-lg overflow-hidden border border-stone-850 bg-stone-950 shadow flex-shrink-0"
                >
                  <img src={photo} alt={`Snap ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 right-0.5 bg-stone-950/85 px-1 py-0.2 rounded text-[6px] font-bold text-amber-500 border border-stone-850 uppercase tracking-widest">
                    #{index + 1}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
