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
  id?: string;
  msg: {
    id: string;
    SenderId: string;
    message_text: string;
    message_file_url?: string;
    type: string;
    editCount: number,
    timestamp: string;
    isRead?: boolean;
    allRead: boolean;
    Sender?: {
      id?: string;
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
  idx?: number;
  socket?: any;
};

export interface SingleMessageProps {
  msg: {
    id: string,
    type: string,
    message_text: string,
    message_file_url?: string,
    timestamp: string,
    editCount: number,
    Sender: {
      id: string,
      name: string,
      imageUrl: string
    },
    Receiver: {
      id: string,
      name: string,
      imageUrl: string
    },
    isRead: boolean
  }
};