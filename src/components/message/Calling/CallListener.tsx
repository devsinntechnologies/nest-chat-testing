"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCallData } from "@/slice/callSlice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getSocket } from "@/lib/socket";
import { User } from "@/lib/types";
import { BASE_IMAGE } from "@/lib/constants";

interface IncomingCall {
  from: string;
  sdp: any;
  roomId: string;
  callerName: string;
  callerImage?: string;
}

export default function CallListener() {
  const socket = getSocket();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleOffer = (data: { type?: string; from: User; sdp: any; roomId: string }) => {
      if (data.type === "negotiation") return;

      setCall({
        from: data.from.id,
        sdp: data.sdp,
        roomId: data.roomId,
        callerName: data.from.name,
        callerImage: data.from.imageUrl,
      });

      // Play ringtone
      if (!ringtoneRef.current) {
        const audio = new Audio("/incoming.mp3");
        audio.loop = true;
        audio.play().catch((err) => console.error("Audio play failed:", err));
        ringtoneRef.current = audio;
      }
    };

    socket.on("offer", handleOffer);

    return () => {
      socket.off("offer", handleOffer);
      ringtoneRef.current?.pause();
      ringtoneRef.current = null;
    };
  }, [socket]);

  const cleanup = () => {
    ringtoneRef.current?.pause();
    ringtoneRef.current = null;
    setCall(null);
  };

  const acceptCall = () => {
    cleanup();

    const callData = {
      peerId: call?.from,
      sdp: call?.sdp,
      name: call?.callerName,
      image: call?.callerImage,
    };

    dispatch(setCallData(callData));
    sessionStorage.setItem("call", JSON.stringify(callData));

    router.push(`/messages/${call?.roomId}?audio=1`);
  };

  const rejectCall = () => {
    cleanup();
    socket.emit("end-call", { to: call?.from });
  };

  if (!call) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-[300px] bg-white border shadow-xl rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={BASE_IMAGE + call.callerImage} />
          <AvatarFallback>{call.callerName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{call.callerName}</p>
          <p className="text-sm text-muted-foreground">is calling...</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={rejectCall}>Reject</Button>
        <Button onClick={acceptCall}>Accept</Button>
      </div>
    </div>
  );
}
