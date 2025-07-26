import { useCallback, useRef, useState } from "react";

export const useScreenShare = (
  peerConnectionRef: React.RefObject<RTCPeerConnection | null>,
  mediaStreamRef: React.RefObject<MediaStream | null>,
  localVideoRef: React.RefObject<HTMLVideoElement | null>
) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const toggleScreenShare = useCallback(async () => {
    if (!mediaStreamRef.current || !peerConnectionRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const originalVideoTrack = mediaStreamRef.current.getVideoTracks()[0];

        if (!screenTrack || !originalVideoTrack) return;

        originalVideoTrackRef.current = originalVideoTrack;

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        mediaStreamRef.current.removeTrack(originalVideoTrack);
        mediaStreamRef.current.addTrack(screenTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStreamRef.current;
        }

        screenTrack.onended = () => {
          if (!peerConnectionRef.current || !originalVideoTrackRef.current) return;

          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");

          if (sender) {
            sender.replaceTrack(originalVideoTrackRef.current);
          }

          mediaStreamRef.current?.removeTrack(screenTrack);
          mediaStreamRef.current?.addTrack(originalVideoTrackRef.current);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }

          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      // Optional: handle manual stop of screen sharing (not triggered by track.onended)
      if (originalVideoTrackRef.current) {
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          sender.replaceTrack(originalVideoTrackRef.current);
        }

        setIsScreenSharing(false);
      }
    }
  }, [isScreenSharing, mediaStreamRef, peerConnectionRef, localVideoRef]);

  return { isScreenSharing, toggleScreenShare };
};
