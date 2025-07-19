"use client";

import { BASE_IMAGE } from "@/lib/constants";
import { MessageProps } from "@/lib/types";
import { RootState } from "@/store/store";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { Check, CheckCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

type MessageReadStatusProps = {
  message: MessageProps["msg"];
  allRead: boolean;
};

export default function MessageReadStatus({
  message,
  allRead,
}: MessageReadStatusProps) {
  const currentUserId = useSelector(
    (state: RootState) => state.authSlice.user?.id
  );

  const messageReads = message.messageReads || [];

  const readers = messageReads.filter(
    (r) => r.userId !== currentUserId
  );

  const othersReadCount = readers.length;

  const [showReadBy, setShowReadBy] = useState(false);

  const handleCloseReadBy = () => setShowReadBy(false);

  let iconColor = "text-red-500"; // default: nobody read
  let doubleTick = false;

  if (allRead) {
    iconColor = "text-blue-500";
    doubleTick = true;
  } else if (othersReadCount > 0) {
    iconColor = "text-blue-500";
  }

  return (
    <>
      <div
        className="flex items-center gap-0.5 cursor-pointer"
        onClick={() => setShowReadBy(true)}
        title="View who read"
      >
        {doubleTick ? (
            <CheckCheck size={14} className={`${iconColor}`} />
        ) : (
          <Check size={14} className={`${iconColor}`} />
        )}
      </div>

      <Dialog open={showReadBy} onOpenChange={setShowReadBy}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Read by</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground mb-2">
            Message: <span className="italic">{message.message_text}</span>
          </p>

          <div className="space-y-2">
            {readers.length === 0 && (
              <p className="text-sm text-gray-500">No one has read this yet.</p>
            )}
            {readers.map((r) => (
              <div
                key={r.userId}
                className="flex items-center gap-2 text-sm"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage
                    src={
                      r.user.imageUrl
                        ? `${BASE_IMAGE}${r.user.imageUrl}`
                        : ""
                    }
                    alt={r.user.name}
                  />
                  <AvatarFallback>
                    {r.user.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span>{r.user.name}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
