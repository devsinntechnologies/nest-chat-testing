"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BASE_IMAGE } from "@/lib/constants";
import { SingleMessageProps } from "@/lib/types";
import Image from "next/image";
import AudioPlayer from "@/components/players/AudioPlayer";
import VideoPlayer from "@/components/players/VideoPlayer";
import { getSocket } from "@/lib/socket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, PenBox, Trash2 } from "lucide-react";

const Message: React.FC<SingleMessageProps> = ({ msg }) => {
  const socket = getSocket();
  const senderId = useSelector(
    (state: RootState) => state.authSlice?.user?.id
  );

  const [expanded, setExpanded] = useState(false);

  const isSender = msg?.Sender?.id === senderId;

  const handleToggleExpand = () => setExpanded(!expanded);

  const handleEdit = (id: string, currentText: string) => {
    const newText = prompt("Edit your message:", currentText);
    if (!newText || newText === currentText) return;

    socket.emit("editMessage", { id, message_text: newText });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    socket.emit("deleteMessage", { id });
  };

  return (
    <div
      className={`flex mb-3 items-end ${isSender ? "justify-end" : "justify-start"}`}
    >
      {!isSender && (
        <Avatar className="w-8 h-8 mr-1">
          <AvatarImage
            src={
              msg.Sender?.imageUrl
                ? `${BASE_IMAGE}${msg.Sender.imageUrl}`
                : ""
            }
            alt={msg.Sender?.name || "User"}
          />
          <AvatarFallback>
            {msg.Sender?.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Edit/Delete menu only if NOT deleted */}
      {isSender && !msg.isDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="outline-0">
            <button className="relative top-0 p-1 rounded text-primary">
              <EllipsisVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => handleEdit(msg.id, msg.message_text)}
            >
              <PenBox /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(msg.id)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div
        className={`p-3 text-sm rounded-2xl max-w-[75%] relative ${isSender
            ? "bg-primary text-white rounded-br-none"
            : "bg-muted text-black rounded-bl-none"
          }`}
      >
        {msg.isDelete ? (
          <p className="italic text-muted-foreground">
            This message was deleted
          </p>
        ) : ["image", "video", "audio"].includes(msg.type) ? (
          <>
            {msg.type === "image" && (
              <Image
                src={`${BASE_IMAGE}${msg.message_file_url}`}
                alt="Uploaded Image"
                className="mt-2 rounded-md object-contain max-h-[300px] w-auto block mx-auto"
                width={400}
                height={400}
              />
            )}
            {msg.type === "video" && (
              <VideoPlayer src={`${BASE_IMAGE}${msg.message_file_url}`} />
            )}
            {msg.type === "audio" && (
              <AudioPlayer src={`${BASE_IMAGE}${msg.message_file_url}`} />
            )}
            <p className="whitespace-pre-wrap break-words mt-1">
              {expanded || msg.message_text.length <= 250
                ? msg.message_text
                : msg.message_text.slice(0, 250) + "..."}
            </p>
          </>
        ) : (
          <p className="whitespace-pre-wrap break-words">
            {expanded || msg.message_text.length <= 250
              ? msg.message_text
              : msg.message_text.slice(0, 250) + "..."}
          </p>
        )}

        {/* See more/less only if not deleted */}
        {!msg.isDelete && msg.message_text.length > 250 && (
          <button
            onClick={handleToggleExpand}
            className="text-xs mt-1 cursor-pointer"
          >
            {expanded ? "See less" : "See more"}
          </button>
        )}

        <div className="text-[10px] text-right text-gray-300 mt-1 flex items-center justify-end gap-1">
          {!msg.isDelete && msg.editCount > 0 && <p>(edited)</p>}
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isSender && (
        <Avatar className="w-8 h-8 ml-1">
          <AvatarImage
            src={
              msg.Sender?.imageUrl
                ? `${BASE_IMAGE}${msg.Sender.imageUrl}`
                : ""
            }
            alt={msg.Sender?.name || "User"}
          />
          <AvatarFallback>
            {msg.Sender?.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default Message;
