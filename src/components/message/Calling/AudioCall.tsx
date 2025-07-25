//@ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  PhoneOutgoingIcon,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { User } from "@/lib/types";
import { useSearchParams } from "next/navigation";

interface AudioCallProps {
  receiver: User | null;
  endCall: () => void;
}

const AudioCall: React.FC<AudioCallProps> = ({ receiver, endCall }) => {
  const socket = getSocket();
  const searchParams = useSearchParams();
  const audio = searchParams.get("audio");
  const off = searchParams.get("off");
  const [connectionState, setConnectionState] = useState("Not Connected");
  const [callTime, setCallTime] = useState(0);


  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timer | null>(null);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [offerSDP, setOfferSDP] = useState("");
  const [answerSDP, setAnswerSDP] = useState("");

  const [isVideoOn, setIsVideoOn] = useState(true);

  console.log('offer', offerSDP)
  console.log('answer', answerSDP)
  useEffect(() => {
    initConnection();
    return () => {
      cleanup();
    };
  }, []);

  const initConnection = async () => {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:localhost:3478",
          username: "testuser",
          credential: "testpass",
        },
      ],
    };

    peerConnection.current = new RTCPeerConnection(config);

    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });


    if (localVideoRef.current)
      localVideoRef.current.srcObject = mediaStreamRef.current;


    mediaStreamRef.current.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, mediaStreamRef.current!);
    });

    const remoteStream = new MediaStream();
    peerConnection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        remoteAudioRef.current.play().catch((err) =>
          console.error("Remote audio play failed", err)
        );
      }
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      setConnectionState(
        peerConnection.current?.iceConnectionState || "unknown"
      );

      if (peerConnection.current?.iceConnectionState === "connected") {
        startCallTimer();
      }
    };
  };

  const startCallTimer = () => {
    if (callTimerRef.current) return;
    callTimerRef.current = setInterval(() => {
      setCallTime((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const handleToggleVideo = () => {
    if (!mediaStreamRef.current) return;
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopScreenShare = async () => {
    if (!mediaStreamRef.current) return;

    const cameraTrack = mediaStreamRef.current.getVideoTracks()[0];

    const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
    }

    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;

    setIsScreenSharing(false);
  };



  const cleanup = () => {
    stopCallTimer();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    socket.off("offer");
    socket.off("answer");
  };

  const handleToggleMic = () => {
    if (!mediaStreamRef.current) return;
    const audioTrack = mediaStreamRef.current
      .getAudioTracks()
      .find((t) => t.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const handleToggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
  };

  const handleEndCall = () => {
    cleanup();
    endCall();
  };

  const createOffer = async () => {
    if (!peerConnection.current) return;

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        setOfferSDP(
          JSON.stringify(peerConnection.current?.localDescription)
        );
      }
    };

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", { to: receiver?.id, sdp: offer });
  };



  useEffect(() => {
    const createAnswer = async ({ sdp }: any) => {
      if (!peerConnection.current) return;
      const offer = typeof sdp === "string" ? JSON.parse(sdp) : sdp;
      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", { to: receiver?.id, sdp: answer });

      setAnswerSDP(JSON.stringify(answer));
    };

    const addAnswer = async ({ sdp }: any) => {
      if (!peerConnection.current) return;
      const answer = typeof sdp === "string" ? JSON.parse(sdp) : sdp;
      console.log('answerCreate', answer)

      if (!peerConnection.current.currentRemoteDescription) {
        await peerConnection.current.setRemoteDescription(answer);
      }
      peerConnection.current.onnegotiationneeded = async () => {
        try {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          socket.emit("offer", { to: receiver?.id, sdp: peerConnection.current.localDescription });
        } catch (err) {
          console.error("Negotiation offer failed", err);
        }
      };

    };

    socket.on("offer", createAnswer);
    socket.on("answer", addAnswer);

    return () => {
      socket.off("offer", createAnswer);
      socket.off("answer", addAnswer);
    };
  }, [receiver?.id, socket]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6">
      <h2 className="text-xl font-semibold text-gray-700">
        Audio Call in Progress... {connectionState}
      </h2>
      <p className="text-sm text-muted-foreground">
        Duration: {Math.floor(callTime / 60)}:
        {String(callTime % 60).padStart(2, "0")}
      </p>

      <audio ref={remoteAudioRef} autoPlay />

      <div className="grid grid-cols-2 gap-4">
        <video ref={localVideoRef} className="w-full border-2 border-green-400 bg-black" autoPlay playsInline />
        <video ref={remoteVideoRef} className="w-full border-2 border-green-400 bg-black" autoPlay playsInline />       </div>

      <div className="flex items-center gap-4 mt-4">
        <Button variant="outline" onClick={handleToggleMic}>
          {isMicOn ? (
            <Mic className="text-green-600" />
          ) : (
            <MicOff className="text-red-600" />
          )}
        </Button>

        <Button variant="outline" onClick={handleToggleVideo}>
          {isVideoOn ? <Video className="text-green-600" /> : <VideoOff className="text-red-600" />}
        </Button>


        <Button variant="outline" onClick={handleToggleSpeaker}>
          {isSpeakerOn ? (
            <Volume2 className="text-blue-600" />
          ) : (
            <VolumeX className="text-gray-400" />
          )}
        </Button>

        <Button
          variant={isScreenSharing ? "destructive" : "outline"}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        >
          {isScreenSharing ? "Stop Sharing" : "Share Screen"}
        </Button>


        <Button variant="destructive" onClick={handleEndCall}>
          <PhoneOff className="mr-2" />
        </Button>
        <Button variant="secondary" onClick={createOffer}>
          <PhoneOutgoingIcon className="mr-2" /> Start Call
        </Button>
      </div>
    </div>
  );
};

export default AudioCall;
