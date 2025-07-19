"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MousePointerClick,
  PlusCircle,
  SmilePlus,
  SendHorizonal,
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

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderId: string;
  // etc.
}

const Page = () => {
  const { id } = useParams();
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 12;

  const {
    data: messagesData,
    isLoading,
    isError,
    refetch,
  } = useFetchChatRoomQuery({ id, pageNo, pageSize });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [typing, setTyping] = useState(false);

  // const [totalMessages, setTotalMessages] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);


  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef(null);
  const scrollableDiv = useRef(null);
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

  const handleInputChange = (e: any) => {
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


  // Initial data load
  useEffect(() => {
    if (messagesData?.success) {
      if (pageNo === 1) {
        // For first page, sort messages by timestamp
        const sortedMessages = sortMessagesByTimestamp(
          messagesData.data.messages || []
        );
        setMessages(sortedMessages);

        if (isInitialLoad) {
          // Only scroll to bottom on the very first load
          setTimeout(() => {
            scrollToBottom();
            setIsInitialLoad(false);
          }, 100);
        }
      } else {
        // For subsequent pages, merge and sort all messages
        setMessages((prev) => {
          const allMessages = [...messagesData.data.messages, ...prev];
          return sortMessagesByTimestamp(allMessages);
        });
      }

      // setTotalMessages(messagesData.data.totalmessages || 0);
      setHasMore(
        pageNo < Math.ceil(messagesData.data.totalmessages / pageSize)
      );
    }

    if (isError) setHasMore(false);
  }, [messagesData, isError, pageNo, isInitialLoad, sortMessagesByTimestamp]);

  // Set receiver info
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

  const senderId = useSelector((state: RootState) => state.authSlice?.user?.id);
  const socket = getSocket();


  // Socket event handlers for chat
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
    socket.on("receiveMessage", ({ message }) => {
      if (message?.message_text && message?.timestamp) {
        setMessages((prev) => {
          // Add new message and sort all messages
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
      <div className="w-full px-1.5 py-3 md:p-4 flex items-center">
        <div className="w-fit flex items-center gap-2 pr-2">
          <PlusCircle className="size-6" />
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
        </div>
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
      </div>
    </div>
  );
};

export default withAuth(Page);
