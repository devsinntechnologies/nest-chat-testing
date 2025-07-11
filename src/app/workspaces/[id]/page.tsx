// @ts-nocheck
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  MousePointerClick,
  PlusCircle,
  SmilePlus,
  SendHorizonal,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getWorkspaceSocket } from "@/lib/workspaceSocket";
import { useFetchWorkspaceChatQuery } from "@/hooks/UseWorkspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BASE_IMAGE } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import withAuth from "@/components/hoc/withAuth";
import InfiniteScroll from "react-infinite-scroll-component";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const WorkspaceChatPage = () => {
  const { id } = useParams();
  const [pageNo, setPageNo] = useState(1);
  const pageSize = 12;
  const router = useRouter();
  const senderId = useSelector((state: RootState) => state.authSlice?.user?.id);
  const socket = getWorkspaceSocket();
  const [hasMore, setHasMore] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [expandedMessages, setExpandedMessages] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [typingUsers, setTypingUsers] = useState<{ userId: string, name: string }[]>([]);


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    adjustTextareaHeight();

    if (!typing) {
      setTyping(true);
      socket.emit("typing", id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit("stopTyping", id);
    }, 1500);
  };


  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollableDiv = useRef(null);

  const { data: workspaceData, isLoading, isError } = useFetchWorkspaceChatQuery({ id, pageNo, pageSize });
  const [workspace, setWorkspace] = useState(null);

  const sortMessagesByTimestamp = useCallback((msgs) => {
    return [...msgs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, []);

  useEffect(() => {
    socket.on('userTyping', ({ userId, name }) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === userId)) {
          return [...prev, { userId, name }];
        }
        return prev;
      });
    });

    socket.on('userStopTyping', ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    return () => {
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [socket]);


  useEffect(() => {
    if (workspaceData?.data) {
      setWorkspace(workspaceData.data);
      if (pageNo === 1) {
        const sorted = sortMessagesByTimestamp(workspaceData.data.messages || []);
        setMessages(sorted);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        setMessages((prev) => {
          const all = [...workspaceData.data.messages, ...prev];
          return sortMessagesByTimestamp(all);
        });
      }
      setHasMore(
        pageNo < Math.ceil(workspaceData.totalCount / workspaceData.pageSize)
      );
    }
  }, [workspaceData, pageNo, sortMessagesByTimestamp]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const fetchData = () => {
    if (hasMore) setPageNo((prev) => prev + 1);
  };

  useEffect(() => {
    if (!id || !senderId) return;
    const workspaceId = id;
    socket.emit("joinWorkspace", workspaceId);
    return () => socket.emit("leaveWorkspace", id);
  }, [id, senderId, socket]);

  useEffect(() => {
    socket.on("receiveMessage", ({ message }) => {
      if (message?.message_text && message?.timestamp) {
        console.log(message?.message_text && message?.timestamp, message?.message_text, message?.timestamp)
        setMessages((prev) => sortMessagesByTimestamp([...prev, message]));
        scrollToBottom();
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [socket, sortMessagesByTimestamp]);

  const handleSend = () => {
    if (!input.trim()) return;
    const message = {
      workspaceId: id,
      senderId,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      type: "workspace",
    };
    socket.emit("sendMessage", message);
    scrollToBottom();
    setInput("");
  };

  const toggleExpand = (index) => {
    setExpandedMessages((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    if (textarea.scrollHeight <= 100) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    } else {
      textarea.style.height = "100px";
      textarea.style.overflowY = "scroll";
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji.native);
  };

  return (
    <div className="flex flex-col h-screen w-full border-l">
      <div className="flex items-center gap-2 p-4 bg-white border-b shadow-md">
        <button onClick={() => router.push("/workspaces")}>
          <ArrowLeft size={20} />
        </button>
        {isLoading ? (
          <Skeleton className="w-12 h-12 rounded-full" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={workspace?.creator?.imageUrl ? `${BASE_IMAGE}${workspace.creator.imageUrl}` : ""} />
              <AvatarFallback>{workspace?.creator?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{workspace?.name}</h2>
              <div className="text-xs text-muted-foreground mt-1 transition-opacity duration-300">
                {typingUsers.length === 0 && (
                  <p>Workspace Chat</p>
                )}

                {typingUsers.length === 1 && (
                  <p className="animate-pulse">{typingUsers[0].name} is typing…</p>
                )}

                {typingUsers.length === 2 && (
                  <p className="animate-pulse">{typingUsers[0].name} and {typingUsers[1].name} are typing…</p>
                )}

                {typingUsers.length > 2 && (
                  <p className="animate-pulse">Several people are typing…</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollableDiv} id="scrollableDiv">
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchData}
          hasMore={hasMore}
          inverse={true}
          scrollableTarget="scrollableDiv"
          loader={<Skeleton className="h-6 w-1/2 mx-auto my-2" />}
        >
          <div />
          {messages.map((msg, index) => {
            const isSender = msg.SenderId === senderId;
            const isExpanded = expandedMessages[index];
            const maxChars = 250;

            return (
              <div
                ref={messagesEndRef}
                key={msg.id || `msg-${index}`}
                className={`flex mb-3 items-end ${isSender ? "justify-end" : "justify-start"}`}
              >
                {!isSender && <Avatar className="w-10 h-10 mr-1">
                  <AvatarImage
                    src={
                      msg.Sender?.imageUrl ? `${BASE_IMAGE}${msg.Sender.imageUrl}` : ""
                    }
                    alt={msg.Sender?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary text-white">
                    {msg.Sender?.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>}
                <div
                  className={`p-3 text-sm rounded-2xl max-w-[75%] ${isSender
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-muted text-black rounded-bl-none"
                    }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {isExpanded || msg.message_text.length <= maxChars
                      ? msg.message_text
                      : msg.message_text.slice(0, maxChars) + "..."}
                  </p>
                  {msg.message_text.length > maxChars && (
                    <button
                      onClick={() => toggleExpand(index)}
                      className="text-xs mt-1 cursor-pointer text-inherit"

                    >
                      {isExpanded ? "See less" : "See more"}
                    </button>
                  )}
                  <div className="text-[10px] text-right text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {isSender && <Avatar className="w-10 h-10 ml-1">
                  <AvatarImage
                    src={
                      msg.Sender?.imageUrl ? `${BASE_IMAGE}${msg.Sender.imageUrl}` : ""
                    }
                    alt={msg.Sender?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary text-white">
                    {msg.Sender?.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>}
              </div>
            );
          })}
        </InfiniteScroll>
      </div>

      <div className="w-full px-3 py-4 flex items-center gap-2">
        <PlusCircle className="size-6" />
        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          <SmilePlus className={`size-6 ${showEmojiPicker && "text-primary"}`} />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-24 left-4 z-10">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              onClickOutside={() => setShowEmojiPicker(false)}
              theme="light"
            />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Type a message..."
          className="flex-1 p-3 border rounded-xl focus:outline-none resize-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`p-3 rounded-xl ${input.trim()
            ? "bg-primary text-white hover:bg-primary/90"
            : "bg-gray-200 text-gray-400"
            }`}
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
};

export default withAuth(WorkspaceChatPage);
