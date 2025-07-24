import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { User } from "@/lib/types";
import { useSearchParams } from "next/navigation";

interface AudioCallProps {
  receiver: User | null
  endCall: () => void;
}

const AudioCall: React.FC<AudioCallProps> = ({ receiver, endCall }) => {
  const searchParams = useSearchParams();
  const audio = searchParams.get("audio");
  const offer = searchParams.get("off");
  const socket = getSocket();
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionState, setConnectionState] = useState('No Connected')
  const candidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescriptionSet = useRef(false);

  const ringbackRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // for media
  useEffect(() => {
    const getMic = async () => {
      console.log("aaaa1")
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

  const config = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: "turn:localhost:3478",
        username: "testuser",
        credential: "testpass"
      }
    ]
  };

  const peer = useRef(
    new RTCPeerConnection(config)
  );

  // for peer connection
  useEffect(() => {
    console.log("aaaa2")
    const pc = peer.current;
    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", { to: receiver?.id, sdp: offer });

        console.log("Negotiation offer sent");
      } catch (error) {
        console.error("Negotiation error:", error);
      }
    };

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
  }, [receiver?.id, socket]);

  // for calling/offering
  useEffect(() => {
    console.log("aaaa3")
    const ring = new Audio("/calling.mp3");
    try {
      if (audio === "1" && offer) {
        try {
          const decoded = JSON.parse(decodeURIComponent(offer));
          console.log(decoded)
          socket.emit('answer', { to: receiver?.id, sdp: decoded })
        } catch (err) {
          console.error("Failed to parse SDP offer", err);
        }
      } else {
        const createOffer = async () => {
          const pc = peer.current;

          pc.onicecandidate = (event) => {
            console.log("📡 ICE Candidate:", event.candidate);
            if (event.candidate) {
              socket.emit("ice-candidate", { to: receiver?.id, candidate: event.candidate });
            }
          };
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: receiver?.id, sdp: offer });
        };

        createOffer();
        ring.loop = true;
        ring.play().catch((e) => console.error("Autoplay block", e));
        ringbackRef.current = ring;
      }
    }
    catch (error) {

    }

    return () => {
      ring.pause();
      ring.currentTime = 0;
    };
  }, [audio, offer, receiver?.id, socket]);


  // for socket events 
  useEffect(() => {
    console.log("aaaa4")
    socket.on("offer", async ({ sdp }) => {
      console.log('offered sdp', sdp)
      const pc = peer.current;

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('Adding answer candidate...:', event.candidate)
        }
      };

      await pc.setRemoteDescription(sdp);
      isRemoteDescriptionSet.current = true;

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { sdp: answer });
    });

    socket.on("answer", async ({ sdp }) => {
      const pc = peer.current;
      await pc.setRemoteDescription(sdp);
      isRemoteDescriptionSet.current = true;

      for (const candidate of candidateQueue.current) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.error("Error adding queued ICE candidate", e);
        }
      }
      candidateQueue.current = [];
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      if (candidate) {
        if (!isRemoteDescriptionSet.current) {
          console.warn("Remote description not set yet. Queuing ICE candidate.");
          candidateQueue.current.push(candidate);
          return;
        }

        try {
          await peer.current.addIceCandidate(candidate);
        } catch (err) {
          console.error("Failed to add ICE candidate:", err);
        }
      }
    });


    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket]);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const remoteStream = new MediaStream();

    peer.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(console.error);
      }
    };
  }, []);


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
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setSpeakerEnabled(!remoteAudioRef.current.muted);
    }
  };

  const handleHoldCall = () => {
    mediaStreamRef.current?.getAudioTracks().forEach(track => (track.enabled = false));
    remoteAudioRef.current && (remoteAudioRef.current.muted = true);
    setMicEnabled(false);
    setSpeakerEnabled(false);
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
      {remoteAudioRef && <div className="w-full h-10 bg-destructive"><audio ref={remoteAudioRef} autoPlay playsInline /></div>}
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
