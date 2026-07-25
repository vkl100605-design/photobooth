/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useBooth, FILTERS } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import {
  Undo2,
  Redo2,
  Trash2,
  Palette,
  Type,
  Smile,
  Brush,
  MousePointer,
  ChevronUp,
  ChevronDown,
  ArrowRight
} from "lucide-react";

// Pre-defined font options for typography choices
const FONTS = [
  { id: "Georgia", name: "Vintage Serif" },
  { id: "Pacifico", name: "Handwritten Pacifico" },
  { id: "Caveat", name: "Cursive Caveat" },
  { id: "Courier New", name: "Classic Typewriter" },
  { id: "Impact", name: "Retro Bold" },
];

const EMOJI_STICKERS = [
  "❤️", "💖", "✨", "⭐", "🕶️", "👑", "🎩", "🎀", "💬", "🎈", "🎉", "🌸", "🍀", "🍕", "🍦", "👽", "🐱", "🐶", "🐻", "🦄"
];

const BRUSH_TYPES = [
  { id: "pen", name: "Fine Pen", width: 4, opacity: 1 },
  { id: "brush", name: "Art Brush", width: 10, opacity: 1 },
  { id: "marker", name: "Round Marker", width: 22, opacity: 1 },
  { id: "highlighter", name: "Highlighter", width: 32, opacity: 0.35 },
];

export default function Editor({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const {
    photos,
    layout,
    background,
    selectedFilter,
    setEditedStripUrl,
    guestAnnotation,
    setGuestAnnotation,
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
  const [textInput, setTextInput] = useState<string>("");
  const [textFont, setTextFont] = useState<string>("Pacifico");
  const [textColor, setTextColor] = useState<string>("#ffffff");

  // Layers & History states
  const [canvasLayers, setCanvasLayers] = useState<any[]>([]);
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
        updateLayersList(fabricCanvas);
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

  const updateLayersList = useCallback((canvasInstance: any) => {
    if (!canvasInstance) return;
    // Get objects and reverse to show top layers first
    const list = [...canvasInstance.getObjects()].reverse();
    setCanvasLayers(list);
  }, []);

  // Setup Fabric event listeners for layers lists & object edits
  useEffect(() => {
    if (!fCanvas) return;

    const handleObjectAdded = () => {
      updateLayersList(fCanvas);
      saveHistoryState(fCanvas);
    };

    const handleObjectModified = () => {
      updateLayersList(fCanvas);
      saveHistoryState(fCanvas);
    };

    const handleObjectRemoved = () => {
      updateLayersList(fCanvas);
    };

    fCanvas.on("object:added", handleObjectAdded);
    fCanvas.on("object:modified", handleObjectModified);
    fCanvas.on("object:removed", handleObjectRemoved);

    return () => {
      fCanvas.off("object:added", handleObjectAdded);
      fCanvas.off("object:modified", handleObjectModified);
      fCanvas.off("object:removed", handleObjectRemoved);
    };
  }, [fCanvas, historyPointer, saveHistoryState, updateLayersList]);

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

  // Layer manipulations
  const layerMoveUp = (obj: any) => {
    sounds.playClick();
    obj.bringForward();
    fCanvas.renderAll();
    updateLayersList(fCanvas);
  };

  const layerMoveDown = (obj: any) => {
    sounds.playClick();
    obj.sendBackwards();
    fCanvas.renderAll();
    updateLayersList(fCanvas);
  };

  const layerDelete = (obj: any) => {
    sounds.playClick();
    fCanvas.remove(obj);
    fCanvas.renderAll();
    updateLayersList(fCanvas);
    saveHistoryState(fCanvas);
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
      updateLayersList(fCanvas);
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
      updateLayersList(fCanvas);
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
    onNext();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 flex flex-col items-center justify-start min-h-[88vh] relative select-none">
      
      {/* Editor Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-stone-400 hover:text-stone-200 transition-colors text-sm font-semibold cursor-pointer"
        >
          &larr; Back
        </button>

        <h2 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-1.5">
          <Palette className="w-4.5 h-4.5 text-amber-500 animate-pulse" /> Retro Doodling Cabin
        </h2>

        {/* Undo/Redo Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={historyPointer <= 0 || isProcessing}
            className="p-2 rounded-lg bg-stone-900 border border-stone-850 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyPointer >= historyStack.length - 1 || isProcessing}
            className="p-2 rounded-lg bg-stone-900 border border-stone-850 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full items-start">
        
        {/* Sidebar Controls (left-2 columns) */}
        <div className="md:col-span-1 flex flex-col gap-4">
          
          {/* Tool Navigation Selection */}
          <div className="bg-stone-900/40 border border-stone-850 p-3 rounded-2xl flex md:flex-col justify-around gap-2 shadow-inner">
            <button
              onClick={() => handleSelectTool("select")}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer border transition-colors flex-1 md:flex-initial ${
                activeTool === "select"
                  ? "bg-amber-500 text-stone-950 border-amber-500"
                  : "bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900"
              }`}
            >
              <MousePointer className="w-4.5 h-4.5" />
              <span>Select</span>
            </button>
            <button
              onClick={() => handleSelectTool("draw")}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer border transition-colors flex-1 md:flex-initial ${
                activeTool === "draw"
                  ? "bg-amber-500 text-stone-950 border-amber-500"
                  : "bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900"
              }`}
            >
              <Brush className="w-4.5 h-4.5" />
              <span>Doodle</span>
            </button>
            <button
              onClick={() => handleSelectTool("sticker")}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer border transition-colors flex-1 md:flex-initial ${
                activeTool === "sticker"
                  ? "bg-amber-500 text-stone-950 border-amber-500"
                  : "bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900"
              }`}
            >
              <Smile className="w-4.5 h-4.5" />
              <span>Stickers</span>
            </button>
            <button
              onClick={() => handleSelectTool("text")}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer border transition-colors flex-1 md:flex-initial ${
                activeTool === "text"
                  ? "bg-amber-500 text-stone-950 border-amber-500"
                  : "bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900"
              }`}
            >
              <Type className="w-4.5 h-4.5" />
              <span>Letters</span>
            </button>
          </div>

          {/* Sub-Panel: Brush Draw settings */}
          {activeTool === "draw" && (
            <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-2xl shadow-lg flex flex-col gap-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Brush Settings</span>
              
              {/* Preset Brushes */}
              <div className="grid grid-cols-2 gap-2">
                {BRUSH_TYPES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelectBrush(b.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      activeBrush === b.id
                        ? "bg-stone-800 border-amber-500 text-amber-400"
                        : "bg-stone-950 border-stone-800 text-stone-400"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {/* Size Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-stone-400 font-medium">
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

              {/* Brush Color Picker */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-stone-400 font-medium">Stroke Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-8 h-8 rounded border border-stone-800 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-stone-400 uppercase font-mono font-bold">{brushColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Panel: Stickers List */}
          {activeTool === "sticker" && (
            <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-2xl shadow-lg flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Stickers Pack</span>
              <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {EMOJI_STICKERS.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddSticker(emoji)}
                    className="aspect-square rounded-lg bg-stone-950 hover:bg-stone-850 border border-stone-800 text-2xl flex items-center justify-center cursor-pointer transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Panel: Text Editor */}
          {activeTool === "text" && (
            <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-2xl shadow-lg flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Letters Panel</span>
              <input
                type="text"
                placeholder="Type word..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
              />

              {/* Fonts */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Select Font</span>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-300 p-2 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id} className="bg-stone-950 font-serif">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Color */}
              <div className="flex justify-between items-center border-t border-stone-800/80 pt-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded border border-stone-800 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-stone-400 uppercase">{textColor}</span>
                </div>

                <button
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  className="py-1.5 px-3 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Insert
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Canvas Display Desk (center-2 columns) */}
        <div ref={containerRef} className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-stone-950/20 border border-stone-850/60 rounded-3xl shadow-inner relative overflow-hidden" style={{ touchAction: "none" }}>
          
          {/* Desk Vintage Lamp Glow */}
          <div className="absolute top-0 w-80 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Loader */}
          {isProcessing && (
            <div className="absolute inset-0 bg-stone-950/90 z-20 flex flex-col items-center justify-center rounded-3xl">
              <div className="w-10 h-10 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin mb-3" />
              <span className="text-xs text-stone-400 font-semibold animate-pulse">Exposing photo strip...</span>
            </div>
          )}

          {/* Scale Box Wrapper to shrink canvas container layout dynamically */}
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
                  ? "363px" // double wide
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

          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest mt-4">
            Interactive Scrapbook (600x1800 DPI Scale)
          </span>
        </div>

        {/* Layers & Exporter Panel (right-1 column) */}
        <div className="md:col-span-1 flex flex-col gap-4 self-stretch">
          
          {/* Layers Manager */}
          <div className="flex-1 flex flex-col bg-stone-900/40 border border-stone-850 rounded-2xl p-4 shadow-lg h-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3 border-b border-stone-850 pb-2">
              Layers List ({canvasLayers.length})
            </span>

            {canvasLayers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-30 text-stone-500">
                <Type className="w-7 h-7 mb-2 stroke-1" />
                <p className="text-[10px] uppercase font-bold tracking-wider">No Layers</p>
                <p className="text-[9px] mt-1 max-w-[120px]">Stickers, doodles, and text boxes will appear as separate layers.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[30vh] md:max-h-[36vh] pr-1 py-1">
                {canvasLayers.map((obj, index) => {
                  const isTextObj = obj.type === "text" || obj.type === "i-text";
                  const label = isTextObj
                    ? `Text: "${obj.text.substring(0, 10)}${obj.text.length > 10 ? "..." : ""}"`
                    : obj.type === "path"
                    ? "Doodle Stroke"
                    : `Sticker (${obj.text})`;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-xl bg-stone-950 border border-stone-850 text-[10px] font-medium"
                    >
                      <span className="text-stone-300 truncate max-w-[80px]" title={label}>
                        {label}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {/* Layer order re-order buttons */}
                        <button
                          onClick={() => layerMoveUp(obj)}
                          className="p-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 cursor-pointer"
                          aria-label="Bring Forward"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => layerMoveDown(obj)}
                          className="p-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 cursor-pointer"
                          aria-label="Send Backward"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {/* Delete layer object */}
                        <button
                          onClick={() => layerDelete(obj)}
                          className="p-1 rounded bg-stone-900 border border-red-900/30 text-red-400 hover:bg-red-950/20 cursor-pointer ml-1"
                          aria-label="Delete layer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export action */}
          <button
            onClick={handleFinishEditing}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            Finish & Print <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
