"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Workspace } from "@/lib/types";
import { useJoinPublicWorkspaceMutation } from "@/hooks/UseWorkspace";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import AddMemberDialog from "./AddMemberDialog";

export function WorkspaceList({
  workspaces,
  isLoading,
  refetch,
}: {
  workspaces: Workspace[];
  isLoading: boolean;
  refetch: () => void;
}) {
  const [joinPublic] = useJoinPublicWorkspaceMutation();
  const userId = useSelector(
    (state: RootState) => state.authSlice.user?.id
  );
  console.log(userId)

  if (isLoading) return <p>Loading…</p>;

  const handleJoinPublic = async ({ workspaceId }: { workspaceId: string }) => {
    const loadingId = toast.loading("Joining to public workspace…");
    try {
      const formData = { userId, workspaceId }
      const res = await joinPublic(formData).unwrap();
      toast.dismiss(loadingId);
      if (!res.success) {
        toast.error(res.message || "Failed to join workspace");
        return;
      }

      toast.success(res.message || "Joined workspace successfully");
      refetch();
    } catch (err: any) {
      toast.dismiss(loadingId);
      toast.error(err?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="grid gap-4">
      <p>{userId}</p>
      {workspaces.map((ws) => (
        <Card key={ws.id} className="p-4 flex flex-col gap-2">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{ws.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {ws.type}
              </p>
              <p className="text-xs">
                Created by: <span className="font-medium">{ws.creator?.name}</span>
              </p>
            </div>
            {ws.creator.id === userId && ws.type === 'private' && <AddMemberDialog workspaceId={ws.id} refetch={refetch}/>}
            {ws.type === 'public' && <Button
              onClick={() => { handleJoinPublic({ workspaceId: ws.id }) }}
            >
              Join
            </Button>}
          </div>

          {ws.members.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">Members:</p>
              <ul className="text-xs text-muted-foreground">
                {ws.members.map((m) => (
                  <li key={m.id}>{m.member.name}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
