'use client';

import { useGetAllMembersQuery } from '@/hooks/UseWorkspace';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { BASE_IMAGE } from '@/lib/constants';
import { MoreHorizontal } from 'lucide-react';
import React, { useState } from 'react';

const MembersDialog = ({ id }: { id: string }) => {
  const [pageNo, setPageNo] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pageSize = 12;
  const { data, isLoading, isError } = useGetAllMembersQuery({ id, pageNo, pageSize });

  const members = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full space-y-3">
      <h2 className="text-xl font-semibold">Workspace Members</h2>

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
                    onClick={() => {
                      setOpenMenuId(null);
                      // TODO: make admin logic
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  >
                    Make Admin
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      // TODO: remove member logic
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm text-red-600"
                  >
                    Remove Member
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
