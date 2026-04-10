"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "@/components/feed/ProjectCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useAuthStore } from "@/store/authStore";
import { Project } from "@/types";
import api from "@/lib/axios";

const LIMIT = 10;

export default function FeedPage() {
  const { isLoggedIn } = useAuthStore();
  const [feedType, setFeedType] = useState<"global" | "following">("global");
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset feed when tab changes
  useEffect(() => {
    setProjects([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [feedType]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const endpoint =
          feedType === "following" ? "/projects/feed" : "/projects";
        const res = await api.get(endpoint, {
          params: { page, limit: LIMIT },
        });

        const newProjects = res.data.projects;
        setProjects((prev) =>
          page === 1 ? newProjects : [...prev, ...newProjects]
        );
        setHasMore(newProjects.length === LIMIT);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchProjects();
  }, [feedType, page]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [loadingMore, hasMore]);

  const bottomRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Feed Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        {isLoggedIn && (
          <Tabs
            value={feedType}
            onValueChange={(v) => setFeedType(v as "global" | "following")}
          >
            <TabsList>
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {feedType === "following"
            ? "Follow some developers to see their projects here"
            : "No projects yet. Be the first to post!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={bottomRef} className="h-10 mt-4" />

      {/* Loading more */}
      {loadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Skeleton className="w-full h-48 rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}