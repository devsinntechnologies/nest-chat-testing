"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useCreatePrivateWorkspaceMutation } from "@/hooks/UseWorkspace";

export default function CreatePrivateWorkspaceDialog({
  refetch,
}: {
  refetch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const [createWorkspace] = useCreatePrivateWorkspaceMutation();

 const handleCreate = async () => {
  const loadingId = toast.loading("Creating workspace…");
  try {
    const res = await createWorkspace({ name: name.trim() || "New Workspace" }).unwrap();

    toast.dismiss(loadingId);

    if (!res?.success) {
      toast.error(res?.message || "Failed to create workspace");
      return;
    }

    toast.success(res.message || "Workspace created");
    refetch();
    setOpen(false);
    setName("");
  } catch (err: any) {
    toast.dismiss(loadingId);

    // 👇 log exact structure to debug
    console.error("❌ Error response:", err);

    toast.error(err?.data?.message || err?.message || "An error occurred");
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Private Workspace</Button>
      </DialogTrigger>

      <DialogContent>
        <h2 className="text-lg font-semibold mb-2">New Private Workspace</h2>

        <Input
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4"
        />

        <Button onClick={handleCreate}>Create</Button>
      </DialogContent>
    </Dialog>
  );
}
