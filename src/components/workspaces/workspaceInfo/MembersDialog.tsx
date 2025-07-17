'use client';

import {
  useDeleteMemberByIdMutation,
  useGetAllMembersQuery,
  useUpdateMembertypeMutation
} from '@/hooks/UseWorkspace';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BASE_IMAGE } from '@/lib/constants';
import { EllipsisVertical } from 'lucide-react';
import React, { useState } from 'react';
import AddMemberDialog from './AddMemberDialog';
import { toast } from 'sonner';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

const MembersDialog = ({ id, refetch }: { id: string, refetch: () => void }) => {
  const userId = useSelector((state: RootState) => state.authSlice.user?.id);
  const [pageNo, setPageNo] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [updateMemberType, { isLoading: updatingType }] = useUpdateMembertypeMutation();
  const [deleteMember, { isLoading: deletingMember }] = useDeleteMemberByIdMutation();

  const pageSize = 12;
  const { data, isLoading, isError, refetch: refetchMembers } = useGetAllMembersQuery({ id, pageNo, pageSize });

  const members = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const activeMembers = members.filter((m: any) => !m.isRemoved);
  const removedMembers = members.filter((m: any) => m.isRemoved);

  const handleMakeAdmin = async (memberId: string) => {
    setOpenMenuId(null);
    try {
      await updateMemberType({ id: memberId }).unwrap();
      toast.success('Member promoted/demoted successfully');
      refetch();
      refetchMembers();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to change role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setOpenMenuId(null);
    try {
      await deleteMember({ id: memberId }).unwrap();
      toast.success('Member removed successfully');
      refetch();
      refetchMembers();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove member');
    }
  };

  const renderMember = (member: any, showActions = true) => (
    <div
      key={member.id}
      className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-accent relative"
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9 ring ring-muted">
          <AvatarImage
            src={member.member.imageUrl ? `${BASE_IMAGE}${member.member.imageUrl}` : undefined}
          />
          <AvatarFallback>{member.member.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium truncate">{member.member.name}</p>
          <p className="text-xs text-muted-foreground truncate">{member.member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={
            member.type === 'member' ? 'outline' : 'default'
          }
          className="text-xs capitalize"
        >
          {member.type || 'member'}
        </Badge>

        {showActions && userId !== member.member.id && (
          <button
            onClick={() =>
              setOpenMenuId(openMenuId === member.id ? null : member.id)
            }
            className="p-1 hover:bg-muted rounded"
          >
            <EllipsisVertical size={18} />
          </button>
        )}
      </div>

      {showActions && userId !== member.member.id && openMenuId === member.id && (
        <div className="absolute right-3 top-12 bg-popover border rounded shadow z-50 w-40">
          <button
            onClick={() => handleMakeAdmin(member.id)}
            className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
            disabled={updatingType}
          >
            {updatingType ? 'Updating…' : 'Change Admin/Member'}
          </button>
          <button
            onClick={() => handleRemoveMember(member.id)}
            className="w-full text-left px-3 py-2 hover:bg-accent text-sm text-red-600"
            disabled={deletingMember}
          >
            {deletingMember ? 'Removing…' : 'Remove Member'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-3">
      <div className='w-full flex items-center justify-between'>
        <h2 className="text-xl font-semibold">Workspace Members</h2>
        <AddMemberDialog workspaceId={id} refetch={refetch} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-14 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-500">Failed to load members.</p>
      ) : (
        <>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Members</h3>
            {activeMembers.length === 0 && <p className="text-xs text-muted-foreground">No active members</p>}
            {activeMembers.map((m: any) => renderMember(m, true))}
          </div>

          {removedMembers.length > 0 && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Past Members</h3>
              {removedMembers.map((m: any) => renderMember(m, false))}
            </div>
          )}
        </>
      )}

      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-muted-foreground">
            Page {pageNo} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNo === 1}
              onClick={() => setPageNo((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pageNo >= totalPages}
              onClick={() => setPageNo((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersDialog;
