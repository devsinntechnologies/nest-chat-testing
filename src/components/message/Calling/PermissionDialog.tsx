import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, ShieldAlert, Video } from "lucide-react";
import { toast } from "sonner";

interface DialogProps {
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<any>>
}

const PermissionDialog: React.FC<DialogProps> = ({ open, setOpen }) => {
  const [permissions, setPermissions] = useState({
    mic: "prompt",
    cam: "prompt",
  });

  const checkPermissions = async () => {
    try {
      const micStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
      const camStatus = await navigator.permissions.query({ name: "camera" as PermissionName });

      setPermissions({
        mic: micStatus.state,
        cam: camStatus.state,
      });

      micStatus.onchange = () =>
        setPermissions((prev) => ({ ...prev, mic: micStatus.state }));
      camStatus.onchange = () =>
        setPermissions((prev) => ({ ...prev, cam: camStatus.state }));
    } catch (err) {
      console.warn("Permission API not supported", err);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestPermission = async (type: "audio" | "video") => {
    try {
      const constraints =
        type === "audio" ? { audio: true } : { audio: true, video: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      stream.getTracks().forEach((track) => track.stop());

      toast.success(`${type === "audio" ? "Microphone" : "Camera & Mic"} permission granted`);
      checkPermissions();
    } catch (error) {
      toast.error("Permission denied or blocked.");
      checkPermissions();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Permissions Required</DialogTitle>
          <DialogDescription>
            To start a call, we need access to your microphone and camera.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(permissions.mic === "prompt" || permissions.cam === "prompt") && (
            <div className="flex gap-2 flex-wrap">
              {permissions.mic === "prompt" && (
                <Button onClick={() => requestPermission("audio")} variant="default">
                  <Mic className="mr-2 w-4 h-4" />
                  Request Mic Access
                </Button>
              )}
              {permissions.cam === "prompt" && (
                <Button onClick={() => requestPermission("video")} variant="secondary">
                  <Video className="mr-2 w-4 h-4" />
                  Request Camera Access
                </Button>
              )}
            </div>
          )}

          {(permissions.mic === "denied" || permissions.cam === "denied") && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Mic or camera access is blocked. Please allow it in your browser settings (🔒 icon in the address bar).
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={checkPermissions}>
            Recheck Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionDialog;
