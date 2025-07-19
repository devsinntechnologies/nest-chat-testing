// @ts-nocheck
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
import ChatWithSeller from "./ChatWithSeller";
import AllUsers from "./AllUsers";
// import EmptyInbox from "../misc/EmptyInbox";


const MessageSideBar = () => {
  const userId = useSelector((state: RootState) => state.authSlice.user?.id);
  const { id } = useParams();
  const router = useRouter();
  const activeRoomId = id || null;
  const [rooms, setRooms] = useState([]);
  const { data: messagesData, isLoading, isError } = useFetchChatsQuery({});
  const [filter, setFilter] = useState("All");
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300); // Adjust delay (in milliseconds)

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredRooms = useMemo(() => {
    let updatedRooms = [...rooms];

    if (filter === "Buyer") {
      updatedRooms = updatedRooms.filter((room) => {
        if (!room.roomId || !userId) return false; // Ensure room.roomId exists before splitting
        const parts = room.roomId.split("-");
        return parts.length > 1 && parts[1] === userId;
      });
    } else if (filter === "Seller") {
      updatedRooms = updatedRooms.filter((room) => {
        if (!room.roomId || !userId) return false;
        const parts = room.roomId.split("-");
        return parts.length > 0 && parts[0] === userId;
      });
    }

    if (debouncedSearch) {
      updatedRooms = updatedRooms.filter((room) =>
        room.roomName?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    updatedRooms.sort((a, b) => {
      const timestampA = new Date(a.lastMessage?.timestamp).getTime() || 0;
      const timestampB = new Date(b.lastMessage?.timestamp).getTime() || 0;
      return timestampB - timestampA; // Descending order
    });

    return updatedRooms;
  }, [rooms, filter, debouncedSearch, userId]);

  useEffect(() => {
    if (messagesData?.data) {
      setRooms(messagesData.data);
    }
  }, [messagesData]);

  // isMobileView
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

    // Handle incoming new messages
    const handleNewMessage = (data) => {
      const { roomId, lastMessage, unreadMessages } =
        data;

      setRooms((prevRooms) => {
        let updatedRooms = prevRooms.map((room) =>
          room.roomId === roomId
            ? { ...room, lastMessage, unreadMessages }
            : room
        );

        const existingRoomIndex = prevRooms.findIndex(
          (room) => room.roomId === roomId
        );

        if (existingRoomIndex === -1) {
          updatedRooms = [
            { roomId, lastMessage, unreadMessages: 1 },
            ...prevRooms,
          ];
        } else {
          // Move the updated room to the top
          const updatedRoom = updatedRooms.find(
            (room) => room.roomId === roomId
          );
          updatedRooms = updatedRooms.filter((room) => room.roomId !== roomId);
          updatedRooms.unshift(updatedRoom);
        }

        return updatedRooms;
      });
    };

    // Handle message read event
    const handleReadMessage = (data) => {
      const { roomId, unreadMessages } = data;
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.roomId === roomId
            ? {
              ...room,
              lastMessage: {
                ...room.lastMessage,
              },
              unreadMessages,
            }
            : room
        )
      );
    };

    // Listen for incoming socket events
    socket.on("chatRoomUpdated", handleNewMessage);
    socket.on("newMessage", handleNewMessage);
    socket.on("readMessage", handleReadMessage);

    return () => {
      socket.off("chatRoomUpdated", handleNewMessage);
      socket.off("newMessage", handleNewMessage);
      socket.off("readMessage", handleReadMessage);
    };
  }, [userId]);

  useEffect(() => {
    if (messagesData?.data) {
      setRooms(messagesData.data);
    }
  }, [messagesData]);

  const handleRoomClick = (roomId) => {
    router.push(`/messages/${roomId}`);
  };

  if (isMobileView && id) {
    return;
  }

  return (
    <div className="relative w-full flex flex-col h-screen bg-gray-50 border-r">
      <div className="px-4 pt-3">
        <div className="text-xl flex gap-2 items-center">
          <Link href="/">
            <ArrowLeft
              size={21}
              className="cursor-pointer font-extralight text-base"
            /></Link>
          <h1 className="font-semibold">Chats</h1>
        </div>
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <FilterButtons filter={filter} setFilter={setFilter} />
      </div>
      <div className="py-4 px-3 h-[calc(100vh-30vh)] flex-1 overflow-y-auto no-scrollbar">
        <div className="w-full">
          {!isLoading &&
            !isError &&
            (filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const isSender = room.lastMessage?.senderId === userId;
                const messageContent = isSender
                  ? `You: ${room.lastMessage?.content || ""}`
                  : room.lastMessage?.content || "";

                return (
                  <div
                    onClick={() => handleRoomClick(room.roomId)} // Fixed function name
                    key={room.roomId}
                    className={`w-full cursor-pointer transition-all justify-center py-4 px-3 gap-4 flex items-center ${activeRoomId === room.roomId ? "border-2 rounded-lg" : ""
                      }`}
                  >
                    <Avatar className="lg:w-12 lg:h-12  w-10 h-10">
                      <AvatarImage
                        src={
                          room?.receiver?.imageUrl
                            ? `${BASE_IMAGE}${room?.receiver?.imageUrl}`
                            : ""
                        }
                        alt={room?.users?.[0]?.email || ""}
                        className="w-full h-full text-sm bg-gradient-to-t to-gradientTo from-gradientFrom"
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {room?.roomName?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 text-[10px] h-fit">
                      <div className="flex gap-1">
                        <h1 className="font-medium text-black text-base truncate">
                          {room.roomName || "Chat"}
                        </h1>
                      </div>
                      <h2 className="text-secondary text-sm truncate">
                        {messageContent}
                      </h2>
                    </div>

                    <MessageTimestamp
                      timestamp={new Date(room.lastMessage?.timestamp)}
                      unreadMessages={room.unreadMessages || 0}
                      isSender={isSender}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                {/* <EmptyInbox /> */}
                <div className="w-full flex items-center justify-center h-40 gap-3"><MessageSquareWarningIcon /> No Chats Found</div>
              </div>
            ))}
          {isLoading &&
            <div className="w-full space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="w-full h-[60px]" />
              ))}
            </div>}
          {!isLoading && isError && (
            <div className="h-50 text-destructive text-lg flex items-center justify-center">
              Error loading Messages. Please try again.
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-2 right-2"> <AllUsers /></div>
    </div>
  );
};

const MessageTimestamp = ({ timestamp, unreadMessages, isSender }) => {
  const formatTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday =
      messageDate.toLocaleDateString() === today.toLocaleDateString();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      messageDate.toLocaleDateString() === yesterday.toLocaleDateString();

    // const formattedTime = messageDate.toLocaleTimeString([], {
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   hour12: true, // Force AM/PM format
    // });

    if (isToday) {
      return `Today`;
    }
    if (isYesterday) {
      return `Yesterday`;
    }

    return `${messageDate.toLocaleDateString()}`;
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
