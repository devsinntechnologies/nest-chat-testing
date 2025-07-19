"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, MessageSquareWarningIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import { useFetchChatsQuery } from "@/hooks/useChat";
import { getSocket } from "@/lib/socket";
import { useSelector } from "react-redux";
import { BASE_IMAGE } from "@/lib/constants";
import SearchBar from "./SearchBar";
import Link from "next/link";
import FilterButtons from "./FilterButtons";
import { Skeleton } from "../ui/skeleton";
import { RootState } from "@/store/store";
import AllUsers from "./AllUsers";

type Message = {
  senderId: string;
  receiverId: string;
  message_text: string;
  type: string;
  timestamp: string;
};

type Room = {
  roomId: string;
  roomName: string;
  receiver: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
  };
  unreadMessages: number;
  lastMessage: Message | null;
};

type SocketNewMessagePayload = {
  roomId: string;
  lastMessage: Message;
  unreadMessages: number;
};

const MessageSideBar = () => {
  const userId = useSelector(
    (state: RootState) => state.authSlice.user?.id
  ) as string | undefined;

  const { id } = useParams<{ id?: string }>();
  const router = useRouter();
  const activeRoomId = id || null;

  const [rooms, setRooms] = useState<Room[]>([]);
  const { data: messagesData, isLoading, isError } = useFetchChatsQuery({});
  const [filter, setFilter] = useState<"All" | "Buyer" | "Seller">("All");
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredRooms = useMemo(() => {
    let updatedRooms = [...rooms];

    if (filter === "Buyer" && userId) {
      updatedRooms = updatedRooms.filter((room) => {
        const parts = room.roomId.split("-");
        return parts[1] === userId;
      });
    } else if (filter === "Seller" && userId) {
      updatedRooms = updatedRooms.filter((room) => {
        const parts = room.roomId.split("-");
        return parts[0] === userId;
      });
    }

    if (debouncedSearch) {
      updatedRooms = updatedRooms.filter((room) =>
        room.roomName?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    updatedRooms.sort((a, b) => {
      const timestampA = new Date(a.lastMessage?.timestamp || 0).getTime();
      const timestampB = new Date(b.lastMessage?.timestamp || 0).getTime();
      return timestampB - timestampA;
    });

    return updatedRooms;
  }, [rooms, filter, debouncedSearch, userId]);

  useEffect(() => {
    if (messagesData?.data) {
      setRooms(messagesData.data);
    }
  }, [messagesData]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data: SocketNewMessagePayload) => {
      const { roomId, lastMessage, unreadMessages } = data;

      setRooms((prevRooms) => {
        const existingIndex = prevRooms.findIndex(
          (room) => room.roomId === roomId
        );

        if (existingIndex !== -1) {
          const updatedRoom = {
            ...prevRooms[existingIndex],
            lastMessage,
            unreadMessages,
          };

          const updatedRooms = [
            updatedRoom,
            ...prevRooms.filter((room) => room.roomId !== roomId),
          ];

          return updatedRooms;
        } else {
          const newRoom: Room = {
            roomId,
            roomName: "New Chat",
            receiver: {
              id: "",
              name: "",
              email: "",
              imageUrl: "",
            },
            lastMessage,
            unreadMessages: 1,
          };

          return [newRoom, ...prevRooms];
        }
      });
    };

    const handleReadMessage = (data: { roomId: string; unreadMessages: number }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.roomId === data.roomId
            ? {
                ...room,
                unreadMessages: data.unreadMessages,
              }
            : room
        )
      );
    };

    socket.on("chatRoomUpdated", handleNewMessage);
    socket.on("newMessage", handleNewMessage);
    socket.on("readMessage", handleReadMessage);

    return () => {
      socket.off("chatRoomUpdated", handleNewMessage);
      socket.off("newMessage", handleNewMessage);
      socket.off("readMessage", handleReadMessage);
    };
  }, []);

  const handleRoomClick = (roomId: string) => {
    router.push(`/messages/${roomId}`);
  };

  if (isMobileView && id) return null;

  return (
    <div className="relative w-full flex flex-col h-screen bg-gray-50 border-r">
      <div className="px-4 pt-3">
        <div className="text-xl flex gap-2 items-center">
          <Link href="/">
            <ArrowLeft size={21} className="cursor-pointer text-base" />
          </Link>
          <h1 className="font-semibold">Chats</h1>
        </div>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <FilterButtons filter={filter} setFilter={setFilter} />
      </div>

      <div className="py-4 px-3 h-[calc(100vh-30vh)] flex-1 overflow-y-auto no-scrollbar">
        <div className="w-full">
          {!isLoading && !isError && filteredRooms.length > 0 && (
            filteredRooms.map((room) => {
              const isSender = room.lastMessage?.senderId === userId;
              const messageContent =
                room.lastMessage?.type === "text"
                  ? room.lastMessage?.message_text
                  : `[${room.lastMessage?.type}]`;

              return (
                <div
                  onClick={() => handleRoomClick(room.roomId)}
                  key={room.roomId}
                  className={`w-full cursor-pointer py-4 px-3 gap-4 flex items-center ${
                    activeRoomId === room.roomId ? "border-2 rounded-lg" : ""
                  }`}
                >
                  <Avatar className="lg:w-12 lg:h-12 w-10 h-10">
                    <AvatarImage
                      src={
                        room?.receiver?.imageUrl
                          ? `${BASE_IMAGE}${room?.receiver?.imageUrl}`
                          : ""
                      }
                      alt={room?.receiver?.email || ""}
                      className="w-full h-full"
                    />
                    <AvatarFallback>
                      {room?.roomName?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <h1 className="font-medium text-black text-base truncate">
                      {room.roomName || "Chat"}
                    </h1>
                    <h2 className="text-secondary text-sm truncate">
                      {isSender ? `You: ${messageContent}` : messageContent}
                    </h2>
                  </div>

                  <MessageTimestamp
                    timestamp={room.lastMessage?.timestamp}
                    unreadMessages={room.unreadMessages}
                    isSender={isSender}
                  />
                </div>
              );
            })
          )}

          {!isLoading && !isError && filteredRooms.length === 0 && (
            <div className="w-full flex items-center justify-center h-40 gap-3">
              <MessageSquareWarningIcon /> No Chats Found
            </div>
          )}

          {isLoading && (
            <div className="w-full space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="w-full h-[60px]" />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="h-50 text-destructive text-lg flex items-center justify-center">
              Error loading Messages. Please try again.
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 right-2">
        <AllUsers />
      </div>
    </div>
  );
};

type MessageTimestampProps = {
  timestamp: string | undefined;
  unreadMessages: number;
  isSender: boolean;
};

const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  timestamp,
  unreadMessages,
  isSender,
}) => {
  const formatTimestamp = (ts?: string) => {
    if (!ts) return "";
    const date = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) return "Today";
    if (date >= yesterday) return "Yesterday";

    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-center gap-1 flex-col text-center text-xs">
      <h1>{formatTimestamp(timestamp)}</h1>
      {!isSender && unreadMessages > 0 && (
        <div className="p-1 size-6 text-white bg-primary rounded-full">
          {unreadMessages}
        </div>
      )}
    </div>
  );
};

export default MessageSideBar;
