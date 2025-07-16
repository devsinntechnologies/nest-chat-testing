"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useJoinWorkspaceMutation } from "@/hooks/UseWorkspace";
import { useGetAllUsersQuery } from "@/hooks/UseAuth";

export default function AddMemberDialog({
  workspaceId,
  refetch,
}: {
  workspaceId: string;
  refetch: () => void;
}) {
  const userId = useSelector(
    (state: RootState) => state.authSlice.user?.id
  );

  const { data, isLoading, isError } = useGetAllUsersQuery({});
  const [joinPrivate] = useJoinWorkspaceMutation();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (isLoading) return <p>Loading users…</p>;
  if (isError) return <p>Failed to fetch users.</p>;

  const users =
    data?.data?.filter((user: any) => user.id !== userId) || [];

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    const loadingId = toast.loading("Adding member to workspace…");
    try {
      const formData = { userId: selectedUserId, workspaceId };
      const res = await joinPrivate(formData).unwrap();
      toast.dismiss(loadingId);

      if (!res.success) {
        toast.error(res.message || "Failed to add member");
        return;
      }

      toast.success(res.message || "Member added successfully");
      refetch();
      setOpen(false); // Close dialog
      setSelectedUserId(null);
    } catch (err: any) {
      toast.dismiss(loadingId);
      toast.error(err?.data?.message || "An error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Member</Button>
      </DialogTrigger>

      <DialogContent>
        <h2 className="text-lg font-semibold mb-4">Select a user to add</h2>

        <Select onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddMember}>Add Now</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
