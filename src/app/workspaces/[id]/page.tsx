// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, PlusCircle, SmilePlus, SendHorizonal, Mic } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getWorkspaceSocket } from "@/lib/workspaceSocket";
import { useFetchWorkspaceChatQuery } from "@/hooks/UseWorkspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "react-infinite-scroll-component";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import withAuth from "@/components/hoc/withAuth";
import { BASE_IMAGE } from "@/lib/constants";
import { useInView } from "react-intersection-observer";
import Message from "@/components/workspaces/Message/Message";
import { Button } from "@/components/ui/button";
import ChatHeader from "@/components/workspaces/ChatHeader";
import { AddDropdown } from "@/components/workspaces/Inputs/AddDropdown";
import VoiceRecorder from "@/components/workspaces/Inputs/VoiceRecorder";

const WorkspaceChatPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const socket = getWorkspaceSocket();

  const senderId = useSelector((state: RootState) => state.authSlice?.user?.id);

  const [pageNo, setPageNo] = useState(1);
  const pageSize = 12;

  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: workspaceData,
    isLoading,
    refetch
  } = useFetchWorkspaceChatQuery(
    { id },
    { refetchOnMountOrArgChange: true }
  );


  const handleCancelVoice = () => {
    setIsVoiceMode(false);
  };

  const workspace = workspaceData?.data;
  const totalCount = workspaceData?.totalCount || 0;

  const hasMore = messages.length < totalCount;

  const unread = messages.some(
    m => !m.messageReads?.some(r => r.userId === senderId)
  );


  const unreadMessages = messages.filter(
    m => !m.messageReads?.some(r => r.userId === senderId)
  );

  const unreadTexts = unreadMessages.map(m => m.message_text);

  const sortMessages = useCallback(
    (msgs) =>
      [...msgs].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    []
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!input.trim()) return;

    socket.emit("sendMessage", {
      workspaceId: id,
      senderId,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    });

    setInput("");
  };

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    adjustTextareaHeight();
    if (!typing) {
      socket.emit("typing", id);
      setTyping(true)
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", id);
      setTyping(false)
    }, 1500);
  };

  const typingTimeout = useRef<NodeJS.Timeout>();

  const handleScroll = () => {
    const el = scrollableDiv.current;
    if (!el) return;
    const threshold = 0;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (!id || !senderId) return;
    socket.emit("joinWorkspace", id);
    return () => socket.emit("leaveWorkspace", id);
  }, [id, senderId, socket]);

  useEffect(() => {
    if (workspace && unread && !isAtBottom) {
      scrollToBottom();
    }
  }, [isAtBottom, unread, workspace]);

  // Incoming message
  useEffect(() => {
    const onMessage = ({ message }: { message: Message }) => {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === message.id);

        let updatedMessages;

        if (index !== -1) {
          updatedMessages = [...prev];
          updatedMessages[index] = message;
        } else {
          updatedMessages = [...prev, message];
        }

        return sortMessages(updatedMessages);
      });

      scrollToBottom();
    };

    const onMessageReaded = ({ messageId, userId, readAt, user }) => {

      setMessages((prev) => {
        const next = sortMessages(
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;

            const alreadyRead = msg.messageReads?.some(r => r.userId === userId);

            if (!alreadyRead) {

              return {
                ...msg,
                messageReads: [
                  ...(msg.messageReads || []),
                  { userId, readAt, user },
                ],
              };
            } else {
              console.log("🚫 Already marked as read for", userId, "on message", messageId);
            }

            return msg;
          })
        );

        return next;
      });

      scrollToBottom();
    };


    socket.on("receiveMessage", onMessage);
    socket.on("messageRead", onMessageReaded);
    return () => {
      socket.off("receiveMessage", onMessage);
      socket.off("messageRead", onMessageReaded);
    }
  }, [socket, sortMessages]);

  // New page of data
  useEffect(() => {
    if (workspace?.messages) {
      setMessages((prev) =>
        sortMessages([...workspace.messages, ...prev])
      );
    }
  }, [workspace, sortMessages]);

  const fetchMore = () => {
    if (hasMore) setPageNo((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen w-full border-l">
      <ChatHeader workspace={workspace} isLoading={isLoading} refetchWorkspace={refetch} />
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        id="scrollableDiv"
        ref={scrollableDiv}
        onScroll={handleScroll}
      >
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMore}
          hasMore={hasMore}
          inverse
          scrollableTarget="scrollableDiv"
          loader={<Skeleton className="h-6 w-1/2 mx-auto my-2" />}
        >
          {messages.map((msg, idx) => (
            <Message key={idx} id={id} msg={msg} idx={idx} socket={socket} />
          ))}
        </InfiniteScroll>

        {!isAtBottom && unread && (
          <Button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-4 bg-primary text-white rounded-full shadow-md"
          >
            New Message
          </Button>
        )}


        <div ref={messagesEndRef} className="size-0" />
      </div>

      {/* Input */}
      <div className="w-full px-3 py-4 flex items-center gap-2 relative">
        {isVoiceMode ?
          <VoiceRecorder
            setIsVoiceMode={setIsVoiceMode}
            onCancel={handleCancelVoice}
          />
          :
          <>
            <AddDropdown />
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <SmilePlus className={`size-6 ${showEmojiPicker && "text-primary"}`} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-24 left-4 z-10">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji) => setInput((prev) => prev + emoji.native)}
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
              placeholder="Type a message…"
              className="flex-1 p-3 border rounded-xl focus:outline-none resize-none"
            />
            {input.trim().length < 1 ?
              <button
                onClick={() => setIsVoiceMode(true)}
                // disabled={!input.trim()}
                className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90"
              >
                <Mic size={20} />
              </button>
              : <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={`p-3 rounded-xl ${input.trim()
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-200 text-gray-400"
                  }`}
              >
                <SendHorizonal size={20} />
              </button>}
          </>
        }
      </div>
    </div>
  );
};

export default withAuth(WorkspaceChatPage);
