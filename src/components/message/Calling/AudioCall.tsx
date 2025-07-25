"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSocket } from "@/lib/socket";
import { User } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { usePeer } from "@/context/PeerContext";

interface AudioCallProps {
  receiver: User | null;
  endCall: () => void;
}

const AudioCall: React.FC<AudioCallProps> = ({ receiver, endCall }) => {
  const {
    peerConnection,
    addTracks,
    createOffer,
    setRemoteDescription,
  } = usePeer();

  const socket = getSocket();
  const searchParams = useSearchParams();
  const audio = searchParams.get("audio");

  const [connectionState, setConnectionState] = useState<string>("Not Connected");
  const [callTime, setCallTime] = useState<number>(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!peerConnection) return;

    const init = async () => {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (localVideoRef.current && mediaStreamRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }

      addTracks(mediaStreamRef.current);

      const remoteStream = new MediaStream();
      peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(console.error);
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        setConnectionState(peerConnection.iceConnectionState || "Unknown");
        if (peerConnection.iceConnectionState === "connected") {
          startCallTimer();
        }
      };

      socket.on("offer", async ({ sdp }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", { to: receiver?.id, sdp: answer });
      });

      socket.on("answer", async ({ sdp }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        if (candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { to: receiver?.id, candidate: event.candidate });
        }
      };
    };

    init();
  }, []);

  const createCallOffer = useCallback(async () => {
    if (!peerConnection) return;
    const offer = await createOffer();
    socket.emit("offer", { to: receiver?.id, sdp: offer });
  }, [peerConnection]);

  useEffect(() => {
    if (audio !== "1") {
      createCallOffer();
    }
  }, [audio, createCallOffer]);

  const startCallTimer = () => {
    if (!callTimerRef.current) {
      callTimerRef.current = setInterval(() => {
        setCallTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const cleanup = () => {
    stopCallTimer();
    peerConnection?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    endCall();
  };

  const toggleMic = () => {
    const audioTrack = mediaStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = mediaStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
  };

  const shareScreen = async () => {
    if (!peerConnection) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = () => stopScreenShare();
      setIsScreenSharing(true);
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = async () => {
    if (!peerConnection || !mediaStreamRef.current) return;

    const cameraTrack = mediaStreamRef.current.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
    }

    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  };

  return (
    <div className="w-full h-[92%] flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-2 bg-gray-900 border-b border-gray-700">
        <div>
          <h2 className="text-lg font-semibold">{receiver?.name || "Unknown User"}</h2>
          <p className="text-sm text-gray-400">
            {connectionState} · {Math.floor(callTime / 60)}:
            {(callTime % 60).toString().padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Video Section */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {[localVideoRef, remoteVideoRef].map((ref, i) => (
          <div key={i} className="relative w-full h-full rounded-xl overflow-hidden border-2 border-gray-600">
            <video
              ref={ref}
              className="object-cover w-full h-full"
              autoPlay
              muted={i === 0}
              playsInline
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {(i === 0 && !isMicOn) && <MicOff className="w-5 h-5 text-red-500" />}
              {(i === 0 && !isVideoOn) && <VideoOff className="w-5 h-5 text-red-500" />}
              {(i === 0 && isScreenSharing) && <Monitor className="w-5 h-5 text-yellow-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <TooltipProvider>
        <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-700 bg-gray-900">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={toggleMic} variant="ghost">
                {isMicOn ? <Mic className="text-green-500" /> : <MicOff className="text-red-500" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Mic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={toggleVideo} variant="ghost">
                {isVideoOn ? <Video className="text-green-500" /> : <VideoOff className="text-red-500" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Camera</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={toggleSpeaker} variant="ghost">
                {isSpeakerOn ? <Volume2 className="text-blue-500" /> : <VolumeX className="text-gray-400" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Speaker</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={isScreenSharing ? stopScreenShare : shareScreen} variant="ghost">
                {isScreenSharing ? <MonitorOff className="text-yellow-500" /> : <Monitor className="text-white" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Screen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={cleanup} variant="destructive" className="rounded-full bg-red-600 hover:bg-red-700 p-3">
                <PhoneOff className="text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>End Call</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <audio ref={remoteAudioRef} hidden />
    </div>
  );
};

export default AudioCall;
