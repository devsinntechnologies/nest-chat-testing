"use client";

import { usePeer } from "@/context/PeerContext";
import { getSocket } from "@/lib/socket";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useSelector } from "react-redux";

interface ChildProps {
  children: ReactNode;
}

export default function Child({ children }: ChildProps) {
  const userId = useSelector((state: RootState) => state.authSlice.user?.id);
  const params = useParams();
  const idParam = params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [user1, user2] = (id?.split("-") ?? ["", ""]) as [string, string];

  const receiverId = user1 === userId ? user2 : user1;
  const { peerConnection } = usePeer();
  const socket = getSocket();

  const [offerSDP, setOfferSDP] = useState("");
  const [answerSDP, setAnswerSDP] = useState("");

  // 👉 Negotiation Handler
  useEffect(() => {
    if (!peerConnection) return;

    const handleNegotiation = async () => {
      try {
        const existingSDP = peerConnection.localDescription;
        console.log("[negotiationneeded] Triggered");
        console.log("[negotiationneeded] Existing SDP:", existingSDP?.type);

        if (existingSDP?.type === "offer") {
          console.log("[negotiationneeded] Reusing existing offer");
          socket.emit("offer", { type: "negotiation", to: receiverId, sdp: existingSDP });
          setOfferSDP(JSON.stringify(existingSDP));
        } else {
          console.log("[negotiationneeded] Creating new offer...");
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit("offer", {type: "negotiation", to: receiverId, sdp: offer });
          setOfferSDP(JSON.stringify(offer));
          console.log("[negotiationneeded] New offer sent");
        }
      } catch (err) {
        console.error("[negotiationneeded] Failed", err);
      }
    };

    peerConnection.onnegotiationneeded = handleNegotiation;

    return () => {
      console.log("[negotiationneeded] Cleanup");
      peerConnection.onnegotiationneeded = null;
    };
  }, [peerConnection, socket, receiverId]);

  // 👉 Signaling Handler
  useEffect(() => {
    if (!peerConnection) return;

    const handleOffer = async ({ from, sdp }: any) => {
      try {
        const offer = typeof sdp === "string" ? JSON.parse(sdp) : sdp;
        console.log("[socket] Received offer from:", from);

        if (!peerConnection.remoteDescription) {
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          socket.emit("answer", { to: from?.id || receiverId, sdp: answer });
          setAnswerSDP(JSON.stringify(answer));
          console.log("[socket] Sent answer");
        }
      } catch (err) {
        console.error("[socket] Error handling offer", err);
      }
    };

    const handleAnswer = async ({ sdp }: any) => {
      try {
        const answer = typeof sdp === "string" ? JSON.parse(sdp) : sdp;
        if (!peerConnection.remoteDescription) {
          await peerConnection.setRemoteDescription(answer);
          console.log("[socket] Answer applied");
        }
      } catch (err) {
        console.error("[socket] Error handling answer", err);
      }
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
    };
  }, [peerConnection, socket, receiverId]);

  return <>{children}</>;
}
