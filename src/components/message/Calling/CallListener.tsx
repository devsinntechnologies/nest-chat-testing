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
import { showIncomingCallNotification } from "@/lib/notification";

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
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>();
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const notificationRef = useRef<Notification | null>(null);

  // Ask Notification Permission
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationSupported(true);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if (!notificationSupported) return;
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
    });
  };

  // Handle Incoming Calls
  useEffect(() => {
    const handleOffer = (data: { type?: string; from: User; sdp: any; roomId: string }) => {
      if (data.type === "negotiation") return;

      const incoming: IncomingCall = {
        from: data.from.id,
        sdp: data.sdp,
        roomId: data.roomId,
        callerName: data.from.name,
        callerImage: data.from.imageUrl,
      };

      setCall(incoming);

      // Play ringtone
      if (!ringtoneRef.current) {
        const audio = new Audio("/incoming.mp3");
        audio.loop = true;
        audio.play().catch((err) => console.error("Audio play failed:", err));
        ringtoneRef.current = audio;
      }

      if (notificationSupported && Notification.permission === "granted") {
        if (!document.hasFocus()) {
          const notify = showIncomingCallNotification({
            title: `${incoming.callerName} is calling...`,
            body: "Click to open the call",
            icon: BASE_IMAGE + incoming.callerImage,
          });

          notificationRef.current = notify || null;
        }
      }
    };

    socket.on("offer", handleOffer);

    return () => {
      socket.off("offer", handleOffer);
      ringtoneRef.current?.pause();
      ringtoneRef.current = null;
    };
  }, [socket, notificationSupported]);

  const cleanup = () => {
    ringtoneRef.current?.pause();
    ringtoneRef.current = null;

    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }

    setCall(null);
  };

  const acceptCall = () => {
    cleanup();
    if (!call) return;

    const callData = {
      peerId: call.from,
      sdp: call.sdp,
      name: call.callerName,
      image: call.callerImage,
    };

    dispatch(setCallData(callData));
    sessionStorage.setItem("call", JSON.stringify(callData));
    router.push(`/messages/${call.roomId}?audio=1`);
  };

  const rejectCall = () => {
    if (call?.from) socket.emit("end-call", { to: call.from });
    cleanup();
  };

  return (
    <>
      {notificationSupported && notificationPermission !== "granted" && (
        <div className="fixed top-4 right-4 z-50 w-[300px] bg-yellow-100 text-yellow-900 border border-yellow-300 shadow rounded-md p-3">
          <p className="text-sm">Please enable notifications for incoming call alerts.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={requestNotificationPermission}>
            Enable Notifications
          </Button>
        </div>
      )}

      {call && (
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
            <Button variant="outline" onClick={rejectCall}>
              Reject
            </Button>
            <Button onClick={acceptCall}>Accept</Button>
          </div>
        </div>
      )}
    </>
  );
}
