"use client";

import React, { useEffect, useRef, useState } from "react";
import { useBooth, FILTERS } from "@/contexts/BoothContext";
import { sounds } from "@/lib/sounds";
import { Download, Clipboard, RefreshCw, LogOut, Printer, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function PrinterAnimation({ onExit }: { onExit: () => void }) {
  const { photos, layout, background, selectedFilter, editedStripUrl, resetSession } = useBooth();
  const [isDeveloping, setIsDeveloping] = useState(true);
  const [printProgress, setPrintProgress] = useState(0);
  const [compositeUrl, setCompositeUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");

  // Run the developing animation and trigger printer sound
  useEffect(() => {
    sounds.playPrinter(5); // Play synthetic gear wind sound for 5s
    
    const interval = setInterval(() => {
      setPrintProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDeveloping(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Composite the final image when photos are loaded
  useEffect(() => {
    if (editedStripUrl) {
      setCompositeUrl(editedStripUrl);
      return;
    }

    if (photos.length === 0) return;
    
    // Create image objects for all captured frames to render them on canvas
    const loadImages = async () => {
      const promises = photos.map((url) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          if (!url.startsWith("data:")) {
            img.crossOrigin = "anonymous";
          }
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      });
      return Promise.all(promises);
    };

    loadImages().then((loadedImgs) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Define dimensions at 300 DPI (approx 2"x6" for strip)
      let canvasWidth = 600;
      let canvasHeight = 1800;
      const padding = 30; // outer margin
      const spacing = 20; // photo gaps

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

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 1. Draw Backdrop
      if (background.startsWith("data:") || background.startsWith("blob:") || background.startsWith("http")) {
        // Draw custom image backdrop
        const bgImg = new Image();
        if (background.startsWith("http")) {
          bgImg.crossOrigin = "anonymous";
        }
        bgImg.src = background;
        bgImg.onload = () => {
          // Cover logic
          const scale = Math.max(canvasWidth / bgImg.width, canvasHeight / bgImg.height);
          const x = (canvasWidth - bgImg.width * scale) / 2;
          const y = (canvasHeight - bgImg.height * scale) / 2;
          ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          drawPhotosAndTexture();
        };
      } else if (background.startsWith("repeating-")) {
        // Simple procedural background drawing
        ctx.fillStyle = "#8b5a2b"; // fallback retro wood brown
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // draw vertical striped wallpaper style
        ctx.fillStyle = "#704214";
        for (let i = 0; i < canvasWidth; i += 60) {
          ctx.fillRect(i, 0, 30, canvasHeight);
        }
        drawPhotosAndTexture();
      } else if (background.startsWith("linear-")) {
        // Draw linear gradient
        const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        if (background.includes("#2c1a11")) { // vintage cafe
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
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawPhotosAndTexture();
      } else {
        // Solid color
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawPhotosAndTexture();
      }

      function drawPhotosAndTexture() {
        if (!ctx || !canvas) return;
        // 2. Set Filter
        const filterPreset = FILTERS.find((f) => f.id === selectedFilter) || FILTERS[0];
        ctx.filter = filterPreset.cssFilter;

        // 3. Draw Photos based on layout
        if (layout.id === "strip-3" || layout.id === "strip-4") {
          const photoCount = layout.photoCount;
          const availableHeight = canvasHeight - padding * 2 - spacing * (photoCount - 1);
          const singleHeight = availableHeight / photoCount;
          const singleWidth = canvasWidth - padding * 2;

          loadedImgs.forEach((img, idx) => {
            const x = padding;
            const y = padding + idx * (singleHeight + spacing);
            
            // Draw image cropped to layout aspect ratio
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, singleWidth, singleHeight);
            ctx.clip();
            
            const scale = Math.max(singleWidth / img.width, singleHeight / img.height);
            const ix = x + (singleWidth - img.width * scale) / 2;
            const iy = y + (singleHeight - img.height * scale) / 2;
            ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);
            
            ctx.restore();

            // Draw a subtle retro frame border around the photo
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

            ctx.strokeStyle = "rgba(0,0,0,0.4)";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, singleWidth, singleHeight);
          });
        } else if (layout.id === "polaroid") {
          const img = loadedImgs[0];
          const singleWidth = canvasWidth - padding * 2;
          const singleHeight = singleWidth; // square
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

          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, singleWidth, singleHeight);

          // bottom note section text simulator
          ctx.filter = "none";
          ctx.font = "italic 32px 'Georgia', serif";
          ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
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

            ctx.strokeStyle = "rgba(0,0,0,0.4)";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, size, size);
          });
        }

        // Reset filter context
        ctx.filter = "none";

        // 4. Generate fine paper grain texture overlay
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
          noiseData.data[i + 3] = 18; // low alpha noise opacity
        }
        noiseCtx.putImageData(noiseData, 0, 0);

        const pattern = ctx.createPattern(noiseCanvas, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Convert finalized canvas graphics to in-memory URL
        setCompositeUrl(canvas.toDataURL("image/png"));
      }
    });
  }, [photos, layout, background, selectedFilter, editedStripUrl]);

  const handleDownload = () => {
    if (!compositeUrl) return;
    
    // Play shutter sound on download click as physical validation
    sounds.playShutter();

    const link = document.createElement("a");
    link.href = compositeUrl;
    link.download = `photobooth_strip_${Date.now()}.${exportFormat === "png" ? "png" : "jpg"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Confetti explosion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#d97706", "#fff", "#1c1917"],
    });
  };

  const handleCopyToClipboard = async () => {
    if (!compositeUrl) return;
    sounds.playClick();
    try {
      const response = await fetch(compositeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      confetti({
        particleCount: 30,
        spread: 30,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error("Could not copy strip to clipboard:", err);
    }
  };

  // Launch browser native print window to allow printing/saving as PDF
  const handlePrintOrPDF = () => {
    sounds.playClick();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Photo Strip</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
            }
            img {
              max-width: 100%;
              max-height: 98vh;
              object-fit: contain;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            @page {
              size: auto;
              margin: 0mm;
            }
          </style>
        </head>
        <body>
          <img src="${compositeUrl}" />
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[85vh] relative">
      {/* Developing Animation */}
      {isDeveloping ? (
        <div className="flex flex-col items-center text-center py-12">
          {/* Chamber glow indicator */}
          <div className="relative w-40 h-10 bg-stone-900 border border-stone-850 rounded-lg flex items-center justify-center shadow-inner overflow-hidden mb-8">
            <div
              style={{ width: `${printProgress}%` }}
              className="absolute left-0 top-0 bottom-0 bg-red-600/30 transition-all duration-100 ease-linear"
            />
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-500 z-10 animate-pulse flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 animate-bounce" /> Developing Film...
            </span>
          </div>

          <div className="w-64 h-80 bg-stone-900/60 border border-stone-850 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
            {/* Sliding animation representing emerging paper */}
            <motion.div
              initial={{ y: 250 }}
              animate={{ y: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              className="w-36 h-72 bg-stone-100 rounded shadow-md border-x-4 border-t-4 border-stone-300 p-2 flex flex-col gap-1.5"
            >
              <div className="w-full aspect-[4/3] bg-stone-200 animate-pulse rounded" />
              <div className="w-full aspect-[4/3] bg-stone-200 animate-pulse rounded" />
              <div className="w-full aspect-[4/3] bg-stone-200 animate-pulse rounded" />
            </motion.div>
          </div>
          <p className="text-stone-500 text-xs mt-6 tracking-wide italic">
            Please wait while the photographic silver halide particles stabilize.
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Developed Successfully
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-100">Your Photo Strip is Ready!</h2>
            <p className="text-stone-400 text-xs mt-1">Your photo exists only in-memory and will be deleted once you close or reload.</p>
          </div>

          {/* Canvas placeholder */}

          {/* Photo Strip Frame Preview with shadow & physical paper feeling */}
          <div className="max-w-[260px] w-full bg-stone-950/40 p-4 border border-stone-850 rounded-2xl shadow-2xl mb-8 flex justify-center">
            {compositeUrl && (
              <div className="w-48 shadow-2xl border border-stone-300/40 bg-stone-100 rounded-sm p-1.5 transform hover:rotate-1 transition-transform duration-300 relative select-none">
                {/* Print paper shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                <img
                  src={compositeUrl}
                  alt="Final photo strip"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

          {/* Export Configurations & Actions */}
          <div className="w-full max-w-md bg-stone-900/40 border border-stone-850 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            
            {/* Format Toggles */}
            <div className="flex justify-between items-center bg-stone-950 p-1.5 rounded-lg border border-stone-800">
              <span className="text-xs text-stone-400 font-bold ml-2 uppercase">File Type</span>
              <div className="flex gap-1.5">
                {(["png", "jpeg"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      sounds.playClick();
                      setExportFormat(fmt);
                    }}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                      exportFormat === fmt
                        ? "bg-amber-500 text-stone-950"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Action grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Download */}
              <button
                onClick={handleDownload}
                className="col-span-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all transform active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4.5 h-4.5" /> Download Photo Strip
              </button>

              {/* Copy */}
              <button
                onClick={handleCopyToClipboard}
                className="py-2.5 px-4 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-semibold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clipboard className="w-4 h-4" />
                {copySuccess ? "Copied!" : "Copy Strip"}
              </button>

              {/* PDF/Print */}
              <button
                onClick={handlePrintOrPDF}
                className="py-2.5 px-4 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-semibold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Save as PDF / Print
              </button>
            </div>

            {/* Navigation options */}
            <div className="flex gap-3 mt-2 border-t border-stone-800/80 pt-4 justify-between">
              {/* Take Another */}
              <button
                onClick={() => {
                  sounds.playClick();
                  resetSession();
                }}
                className="py-2 px-3 text-stone-400 hover:text-stone-200 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Shoot Again
              </button>

              {/* Exit curtain */}
              <button
                onClick={() => {
                  sounds.playClick();
                  onExit();
                }}
                className="py-2 px-4 rounded-lg bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 text-red-400 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Exit Booth
              </button>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
