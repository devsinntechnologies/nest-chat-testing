"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDebounce } from "@/hooks/UseDebounce";
import Pagination from "../Pagination";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { BASE_IMAGE } from "@/lib/constants";
import { useSearchMessagesQuery } from "@/hooks/useChat";

interface SearchMessageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchMessage({ open, onOpenChange }: SearchMessageProps) {
  const { id: roomId } = useParams();
  const [query, setQuery] = useState("");
  const [pageNo, setPageNo] = useState(1);

  const debouncedQuery = useDebounce(query, 500);
  const pageSize = 5;

  const queryParams = useMemo(
    () => ({
      roomId,
      query: debouncedQuery,
      pageNo,
      pageSize,
    }),
    [roomId, debouncedQuery, pageNo]
  );

  const { data, isLoading, refetch } = useSearchMessagesQuery(queryParams);

  const messages = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [debouncedQuery, pageNo, open, refetch]);

  const renderMessageCard = (msg: any) => (
    <Card
      key={msg.id}
      className="group relative px-5 py-4 flex flex-col gap-3 rounded-2xl border border-muted bg-background shadow-sm hover:shadow-md transition"
    >
      {/* Header: Avatar + Name + Time */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 shadow">
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
          <div>
            <div className="font-semibold text-sm leading-tight text-foreground">
              {msg.Sender?.name || "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Edited badge (if edited) */}
        {msg.editCount > 0 && (
          <Badge
            variant="destructive"
            className="text-[10px] px-2 py-0.5 tracking-wide rounded-full"
          >
            Edited
          </Badge>
        )}
      </div>

      {/* Message Text */}
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {msg.message_text}
      </p>

      {/* Attachments */}
      {msg.message_file_url && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">Attachment:</span>
          <a
            href={msg.message_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition"
          >
            📎 View file
          </a>
        </div>
      )}

      {/* Optional: subtle bottom border on hover */}
      <div className="absolute bottom-0 left-5 right-5 h-px bg-muted opacity-0 group-hover:opacity-100 transition"></div>
    </Card>
  );


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5" /> Search Messages
          </DialogTitle>
          <DialogDescription>
            Quickly find messages from your chat history.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by message text…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPageNo(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 w-full">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No messages found for{" "}
              <span className="font-medium">{debouncedQuery || "…empty query"}</span>
            </p>
          ) : (
            messages.map(renderMessageCard)
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              totalPages={totalPages}
              currentPage={pageNo}
              onPageChange={setPageNo}
            />
          </div>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
