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
import { MoreHorizontal } from 'lucide-react';
import React, { useState } from 'react';
import AddMemberDialog from './AddMemberDialog';
import { toast } from 'sonner';

const MembersDialog = ({ id, refetch }: { id: string, refetch: () => void }) => {
  const [pageNo, setPageNo] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [updateMemberType, { isLoading: updatingType }] = useUpdateMembertypeMutation();
  const [deleteMember, { isLoading: deletingMember }] = useDeleteMemberByIdMutation();

  const pageSize = 12;
  const { data, isLoading, isError } = useGetAllMembersQuery({ id, pageNo, pageSize });

  const members = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleMakeAdmin = async (memberId: string) => {
    setOpenMenuId(null);
    try {
      await updateMemberType({ id: memberId }).unwrap();
      toast.success('Member promoted to Admin successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to make member Admin');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setOpenMenuId(null);
    try {
      await deleteMember({ id: memberId }).unwrap();
      toast.success('Member removed successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove member');
    }
  };

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
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {members.map((member: any) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-accent relative"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 ring ring-muted">
                  <AvatarImage
                    src={member.imageUrl ? `${BASE_IMAGE}${member.imageUrl}` : undefined}
                  />
                  <AvatarFallback>{member.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    member.member?.[0]?.type === 'member' ? 'outline' : 'default'
                  }
                  className="text-xs capitalize"
                >
                  {member.member?.[0]?.type || 'member'}
                </Badge>

                <button
                  onClick={() =>
                    setOpenMenuId(openMenuId === member.id ? null : member.id)
                  }
                  className="p-1 hover:bg-muted rounded"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Menu */}
              {openMenuId === member.id && (
                <div className="absolute right-3 top-12 bg-popover border rounded shadow z-50 w-40">
                  <button
                    onClick={() => handleMakeAdmin(member.member[0].id)}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                    disabled={updatingType}
                  >
                    {updatingType ? 'Promoting…' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.member[0].id)}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm text-red-600"
                    disabled={deletingMember}
                  >
                    {deletingMember ? 'Removing…' : 'Remove Member'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
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
