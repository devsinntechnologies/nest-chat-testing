"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLeaveWorkspaceMutation } from "@/hooks/UseWorkspace";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function LeaveWorkspaceAlert() {
  const { id } = useParams();

  const [deleteMember, { isLoading: deletingMember }] = useLeaveWorkspaceMutation();

  const handleRemove = async () => {
    try {
      toast.loading("Removing from the workspace...");
      const res = await deleteMember({ id }).unwrap();
      toast.dismiss();

      if (res.success) {
        toast.success("You have been removed from the workspace.");
        window.location.href = "/workspaces";
      } else {
        toast.error("Failed to remove from workspace.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("An error occurred while removing.");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={deletingMember}>
          {deletingMember ? "Leaving..." : "Leave Workspace"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. You will lose access to this workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingMember}>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive" onClick={handleRemove} disabled={deletingMember}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
