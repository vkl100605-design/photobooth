/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { sounds } from "@/lib/sounds";

export type BoothStep =
  | "landing"
  | "choose-mode"
  | "frame-select"
  | "bg-select"
  | "camera"
  | "filters"
  | "edit"
  | "preview"
  | "print"
  | "done";

export type BoothMode = "normal" | "connect";

export interface FrameLayout {
  id: string;
  name: string;
  photoCount: number;
  aspectRatio: number; // width / height of individual photos
  description: string;
}

export const FRAME_LAYOUTS: FrameLayout[] = [
  { id: "strip-3", name: "3-Photo Strip", photoCount: 3, aspectRatio: 4 / 3, description: "Classic vertical 3-shot strip" },
  { id: "strip-4", name: "4-Photo Strip", photoCount: 4, aspectRatio: 4 / 3, description: "Traditional photo booth vertical strip" },
  { id: "strip-6", name: "6-Photo Grid", photoCount: 6, aspectRatio: 4 / 3, description: "2x3 grid of vintage memories" },
  { id: "polaroid", name: "Polaroid Style", photoCount: 1, aspectRatio: 1, description: "Single retro square frame with space for handwriting" },
  { id: "grid-square", name: "4-Photo Grid", photoCount: 4, aspectRatio: 1, description: "2x2 grid of modern polaroids" }
];

export interface BackgroundPreset {
  id: string;
  name: string;
  type: "solid" | "gradient" | "pattern";
  value: string;
}

export const BACKGROUNDS: BackgroundPreset[] = [
  { id: "cafe", name: "Cafe Wood", type: "pattern", value: "repeating-linear-gradient(90deg, #8b5a2b, #8b5a2b 30px, #704214 30px, #704214 60px)" },
  { id: "sunset", name: "Sunset Gold", type: "gradient", value: "linear-gradient(to bottom, #ff7e5f, #feb47b)" },
  { id: "cherry", name: "Cherry Petal", type: "gradient", value: "linear-gradient(to bottom, #ffd1dc, #ffb7c5)" },
  { id: "cyber", name: "Neon Cyber", type: "gradient", value: "linear-gradient(to bottom, #0f0c20, #240b36)" },
  { id: "minimal-white", name: "Studio White", type: "solid", value: "#f5f5f4" },
  { id: "minimal-black", name: "Studio Black", type: "solid", value: "#1c1917" }
];

export interface FilterPreset {
  id: string;
  name: string;
  cssFilter: string;
}

export const FILTERS: FilterPreset[] = [
  { id: "original", name: "Original Color", cssFilter: "none" },
  { id: "vintage", name: "Vintage Warmth", cssFilter: "sepia(0.35) contrast(0.95) saturate(1.1) brightness(1.02)" },
  { id: "bw", name: "Classic B&W", cssFilter: "grayscale(1) contrast(1.1)" },
  { id: "warm", name: "Warm Film", cssFilter: "sepia(0.2) saturate(1.15) contrast(0.95) hue-rotate(-5deg)" },
  { id: "moonlight", name: "Moonlight", cssFilter: "contrast(1.05) saturate(0.8) hue-rotate(180deg) brightness(0.95)" },
  { id: "kodak", name: "Kodak Gold", cssFilter: "sepia(0.15) saturate(1.3) contrast(1.05) brightness(1.02)" },
  { id: "fuji", name: "Fujifilm Superia", cssFilter: "saturate(0.9) contrast(1.1) hue-rotate(5deg) brightness(0.98)" },
  { id: "sepia", name: "Classic Sepia", cssFilter: "sepia(0.8) contrast(0.9) brightness(0.95)" },
  { id: "vintage-matte", name: "Vintage Matte", cssFilter: "contrast(0.85) brightness(1.05) sepia(0.08) saturate(0.9)" },
];

interface BoothContextType {
  step: BoothStep;
  setStep: (step: BoothStep) => void;
  mode: BoothMode | null;
  setMode: (mode: BoothMode | null) => void;
  layout: FrameLayout;
  setLayout: (layout: FrameLayout) => void;
  background: string; // preset id or uploaded data-url
  setBackground: (bg: string) => void;
  photos: string[];
  setPhotos: (photos: string[]) => void;
  selectedFilter: string; // filter id
  setSelectedFilter: (filterId: string) => void;
  removeBackground: boolean;
  setRemoveBackground: (val: boolean) => void;
  editedStripUrl: string;
  setEditedStripUrl: (url: string) => void;
  isMuted: boolean;
  toggleMuted: () => void;
  resetSession: () => void;

  // Multiplayer (Phase 3)
  multiplayerRole: "host" | "guest" | null;
  setMultiplayerRole: (role: "host" | "guest" | null) => void;
  peerId: string;
  connectedGuestsCount: number;
  isSimulatedMultiplayer: boolean;
  setIsSimulatedMultiplayer: (val: boolean) => void;
  shutterTriggeredFromGuest: number;
  triggerShutterFromGuest: () => void;
  guestAnnotation: { type: "sticker" | "text"; value: string; font?: string; color?: string; timestamp: number } | null;
  setGuestAnnotation: (anno: any) => void;
  connectToHost: (hostId: string) => void;
  sendGuestAction: (action: any) => void;
  localStream: MediaStream | null;
  setLocalStream: (stream: MediaStream | null) => void;
  remoteStream: MediaStream | null;
  setRemoteStream: (stream: MediaStream | null) => void;
  loopVideoUrl: string;
  setLoopVideoUrl: (url: string) => void;
}

const BoothContext = createContext<BoothContextType | undefined>(undefined);

export function BoothProvider({ children }: { children: React.ReactNode }) {
  const [step, setStepState] = useState<BoothStep>("landing");
  const [mode, setMode] = useState<BoothMode | null>(null);
  const [layout, setLayout] = useState<FrameLayout>(FRAME_LAYOUTS[1]); // default to 4-photo strip
  const [background, setBackground] = useState<string>(BACKGROUNDS[4].value); // default minimal-white
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("original");
  const [removeBackground, setRemoveBackground] = useState<boolean>(false);
  const [editedStripUrl, setEditedStripUrl] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [loopVideoUrl, setLoopVideoUrl] = useState<string>("");

  // Multiplayer variables
  const [multiplayerRole, setMultiplayerRoleState] = useState<"host" | "guest" | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [isSimulatedMultiplayer, setIsSimulatedMultiplayer] = useState<boolean>(false);
  const [shutterTriggeredFromGuest, setShutterTriggeredFromGuest] = useState<number>(0);
  const [guestAnnotation, setGuestAnnotation] = useState<any>(null);

  // WebRTC Media call streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // PeerJS instances references
  const [PeerClass, setPeerClass] = useState<any>(null);
  const [peerInstance, setPeerInstance] = useState<any>(null);
  const [guestConnections, setGuestConnections] = useState<any[]>([]);
  const [connectedGuestsCount, setConnectedGuestsCount] = useState<number>(0);
  const [hostConnection, setHostConnection] = useState<any>(null);

  // Dynamically load peerjs library on mount to be SSR safe
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("peerjs")
        .then((mod) => {
          setPeerClass(() => mod.Peer);
        })
        .catch((err) => console.warn("Failed to load PeerJS module:", err));
    }
  }, []);

  // Synchronize initial mute status
  useEffect(() => {
    sounds.setMute(isMuted);
  }, [isMuted]);

  const toggleMuted = () => {
    setIsMuted((prev) => {
      const newVal = !prev;
      sounds.setMute(newVal);
      return newVal;
    });
  };

  const setStep = (newStep: BoothStep) => {
    setStepState(newStep);
  };

  // setMultiplayerRole helper
  const setMultiplayerRole = (role: "host" | "guest" | null) => {
    setMultiplayerRoleState(role);
  };

  // Host WebRTC peer creation effect
  useEffect(() => {
    if (multiplayerRole !== "host" || !PeerClass) return;

    // Create host Peer instance with STUN servers for NAT traversal
    const peer = new PeerClass(undefined, {
      debug: 1,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" }
        ]
      }
    });
    setPeerInstance(peer);

    peer.on("open", (id: string) => {
      setPeerId(id);
    });

    peer.on("call", (call: any) => {
      call.answer(localStreamRef.current || undefined);
      call.on("stream", (remoteStreamInstance: MediaStream) => {
        setRemoteStream(remoteStreamInstance);
      });
      call.on("close", () => {
        setRemoteStream(null);
      });
      call.on("error", () => {
        setRemoteStream(null);
      });
    });

    peer.on("connection", (conn: any) => {
      conn.on("open", () => {
        setGuestConnections((prev) => {
          const next = [...prev, conn];
          setConnectedGuestsCount(next.filter((c) => c.open).length);
          return next;
        });

        // Send initial baseline state on connection open
        conn.send({
          type: "SYNC_STATE",
          step,
          layout,
          background,
          selectedFilter,
          photos,
        });
      });

      conn.on("data", (data: any) => {
        if (data.type === "TRIGGER_SHUTTER") {
          setShutterTriggeredFromGuest((prev) => prev + 1);
        } else if (data.type === "ADD_STICKER_COOP") {
          setGuestAnnotation({
            type: data.annoType,
            value: data.value,
            font: data.font,
            color: data.color,
            timestamp: Date.now(),
          });
        }
      });

      const handleCleanup = () => {
        setGuestConnections((prev) => {
          const next = prev.filter((c) => c !== conn);
          setConnectedGuestsCount(next.filter((c) => c.open).length);
          return next;
        });
      };

      conn.on("close", handleCleanup);
      conn.on("error", handleCleanup);
    });

    return () => {
      peer.destroy();
      setPeerInstance(null);
      setPeerId("");
      setGuestConnections([]);
      setConnectedGuestsCount(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiplayerRole, PeerClass]);

  // Host state broadcast effect: sync state automatically with all connected guests
  useEffect(() => {
    if (multiplayerRole !== "host" || guestConnections.length === 0) return;

    guestConnections.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: "SYNC_STATE",
          step,
          layout,
          background,
          selectedFilter,
          photos,
        });
      }
    });
  }, [step, layout, background, selectedFilter, photos, multiplayerRole, guestConnections]);

  // Connects Guest device directly to Host using their WebRTC Peer ID
  const connectToHost = useCallback(
    (hostId: string) => {
      if (!PeerClass) return;
      setMultiplayerRoleState("guest");

      const peer = new PeerClass(undefined, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" }
          ]
        }
      });
      setPeerInstance(peer);

      peer.on("open", () => {
        const conn = peer.connect(hostId);
        setHostConnection(conn);

        conn.on("data", (data: any) => {
          if (data.type === "SYNC_STATE") {
            setStepState(data.step);
            setLayout(data.layout);
            setBackground(data.background);
            setSelectedFilter(data.selectedFilter);
            setPhotos(data.photos);
          }
        });

        const handleCleanup = () => {
          setHostConnection(null);
          setMultiplayerRoleState(null);
          setStepState("landing");
          setRemoteStream(null);
        };

        conn.on("close", handleCleanup);
        conn.on("error", handleCleanup);
      });

      peer.on("call", (call: any) => {
        call.answer(localStreamRef.current || undefined);
        call.on("stream", (remoteStreamInstance: MediaStream) => {
          setRemoteStream(remoteStreamInstance);
        });
        call.on("close", () => {
          setRemoteStream(null);
        });
        call.on("error", () => {
          setRemoteStream(null);
        });
      });

      peer.on("error", (err: any) => {
        console.warn("Guest Peer error connection closed:", err);
        setHostConnection(null);
        setMultiplayerRoleState(null);
        setStepState("landing");
        setRemoteStream(null);
      });
    },
    [PeerClass]
  );

  // Guest calling Host effect when Guest localStream is active
  useEffect(() => {
    if (multiplayerRole !== "guest" || !peerInstance || !hostConnection || !localStream) return;

    const call = peerInstance.call(hostConnection.peer, localStream);
    call.on("stream", (remoteStreamInstance: MediaStream) => {
      setRemoteStream(remoteStreamInstance);
    });
    
    const handleClose = () => {
      setRemoteStream(null);
    };
    call.on("close", handleClose);
    call.on("error", handleClose);

    return () => {
      call.close();
    };
  }, [localStream, hostConnection, peerInstance, multiplayerRole]);

  // Triggers remote action broadcast to host OR runs simulation locally
  const sendGuestAction = useCallback(
    (action: any) => {
      if (multiplayerRole === "guest" && hostConnection && hostConnection.open) {
        hostConnection.send(action);
      } else {
        // Run locally in simulation mode
        if (action.type === "TRIGGER_SHUTTER") {
          setShutterTriggeredFromGuest((prev) => prev + 1);
        } else if (action.type === "ADD_STICKER_COOP") {
          setGuestAnnotation({
            type: action.annoType,
            value: action.value,
            font: action.font,
            color: action.color,
            timestamp: Date.now(),
          });
        }
      }
    },
    [multiplayerRole, hostConnection]
  );

  const triggerShutterFromGuest = () => {
    setShutterTriggeredFromGuest((prev) => prev + 1);
  };

  const resetSession = () => {
    setStepState("landing");
    setMode(null);
    setLayout(FRAME_LAYOUTS[1]);
    setBackground(BACKGROUNDS[4].value);
    setPhotos([]);
    setSelectedFilter("original");
    setRemoveBackground(false);
    setEditedStripUrl("");

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    setRemoteStream(null);

    // Multiplayer Resets
    setMultiplayerRoleState(null);
    setPeerId("");
    setIsSimulatedMultiplayer(false);
    setShutterTriggeredFromGuest(0);
    setGuestAnnotation(null);
    
    if (peerInstance) {
      peerInstance.destroy();
      setPeerInstance(null);
    }
    setHostConnection(null);
    setGuestConnections([]);
    setConnectedGuestsCount(0);

    if (loopVideoUrl) {
      URL.revokeObjectURL(loopVideoUrl);
    }
    setLoopVideoUrl("");
  };

  return (
    <BoothContext.Provider
      value={{
        step,
        setStep,
        mode,
        setMode,
        layout,
        setLayout,
        background,
        setBackground,
        photos,
        setPhotos,
        selectedFilter,
        setSelectedFilter,
        removeBackground,
        setRemoveBackground,
        editedStripUrl,
        setEditedStripUrl,
        isMuted,
        toggleMuted,
        resetSession,

        // Multiplayer (Phase 3)
        multiplayerRole,
        setMultiplayerRole,
        peerId,
        connectedGuestsCount,
        isSimulatedMultiplayer,
        setIsSimulatedMultiplayer,
        shutterTriggeredFromGuest,
        triggerShutterFromGuest,
        guestAnnotation,
        setGuestAnnotation,
        connectToHost,
        sendGuestAction,
        localStream,
        setLocalStream,
        remoteStream,
        setRemoteStream,
        loopVideoUrl,
        setLoopVideoUrl,
      }}
    >
      {children}
    </BoothContext.Provider>
  );
}

export function useBooth() {
  const context = useContext(BoothContext);
  if (!context) {
    throw new Error("useBooth must be used within a BoothProvider");
  }
  return context;
}
