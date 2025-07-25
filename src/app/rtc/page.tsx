"use client";

import React, { useEffect, useRef, useState } from "react";

const WebRTCPage = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [offerSDP, setOfferSDP] = useState("");
  const [answerSDP, setAnswerSDP] = useState("");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    peerConnection.current = new RTCPeerConnection();
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    remoteStream.current = new MediaStream();

    if (localVideoRef.current)
      localVideoRef.current.srcObject = localStream.current;
    if (remoteVideoRef.current)
      remoteVideoRef.current.srcObject = remoteStream.current;

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, localStream.current!);
    });

    peerConnection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current?.addTrack(track);
      });
    };
  };

  const createOffer = async () => {
    if (!peerConnection.current) return;
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        setOfferSDP(JSON.stringify(peerConnection.current?.localDescription));
      }
    };
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
  };

  const createAnswer = async () => {
    if (!peerConnection.current || !offerSDP) return;
    const offer = JSON.parse(offerSDP);
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        setAnswerSDP(JSON.stringify(peerConnection.current?.localDescription));
      }
    };
    await peerConnection.current.setRemoteDescription(offer);
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
  };

  const addAnswer = async () => {
    if (!peerConnection.current || !answerSDP) return;
    if (!peerConnection.current.currentRemoteDescription) {
      const answer = JSON.parse(answerSDP);
      await peerConnection.current.setRemoteDescription(answer);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-center">
        WebRTC – Manual SDP Exchange
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <video ref={localVideoRef} className="w-full border-2 border-green-400 bg-black" autoPlay playsInline />
        <video ref={remoteVideoRef} className="w-full border-2 border-green-400 bg-black" autoPlay playsInline />
      </div>

      <div className="bg-yellow-50 p-4 rounded-md shadow">
        <p className="mb-2 font-medium">Step 1: Create an Offer (User 1)</p>
        <button
          onClick={createOffer}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Offer
        </button>
        <textarea
          value={offerSDP}
          onChange={(e) => setOfferSDP(e.target.value)}
          placeholder="SDP Offer"
          className="w-full mt-2 p-2 border rounded h-24"
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-md shadow">
        <p className="mb-2 font-medium">Step 2: Create an Answer (User 2)</p>
        <button
          onClick={createAnswer}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Create Answer
        </button>
        <textarea
          value={answerSDP}
          onChange={(e) => setAnswerSDP(e.target.value)}
          placeholder="SDP Answer"
          className="w-full mt-2 p-2 border rounded h-24"
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-md shadow">
        <p className="mb-2 font-medium">Step 3: Add Answer (User 1)</p>
        <button
          onClick={addAnswer}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Add Answer
        </button>
      </div>
    </div>
  );
};

export default WebRTCPage;

// 'use client'
// import React, { useEffect, useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Video, VideoOff } from "lucide-react";
// import { getSocket } from "@/lib/socket";
// import { User } from "@/lib/types";
// import { useSearchParams } from "next/navigation";

// interface AudioCallProps {
//   receiver: User | null;
//   endCall: () => void;
// }

// const AudioCall: React.FC<AudioCallProps> = ({ receiver, endCall }) => {
//   const searchParams = useSearchParams();
//   const audio = searchParams.get("audio");
//   const offer = searchParams.get("off");

//   const socket = getSocket();
//   const [micEnabled, setMicEnabled] = useState(true);
//   const [cameraEnabled, setCameraEnabled] = useState(true);
//   const [speakerEnabled, setSpeakerEnabled] = useState(true);
//   const [callTime, setCallTime] = useState(0);
//   const [connectionState, setConnectionState] = useState("Not Connected");

//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const candidateQueue = useRef<RTCIceCandidateInit[]>([]);
//   const isRemoteDescriptionSet = useRef(false);

//   const ringbackRef = useRef<HTMLAudioElement | null>(null);
//   const mediaStreamRef = useRef<MediaStream | null>(null);

//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const remoteAudioRef = useRef<HTMLAudioElement>(null);

//   const peerConnection = useRef<RTCPeerConnection | null>(null);

//   useEffect(() => {
//     initConnection();
//   }, []);

//   const initConnection = async () => {
//     const config = {
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         {
//           urls: "turn:localhost:3478",
//           username: "testuser",
//           credential: "testpass",
//         },
//       ],
//     };

//     peerConnection.current = new RTCPeerConnection(config);

//     mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: true,
//     });

//     mediaStreamRef.current.getTracks().forEach((track) => {
//       peerConnection.current?.addTrack(track, mediaStreamRef.current!);
//     });

//     if (localVideoRef.current)
//       localVideoRef.current.srcObject = mediaStreamRef.current;

//     const remoteStream = new MediaStream();
//     peerConnection.current.ontrack = (event) => {
//       event.streams[0].getTracks().forEach((track) => {
//         remoteStream.addTrack(track);
//       });

//       if (remoteAudioRef.current) {
//         remoteAudioRef.current.srcObject = remoteStream;
//         remoteAudioRef.current.play().catch((err) =>
//           console.error("Remote audio play failed", err)
//         );
//       }
//     };

//     peerConnection.current.oniceconnectionstatechange = () => {
//       setConnectionState(peerConnection.current?.iceConnectionState || "unknown");
//       if (peerConnection.current?.iceConnectionState === "connected") {
//         startCallTimer();
//         if (ringbackRef.current) {
//           ringbackRef.current.pause();
//           ringbackRef.current.currentTime = 0;
//         }
//       }
//     };
//   };

//   useEffect(() => {
//     const ring = new Audio("/calling.mp3");
//     if (audio === "1" && offer) {
//       try {
//         const decoded = JSON.parse(decodeURIComponent(offer));
//         socket.emit("answer", { to: receiver?.id, sdp: decoded });
//       } catch (err) {
//         console.error("Failed to parse offer", err);
//       }
//     } else {
//       const createOffer = async () => {
//         if (!peerConnection.current) return;
//         peerConnection.current.onicecandidate = (event) => {
//           if (event.candidate) {
//             socket.emit("ice-candidate", { to: receiver?.id, candidate: event.candidate });
//           }
//         };

//         const offer = await peerConnection.current.createOffer();
//         await peerConnection.current.setLocalDescription(offer);

//         socket.emit("offer", { to: receiver?.id, sdp: offer });

//         ring.loop = true;
//         ring.play().catch((e) => console.warn("Autoplay issue", e));
//         ringbackRef.current = ring;
//       };

//       createOffer();
//     }

//     return () => {
//       ring.pause();
//       ring.currentTime = 0;
//     };
//   }, [audio, offer, receiver?.id, socket]);

//   useEffect(() => {
//     if (!peerConnection.current) return;
//     const pc = peerConnection.current;

//     socket.on("offer", async ({ sdp }) => {
//       pc.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", { to: receiver?.id, candidate: event.candidate });
//         }
//       };

//       await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//       isRemoteDescriptionSet.current = true;

//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       socket.emit("answer", { to: receiver?.id, sdp: answer });
//     });

//     socket.on("answer", async ({ sdp }) => {
//       await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//       isRemoteDescriptionSet.current = true;

//       for (const candidate of candidateQueue.current) {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//       }
//       candidateQueue.current = [];
//     });

//     socket.on("ice-candidate", async ({ candidate }) => {
//       if (!isRemoteDescriptionSet.current) {
//         candidateQueue.current.push(candidate);
//         return;
//       }

//       try {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//       } catch (e) {
//         console.error("Failed to add ICE candidate", e);
//       }
//     });

//     return () => {
//       socket.off("offer");
//       socket.off("answer");
//       socket.off("ice-candidate");
//     };
//   }, [socket, receiver?.id]);

//   const startCallTimer = () => {
//     timerRef.current = setInterval(() => {
//       setCallTime((prev) => prev + 1);
//     }, 1000);
//   };

//   const stopCallTimer = () => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//   };

//   const handleToggleMic = () => {
//     if (mediaStreamRef.current) {
//       const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setMicEnabled(audioTrack.enabled);
//       }
//     }
//   };

//   const handleToggleCamera = () => {
//     if (mediaStreamRef.current) {
//       const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setCameraEnabled(videoTrack.enabled);
//       }
//     }
//   };

//   const handleToggleSpeaker = () => {
//     if (remoteAudioRef.current) {
//       remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
//       setSpeakerEnabled(!remoteAudioRef.current.muted);
//     }
//   };

//   const handleEndCall = () => {
//     stopCallTimer();
//     peerConnection.current?.close();

//     if (mediaStreamRef.current) {
//       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
//       mediaStreamRef.current = null;
//     }

//     if (ringbackRef.current) {
//       ringbackRef.current.pause();
//       ringbackRef.current.currentTime = 0;
//     }

//     endCall();
//   };

//   return (
//     <div className="flex flex-col items-center justify-center gap-6 p-6">
//       <h2 className="text-xl font-semibold text-gray-700">
//         Audio Call in Progress... {connectionState}
//       </h2>
//       <p className="text-sm text-muted-foreground">
//         Duration: {Math.floor(callTime / 60)}:{String(callTime % 60).padStart(2, "0")}
//       </p>

//       <div className="flex gap-4">
//         <video ref={localVideoRef} autoPlay muted playsInline className="w-40 h-32 rounded-md bg-black" />
//         <audio ref={remoteAudioRef} autoPlay playsInline />
//       </div>

//       <div className="flex items-center gap-4 mt-4">
//         <Button variant="outline" onClick={handleToggleMic}>
//           {micEnabled ? <Mic className="text-green-600" /> : <MicOff className="text-red-600" />}
//         </Button>

//         <Button variant="outline" onClick={handleToggleCamera}>
//           {cameraEnabled ? <Video className="text-blue-600" /> : <VideoOff className="text-gray-500" />}
//         </Button>

//         <Button variant="outline" onClick={handleToggleSpeaker}>
//           {speakerEnabled ? <Volume2 className="text-blue-600" /> : <VolumeX className="text-gray-400" />}
//         </Button>

//         <Button variant="destructive" onClick={handleEndCall}>
//           <PhoneOff className="mr-2" /> End Call
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default AudioCall;
