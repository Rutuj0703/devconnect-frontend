"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Github, ExternalLink, Eye, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Project } from "@/types";
import VideoPlayer from "@/components/project/VideoPlayer";
import CommentSection from "@/components/project/CommentSection";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      const data = res.data;
      console.log("Project response:", JSON.stringify(data, null, 2));
      setProject(data);
      setLikeCount(data?._count?.likes ?? 0);
    } catch (err: any) {
      console.log("Fetch error:", err);
      if (err.response?.status === 404) {
        toast.error("Project not found");
        router.push("/feed");
      }
    } finally{
      setLoading(false);
    }
  };
  fetchProject();
}, [id]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to like projects");
      return;
    }
    try {
      if (liked) {
        await api.delete(`/projects/${id}/like`);
        setLikeCount((prev) => prev - 1);
      } else {
        await api.post(`/projects/${id}/like`);
        setLikeCount((prev) => prev + 1);
      }
      setLiked(!liked);
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (loading) return <ProjectDetailSkeleton />;
  if (!project) return null;

  const isOwner = user?.id === project.user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      {/* Cover Image */}
      {project.coverImage && (
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${id}/edit`}>Edit</Link>
            </Button>
          )}
          {project.repoUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-1" />
                Repo
              </a>
            </Button>
          )}
          {project.liveUrl && (
            <Button size="sm" asChild>
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Live Demo
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Author + Stats */}
      <div className="flex items-center justify-between">
        <Link href={`/users/${project.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-9 w-9">
            <AvatarImage src={project.user.avatarUrl ?? ""} />
            <AvatarFallback>{project.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{project.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {project.viewsCount}
          </span>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            {likeCount}
          </button>
        </div>
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag.tag.id} variant="secondary">
              {tag.tag.name}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Description */}
      <div>
        <h2 className="text-lg font-semibold mb-2">About this project</h2>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {project.description}
        </p>
      </div>

      {/* Video Player */}
      {project.demoVideoUrl && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Demo Video</h2>
            <VideoPlayer url={project.demoVideoUrl} />
          </div>
        </>
      )}

      <Separator />

      {/* Comments */}
      <CommentSection projectId={project.id} />
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="w-full h-80 rounded-xl" />
      <Skeleton className="h-10 w-2/3" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}