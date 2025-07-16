'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import MembersDialog from './MembersDialog';
import WorkspaceInfo from './WorkspaceInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkspaceInfosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: any;
  refetchWorkspace: ()=> void
}

const WorkspaceInfos: React.FC<WorkspaceInfosProps> = ({
  open,
  onOpenChange,
  workspace,
  refetchWorkspace
}) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-2 pt-10 w-[800px] overflow-hidden">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className='w-full'>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="member">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="member">
            <MembersDialog id={workspace.id} refetch={refetchWorkspace}/>
          </TabsContent>
          <TabsContent value="info">
            <WorkspaceInfo workspace={workspace} refetchWorkspace={refetchWorkspace}/>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceInfos;
