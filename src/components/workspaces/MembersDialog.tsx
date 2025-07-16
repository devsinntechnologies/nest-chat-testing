'use client'

import { useGetAllMembersQuery } from '@/hooks/UseWorkspace';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { BASE_IMAGE } from '@/lib/constants';
import { Badge } from '../ui/badge';

interface MembersDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MembersDialog: React.FC<MembersDialogProps> = ({ id, open, onOpenChange }) => {
  const [pageNo, setPageNo] = useState(1);
  const pageSize = 12;

  const { data, isLoading, isError } = useGetAllMembersQuery({ id, pageNo, pageSize });

  const members = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-primary">
            Workspace Members
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-1/2 h-4 rounded" />
                  <Skeleton className="w-1/3 h-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
            Failed to load members. Please try again later.
          </div>
        ) : members.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3 text-center">
            No members found in this workspace.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex gap-3 items-center p-2 rounded-lg hover:bg-accent transition-colors border border-border"
              >
                <Avatar className="w-10 h-10 ring-1 ring-muted">
                  <AvatarImage
                    src={
                      member.imageUrl
                        ? `${BASE_IMAGE}${member.imageUrl}`
                        : undefined
                    }
                  />
                  <AvatarFallback>
                    {member.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>

                <Badge
                  variant={
                    member.member?.[0]?.type === 'member'
                      ? 'outline'
                      : 'default'
                  }
                  className="text-xs capitalize"
                >
                  {member.member?.[0]?.type || 'member'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex justify-between items-center mt-4 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Page <span className="font-medium">{pageNo}</span> of <span className="font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                disabled={pageNo === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNo((p) => Math.min(totalPages, p + 1))}
                disabled={pageNo >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MembersDialog;
