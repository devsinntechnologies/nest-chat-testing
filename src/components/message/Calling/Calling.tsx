"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Phone, Video } from 'lucide-react';
import { RootState } from '@/store/store';
import { User } from '@/lib/types';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import VideoCall from './VideoCall';
import AudioCall from './AudioCall';
import PermissionDialog from './PermissionDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CallingProps {
  receiver: User | null;
}

const Calling: React.FC<CallingProps> = ({ receiver }) => {
  const user = useSelector((state: RootState) => state.authSlice.user);
  const [isCall, setIsCall] = useState(false);
  const [audioCall, setAudioCall] = useState(false);
  const [videoCall, setVideoCall] = useState(false);
  const [permissionPopup, setPermissionPopup] = useState(false);
  const [isCheckingMedia, setIsCheckingMedia] = useState(false);
  const [remoteSDP, setRemoteSDP] = useState<any>(null);

  const permissions = usePermissionState(isCall);
  const searchParams = useSearchParams();

  useEffect(() => {
    const audio = searchParams.get("audio");
    const offer = searchParams.get("off");

    if (audio === "1" && offer) {
      try {
        setIsCall(true);
        setAudioCall(true);
        toast.success("Incoming audio call detected");
      } catch (err) {
        console.error("Failed to parse SDP offer", err);
      }
    }
  }, [searchParams]);

  const handleAudioCall = async () => {
    if (!receiver || !user) return toast.error("Missing user info");

    setIsCall(true);
    setAudioCall(true);

    try {
      setIsCheckingMedia(true);
      toast.success("Microphone access granted");
    } catch (error) {
      setIsCall(false);
      setAudioCall(false);
      toast.error("Microphone access denied or unavailable.");
      setPermissionPopup(true);
    } finally {
      setIsCheckingMedia(false);
    }
  };

  const handleVideoCall = async () => {
    if (!receiver || !user) return toast.error("Missing user info");

    setIsCall(true);
    setVideoCall(true);

    try {
      setIsCheckingMedia(true);
      toast.success("Camera & Mic access granted");
    } catch (error) {
      setIsCall(false);
      setVideoCall(false);
      toast.error("Camera or microphone access denied.");
      setPermissionPopup(true);
    } finally {
      setIsCheckingMedia(false);
    }
  };

  const closeCallDialog = () => {
    setIsCall(false);
    setAudioCall(false);
    setVideoCall(false);
    setRemoteSDP(null);

    const cleanURL = window.location.pathname;
    window.history.replaceState({}, "", cleanURL);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleAudioCall}
          disabled={isCheckingMedia}
          className="hover:bg-accent p-2 rounded-full transition"
          title="Audio Call"
        >
          <Phone className="text-primary" />
        </button>
        <button
          onClick={handleVideoCall}
          disabled={isCheckingMedia}
          className="hover:bg-accent p-2 rounded-full transition"
          title="Video Call"
        >
          <Video className="text-primary" />
        </button>
      </div>

      {permissionPopup && <PermissionDialog open={permissionPopup} setOpen={setPermissionPopup} />}

      {user && receiver && isCall && !permissionPopup && (
        <Dialog open={isCall} onOpenChange={closeCallDialog}>
          <DialogContent
            className="w-200"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            {videoCall && <VideoCall />}
            {audioCall && (
              <AudioCall
                receiver={receiver}
                endCall={closeCallDialog}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Calling;

function usePermissionState(isCall: boolean) {
  const [permissions, setPermissions] = useState({
    mic: 'prompt',
    cam: 'prompt',
  });

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

        setPermissions({
          mic: micStatus.state,
          cam: camStatus.state,
        });

        micStatus.onchange = () => setPermissions((p) => ({ ...p, mic: micStatus.state }));
        camStatus.onchange = () => setPermissions((p) => ({ ...p, cam: camStatus.state }));
      } catch (err) {
        console.warn("Permission API not supported", err);
      }
    };

    if (isCall) checkPermissions();
  }, [isCall]);

  return permissions;
}
