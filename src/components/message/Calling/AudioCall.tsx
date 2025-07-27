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
import { useMediaControls } from "@/hooks/useMediaControls";
import { useScreenShare } from "@/hooks/useScreenShare";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BASE_IMAGE } from "@/lib/constants";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";

interface AudioCallProps {
  receiver: User | null;
  endCall: () => void;
}

const AudioCall: React.FC<AudioCallProps> = ({ receiver, endCall }) => {
  const user = useSelector((state: RootState) => state.authSlice.userProfile)
  const {
    peerConnection,
    addTracks,
    createAnswer,
    setRemoteDescription,
  } = usePeer();

  const socket = getSocket();
  const searchParams = useSearchParams();
  const audio = searchParams.get("audio");
  const [hasRemoteVideo, setHasRemoteVideo] = useState<boolean>(true);
  const [connectionState, setConnectionState] = useState<string>("Not Connected");
  const [callTime, setCallTime] = useState<number>(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(peerConnection);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());


  const { isMicOn, isVideoOn, toggleMic, toggleVideo } = useMediaControls(mediaStreamRef);
  const { isScreenSharing, toggleScreenShare } = useScreenShare(
    peerConnectionRef,
    mediaStreamRef,
    localVideoRef
  );


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
      peerConnection.ontrack = (event) => {
        console.log("📡 ontrack triggered");

        // Log track info
        console.log("📥 Incoming track kind:", event.track.kind);
        console.log("📥 Incoming stream(s):", event.streams);

        const track = event.track;
        const remoteStream = remoteStreamRef.current;

        if (!remoteStream) {
          console.warn("⚠️ remoteStreamRef.current is null");
          return;
        }

        // Check if track already exists in stream
        const existingTracks = remoteStream.getTracks();
        console.log("🎛️ Existing remoteStream tracks:", existingTracks);

        if (!existingTracks.includes(track)) {
          console.log("➕ Adding new track to remoteStream");
          remoteStream.addTrack(track);
        } else {
          console.log("✅ Track already exists in remoteStream");
        }

        // Attach to remote video
        if (remoteVideoRef.current) {
          if (!remoteVideoRef.current.srcObject) {
            console.log("🎥 Attaching stream to remoteVideoRef");
            remoteVideoRef.current.srcObject = remoteStream;

            remoteVideoRef.current.onloadedmetadata = () => {
              remoteVideoRef.current?.play().then(() => {
                console.log("▶️ remoteVideoRef playing successfully");
                // if (track.kind === "video") {
                //   setHasRemoteVideo(true);
                // }
              }).catch((err) => {
                console.error("❌ remoteVideoRef play error:", err);
              });
            };
          } else {
            console.log("📽️ remoteVideoRef already has a stream");
          }
        } else {
          console.warn("⚠️ remoteVideoRef.current is null");
        }

        // Attach to remote audio
        if (remoteAudioRef.current) {
          if (!remoteAudioRef.current.srcObject) {
            console.log("🔊 Attaching stream to remoteAudioRef");
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.onloadedmetadata = () => {
              console.log("📽️ Tracks in remoteStream:", remoteStream.getTracks());
              console.log("🎞️ Video tracks:", remoteStream.getVideoTracks());
              remoteAudioRef.current?.play().then(() => {
                console.log("▶️ remoteAudioRef playing successfully");
              }).catch((err) => {
                console.error("❌ remoteAudioRef play error:", err);
              });
            };
          } else {
            console.log("📻 remoteAudioRef already has a stream");
          }
        } else {
          console.warn("⚠️ remoteAudioRef.current is null");
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        setConnectionState(peerConnection.iceConnectionState || "Unknown");
        if (peerConnection.iceConnectionState === "connected") {
          startCallTimer();
        }
      };

      socket.on("offer", async ({ sdp }) => {
        console.log("at offer", sdp)
        await setRemoteDescription(sdp);
        console.log("creating... answer")
        const answer = await createAnswer();
        console.log(answer, "created answer")
        socket.emit("answer", { to: receiver?.id, sdp: answer });
      });

      socket.on("answer", async ({ sdp }) => {
        console.log("at answer")
        await setRemoteDescription(sdp)
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
    peerConnection?.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });

    peerConnection?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    endCall();
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
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
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        <div className="col-span-9 relative w-full h-full rounded-xl overflow-hidden border-2 border-gray-600 bg-black">
          <video
            ref={remoteVideoRef}
            className="object-cover w-full h-full"
            autoPlay
            playsInline
            muted={false}
          />
          {!hasRemoteVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <Avatar className="w-28 h-28">
                <AvatarImage src={BASE_IMAGE + receiver?.imageUrl} />
                <AvatarFallback>{receiver?.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>


        {/* Local User Small View */}
        <div className="col-span-3 relative w-full h-full rounded-xl overflow-hidden border-2 border-gray-600">
          {/* {isVideoOn || isScreenSharing ? ( */}
            <video
              ref={localVideoRef}
              className="object-cover w-full h-full"
              autoPlay
              muted
              playsInline
            />
          {/* ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-700">
              <Avatar className="w-20 h-20">
                <AvatarImage src={BASE_IMAGE + user?.imageUrl} />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          )} */}
          <div className="absolute top-2 right-2 flex gap-2">
            {!isMicOn && <MicOff className="w-5 h-5 text-red-500" />}
            {isScreenSharing && <Monitor className="w-5 h-5 text-yellow-400" />}
          </div>
        </div>
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
              <Button onClick={toggleScreenShare} variant="ghost">
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
