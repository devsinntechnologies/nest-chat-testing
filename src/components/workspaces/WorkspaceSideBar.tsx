// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Lock, MessageSquareWarningIcon, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import { getWorkspaceSocket } from "@/lib/workspaceSocket";
import { useSelector } from "react-redux";
import { BASE_IMAGE } from "@/lib/constants";
import SearchBar from "./SearchBar";
import { Skeleton } from "../ui/skeleton";
import { RootState } from "@/store/store";
import { useGetPublicWorkspacesQuery, useGetPrivateWorkspacesQuery } from "@/hooks/UseWorkspace";
import Image from "next/image";

const WorkspaceSideBar = () => {
  const userId = useSelector((state: RootState) => state.authSlice.user?.id);
  const { id } = useParams();
  const router = useRouter();

  const activeworkspaceId = id || null;

  const {
    data: publicWorkspacesData,
    isLoading: isLoadingPublic,
    isError: publicError
  } = useGetPublicWorkspacesQuery({ pageNo: 1, pageSize: 100 });

  const {
    data: privateWorkspacesData,
    isLoading: isLoadingPrivate,
    isError: privateError
  } = useGetPrivateWorkspacesQuery({ pageNo: 1, pageSize: 100 });

  const [filter, setFilter] = useState("All");
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ [workspaceId: string]: { userId: string, name: string }[] }>({});
  const [rooms, setRooms] = useState([]);

  const isError = publicError && privateError;
  const isLoading = isLoadingPrivate && isLoadingPublic;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const combinedWorkspaces = useMemo(() => {
    const publicList = publicWorkspacesData?.data || [];
    const privateList = privateWorkspacesData?.data || [];
    let filtered: any[] = [];

    if (filter === "Public") filtered = publicList;
    else if (filter === "Private") filtered = privateList;
    else filtered = [...publicList, ...privateList];

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter((ws) =>
        ws.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [filter, publicWorkspacesData, privateWorkspacesData, debouncedSearch]);

  // Sync rooms whenever combinedWorkspaces changes
  useEffect(() => {
    setRooms((prevRooms) => {
      return combinedWorkspaces.map(ws => {
        const existing = prevRooms.find(r => r.workspaceId === ws.id);
        return existing || {
          workspaceId: ws.id,
          lastMessage: ws.lastMessage || null,
          unreadMessages: ws.unreadedCount || 0,
        };
      });
    });
  }, [combinedWorkspaces]);

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
    const socket = getWorkspaceSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { workspaceId, lastMessage, unreadMessages } = data;

      setRooms((prevRooms) => {
        let updatedRooms = prevRooms.map((room) =>
          room.workspaceId === workspaceId
            ? { ...room, lastMessage, unreadMessages }
            : room
        );

        const existingRoomIndex = prevRooms.findIndex(
          (room) => room.workspaceId === workspaceId
        );

        if (existingRoomIndex === -1) {
          updatedRooms = [
            { workspaceId, lastMessage, unreadMessages: 1 },
            ...prevRooms,
          ];
        } else {
          const updatedRoom = updatedRooms.find(
            (room) => room.workspaceId === workspaceId
          );
          updatedRooms = updatedRooms.filter((room) => room.workspaceId !== workspaceId);
          updatedRooms.unshift(updatedRoom);
        }

        return updatedRooms;
      });
    };

    const handleReadMessage = (data) => {
      const { workspaceId, unreadMessages } = data;
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.workspaceId === workspaceId
            ? {
              ...room,
              unreadMessages,
            }
            : room
        )
      );
    };

    const onTyping = ({ workspaceId, userId, name }) => {
      setTypingUsers((prev) => {
        const currentWorkspaceUsers = Array.isArray(prev[workspaceId]) ? prev[workspaceId] : [];
        const alreadyExists = currentWorkspaceUsers.some((u) => u.userId === userId);

        if (alreadyExists) return prev;

        return {
          ...prev,
          [workspaceId]: [...currentWorkspaceUsers, { userId, name }]
        };
      });
    };

    const onStopTyping = ({ workspaceId, userId }) => {
      setTypingUsers((prev) => {
        const currentWorkspaceUsers = Array.isArray(prev[workspaceId]) ? prev[workspaceId] : [];
        const updatedUsers = currentWorkspaceUsers.filter((u) => u.userId !== userId);

        return {
          ...prev,
          [workspaceId]: updatedUsers
        };
      });
    };


    socket.on("userTyping", onTyping);
    socket.on("userStopTyping", onStopTyping);
    socket.on("newMessage", handleNewMessage);
    socket.on("readMessage", handleReadMessage);

    return () => {
      socket.off("userTyping", onTyping);
      socket.off("userStopTyping", onStopTyping);
      socket.off("newMessage", handleNewMessage);
      socket.off("readMessage", handleReadMessage);
    };
  }, [userId]);

  if (isMobileView && id) {
    return null;
  }

  const renderTyping = (workspaceId, lastMsg) => {
    const users = typingUsers[workspaceId] || [];
    if (users.length === 1) {
      return `${users[0].name} typing…`;
    }
    if (users.length === 2) {
      return `${users[0].name}, ${users[1].name} typing…`;
    }
    if (users.length > 2) {
      return `${users.length} typing…`;
    }
    return lastMsg;
  };


  return (
    <div className="relative w-full flex flex-col h-screen bg-gray-50 border-r">
      <div className="px-4 pt-3">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={setSearchTerm}
        />
      </div>
      <div className="flex gap-2 px-4 py-2">
        {["All", "Public", "Private"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 text-sm rounded-full border ${filter === type
              ? "bg-primary text-white"
              : "text-muted-foreground"
              }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="py-4 px-3 h-[calc(100vh-30vh)] flex-1 overflow-y-auto no-scrollbar">
        <div className="w-full">
          {!isLoading && !isError && rooms.length > 0 && (
            <div className="space-y-1 px-3">
              <h2 className="text-sm font-semibold text-muted-foreground mt-2">
                Workspaces
              </h2>
              {rooms.map((room) => {
                const ws = combinedWorkspaces.find(
                  (w) => w.id === room.workspaceId
                );
                if (!ws) return null;

                const lastMsg =
                  room.lastMessage?.message_text || "No messages yet";
                const timestamp = room.lastMessage?.timestamp;
                const unreadedCount = room.unreadMessages || 0;
                const isSender = room.lastMessage?.SenderId;

                return (
                  <div
                    key={ws.id}
                    onClick={() => router.push(`/workspaces/${ws.id}`)}
                    className="flex items-center gap-4 py-3 px-3 cursor-pointer rounded-xl hover:bg-muted transition"
                  >
                    <div className="relative">
                      {ws.creator?.imageUrl ? (
                        <Image
                          width={100}
                          height={100}
                          src={`${BASE_IMAGE}${ws.creator.imageUrl}`}
                          alt="avatar"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                          {ws.name?.[0]?.toUpperCase() || "W"}
                        </div>
                      )}
                      <Users className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full p-0.5 text-primary shadow-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold truncate">
                          {ws.name}
                        </p>
                        {ws.type === "private" && (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {renderTyping(ws.id, lastMsg)}
                      </p>
                    </div>

                    <MessageTimestamp
                      timestamp={timestamp}
                      unreadedCount={unreadedCount}
                      isSender={isSender}
                    />
                  </div>
                );
              })}
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
    </div>
  );
};

const MessageTimestamp = ({ timestamp, unreadedCount, isSender }) => {
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

    if (isToday) return `Today`;
    if (isYesterday) return `Yesterday`;

    return `${messageDate.toLocaleDateString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-1 flex-col text-center text-xs">
      <h1>{timestamp ? formatTimestamp(timestamp) : "-"}</h1>
      {unreadedCount > 0 && (
        <div className="p-1 min-w-6 h-6 text-white bg-primary rounded-full">
          {unreadedCount}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSideBar;
