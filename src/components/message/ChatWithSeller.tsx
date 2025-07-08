// @ts-nocheck
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFetchChatsQuery, useSendMessageMutation } from "@/hooks/useChat";
import { Loader2, MessageSquare, Send } from "lucide-react";  
import { toast } from "sonner";

const ChatWithSeller = ({ receiverId }) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedReply, setSelectedReply] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Added dialog open state
  const { data: messagesData } = useFetchChatsQuery({});
  
  const quickReplies = [
    "Hi, I need some help with my order.",
    "Could you assist me with the payment process?",
    "I'm facing issues with shipping updates.",
    "Can you help me track my delivery?",
    "I'd like assistance with a return request.",
    "I have a question about product availability."
  ];  

  const [sendMessage, { isLoading }] = useSendMessageMutation();

  // Handle quick reply click
  const handleQuickReplyClick = (msg) => {
    setMessage(msg);
    setSelectedReply(msg);
  };

  // Handle sending message
  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please type a message before sending.");
      return;
    }

    setError("");
    try {
      const response = await sendMessage({
        receiverId,
        content: message,
      }).unwrap();

      setMessage("");

      if (response.success) {
        router.push(`/messages/${response.data.RoomId}`);
      }
    } catch (error) {
      setError("Oops! Failed to send your message.");
      toast.error("Message Failed", { description: error?.message });
    }
  };

  // Check if an existing chat room already exists
  const handleChatWithSeller = () => {
    // Check if a chat room already exists for this receiverId
    const existingRoom = messagesData?.data?.find(
      (chat) => chat.receiver.id === receiverId
    );
    
    if (existingRoom) {
      router.push(`/messages/${existingRoom.roomId}`);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    if (selectedReply && e.target.value !== selectedReply) {
      setSelectedReply(null); // Unselect the quick reply if user starts typing
    }
  };

  return (
    <div>
      <Button
        className="text-xs sm:!text-sm md:!text-[15px] font-semibold !px-5 flex items-center gap-2 hover:border-primary/10 transition-transform"
        variant="secondary"
        onClick={handleChatWithSeller}
      >
        <MessageSquare className="size-3 md:size-4.5" />
        Chat With Seller
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="min-w-200 mx-auto p-6 bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl md:text-2xl font-semibold text-black">
              Start a Conversation
            </DialogTitle>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Need help? Send the seller a message.
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
              {quickReplies.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReplyClick(msg)}
                  className={`flex items-center justify-center text-xs md:text-sm px-6 py-3 rounded-lg ${
                    selectedReply === msg
                      ? "bg-primary text-white"
                      : "bg-muted text-secondary"
                  } hover:scale-101 transition-all duration-200 shadow-sm`}
                >
                  {msg}
                </button>
              ))}
            </div>

            <Textarea
              value={message}
              onChange={handleMessageChange}
              placeholder="Type your message here..."
              rows={10}
              className="p-4 border rounded-lg shadow-sm w-full h-20 mx-auto focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />

            {error && (
              <p className="text-destructive text-sm text-center mt-2 p-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              onClick={handleSend}
              className="w-full mt-4 py-3 bg-primary text-white focus:outline-none shadow-md flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2" /> Send Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWithSeller;
