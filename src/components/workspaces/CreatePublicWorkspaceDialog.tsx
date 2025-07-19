"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useCreatePublicWorkspaceMutation } from "@/hooks/UseWorkspace";

export default function CreatePublicWorkspaceDialog({
  refetch,
}: {
  refetch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const [createpubWorkspace] = useCreatePublicWorkspaceMutation();

 const handleCreate = async () => {
  const loadingId = toast.loading("Creating workspace…");
  try {
    const res = await createpubWorkspace({ name: name.trim() || "New Workspace" }).unwrap();

    toast.dismiss(loadingId);

    if (!res?.success) {
      toast.error(res?.message || "Failed to create workspace");
      return;
    }

    toast.success(res.message || "Workspace created");
    refetch();
    setOpen(false);
    setName("");
  } catch (err) {
    toast.dismiss();
    toast.error("An error occurred");
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Public Workspace</Button>
      </DialogTrigger>

      <DialogContent>
        <h2 className="text-lg font-semibold mb-2">New Public Workspace</h2>

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
