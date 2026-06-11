export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  repoUrl: string | null;
  liveUrl: string | null;
  coverImage: string | null;
  demoVideoUrl: string | null;
  viewsCount: number;
  createdAt: string;
  user: User;
  tags: ProjectTag[];
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface ProjectTag {
  projectId: string;
  tagId: string;
  tag: Tag;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projectId: string;
  parentId: string | null;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  replies?: Comment[];
}

export interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "REPLY";
  read: boolean;
  createdAt: string;
  actor: User;
  project?: Pick<Project, "id" | "title">;
}