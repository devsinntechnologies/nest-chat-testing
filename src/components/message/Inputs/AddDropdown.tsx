"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, Video, Mic, ImageIcon, Trash2, Loader2, Crop } from "lucide-react";
import { useState } from "react";
import CropModal from "../../Modal/CropModal";
import Image from "next/image";
import { useUploadMessageFileMutation } from "@/hooks/UseWorkspace";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getWorkspaceSocket } from "@/lib/workspaceSocket";

export function AddDropdown() {
  const { id } = useParams();
  const socket = getWorkspaceSocket();
  const [addFile, { isLoading }] = useUploadMessageFileMutation();

  const [dialogType, setDialogType] = useState<"image" | "video" | "audio" | null>(null);
  const [files, setFiles] = useState<{ type: string; url: string; blob: Blob }[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    const newFiles: typeof files = [];
    for (const file of Array.from(fileList)) {
      const url = URL.createObjectURL(file);
      if (dialogType === "image" && !showCropper && !imageToCrop) {
        setImageToCrop(url);
        setShowCropper(true);
      } else {
        newFiles.push({ type: dialogType!, url, blob: file });
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleCropped = (croppedBlob: Blob) => {
    const url = URL.createObjectURL(croppedBlob);
    setFiles((prev) => [...prev, { type: "image", url, blob: croppedBlob }]);
    setShowCropper(false);
    setImageToCrop(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error("No files added");
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file.blob));

      const res = await addFile({ id, formData }).unwrap();

      setFiles([]);
      toast.success("Files uploaded!");

      if (res.success && res.data?.length) {
        res.data.forEach((item: any) => {
          socket.emit("sendMessage", {
            workspaceId: item.workspaceId,
            message_file_url: item.fileUrl,
            type: item.type,
          });
        });
      }
    } catch {
      toast.error("Failed to upload.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PlusCircle className="size-6 cursor-pointer text-muted-foreground hover:text-primary" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 py-2" align="start">
          <DropdownMenuLabel>Add Content</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogType("image")}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Upload Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType("video")}>
            <Video className="mr-2 h-4 w-4" />
            Upload Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType("audio")}>
            <Mic className="mr-2 h-4 w-4" />
            Upload Audio
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!dialogType} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload {dialogType}</DialogTitle>
          </DialogHeader>

          {showCropper && imageToCrop && (
            <CropModal
              imageSrc={imageToCrop}
              onCancel={() => {
                setShowCropper(false);
                setImageToCrop(null);
                setDialogType(null);
              }}
              onCrop={handleCropped}
            />
          )}

          <div className="text-sm text-muted-foreground mb-2">
            Drag & drop or browse files below
          </div>

          <div className="grid grid-cols-3 gap-4">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative rounded-lg border bg-muted aspect-square overflow-hidden shadow-sm"
              >
                {file.type === "image" && (
                  <Image
                    src={file.url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                )}
                {file.type === "video" && (
                  <video
                    src={file.url}
                    controls
                    className="object-cover w-full h-full"
                  />
                )}
                {file.type === "audio" && (
                  <audio
                    src={file.url}
                    controls
                    className="w-full p-2"
                  />
                )}
                {/* <div className="absolute bottom-0 text-xs bg-black/60 text-white w-full text-center truncate px-1">
                  {file.blob?.name}
                </div> */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {file.type === "image" && (
                    <button
                      onClick={() => {
                        setImageToCrop(file.url);
                        setShowCropper(true);
                      }}
                      className="bg-primary text-white rounded-full p-1"
                    >
                      <Crop size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button asChild variant="secondary">
              <label htmlFor="fileUpload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
            <input
              id="fileUpload"
              name="fileUpload"
              type="file"
              multiple
              accept={
                dialogType === "image"
                  ? "image/*"
                  : dialogType === "video"
                  ? "video/*"
                  : "audio/*"
              }
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isLoading}
            >
              {isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
