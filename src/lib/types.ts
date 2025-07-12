export type DecodedToken = {
  id: string;
  email: string;
  iat: number;
  exp?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

export interface Member {
  id: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  member: User;
}

export interface Workspace {
  id: string;
  name: string;
  type: "public" | "private";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: User;
  members: Member[];
}

export interface MessageProps {
  id: string;
  msg: {
    id: string;
    SenderId: string;
    message_text: string;
    timestamp: string;
    isRead?: boolean;
    allRead: boolean;
    Sender?: {
      name?: string;
      imageUrl?: string;
    };
    messageReads?: {
      userId: string;
      user: {
        id: string;
        name: string;
        email: string;
        imageUrl: string;
      };
      readAt: string;
    }[];
  };
  idx: number;
  socket: any;
};