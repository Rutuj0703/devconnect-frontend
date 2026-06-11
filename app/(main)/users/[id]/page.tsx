"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Project, User } from "@/types";
import ProjectCard from "@/components/feed/ProjectCard";

interface UserStats {
  projectsCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
  totalComments: number;
}

interface ProjectTag {
  projectId: string;
  tagId: string;
  tag: { id: string; name: string };
}

interface ProjectApiResponse {
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
  _count?: { likes: number; comments: number };
}

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser, isLoggedIn } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  const mapProjectResponse = (project: ProjectApiResponse): Project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    repoUrl: project.repoUrl ?? null,
    liveUrl: project.liveUrl ?? null,
    coverImage: project.coverImage ?? null,
    demoVideoUrl: project.demoVideoUrl ?? null,
    viewsCount: project.viewsCount,
    createdAt: project.createdAt,
    user: project.user,
    tags: project.tags,
    _count: project._count ?? { likes: 0, comments: 0 },
  });

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const [userRes, statsRes, projectsRes] = await Promise.all([
          api.get<User>(`/users/${id}`),
          api.get<UserStats>(`/users/${id}/stats`),
          api.get<ProjectApiResponse[]>(`/users/${id}/projects`),
        ]);

        setUser(userRes.data);
        setStats(statsRes.data);
        setProjects(projectsRes.data.map(mapProjectResponse));
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Unable to load this profile at the moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to follow users");
      return;
    }

    if (!id) return;

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await api.delete(`/users/${id}/follow`);
        setIsFollowing(false);
        setStats((prev) =>
          prev ? { ...prev, followersCount: Math.max(prev.followersCount - 1, 0) } : prev
        );
      } else {
        await api.post(`/users/${id}/follow`);
        setIsFollowing(true);
        setStats((prev) =>
          prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev
        );
      }
    } catch (err) {
      console.error("Follow error", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error)
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">
        {error}
      </div>
    );

  if (!user)
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">
        User not found.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Avatar className="h-24 w-24 shrink-0">
          <AvatarImage src={user.avatarUrl ?? ""} />
          <AvatarFallback className="text-3xl">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>

            {isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <a href="/settings">Edit Profile</a>
              </Button>
            ) : (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading
                  ? "..."
                  : isFollowing
                  ? "Unfollow"
                  : "Follow"}
              </Button>
            )}
          </div>

          {user.bio && <p className="text-sm leading-relaxed">{user.bio}</p>}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Projects", value: stats.projectsCount },
            { label: "Followers", value: stats.followersCount },
            { label: "Following", value: stats.followingCount },
            { label: "Total Likes", value: stats.totalLikes },
            { label: "Comments", value: stats.totalComments },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-lg border bg-card"
            >
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            Projects {projects.length > 0 && `(${projects.length})`}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {isOwnProfile
                ? "You haven't posted any projects yet"
                : `${user.name} hasn't posted any projects yet`}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={(projectId) => setProjects((prev) => prev.filter((p) => p.id !== projectId))}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityFeed userId={id as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityFeed({ userId }: { userId: string }) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchActivity = async () => {
      try {
        const res = await api.get(`/users/${userId}/activity`);
        setActivity(res.data.activity || []);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm">
          <span className="text-muted-foreground">{item.type}</span>
          <span>{item.description}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}