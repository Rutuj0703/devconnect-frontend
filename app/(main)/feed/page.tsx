"use client";

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { Project } from "@/types";
import api from "@/lib/axios";
import ProjectPost from "./ProjectPost";

const LIMIT = 5;

export default function FeedPage() {
  const { isLoggedIn } = useAuthStore();
  const [feedType, setFeedType] = useState<"global" | "following">("global");
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Reset on tab change
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
        const endpoint = feedType === "following" ? "/feed/following" : "/projects";
        const res = await api.get(endpoint, { params: { page, limit: LIMIT } });
        const newProjects = Array.isArray(res.data) ? res.data : res.data.projects ?? [];
        setProjects((prev) => (page === 1 ? newProjects : [...prev, ...newProjects]));
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

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [loadingMore, hasMore, loading]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (bottomRef.current) observerRef.current.observe(bottomRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  return (
    <div className="max-w-[470px] mx-auto">
      {/* Feed Toggle */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b pb-3 pt-2 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">DevConnect</h1>
          {isLoggedIn && (
            <Tabs value={feedType} onValueChange={(v) => setFeedType(v as "global" | "following")}>
              <TabsList className="h-8">
                <TabsTrigger value="global" className="text-xs px-3">Global</TabsTrigger>
                <TabsTrigger value="following" className="text-xs px-3">Following</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {feedType === "following"
            ? "Follow some developers to see their projects here"
            : "No projects yet. Be the first to post!"}
        </div>
      ) : (
        <div className="space-y-1">
          {projects.map((project) => (
            <ProjectPost key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={bottomRef} className="h-10" />
      {loadingMore && (
        <div className="space-y-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="border-b pb-4 mb-4 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </div>
      <div className="w-full aspect-square bg-muted animate-pulse" />
      <div className="px-1 space-y-2">
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        <div className="h-3 w-full bg-muted animate-pulse rounded" />
        <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}