"use client";
import { useState, useEffect, useRef, useCallback, ChangeEvent, KeyboardEvent } from "react";
import {
  MousePointerClick,
  PlusCircle,
  SmilePlus,
  SendHorizonal,
  Mic,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getSocket } from "@/lib/socket";
import { useFetchChatRoomQuery } from "@/hooks/useChat";
import { Skeleton } from "@/components/ui/skeleton";
import withAuth from "@/components/hoc/withAuth";
import InfiniteScroll from "react-infinite-scroll-component";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Message from "@/components/message/Message";
import ChatHeader from "@/components/message/ChatHeader";
import VoiceRecorder from "@/components/message/Inputs/VoiceRecorder";
import { AddDropdown } from "@/components/message/Inputs/AddDropdown";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  message_text?: string;
  sender?: { id: string };
  [key: string]: any;
}

interface Params {
  id: string;
}

const Page = () => {
  const { id } = useParams();
  const [pageNo, setPageNo] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const senderId = useSelector((state: RootState) => state.authSlice?.user?.id);
  const socket = getSocket();
  const pageSize = 12;

  const {
    data: messagesData,
    isLoading,
    isError,
    refetch,
  } = useFetchChatRoomQuery({ id, pageNo, pageSize });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [receiver, setReceiver] = useState<any>(null);
  const [typing, setTyping] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollableDiv = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const sortMessagesByTimestamp = useCallback((msgs: Message[]): Message[] => {
    return [...msgs].sort(
      (b, a) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, []);

  const handleCancelVoice = () => {
    setIsVoiceMode(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    adjustTextareaHeight();
    if (!typing) {
      socket.emit("typing", { roomId: id });
      setTyping(true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId: id });
      setTyping(false);
    }, 1500);
  };

  useEffect(() => {
    if (messagesData?.success) {
      if (pageNo === 1) {
        const sortedMessages = sortMessagesByTimestamp(
          messagesData.data.messages || []
        );
        setMessages(sortedMessages);

        if (isInitialLoad) {
          setTimeout(() => {
            scrollToBottom();
            setIsInitialLoad(false);
          }, 100);
        }
      } else {
        setMessages((prev) => {
          const allMessages = [...messagesData.data.messages, ...prev];
          return sortMessagesByTimestamp(allMessages);
        });
      }
      setHasMore(
        pageNo < Math.ceil(messagesData.data.totalmessages / pageSize)
      );
    }
    if (isError) setHasMore(false);
  }, [messagesData, isError, pageNo, isInitialLoad, sortMessagesByTimestamp]);

  useEffect(() => {
    if (messagesData?.data?.receiver) {
      setReceiver(messagesData.data.receiver);
    }
  }, [messagesData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = () => {
    if (hasMore) {
      setPageNo((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    if (id && senderId) {
      socket.emit("joinChatRoom", id);
      refetch();
    }
    return () => {
      socket.emit("leaveChatRoom", id);
    };
  }, [id, senderId, socket, refetch]);

  useEffect(() => {
    socket.on("receiveMessage", ({ message }: { message: Message }) => {
      if (message?.message_text && message?.timestamp) {
        setMessages((prev) => {
          const updatedMessages = [...prev, message];
          return sortMessagesByTimestamp(updatedMessages);
        });
        scrollToBottom();
      }
    });
    return () => {
      socket.off("receiveMessage");
    };
  }, [socket, sortMessagesByTimestamp]);

  const handleSend = () => {
    if (input.trim()) {
      const newMessage = {
        roomId: id,
        senderId,
        receiverId: receiver?.id,
        message_text: input.trim(),
        timestamp: new Date().toISOString(),
        sender: { id: senderId },
      };
      socket.emit("sendMessage", newMessage);
      setInput("");
      scrollToBottom();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      if (textarea.scrollHeight <= 100) {
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else {
        textarea.style.height = "100px";
        textarea.style.overflowY = "scroll";
      }
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setInput((prev) => prev + emoji.native);
  };

  return (
    <div className="flex flex-col h-screen w-full lg:w-[70%] relative md:w-[50%] flex-1 border-l border-border">
      <ChatHeader isLoading={isLoading} receiver={receiver} />
      <div className=" h-[calc(100vh-215px)] flex-1">
        <div
          id="scrollableDiv"
          ref={scrollableDiv}
          className="flex-1 p-4 overflow-y-auto h-full flex flex-col-reverse"
        >
          {isLoading && pageNo === 1 ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="text-center text-destructive">
              Error loading messages
            </div>
          ) : messages.length > 0 ? (
            <InfiniteScroll
              dataLength={messages.length}
              next={fetchData}
              hasMore={hasMore}
              loader={
                <div className="text-center py-2">
                  <Skeleton className="h-10 w-1/2 mx-auto" />
                </div>
              }
              endMessage={
                !hasMore &&
                messages.length > pageSize && (
                  <p className="text-center text-gray-500 my-2">
                    No more messages
                  </p>
                )
              }
              scrollableTarget="scrollableDiv"
              style={{ display: "flex", flexDirection: "column-reverse" }}
              inverse={true}
              scrollThreshold="200px"
            >
              <div ref={messagesEndRef} />
              {messages.map((msg, index) => {

                return (
                  <Message key={index} msg={msg} />
                );
              })}
            </InfiniteScroll>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 h-full">
              <MousePointerClick size={48} />
              <p className="text-lg mt-2">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="w-full px-3 py-4 flex items-center gap-2 relative">
        {isVoiceMode ?
          <VoiceRecorder
            setIsVoiceMode={setIsVoiceMode}
            onCancel={handleCancelVoice}
          />
          :
          <>
            <AddDropdown />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="mr-2"
            >
              <SmilePlus
                className={`${showEmojiPicker && "text-primary"} size-6`}
              />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-22 left-4">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  onClickOutside={() => setShowEmojiPicker(false)}
                  theme="light"
                />
              </div>
            )}
            <div className="flex-1 flex items-center gap-1 justify-between">
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
                className="flex-1 p-2 md:p-3 no-scrollbar border w-full md:bg-[#ede6f0] rounded-lg md:rounded-xl focus:outline-none focus:border-primary resize-none"
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
            </div>
          </>
        }
      </div>
      {/* <div className="w-full px-1.5 py-3 md:p-4 flex items-center">
        <div className="w-fit flex items-center gap-2 pr-2">
          <PlusCircle className="size-6" />
        

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`
      transition-all duration-300 ease-in-out md:py-3 md:px-6 p-2.5 rounded-full md:rounded-xl 
      flex items-center justify-center gap-2 
      ${input.trim()
                ? "opacity-100 scale-100 pointer-events-auto bg-primary text-white hover:bg-primary"
                : "opacity-60 scale-95 pointer-events-none bg-gray-200"
              }`}
          >
            <SendHorizonal size={20} className="block md:hidden" />
            <span className="hidden md:block">Send</span>
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default withAuth(Page);
