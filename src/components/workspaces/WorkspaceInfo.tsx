'use client'

import React from 'react';
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
import { Badge } from '../ui/badge';
import { BASE_IMAGE } from '@/lib/constants';

interface WorkspaceInfoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: any; // ideally type properly later
}

const WorkspaceInfo: React.FC<WorkspaceInfoProps> = ({
  open,
  onOpenChange,
  workspace,
}) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-primary">
            Workspace Info
          </DialogTitle>
        </DialogHeader>

        {/* Workspace Details */}
        <div className="space-y-1 mb-4">
          <p className="text-xl font-bold text-foreground">{workspace?.name}</p>
          <Badge
            variant={workspace?.type === 'public' ? 'outline' : 'default'}
            className="capitalize"
          >
            {workspace?.type}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Created At:{' '}
            {new Date(workspace?.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <hr />

        {/* Creator */}
        <div className="flex items-center gap-3 mt-3">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={
                workspace?.creator.imageUrl
                  ? `${BASE_IMAGE}${workspace?.creator.imageUrl}`
                  : undefined
              }
            />
            <AvatarFallback>
              {workspace?.creator.name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">
              {workspace?.creator.name}
            </p>
            <p className="text-xs text-muted-foreground">{workspace?.creator.email}</p>
          </div>
          <Badge variant="destructive" className="ml-auto">
            Creator
          </Badge>
        </div>

        <hr className="my-3" />

        {/* Members */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {workspace?.members?.map((m: any) => (
            <div
              key={m.id}
              className="flex gap-3 items-center p-2 rounded-lg hover:bg-accent transition-colors border border-border"
            >
              <Avatar className="w-9 h-9">
                <AvatarImage
                  src={
                    m.member.imageUrl
                      ? `${BASE_IMAGE}${m.member.imageUrl}`
                      : undefined
                  }
                />
                <AvatarFallback>
                  {m.member.name?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.member.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {m.member.email}
                </p>
              </div>

              <Badge
                variant={
                  m.type === 'admin'
                    ? 'destructive'
                    : 'secondary'
                }
                className="capitalize text-xs"
              >
                {m.type}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceInfo;
