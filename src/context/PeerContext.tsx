"use client";

import React, {
  createContext,
  useContext,
  useEffect,
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
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const pc = new RTCPeerConnection(rtcConfig);

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    setPeerConnection(pc);

    return () => {
      pc.close();
      setPeerConnection(null);
      setRemoteStream(null);
    };
  }, []);

  const addTracks = useCallback((stream: MediaStream) => {
    if (!peerConnection || peerConnection.signalingState === "closed") return;

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  }, [peerConnection]);

  const createOffer = async (): Promise<RTCSessionDescriptionInit | null> => {

    console.log(peerConnection, 'from off context')
    if (!peerConnection) return null;
    console.log(peerConnection, 'no 0 from off context')

    const offer = await peerConnection.createOffer();
    console.log(offer, 'off context')

    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  const createAnswer = useCallback(async () => {
    if (!peerConnection || peerConnection.signalingState === "closed") return null;
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }, [peerConnection]);

  const setRemoteDescription = useCallback(async (desc: RTCSessionDescriptionInit) => {
    if (!peerConnection || peerConnection.signalingState === "closed") return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(desc));
  }, [peerConnection]);

  const closeConnection = useCallback(() => {
    if (peerConnection) {
      peerConnection.getSenders().forEach((sender) => {
        try {
          sender.track?.stop();
        } catch (_) {}
      });

      peerConnection.close();
      setPeerConnection(null);
      setRemoteStream(null);
    }
  }, [peerConnection]);

  return (
    <PeerContext.Provider
      value={{
        peerConnection,
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
