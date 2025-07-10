"use client";

import { WorkspaceList } from "@/components/workspaces/WorkspaceList";
import { useGetPublicWorkspacesQuery, useGetPrivateWorkspacesQuery } from "@/hooks/UseWorkspace";
// import { Button } from "@/components/ui/button";
import CreatePrivateWorkspaceDialog from "@/components/workspaces/CreatePrivateWorkspaceDialog";
import CreatePublicWorkspaceDialog from "@/components/workspaces/CreatePublicWorkspaceDialog";

export default function WorkspacePage() {
  const {
    data: dataPublic,
    isLoading: isLoadingPublic,
    refetch: refetchPublic,
  } = useGetPublicWorkspacesQuery({ pageNo: 1, pageSize: 10 });

  const {
    data: dataPrivate,
    isLoading: isLoadingPrivate,
    refetch: refetchPrivate,
  } = useGetPrivateWorkspacesQuery({ pageNo: 1, pageSize: 10 });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Workspaces</h1>

      <section className="mb-8">
          <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold mb-2">Public Workspaces</h2>
          <CreatePublicWorkspaceDialog refetch={refetchPublic} />
        </div>
        <WorkspaceList
          workspaces={dataPublic?.data || []}
          isLoading={isLoadingPublic}
          refetch={refetchPublic}
        />
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Private Workspaces</h2>
          <CreatePrivateWorkspaceDialog refetch={refetchPrivate} />
        </div>

        <WorkspaceList
          workspaces={dataPrivate?.data || []}
          isLoading={isLoadingPrivate}
          refetch={refetchPrivate}
        />
      </section>
    </div>
  );
}
