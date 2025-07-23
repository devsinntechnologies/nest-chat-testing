import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { User } from "@/lib/types";

interface AudioCallProps {
  receiver: User | null
  endCall: () => void;
}

const AudioCall: React.FC<AudioCallProps> = ({receiver, endCall }) => {
  const socket = getSocket();
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionState, setConnectionState] = useState('No Connected')

  const ringbackRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const peer = useRef(
    new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
  );

  // for peer connection
  useEffect(() => {
    const pc = peer.current;

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState)

      if (pc.connectionState === "connected") {
        console.log("✅ Peer connection established");
        startCallTimer();
      }

      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        setConnectionState('call ended')
        stopCallTimer();
      }
    };

    return () => {
      stopCallTimer();
    };
  }, []);

  // for calling/offering
  useEffect(() => {
    const createOffer = async () => {
      const pc = peer.current;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", { to: receiver?.id, sdp: offer });
    };

    createOffer();
    const ring = new Audio("/calling.mp3");
    ring.loop = true;
    ring.play().catch((e) => console.error("Autoplay block", e));
    ringbackRef.current = ring;

    return () => {
      ring.pause();
      ring.currentTime = 0;
    };
  }, [receiver?.id, socket]);

  // for media
  useEffect(() => {
    const getMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        stream.getAudioTracks().forEach((track) => {
          peer.current.addTrack(track, stream);
        });
      } catch (err) {
        console.error("Microphone access denied", err);
        alert("Microphone permission denied. Please enable it in browser settings.");
      }
    };

    getMic();
  }, []);

  // for socket events 
  useEffect(() => {

    socket.on("offer", async ({ sdp }) => {
      const pc = peer.current;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { sdp: answer });
    });

    // 👂 When answer is received
    socket.on("answer", async ({ sdp }) => {
      const pc = peer.current;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // 👂 When ICE candidate is received
    socket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add ICE candidate:", err);
        }
      }
    });

    // 📤 Send local ICE candidates to remote peer
    peer.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket]);


  const startCallTimer = () => {
    timerRef.current = setInterval(() => {
      setCallTime((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleToggleMic = () => {
    const stream = mediaStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const handleToggleSpeaker = () => {
    if (ringbackRef.current) {
      const isMuted = ringbackRef.current.muted;
      ringbackRef.current.muted = !isMuted;
      setSpeakerEnabled(!isMuted);
    }
  };

  const handleEndCall = async () => {
    if (ringbackRef.current) {
      ringbackRef.current.pause();
      ringbackRef.current.currentTime = 0;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    peer.current.close();

    endCall();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6">
      <h2 className="text-xl font-semibold text-gray-700">Audio Call in Progress... {connectionState}</h2>
      <p className="text-sm text-muted-foreground">
        Duration: {Math.floor(callTime / 60)}:{String(callTime % 60).padStart(2, "0")}
      </p>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleToggleMic}>
          {micEnabled ? <Mic className="text-green-600" /> : <MicOff className="text-red-600" />}
        </Button>

        <Button variant="outline" onClick={handleToggleSpeaker}>
          {speakerEnabled ? <Volume2 className="text-blue-600" /> : <VolumeX className="text-gray-400" />}
        </Button>

        <Button variant="destructive" onClick={handleEndCall}>
          <PhoneOff className="mr-2" /> End Call
        </Button>
      </div>
    </div>
  );
};

export default AudioCall;
