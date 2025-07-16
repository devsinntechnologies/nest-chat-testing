// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { BASE_IMAGE } from '@/lib/constants';
import { useUpdateWorkspaceMutation, useUpdateWorkspacePictureMutation } from '@/hooks/UseWorkspace';
import CropModal from '../Modal/CropModal';

const WorkspaceInfo = ({ workspace, refetchWorkspace }: { workspace: any, refetchWorkspace: () => void }) => {
  const [updateWorkspaceImage, { isLoading: workspaceImageLoading }] = useUpdateWorkspacePictureMutation();
  const [updateWorkspace, { isLoading }] = useUpdateWorkspaceMutation();

  const [name, setName] = useState(workspace?.name || '');
  const [type, setType] = useState(workspace?.type || 'public');
  const [editMode, setEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropData, setCropData] = useState<Blob | null>(null);
  const [showCropper, setShowCropper] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  const uploadImage = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('image', blob);

    try {
      await updateWorkspaceImage({id:workspace.id, formData}).unwrap();
      toast.success('Workspace image updated.');
      refetchWorkspace();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update image.');
    }
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
    <>
      {showCropper ? (
        <CropModal
          imageSrc={previewUrl}
          onCancel={() => setShowCropper(false)}
          onCrop={(croppedBlob) => {
            setCropData(croppedBlob);
            uploadImage(croppedBlob);
            setShowCropper(false);
          }}
        />)
        :
        (<div className="w-full space-y-6 p-4">
          <div className="relative flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-2 ring-primary shadow-md">
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

              <Button
                variant="secondary"
                size="icon"
                onClick={() => document.getElementById('workspace-image-input')?.click()}
                className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 shadow-md"
              >
                <Pencil className="w-4 h-4" />
              </Button>


              <input
                type="file"
                accept="image/*"
                hidden
                id="workspace-image-input"
                onChange={handleFileChange}
              />

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
        </div>
        )}
    </>
  );
};

export default WorkspaceInfo;
