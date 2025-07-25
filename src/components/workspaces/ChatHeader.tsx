// @ts-nocheck
import { ArrowLeft, EllipsisVertical } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { BASE_IMAGE } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { getWorkspaceSocket } from '@/lib/workspaceSocket';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import MembersDialog from './MembersDialog';
import WorkspaceInfo from './WorkspaceInfo';
import WorkspaceInfos from './workspaceInfo/WorkspaceInfos';
import { SearchMessage } from './SearchMessage';

interface ChatHeaderProps {
  workspace: any;
  isLoading: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ workspace: propWorkspace, isLoading, refetchWorkspace }) => {
  const userId = useSelector((state: RootState) => state.authSlice.user.id);
  const router = useRouter();
  const socket = getWorkspaceSocket();

  const [workspace, setWorkspace] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (propWorkspace) {
      setWorkspace(propWorkspace);
      if (propWorkspace?.creator?.id === userId) {
        setIsCreator(true);
      } else {
        setIsCreator(false);
      }
    }
  }, [propWorkspace, userId]);

  useEffect(() => {
    const onTyping = ({ userId, name }) => {
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, name }]
      );
    };

    const onStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('userTyping', onTyping);
    socket.on('userStopTyping', onStopTyping);

    return () => {
      socket.off('userTyping', onTyping);
      socket.off('userStopTyping', onStopTyping);
    };
  }, [socket]);

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b shadow-md">
      <button onClick={() => router.push('/workspaces')}>
        <ArrowLeft size={20} />
      </button>

      <div className="w-0 flex-1">
        {isLoading || !workspace ? (
          <Skeleton className="w-12 h-12 rounded-full" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={
                  workspace?.imageUrl
                    ? `${BASE_IMAGE}${workspace.imageUrl}`
                    : undefined
                }
              />
              <AvatarFallback>
                {workspace?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{workspace?.name}</h2>
              <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                {typingUsers.length
                  ? typingUsers.map((u) => u.name).join(', ') + ' typing…'
                  : 'Workspace Chat'}
              </p>
            </div>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setInfoOpen(true)}>
            View Info
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSearchOpen(true)}>
            Search Messages
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {workspace && (
        <>
          <WorkspaceInfos open={infoOpen} onOpenChange={setInfoOpen} workspace={workspace} refetchWorkspace={refetchWorkspace} />
        </>
      )}
      {workspace && (
        <>
          <SearchMessage open={searchOpen} onOpenChange={setSearchOpen} />
        </>
      )}
    </div>
  );
};

export default ChatHeader;
