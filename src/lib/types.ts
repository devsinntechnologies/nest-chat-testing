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
