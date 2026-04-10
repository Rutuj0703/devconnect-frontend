export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
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
  videoUrl: string | null;
  viewCount: number;
  createdAt: string;
  user: User;
  tags: Tag[];
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
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