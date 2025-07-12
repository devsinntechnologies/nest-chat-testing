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
import { getSocket } from "@/lib/socket";
import { useFetchChatRoomQuery } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BASE_IMAGE } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import withAuth from "@/components/hoc/withAuth";
import InfiniteScroll from "react-infinite-scroll-component";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

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

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [typing, setTyping] = useState(false);
  // const [totalMessages, setTotalMessages] = useState(0);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollableDiv = useRef(null);
  const typingTimeoutRef = useRef(null);

  const sortMessagesByTimestamp = useCallback((msgs: Message[]): Message[] => {
    return [...msgs].sort(
      (b, a) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, []);

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

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Debounced typing function
  const debouncedTyping = useCallback((action) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    return () => {
      typingTimeoutRef.current = setTimeout(() => {
        action();
        typingTimeoutRef.current = null;
      }, 500); // 500ms debounce
    };
  }, []);

  const fetchData = () => {
    if (hasMore) {
      setPageNo((prevPage) => prevPage + 1);
    }
  };

  const router = useRouter();
  const senderId = useSelector((state: RootState) => state.authSlice?.user?.id);
  const socket = getSocket();

  const toggleExpand = (index) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

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
      if (message?.content && message?.timestamp) {
        setMessages((prev) => {
          // Add new message and sort all messages
          const updatedMessages = [...prev, message];
          return sortMessagesByTimestamp(updatedMessages);
        });
        scrollToBottom();
      }
    });

    socket.on("typing", () => {
      setTyping(true);
    });

    socket.on("stopTyping", () => {
      setTyping(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket, sortMessagesByTimestamp]);

  // Debounced typing handlers
  const typingStopped = useCallback(() => {
    socket.emit("stopTyping", { roomId: id, senderId });
  }, [socket, id, senderId]);

  const typingStarted = useCallback(() => {
    if (!typing) {
      socket.emit("typing", { roomId: id, senderId });
    }
  }, [socket, id, senderId, typing]);

  // Use the debounced function for typing events
  const handleTyping = () => {
    typingStarted();
    debouncedTyping(typingStopped)();
  };

  const handleSend = () => {
    if (input.trim()) {
      const newMessage = {
        roomId: id,
        senderId,
        receiverId: receiver?.id,
        content: input.trim(),
        timestamp: new Date().toISOString(),
        sender: { id: senderId },
      };

      socket.emit("sendMessage", newMessage);

      // // Optimistically add the message locally for immediate feedback
      // setMessages(prev => {
      //   const updatedMessages = [...prev, newMessage];
      //   return sortMessagesByTimestamp(updatedMessages);
      // });

      setInput("");
      typingStopped();
      scrollToBottom();
    }
  };

  const handleBack = () => {
    router.push("/messages/");
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

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji.native);
  };

  return (
    <div className="flex flex-col h-screen w-full lg:w-[70%] relative md:w-[50%] flex-1 border-l border-border">
      <div className="flex items-center gap-2 p-4 bg-white border-b-2 shadow-md">
        <button
          onClick={handleBack}
          className="text-gray-600 mr-2 hover:text-black"
        >
          <ArrowLeft size={20} />
        </button>
        {isLoading && pageNo === 1 ? (
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={
                  receiver?.imageUrl ? `${BASE_IMAGE}${receiver.imageUrl}` : ""
                }
                alt={receiver?.name || "User"}
              />
              <AvatarFallback className="bg-primary text-white">
                {receiver?.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold">
                {receiver?.name || "Unknown User"}
              </h2>

              {typing ? (
                <div className="text-xs md:text-sm text-green-700">
                  typing...
                </div>
              ) : (
                <div className="text-xs md:text-sm text-muted-foreground"></div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="bg-[#f5f5f5] h-[calc(100vh-215px)] flex-1">
        <div
          id="scrollableDiv"
          ref={scrollableDiv}
          className="flex-1 p-4 overflow-y-auto h-full bg-[#f5f5f5] flex flex-col-reverse"
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
                const isExpanded = expandedMessages[index];
                const isSender = msg.sender.id === senderId;
                const maxChars = 250;

                return (
                  <div
                    key={index}
                    className={`flex mb-3 ${isSender ? "justify-end" : "justify-start"
                      }`}
                  >
                    {!isSender ? (
                      <div className="flex items-start gap-2 !w-[75%] !max-w-[75%]">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={
                              receiver?.imageUrl
                                ? `${BASE_IMAGE}${receiver?.imageUrl}`
                                : ""
                            }
                            alt=""
                            className="w-full h-full text-sm bg-gradient-to-t to-gradientTo from-gradientFrom"
                          />
                          <AvatarFallback className="bg-primary text-white">
                            {receiver?.name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col items-start max-w-full">
                          <div
                            className={`p-3 w-full max-w-full ${msg.content.includes(" ")
                                ? "break-words"
                                : "break-all"
                              }  rounded-t-2xl text-sm rounded-br-2xl rounded-bl-[8px] bg-[#eceaed] text- ${isSender ? "bg-[#eceaed]" : ""
                              }`}
                          >
                            <p className="">
                              {isExpanded || msg.content.length <= maxChars
                                ? msg.content
                                : msg.content.slice(0, maxChars) + "..."}
                            </p>
                            {msg.content.length > 250 && (
                              <button
                                onClick={() => toggleExpand(index)}
                                className="text-primary text-xs mt-1"
                              >
                                {isExpanded ? "See less" : "See More"}
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 text-right w-full mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end max-w-[85%] md:max-w-[75%]">
                        <div
                          className={`p-3 
                          ${msg.content.includes(" ")
                              ? "break-words"
                              : "break-all"
                            } 
                          w-full max-w-full !text-wrap rounded-t-3xl text-sm rounded-br-[10px] rounded-bl-3xl text-white bg-primary`}
                        >
                          <p>
                            {isExpanded || msg.content.length <= maxChars
                              ? msg.content
                              : msg.content.slice(0, maxChars) + "..."}
                          </p>
                          {msg.content.length > 250 && (
                            <button
                              onClick={() => toggleExpand(index)}
                              className="text-[#eceaed] text-xs mt-1"
                            >
                              {isExpanded ? "See less" : "See More"}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right w-full mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
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
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Type a message..."
            className="flex-1 p-2 md:p-3 no-scrollbar border w-full md:bg-[#ede6f0] rounded-lg md:rounded-xl focus:outline-none focus:border-primary resize-none"
            onBlur={typingStopped}
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
