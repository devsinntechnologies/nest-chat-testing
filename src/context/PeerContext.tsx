"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

type PeerContextType = {
  peerConnection: RTCPeerConnection | null;
  remoteStream: MediaStream | null;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: () => Promise<RTCSessionDescriptionInit | null>;
  setRemoteDescription: (desc: RTCSessionDescriptionInit) => Promise<void>;
  addTracks: (stream: MediaStream) => void;
  closeConnection: () => void;
};

const PeerContext = createContext<PeerContextType | undefined>(undefined);

type PeerProviderProps = {
  children: ReactNode;
};

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:localhost:3478",
      username: "testuser",
      credential: "testpass",
    },
  ],
};

export const PeerProvider = ({ children }: PeerProviderProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const pc = new RTCPeerConnection(rtcConfig);

    pc.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current = pc;

    return () => {
      pc.getSenders().forEach((sender) => sender.track?.stop());
      pc.close();
      peerConnectionRef.current = null;
      setRemoteStream(null);
    };
  }, []);

  const getPeerConnection = () => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.signalingState === "closed") return null;
    return pc;
  };

  const addTracks = useCallback((stream: MediaStream) => {
    const pc = getPeerConnection();
    if (!pc) return;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }, []);

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.signalingState === "closed" || pc.signalingState === "stable") return null;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("createOff")
    return offer;
  }, []);


  const createAnswer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.signalingState === "closed") return null;

    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("✅ createAnswer:", answer.type);
      return answer;
    } catch (err) {
      console.error("❌ createAnswer failed:", err);
      return null;
    }
  }, []);


  const setLocalDescription = useCallback(async (desc: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.signalingState === "closed" || pc.signalingState === "stable") return;

    try {
      await pc.setLocalDescription(new RTCSessionDescription(desc));
    } catch (err) {
      console.error("Failed to setLocalDescription:", err);
    }
  }, []);

  const setRemoteDescription = useCallback(async (desc: RTCSessionDescriptionInit | null) => {
    const pc = peerConnectionRef.current;
    if (!pc || pc.signalingState === "closed") return;
    if (!desc || !desc.type || !desc.sdp) {
      console.error("❌ Invalid SDP received:", desc);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(desc));
      console.log("✅ setRemoteDescription success:", desc.type);
    } catch (err) {
      console.error("❌ setRemoteDescription failed:", err);
    }
  }, []);



  const closeConnection = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (pc) {
      pc.getSenders().forEach((sender) => sender.track?.stop());
      pc.close();
    }

    peerConnectionRef.current = null;
    setRemoteStream(null);
  }, []);

  return (
    <PeerContext.Provider
      value={{
        peerConnection: peerConnectionRef.current,
        remoteStream,
        createOffer,
        createAnswer,
        setRemoteDescription,
        addTracks,
        closeConnection,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = (): PeerContextType => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
};
