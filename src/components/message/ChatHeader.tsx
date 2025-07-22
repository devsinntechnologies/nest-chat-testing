import { ArrowLeft, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Skeleton } from '../ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState } from '@/store/store'
import { getWorkspaceSocket } from '@/lib/workspaceSocket'
import { BASE_IMAGE } from '@/lib/constants'
import { getSocket } from '@/lib/socket'
import { SearchMessage } from './SearchMessage'

interface ChatHeaderProps {
  isLoading: boolean,
  receiver: {
    name: string,
    imageUrl: string
  } | null
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isLoading, receiver }) => {
  // const userId = useSelector((state: RootState) => state.authSlice.user?.id);
  const router = useRouter();
  const socket = getSocket();
  const [typing, setTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);


  useEffect(() => {
    socket.on("typing", () => {
      setTyping(true);
    });

    socket.on("stopTyping", () => {
      setTyping(false);
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [socket]);

  const handleBack = () => {
    router.push("/messages/");
  };

  return (
    <div className='flex items-center justify-between gap-2 p-4 bg-white border-b-2 shadow-md'>
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="text-gray-600 mr-2 hover:text-black"
        >
          <ArrowLeft size={20} />
        </button>
        {isLoading ? (
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
      <Search className='cursor-pointer' onClick={() => setSearchOpen(true)} />
      {receiver && (
        <>
          <SearchMessage open={searchOpen} onOpenChange={setSearchOpen} />
        </>
      )}
    </div>
  )
}

export default ChatHeader