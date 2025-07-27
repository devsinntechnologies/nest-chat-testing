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
      if (videoTrack.enabled) {
        videoTrack.stop(); // this fully turns off the camera
        setIsVideoOn(false);
      } else {
        // Re-acquire camera if needed
        navigator.mediaDevices.getUserMedia({ video: true }).then((newStream) => {
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (mediaStreamRef.current) {
            mediaStreamRef.current.addTrack(newVideoTrack);
            setIsVideoOn(true);
          }
        });
      }
    }
  }, [mediaStreamRef]);

  return {
    isMicOn,
    isVideoOn,
    toggleMic,
    toggleVideo,
  };
};
