"use client";

import { useState, useCallback, useRef } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // If stream already exists, stop it first to prevent leaks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
      setStream(null);
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false, // Photobooth only requires webcam video, no mic needed for normal mode
      };

      if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevicesNotSupported");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.warn("Camera access warning:", err);
      const errorVal = err as Error;
      if (errorVal.message === "MediaDevicesNotSupported") {
        setError("Your browser does not support camera access, or you are running in an insecure context (HTTP). To allow camera access, use localhost or an HTTPS connection.");
      } else if (errorVal.name === "NotAllowedError" || errorVal.name === "PermissionDeniedError") {
        setError("Camera permission denied. Please grant permission in your browser settings to enter the photobooth.");
      } else if (errorVal.name === "NotFoundError" || errorVal.name === "DevicesNotFoundError") {
        setError("No camera device found. Please connect a webcam to use the photobooth.");
      } else {
        setError("Could not access the camera. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
    setStream(null);
    setError(null);
  }, []);

  return {
    stream,
    error,
    isLoading,
    startCamera,
    stopCamera,
  };
}
