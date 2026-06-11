"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Eye, Github, ExternalLink, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project } from "@/types";
import { useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
} 

export default function ProjectCard({ project }: ProjectCardProps) {
  const { isLoggedIn, user } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project._count?.likes ?? 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigating to project page
    if (!isLoggedIn) {
      toast.error("Please login to like projects");
      return;
    }
    try {
      if (liked) {
        await api.delete(`/projects/${project.id}/like`);
        setLikeCount((prev) => prev - 1);
      } else {
        await api.post(`/projects/${project.id}/like`);
        setLikeCount((prev) => prev + 1);
      }
      setLiked(!liked);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        {/* Cover Image */}
        <div className="relative w-full h-48 bg-muted rounded-t-lg overflow-hidden">
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
              <span className="text-4xl">💻</span>
            </div>
          )}
        </div>

        <CardContent className="pt-4 space-y-3">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={project.user?.avatarUrl ?? ""} />
              <AvatarFallback>{project.user?.name?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hover:text-foreground">
              {project.user?.name ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 4).map((tag, index) => (
                <Badge key={tag.tag.id ?? index} variant="secondary" className="text-xs">
                  {tag.tag.name}
                </Badge>
              ))}
              {project.tags.length > 4 && (
                <Badge key="more" variant="outline" className="text-xs">
                  +{project.tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-sm transition-colors ${
                liked
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>

            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{project._count?.comments ?? 0}</span>
            </span>

            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{project.viewsCount}</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-1">
            {project.repoUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(project.repoUrl!, "_blank");
                }}
              >
                <Github className="h-4 w-4" />
              </Button>
            )}
            {project.liveUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(project.liveUrl!, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {/* Delete (owner only) */}
            {user?.id && project.user?.id && user.id === project.user.id && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const ok = confirm('Delete this project? This action cannot be undone.');
                  if (!ok) return;
                  try {
                    await api.delete(`/projects/${project.id}`);
                    toast.success('Project deleted');
                    if (typeof onDelete === 'function') onDelete(project.id);
                  } catch (err) {
                    toast.error('Failed to delete project');
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}