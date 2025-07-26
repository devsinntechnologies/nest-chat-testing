import { useState, useCallback } from "react";

export const useMediaControls = (mediaStreamRef: React.RefObject<MediaStream | null>) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const toggleMic = useCallback(() => {
    const audioTrack = mediaStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, [mediaStreamRef]);

  const toggleVideo = useCallback(() => {
    const videoTrack = mediaStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  }, [mediaStreamRef]);

  return {
    isMicOn,
    isVideoOn,
    toggleMic,
    toggleVideo,
  };
};
