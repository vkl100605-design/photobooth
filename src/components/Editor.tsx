/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useBooth, FILTERS } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import {
  Undo2,
  Redo2,
  Trash2,
  Smile,
  Brush,
  Sparkles
} from "lucide-react";

const EMOJI_STICKERS = [
  "❤️", "💖", "✨", "⭐", "🕶️", "👑", "🎩", "🎀", "💬", "🎈", "🎉", "🌸", "🍀", "🍕", "🍦", "👽", "🐱", "🐶", "🐻", "🦄"
];

const BRUSH_TYPES = [
  { id: "pen", name: "Fine Pen", width: 4, opacity: 1 },
  { id: "brush", name: "Art Brush", width: 10, opacity: 1 },
  { id: "marker", name: "Round Marker", width: 22, opacity: 1 },
  { id: "highlighter", name: "Highlighter", width: 32, opacity: 0.35 },
  { id: "sharpie", name: "Sharpie Pen", width: 6, opacity: 0.92 },
  { id: "neon", name: "Neon Glow", width: 10, opacity: 0.95 },
];

const WASHI_TAPES = [
  { name: "Blush Grid", color: "#fbcfe8", pattern: "grid" },
  { name: "Mint Stripe", color: "#bbf7d0", pattern: "stripes" },
  { name: "Honey Solid", color: "#fef08a", pattern: "solid" },
  { name: "Sky Grid", color: "#bae6fd", pattern: "grid" },
  { name: "Lavender Stripe", color: "#ddd6fe", pattern: "stripes" },
  { name: "Peach Solid", color: "#ffedd5", pattern: "solid" },
];

export default function Editor({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (dataUrl?: string) => void;
}) {
  const {
    photos,
    layout,
    background,
    selectedFilter,
    setEditedStripUrl,
    guestAnnotation,
    setGuestAnnotation,
    multiplayerRole,
    sendGuestAction,
    broadcastToGuests,
    peerCanvasJson,
    localStream,
    remoteStream,
    hostLobbyName,
    guestLobbyName,
  } = useBooth();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [fabricModule, setFabricModule] = useState<any>(null);
  const [fCanvas, setFCanvas] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<"select" | "draw" | "sticker" | "text">("select");
  
  // Brush states
  const [activeBrush, setActiveBrush] = useState<string>("pen");
  const [brushColor, setBrushColor] = useState<string>("#e0a82e"); // vintage gold
  const [brushSize, setBrushSize] = useState<number>(8);
  
  // Text states
  const [textInput, setTextInput] = useState<string>(" ");
  const textFont = "Pacifico";
  const textColor = "#ffffff";

  // History states
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  // 1. First: Compile the baseline composite photo strip on mount
  useEffect(() => {
    if (photos.length === 0) return;

    let active = true;
    let fabricCanvas: any = null;

    const loadImages = async () => {
      return Promise.all(
        photos.map((url) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            if (!url.startsWith("data:")) {
              img.crossOrigin = "anonymous";
            }
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = reject;
          });
        })
      );
    };

    loadImages().then(async (loadedImgs) => {
      if (!active) return;
      // Create off-screen canvas to construct base strip
      const baseCanvas = document.createElement("canvas");
      const ctx = baseCanvas.getContext("2d");
      if (!ctx) return;

      let canvasWidth = 600;
      let canvasHeight = 1800;
      const padding = 30;
      const spacing = 20;

      if (layout.id === "strip-3") {
        canvasWidth = 600;
        canvasHeight = 1600;
      } else if (layout.id === "strip-4") {
        canvasWidth = 600;
        canvasHeight = 2000;
      } else if (layout.id === "strip-6") {
        canvasWidth = 1100;
        canvasHeight = 1600;
      } else if (layout.id === "polaroid") {
        canvasWidth = 900;
        canvasHeight = 1100;
      } else if (layout.id === "grid-square") {
        canvasWidth = 1000;
        canvasHeight = 1050;
      }

      baseCanvas.width = canvasWidth;
      baseCanvas.height = canvasHeight;

      // Draw backdrop
      if (background.startsWith("data:") || background.startsWith("blob:") || background.startsWith("http")) {
        const bgImg = new Image();
        if (background.startsWith("http")) {
          bgImg.crossOrigin = "anonymous";
        }
        bgImg.src = background;
        await new Promise<void>((resolve) => {
          bgImg.onload = () => {
            const scale = Math.max(canvasWidth / bgImg.width, canvasHeight / bgImg.height);
            const x = (canvasWidth - bgImg.width * scale) / 2;
            const y = (canvasHeight - bgImg.height * scale) / 2;
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
            resolve();
          };
          bgImg.onerror = () => resolve();
        });
      } else if (background.startsWith("repeating-")) {
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "#704214";
        for (let i = 0; i < canvasWidth; i += 60) {
          ctx.fillRect(i, 0, 30, canvasHeight);
        }
      } else if (background.startsWith("linear-")) {
        const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        if (background.includes("#2c1a11")) {
          grad.addColorStop(0, "#2c1a11");
          grad.addColorStop(1, "#4a3321");
        } else if (background.includes("#ffd1dc")) {
          grad.addColorStop(0, "#ffd1dc");
          grad.addColorStop(1, "#ffb7c5");
        } else if (background.includes("#ff7e5f")) {
          grad.addColorStop(0, "#ff7e5f");
          grad.addColorStop(1, "#feb47b");
        } else {
          grad.addColorStop(0, "#0f0c20");
          grad.addColorStop(1, "#240b36");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Draw photos and apply non-destructive filters
      const filterPreset = FILTERS.find((f) => f.id === selectedFilter) || FILTERS[0];
      ctx.filter = filterPreset.cssFilter;

      if (layout.id === "strip-3" || layout.id === "strip-4") {
        const photoCount = layout.photoCount;
        const availableHeight = canvasHeight - padding * 2 - spacing * (photoCount - 1);
        const singleHeight = availableHeight / photoCount;
        const singleWidth = canvasWidth - padding * 2;

        loadedImgs.forEach((img, idx) => {
          const x = padding;
          const y = padding + idx * (singleHeight + spacing);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, singleWidth, singleHeight);
          ctx.clip();

          const scale = Math.max(singleWidth / img.width, singleHeight / img.height);
          const ix = x + (singleWidth - img.width * scale) / 2;
          const iy = y + (singleHeight - img.height * scale) / 2;
          ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);
          ctx.restore();

          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, singleWidth, singleHeight);
        });
      } else if (layout.id === "strip-6") {
        const cols = 2;
        const rows = 3;
        const availableWidth = canvasWidth - padding * 2 - spacing;
        const singleWidth = availableWidth / cols;
        const availableHeight = canvasHeight - padding * 2 - spacing * 2;
        const singleHeight = availableHeight / rows;

        loadedImgs.forEach((img, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = padding + col * (singleWidth + spacing);
          const y = padding + row * (singleHeight + spacing);

          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, singleWidth, singleHeight);
          ctx.clip();

          const scale = Math.max(singleWidth / img.width, singleHeight / img.height);
          const ix = x + (singleWidth - img.width * scale) / 2;
          const iy = y + (singleHeight - img.height * scale) / 2;
          ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);
          ctx.restore();

          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, singleWidth, singleHeight);
        });
      } else if (layout.id === "polaroid") {
        const img = loadedImgs[0];
        const singleWidth = canvasWidth - padding * 2;
        const singleHeight = singleWidth;
        const x = padding;
        const y = padding;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, singleWidth, singleHeight);
        ctx.clip();

        const scale = Math.max(singleWidth / img.width, singleHeight / img.height);
        const ix = x + (singleWidth - img.width * scale) / 2;
        const iy = y + (singleHeight - img.height * scale) / 2;
        ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);
        ctx.restore();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, singleWidth, singleHeight);

        // Polaroid bottom note layout spacer
        ctx.filter = "none";
        ctx.font = "italic 32px 'Georgia', serif";
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.textAlign = "center";
        ctx.fillText("memories", canvasWidth / 2, canvasHeight - 75);
      } else if (layout.id === "grid-square") {
        const size = (canvasWidth - padding * 2 - spacing) / 2;
        loadedImgs.forEach((img, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const x = padding + col * (size + spacing);
          const y = padding + row * (size + spacing);

          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, size, size);
          ctx.clip();

          const scale = Math.max(size / img.width, size / img.height);
          const ix = x + (size - img.width * scale) / 2;
          const iy = y + (size - img.height * scale) / 2;
          ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);
          ctx.restore();

          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, size, size);
        });
      }

      ctx.filter = "none";

      // Apply procedural fine paper texture grain
      const noiseCanvas = document.createElement("canvas");
      noiseCanvas.width = 150;
      noiseCanvas.height = 150;
      const noiseCtx = noiseCanvas.getContext("2d")!;
      const noiseData = noiseCtx.createImageData(150, 150);
      for (let i = 0; i < noiseData.data.length; i += 4) {
        const val = Math.floor(Math.random() * 15);
        noiseData.data[i] = val;
        noiseData.data[i + 1] = val;
        noiseData.data[i + 2] = val;
        noiseData.data[i + 3] = 16;
      }
      noiseCtx.putImageData(noiseData, 0, 0);

      const pattern = ctx.createPattern(noiseCanvas, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Initialize Fabric.js dynamic module loading
      const mod = await import("fabric");
      setFabricModule(mod);

      // Create high-res Fabric canvas
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      fabricCanvas = new mod.fabric.Canvas(canvasEl, {
        width: canvasWidth,
        height: canvasHeight,
        isDrawingMode: false,
        backgroundColor: "#1c1917", // fallback backing
      });

      // Load baseline photo strip image as canvas background
      mod.fabric.Image.fromURL(baseCanvas.toDataURL("image/png"), (bgFabricImg: any) => {
        if (!active) {
          if (fabricCanvas) fabricCanvas.dispose();
          return;
        }
        bgFabricImg.set({
          selectable: false,
          evented: false,
          selectable_original: false,
        });
        fabricCanvas.setBackgroundImage(bgFabricImg, fabricCanvas.renderAll.bind(fabricCanvas));
        
        // Track layer structures & set up event hooks
        saveHistoryState(fabricCanvas);
        setFCanvas(fabricCanvas);
        setIsProcessing(false);
      });
    });

    return () => {
      active = false;
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, layout, background, selectedFilter]);

  // History State Logger for Undo / Redo
  const saveHistoryState = useCallback((canvasInstance: any) => {
    if (!canvasInstance) return;
    const json = JSON.stringify(canvasInstance.toJSON());
    
    setHistoryStack((prev) => {
      const sliced = prev.slice(0, historyPointer + 1);
      const nextStack = [...sliced, json];
      setHistoryPointer(nextStack.length - 1);
      return nextStack;
    });
  }, [historyPointer]);

  const broadcastCanvasState = useCallback(() => {
    if (isProcessing || !fCanvas) return;
    const json = JSON.stringify(fCanvas.toJSON());
    if (multiplayerRole === "host") {
      broadcastToGuests({ type: "CANVAS_UPDATE", json });
    } else if (multiplayerRole === "guest") {
      sendGuestAction({ type: "CANVAS_UPDATE", json });
    }
  }, [fCanvas, isProcessing, multiplayerRole, broadcastToGuests, sendGuestAction]);

  const lastSyncTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!fCanvas || !peerCanvasJson || peerCanvasJson.timestamp <= lastSyncTimeRef.current) return;
    lastSyncTimeRef.current = peerCanvasJson.timestamp;
    
    setIsProcessing(true);
    fCanvas.loadFromJSON(peerCanvasJson.json, () => {
      fCanvas.renderAll();
      setIsProcessing(false);
    });
  }, [peerCanvasJson, fCanvas]);

  // Setup Fabric event listeners for history states & object edits
  useEffect(() => {
    if (!fCanvas) return;

    const handleObjectAdded = () => {
      saveHistoryState(fCanvas);
      broadcastCanvasState();
    };

    const handleObjectModified = () => {
      saveHistoryState(fCanvas);
      broadcastCanvasState();
    };

    const handleObjectRemoved = () => {
      broadcastCanvasState();
    };

    fCanvas.on("object:added", handleObjectAdded);
    fCanvas.on("object:modified", handleObjectModified);
    fCanvas.on("object:removed", handleObjectRemoved);

    return () => {
      fCanvas.off("object:added", handleObjectAdded);
      fCanvas.off("object:modified", handleObjectModified);
      fCanvas.off("object:removed", handleObjectRemoved);
    };
  }, [fCanvas, historyPointer, saveHistoryState, broadcastCanvasState]);

  // Sync brush changes & cursors to Fabric drawing engine
  useEffect(() => {
    if (!fCanvas || !fabricModule) return;

    // Deselect any active objects when switching to drawing/sticker/text tools
    if (activeTool !== "select") {
      fCanvas.discardActiveObject().renderAll();
    }

    // Default cursor configurations
    fCanvas.defaultCursor = "default";
    fCanvas.hoverCursor = "move";

    if (activeTool === "draw") {
      fCanvas.isDrawingMode = true;
      const brushPreset = BRUSH_TYPES.find((b) => b.id === activeBrush) || BRUSH_TYPES[0];
      
      // Pencil brush configuration
      const brush = new fabricModule.fabric.PencilBrush(fCanvas);
      brush.width = brushSize || brushPreset.width;
      
      // Format color matching opacity preset (highlighter alpha transparency)
      let finalColor = brushColor;
      if (brushPreset.id === "highlighter") {
        // Hex to RGBA
        const hex = brushColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) || 253;
        const g = parseInt(hex.substring(2, 4), 16) || 224;
        const b = parseInt(hex.substring(4, 6), 16) || 71;
        finalColor = `rgba(${r}, ${g}, ${b}, ${brushPreset.opacity})`;
      } else if (brushPreset.id === "neon") {
        // Apply neon drop shadow glow
        brush.shadow = new fabricModule.fabric.Shadow({
          color: brushColor,
          blur: 15,
          offsetX: 0,
          offsetY: 0
        });
      }
      brush.color = finalColor;
      fCanvas.freeDrawingBrush = brush;

      // Premium dynamic brush circle size cursor
      const size = Math.max(8, brush.width); // Clamp minimum size so it is visible
      const strokeColor = brushPreset.id === "highlighter" ? "rgba(255,255,255,0.7)" : brushColor;
      
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><circle cx='${size/2}' cy='${size/2}' r='${(size/2) - 1}' fill='none' stroke='${strokeColor}' stroke-width='1.5'/></svg>`;
      const cursorUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${size/2} ${size/2}, crosshair`;
      
      fCanvas.freeDrawingCursor = cursorUrl;
      
      if (fCanvas.upperCanvasEl) {
        fCanvas.upperCanvasEl.style.cursor = cursorUrl;
      }
    } else {
      fCanvas.isDrawingMode = false;
      
      let cursorStyle = "default";
      if (activeTool === "text") {
        cursorStyle = "text";
      } else if (activeTool === "sticker") {
        cursorStyle = "cell";
      }
      
      fCanvas.defaultCursor = cursorStyle;
      if (fCanvas.upperCanvasEl) {
        fCanvas.upperCanvasEl.style.cursor = cursorStyle;
      }
    }
  }, [fCanvas, fabricModule, activeTool, activeBrush, brushColor, brushSize]);

  // Listen for guest cooperative annotations
  useEffect(() => {
    if (!fCanvas || !fabricModule || !guestAnnotation) return;

    if (guestAnnotation.type === "sticker") {
      const sticker = new fabricModule.fabric.Text(guestAnnotation.value, {
        fontSize: 70,
        left: fCanvas.width / 2,
        top: fCanvas.height / 2,
        originX: "center",
        originY: "center",
        cornerColor: "#e5e7eb",
        cornerSize: 10,
        transparentCorners: false,
      });

      fCanvas.add(sticker);
      fCanvas.setActiveObject(sticker);
      fCanvas.renderAll();
      saveHistoryState(fCanvas);
      sounds.playShutter();
    } else if (guestAnnotation.type === "text") {
      const text = new fabricModule.fabric.IText(guestAnnotation.value, {
        fontFamily: guestAnnotation.font || "Pacifico",
        fontSize: 36,
        fill: guestAnnotation.color || "#ffffff",
        left: fCanvas.width / 2,
        top: fCanvas.height / 2,
        originX: "center",
        originY: "center",
        cornerColor: "#e5e7eb",
        cornerSize: 10,
        transparentCorners: false,
      });

      fCanvas.add(text);
      fCanvas.setActiveObject(text);
      fCanvas.renderAll();
      saveHistoryState(fCanvas);
      sounds.playShutter();
    }

    setGuestAnnotation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fCanvas, fabricModule, guestAnnotation]);

  // UI Tool Selections
  const handleSelectTool = (tool: "select" | "draw" | "sticker" | "text") => {
    sounds.playClick();
    setActiveTool(tool);
  };

  // Freehand drawing brush presets selection
  const handleSelectBrush = (brushId: string) => {
    sounds.playClick();
    setActiveBrush(brushId);
    const brushPreset = BRUSH_TYPES.find((b) => b.id === brushId);
    if (brushPreset) {
      setBrushSize(brushPreset.width);
    }
  };

  // Adds sticker emoji to active workspace center
  const handleAddSticker = (emoji: string) => {
    if (!fCanvas || !fabricModule) return;
    sounds.playClick();

    const sticker = new fabricModule.fabric.Text(emoji, {
      fontSize: 70,
      left: fCanvas.width / 2,
      top: fCanvas.height / 2,
      originX: "center",
      originY: "center",
      cornerColor: "#e5e7eb",
      cornerSize: 10,
      transparentCorners: false,
    });

    fCanvas.add(sticker);
    fCanvas.setActiveObject(sticker);
    fCanvas.renderAll();
  };

  // Adds jagged translucent washi tape strip to canvas
  const handleAddWashiTape = (color: string, patternType: "solid" | "grid" | "stripes") => {
    if (!fCanvas || !fabricModule) return;
    sounds.playClick();

    // Standard horizontal tape dimensions: 150 wide x 36 high
    const pathStr = "M 5 0 L 0 6 L 4 12 L 0 18 L 4 24 L 0 30 L 5 36 L 145 36 L 140 30 L 144 24 L 140 18 L 144 12 L 140 6 L 145 0 Z";
    
    let tapeFill: any = color;

    if (patternType === "grid") {
      const patternCanvas = document.createElement("canvas");
      patternCanvas.width = 12;
      patternCanvas.height = 12;
      const pCtx = patternCanvas.getContext("2d")!;
      pCtx.fillStyle = color;
      pCtx.fillRect(0, 0, 12, 12);
      pCtx.strokeStyle = "rgba(0,0,0,0.15)";
      pCtx.lineWidth = 1;
      pCtx.strokeRect(0, 0, 12, 12);
      
      tapeFill = new fabricModule.fabric.Pattern({
        source: patternCanvas,
        repeat: "repeat"
      });
    } else if (patternType === "stripes") {
      const patternCanvas = document.createElement("canvas");
      patternCanvas.width = 12;
      patternCanvas.height = 12;
      const pCtx = patternCanvas.getContext("2d")!;
      pCtx.fillStyle = color;
      pCtx.fillRect(0, 0, 12, 12);
      pCtx.strokeStyle = "rgba(0,0,0,0.15)";
      pCtx.lineWidth = 2.5;
      pCtx.beginPath();
      pCtx.moveTo(0, 12);
      pCtx.lineTo(12, 0);
      pCtx.stroke();

      tapeFill = new fabricModule.fabric.Pattern({
        source: patternCanvas,
        repeat: "repeat"
      });
    }

    const tape = new fabricModule.fabric.Path(pathStr, {
      fill: tapeFill,
      opacity: 0.72,
      left: fCanvas.width / 2,
      top: fCanvas.height / 2,
      originX: "center",
      originY: "center",
      cornerColor: "#e5e7eb",
      cornerSize: 10,
      transparentCorners: false,
      scaleX: 1.2,
      scaleY: 1.2,
    });

    fCanvas.add(tape);
    fCanvas.setActiveObject(tape);
    fCanvas.renderAll();
  };

  // Adds customizable text box to active workspace center
  const handleAddText = () => {
    if (!fCanvas || !fabricModule || !textInput.trim()) return;
    sounds.playClick();

    const text = new fabricModule.fabric.IText(textInput, {
      fontFamily: textFont,
      fontSize: 36,
      fill: textColor,
      left: fCanvas.width / 2,
      top: fCanvas.height / 2,
      originX: "center",
      originY: "center",
      cornerColor: "#e5e7eb",
      cornerSize: 10,
      transparentCorners: false,
    });

    fCanvas.add(text);
    fCanvas.setActiveObject(text);
    fCanvas.renderAll();
    setTextInput("");
  };

  // Adds distressed red ink date stamp to canvas
  const handleAddDateStamp = () => {
    if (!fCanvas || !fabricModule) return;
    sounds.playClick();

    const now = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const dateStr = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, "0")}, ${now.getFullYear()}`;

    const dateStamp = new fabricModule.fabric.Text(dateStr, {
      fontFamily: "Courier New",
      fontWeight: "bold",
      fontSize: 22,
      fill: "rgba(220, 38, 38, 0.72)", // distressed red ink
      left: fCanvas.width / 2,
      top: fCanvas.height / 2,
      originX: "center",
      originY: "center",
      angle: -8 + Math.random() * 16, // random hand stamp tilt angle
      cornerColor: "#e5e7eb",
      cornerSize: 10,
      transparentCorners: false,
    });

    fCanvas.add(dateStamp);
    fCanvas.setActiveObject(dateStamp);
    fCanvas.renderAll();
  };

  // Undo / Redo mechanics
  const handleUndo = () => {
    if (!fCanvas || historyPointer <= 0) return;
    sounds.playClick();
    
    const prevPointer = historyPointer - 1;
    setHistoryPointer(prevPointer);
    
    const stateJson = historyStack[prevPointer];
    setIsProcessing(true);
    fCanvas.loadFromJSON(stateJson, () => {
      fCanvas.renderAll();
      setIsProcessing(false);
    });
  };

  const handleRedo = () => {
    if (!fCanvas || historyPointer >= historyStack.length - 1) return;
    sounds.playClick();
    
    const nextPointer = historyPointer + 1;
    setHistoryPointer(nextPointer);
    
    const stateJson = historyStack[nextPointer];
    setIsProcessing(true);
    fCanvas.loadFromJSON(stateJson, () => {
      fCanvas.renderAll();
      setIsProcessing(false);
    });
  };

  // Finalizes edit outputs at high-res multi-factor DPI
  const handleFinishEditing = () => {
    if (!fCanvas) return;
    sounds.playClick();
    
    // Clear active selection borders prior to screenshot capture
    fCanvas.discardActiveObject();
    fCanvas.renderAll();

    // Export with high scale factor multiplier to keep original 300 DPI resolution
    const dataUrl = fCanvas.toDataURL({
      format: "png",
      quality: 1,
    });
    
    setEditedStripUrl(dataUrl);
    onNext(dataUrl);
  };

  // WebRTC Live face-to-face floating bubble
  const renderLiveCallBubble = () => {
    if (multiplayerRole !== "host" && multiplayerRole !== "guest") return null;
    if (!localStream && !remoteStream) return null;

    return (
      <div className="fixed top-20 right-6 z-50 bg-stone-900/90 border border-stone-800 rounded-2xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col gap-1.5 backdrop-blur animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-1.5 justify-between px-1">
          <span className="text-[6px] font-mono tracking-widest text-amber-500 font-bold uppercase">LIVE CABIN CALL</span>
          <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
        </div>
        
        <div className="flex gap-1.5">
          {/* My Video */}
          <div className="w-12 h-12 rounded overflow-hidden border border-stone-850 bg-stone-950 relative">
            {localStream ? (
              <video
                ref={(el) => {
                  if (el) el.srcObject = localStream;
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full bg-stone-950" />
            )}
            <span className="absolute bottom-0.5 left-0.5 bg-stone-950/70 text-[5px] px-0.5 rounded font-bold text-stone-300">You</span>
          </div>

          {/* Peer Video */}
          <div className="w-12 h-12 rounded overflow-hidden border border-stone-850 bg-stone-950 relative">
            {remoteStream ? (
              <video
                ref={(el) => {
                  if (el) el.srcObject = remoteStream;
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-950 text-stone-600 text-[5px] font-semibold">
                Offline
              </div>
            )}
            <span className="absolute bottom-0.5 left-0.5 bg-stone-950/70 text-[5px] px-0.5 rounded font-bold text-stone-300">
              {multiplayerRole === "host" ? guestLobbyName : hostLobbyName}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col items-center justify-start min-h-[88vh] relative select-none">
      {renderLiveCallBubble()}
      
      {/* Editor Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-stone-400 hover:text-stone-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          &larr; Back
        </button>

        <h2 className="text-sm font-sans tracking-widest font-bold text-stone-400 uppercase">
          Retro Scrapbook
        </h2>

        {/* Exporter Button in top right */}
        <button
          onClick={handleFinishEditing}
          disabled={isProcessing}
          className="px-4 py-2 border border-stone-800 hover:bg-stone-900 bg-stone-950 rounded-lg text-xs font-mono tracking-wider font-bold text-stone-200 cursor-pointer disabled:opacity-40 transition-colors uppercase"
        >
          finish ▷
        </button>
      </div>

      {/* Main Single-Column centered layout */}
      <div className="flex flex-col items-center gap-5 w-full">
        
        {/* Canvas Card */}
        <div ref={containerRef} className="w-full flex flex-col items-center justify-center p-4 bg-stone-900/20 border border-stone-850 rounded-3xl shadow-inner relative overflow-hidden" style={{ touchAction: "none" }}>
          
          {/* Vintage Lamp Glow */}
          <div className="absolute top-0 w-80 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Loader */}
          {isProcessing && (
            <div className="absolute inset-0 bg-stone-950/90 z-20 flex flex-col items-center justify-center rounded-3xl">
              <div className="w-10 h-10 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin mb-3" />
              <span className="text-xs text-stone-400 font-semibold animate-pulse">Exposing photo strip...</span>
            </div>
          )}

          {/* Canvas Wrapper */}
          <div
            className="shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-stone-300/40 bg-stone-100 rounded-sm overflow-hidden"
            style={{
              touchAction: "none",
              width: "250px",
              height:
                layout.id === "strip-3"
                  ? "666px"
                  : layout.id === "strip-4"
                  ? "833px"
                  : layout.id === "strip-6"
                  ? "363px"
                  : layout.id === "polaroid"
                  ? "305px"
                  : "262px",
            }}
          >
            {/* Fabric element */}
            <div className="transform scale-[0.4166667] origin-top-left" style={{ width: "600px", height: "100%" }}>
              <canvas id="fabric-editor" ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Small floating actions bar: Undo, Redo, and Delete Selected */}
        <div className="flex gap-4 bg-stone-900/60 border border-stone-850 px-4 py-2 rounded-2xl shadow w-full max-w-[285px] justify-around items-center">
          <button
            onClick={handleUndo}
            disabled={historyPointer <= 0 || isProcessing}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={historyPointer >= historyStack.length - 1 || isProcessing}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Delete active selected sticker/object */}
          <button
            onClick={() => {
              if (!fCanvas) return;
              const activeObject = fCanvas.getActiveObject();
              if (activeObject) {
                sounds.playClick();
                fCanvas.remove(activeObject);
                fCanvas.discardActiveObject().renderAll();
              }
            }}
            className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
            aria-label="Delete selected layer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* The Pill Selectors (Stickers | Draw) */}
        <div className="flex border border-stone-850 bg-stone-900/60 p-1.5 rounded-full w-full max-w-[285px] justify-center gap-1 shadow-inner">
          <button
            onClick={() => handleSelectTool("sticker")}
            className={`px-6 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              activeTool === "sticker" || activeTool === "select" || activeTool === "text"
                ? "bg-white text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Smile className="w-3.5 h-3.5" /> Stickers
          </button>
          <button
            onClick={() => handleSelectTool("draw")}
            className={`px-6 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              activeTool === "draw"
                ? "bg-white text-stone-950 shadow"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Brush className="w-3.5 h-3.5" /> Draw
          </button>
        </div>

        {/* Active Tool Sub-Panel Tray */}
        <div className="w-full max-w-xl bg-stone-900/30 border border-stone-850 rounded-3xl p-4 shadow-xl">
          
          {/* STICKERS TRAY (contains Emojis, Washi Tapes, Stamp, and custom Text Input) */}
          {(activeTool === "sticker" || activeTool === "select" || activeTool === "text") && (
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Insert Stickers, Text, & Tape</span>
              
              <div className="w-full overflow-x-auto py-2 flex gap-4 px-2 items-center justify-start scrollbar-thin">
                {/* 1. Custom Text Input card */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-850 p-2 rounded-xl flex-shrink-0 h-14">
                  <input
                    type="text"
                    placeholder="type word..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                    className="w-[100px] bg-transparent border-none text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none"
                  />
                  <button
                    onClick={handleAddText}
                    disabled={!textInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-white text-stone-950 font-bold text-[9px] uppercase tracking-wider cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    add
                  </button>
                </div>

                {/* 2. Ink Date Stamp button */}
                <button
                  onClick={handleAddDateStamp}
                  className="h-14 px-4 border border-stone-800 bg-stone-950 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-900 flex-shrink-0 select-none text-[9px] font-bold text-stone-200 gap-1"
                >
                  <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>Stamp Date</span>
                </button>

                {/* 3. Classic Emojis */}
                {EMOJI_STICKERS.map((emoji, idx) => (
                  <button
                    key={`emoji-${idx}`}
                    onClick={() => handleAddSticker(emoji)}
                    className="w-14 h-14 rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-800 text-2xl flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}

                {/* 4. Torn Washi Tapes */}
                {WASHI_TAPES.map((tape, idx) => (
                  <button
                    key={`tape-${idx}`}
                    onClick={() => handleAddWashiTape(tape.color, tape.pattern as any)}
                    className="h-14 w-28 rounded-xl border border-stone-800 flex flex-col items-center justify-center cursor-pointer hover:border-stone-600 transition-colors text-[9px] font-mono font-bold text-stone-900 relative overflow-hidden flex-shrink-0 select-none"
                    style={{
                      backgroundColor: tape.color,
                      opacity: 0.85,
                    }}
                  >
                    {tape.pattern === "grid" && (
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,0,0,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:5px_5px]" />
                    )}
                    {tape.pattern === "stripes" && (
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(0,0,0,1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,1)_50%,rgba(0,0,0,1)_75%,transparent_75%,transparent)] bg-[size:6px_6px]" />
                    )}
                    <span className="relative z-10 drop-shadow-sm opacity-60 font-mono uppercase tracking-wider">{tape.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DOODLE BRUSH TRAY */}
          {activeTool === "draw" && (
            <div className="flex flex-col gap-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Brush & Color settings</span>
              
              <div className="w-full overflow-x-auto py-2 flex gap-4 px-2 items-center justify-start scrollbar-thin">
                {/* 1. Stroke color circular picker block */}
                <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 p-2.5 rounded-xl h-14 flex-shrink-0">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-800 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-stone-400 uppercase">{brushColor}</span>
                </div>

                {/* 2. Brush size range container */}
                <div className="flex flex-col gap-1 justify-center bg-stone-950 border border-stone-800 p-2.5 rounded-xl h-14 flex-shrink-0 min-w-[130px]">
                  <div className="flex justify-between text-[8px] text-stone-450 font-bold uppercase tracking-wider">
                    <span>Brush Size</span>
                    <span className="text-amber-500 font-bold">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* 3. Brush presets */}
                {BRUSH_TYPES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBrush(b.id)}
                    className={`h-14 px-4 rounded-xl text-xs font-mono tracking-wide uppercase border transition-all cursor-pointer flex-shrink-0 flex items-center justify-center ${
                      activeBrush === b.id
                        ? "bg-stone-200 border-stone-300 text-stone-950 font-bold"
                        : "bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
