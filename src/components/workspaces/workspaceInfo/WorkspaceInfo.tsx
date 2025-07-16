'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { BASE_IMAGE } from '@/lib/constants';
import { useUpdateWorkspaceMutation } from '@/hooks/UseWorkspace';

const WorkspaceInfo = ({ workspace, refetchWorkspace }: { workspace: any, refetchWorkspace: () => void }) => {
  const [updateWorkspace, { isLoading }] = useUpdateWorkspaceMutation();

  const [name, setName] = useState(workspace?.name || '');
  const [type, setType] = useState(workspace?.type || 'public');
  const [editMode, setEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleImageUpload = () => {
    alert('Image upload function to be implemented.');
  };

  useEffect(() => {
    const changed = name !== workspace?.name || type !== workspace?.type;
    setIsDirty(changed);
  }, [name, type, workspace]);

  const handleSave = async () => {
    try {
      await updateWorkspace({
        id: workspace.id,
        name,
        type
      }).unwrap();

      toast.success('Workspace updated successfully.');
      refetchWorkspace()
      setEditMode(false);
    } catch (error: any) {
      console.log(error)
      toast.error(error?.data.message || 'Failed to update workspace.');
    }
  };

  return (
    <div className="w-full space-y-6 p-4">

      {/* Workspace Avatar */}
      <div className="relative flex flex-col items-center space-y-2">
        <div className="relative">
          <Avatar className="w-24 h-24 ring-2 ring-primary shadow-md">
            <AvatarImage
              src={`${BASE_IMAGE}/uploads/users/87588d1a8028117e68ace56d664661df.png`}
            />
            <AvatarFallback className="text-xl">
              {name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Pencil Button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={handleImageUpload}
            className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 shadow-md"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        {editMode ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-center text-lg font-semibold"
            placeholder="Workspace Name"
          />
        ) : (
          <h2 className="text-2xl font-bold">{name}</h2>
        )}

        {editMode ? (
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="capitalize px-3 py-1 rounded border"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        ) : (
          <Badge
            variant={type === 'public' ? 'outline' : 'default'}
            className="capitalize px-3 py-0.5 text-sm"
          >
            {type}
          </Badge>
        )}

        <p className="text-sm text-muted-foreground">
          Created on {new Date(workspace?.createdAt).toLocaleDateString()}
        </p>

        <div className="flex gap-2 mt-2">
          {editMode ? (
            <>
              <Button
                size="sm"
                disabled={!isDirty || isLoading}
                onClick={handleSave}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditMode(false);
                  setName(workspace?.name || '');
                  setType(workspace?.type || 'public');
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      <hr />

      {/* Creator Info */}
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={
              workspace?.creator?.imageUrl
                ? `${BASE_IMAGE}${workspace.creator.imageUrl}`
                : undefined
            }
          />
          <AvatarFallback>
            {workspace?.creator?.name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{workspace?.creator?.name}</p>
          <p className="text-xs text-muted-foreground">{workspace?.creator?.email}</p>
        </div>
        <Badge variant="destructive" className="ml-auto text-xs">
          Creator
        </Badge>
      </div>

      <hr />

      {/* Members List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {workspace?.members?.map((m: any) => (
          <div
            key={m.id}
            className="flex items-center gap-3 border rounded-lg p-2 bg-muted/40 hover:bg-muted transition"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={
                  m.member?.imageUrl
                    ? `${BASE_IMAGE}${m.member.imageUrl}`
                    : undefined
                }
              />
              <AvatarFallback>
                {m.member?.name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm truncate">{m.member?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.member?.email}</p>
            </div>
            <Badge
              variant={m.type === 'admin' ? 'destructive' : 'secondary'}
              className="capitalize text-[10px] font-semibold"
            >
              {m.type}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceInfo;
