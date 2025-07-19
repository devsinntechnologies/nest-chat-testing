"use client";

import { useUploadMessageFileMutation } from "@/hooks/useChat";
import { getSocket } from "@/lib/socket";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { useSelector } from "react-redux";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onCancel: () => void;
  setIsVoiceMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onCancel, setIsVoiceMode }) => {
  const { id } = useParams();
  const senderId = useSelector((state: RootState) => state.authSlice.user?.id);
  const [user1Id, user2Id] = (id as string).split('-').map(String);
  const receiverId = senderId === user1Id ? user2Id : user1Id;
  const socket = getSocket();
  const [addFile, { isLoading }] = useUploadMessageFileMutation();
  const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [time, setTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    startRecording();
    setIsRecording(true);
    setRecorded(false);
    setTime(0);
    timerRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
  };

  const handleStop = () => {
    stopRecording();
    setIsRecording(false);
    setRecorded(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleCancel = () => {
    stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsVoiceMode(false);
    setIsRecording(false);
    setRecorded(false);
    setTime(0);
    onCancel();
  };

  const handleUpload = async (blob: Blob) => {
    if (!blob) {
      toast.error("No file found");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('receiverId', receiverId)
      formData.append("files", blob, `voice_${Date.now()}.opus`);
      // formData.append("files", blob);

      const res = await addFile(formData).unwrap();

      toast.success("File uploaded!");
      setIsVoiceMode(false);

      if (res.success && res.data?.length) {
        res.data.forEach((item: any) => {
          socket.emit("sendMessage", {
            receiverId,
            message_file_url: item.fileUrl,
            type: item.type,
          });
        });
      }
    } catch {
      toast.error("Failed to upload.");
    }
  };

  const handleSend = async () => {
    if (!mediaBlobUrl) {
      toast.error
      return;
    }
    try {
      const res = await fetch(mediaBlobUrl);
      const blob = await res.blob();
      console.log("Voice blob ready:", blob);
      await handleUpload(blob);
    } catch {
      toast.error("Failed to process audio.");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full max-w-sm mx-auto flex flex-col gap-2">
      <div className="text-center text-sm text-gray-700">
        {isRecording ? (
          <span className="text-red-500">Recording... {formatTime(time)}</span>
        ) : recorded ? (
          <span className="text-green-600">Recorded</span>
        ) : (
          <span className="text-gray-500">Press to Record</span>
        )}
      </div>

      {recorded && mediaBlobUrl && (
        <audio
          src={mediaBlobUrl}
          controls
          className="w-full border rounded p-1"
        />
      )}

      <div className="flex justify-between mt-2 gap-2">
        {!isRecording && !recorded && (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white rounded py-2 hover:bg-blue-600 disabled:opacity-50"
          >
            Start
          </button>
        )}

        {isRecording && (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="flex-1 bg-red-500 text-white rounded py-2 hover:bg-red-600 disabled:opacity-50"
          >
            Stop
          </button>
        )}

        {recorded && (
          <>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="flex-1 bg-green-500 text-white rounded py-2 hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-400 text-white rounded py-2 hover:bg-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}

        {!recorded && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-400 text-white rounded py-2 hover:bg-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
