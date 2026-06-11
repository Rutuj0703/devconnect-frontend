"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Heart, MessageCircle, Eye, Github,
  ExternalLink, Bookmark, MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Project } from "@/types";

interface ProjectPostProps {
  project: Project;
}

export default function ProjectPost({ project }: ProjectPostProps) {
  const { isLoggedIn, user } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project._count?.likes ?? 0);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const handleLike = async () => {
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

  const handleDoubleClick = () => {
    if (!liked) {
      handleLike();
    }
  };

  const caption = project.description ?? "";
  const isLongCaption = caption.length > 100;

  return (
    <article className="border-b border-border pb-2 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-2">
        <Link href={`/users/${project.user.id}`} className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={project.user.avatarUrl ?? ""} />
            <AvatarFallback className="text-xs">
              {project.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-none">{project.user.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {project.repoUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(project.repoUrl!, "_blank")}
            >
              <Github className="h-4 w-4" />
            </Button>
          )}
          {project.liveUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(project.liveUrl!, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {user?.id === project.user.id && (
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cover Image — full width, square like Instagram */}
      <Link href={`/projects/${project.id}`}>
        <div
          className="relative w-full bg-muted cursor-pointer"
          style={{ aspectRatio: "1/1" }}
          onDoubleClick={handleDoubleClick}
        >
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              className="object-cover"
              sizes="470px"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background gap-3">
              <div className="text-6xl">💻</div>
              <p className="text-sm font-medium text-muted-foreground px-8 text-center line-clamp-2">
                {project.title}
              </p>
            </div>
          )}

          {/* Video indicator */}
          {project.demoVideoUrl && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              ▶ Demo
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="px-1 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`p-1.5 rounded-full transition-all active:scale-90 ${
                liked ? "text-red-500" : "text-foreground hover:text-muted-foreground"
              }`}
            >
              <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} />
            </button>

            {/* Comment */}
            <Link href={`/projects/${project.id}#comments`}>
              <button className="p-1.5 rounded-full text-foreground hover:text-muted-foreground transition-colors">
                <MessageCircle className="h-6 w-6" />
              </button>
            </Link>

            {/* Repo link */}
            {project.repoUrl && (
              <button
                onClick={() => window.open(project.repoUrl!, "_blank")}
                className="p-1.5 rounded-full text-foreground hover:text-muted-foreground transition-colors"
              >
                <Github className="h-6 w-6" />
              </button>
            )}

            {/* Live demo */}
            {project.liveUrl && (
              <button
                onClick={() => window.open(project.liveUrl!, "_blank")}
                className="p-1.5 rounded-full text-foreground hover:text-muted-foreground transition-colors"
              >
                <ExternalLink className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Views */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-4 w-4" />
            {project.viewsCount}
          </span>
        </div>

        {/* Like count */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold mb-1">{likeCount} {likeCount === 1 ? "like" : "likes"}</p>
        )}

        {/* Title */}
        <Link href={`/projects/${project.id}`}>
          <h3 className="text-sm font-bold hover:text-primary transition-colors mb-1">
            {project.title}
          </h3>
        </Link>

        {/* Caption */}
        {caption && (
          <p className="text-sm text-foreground leading-snug">
            <span className="font-semibold mr-1">{project.user.name}</span>
            {isLongCaption && !showFullCaption
              ? <>
                  {caption.slice(0, 100)}...{" "}
                  <button
                    onClick={() => setShowFullCaption(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    more
                  </button>
                </>
              : caption
            }
          </p>
        )}

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.slice(0, 5).map((tag, i) => (
              <Badge
                key={tag.tag.id ?? i}
                variant="secondary"
                className="text-xs px-1.5 py-0"
              >
                #{tag.tag.name ?? ""}
              </Badge>
            ))}
          </div>
        )}

        {/* Comment count link */}
        {(project._count?.comments ?? 0) > 0 && (
          <Link href={`/projects/${project.id}#comments`}>
            <p className="text-sm text-muted-foreground mt-1 hover:text-foreground transition-colors">
              View all {project._count?.comments} comments
            </p>
          </Link>
        )}
      </div>
    </article>
  );
}