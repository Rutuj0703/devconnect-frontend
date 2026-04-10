"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/feed/ProjectCard";
import api from "@/lib/axios";
import { Project, User } from "@/types";
import Link from "next/link";

interface SearchResults {
  projects: Project[];
  users: User[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({ projects: [], users: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Fetch all tags for filter chips
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get("/tags");
        setTags(res.data.tags.map((t: any) => t.name));
      } catch {
        // fail silently
      } finally {
        setTagsLoading(false);
      }
    };
    fetchTags();
  }, []);

  // Search function
  const handleSearch = useCallback(async (q: string, tag?: string | null) => {
    if (!q.trim() && !tag) {
      setResults({ projects: [], users: [] });
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();
      if (tag) params.tag = tag;

      const res = await api.get("/search", { params });
      setResults({
        projects: res.data.projects ?? [],
        users: res.data.users ?? [],
      });

      // Update URL
      const url = new URL(window.location.href);
      if (q.trim()) url.searchParams.set("q", q.trim());
      else url.searchParams.delete("q");
      router.replace(url.pathname + url.search, { scroll: false });
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Debounce search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, selectedTag);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, selectedTag]);

  // Search on initial load if query in URL
  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery, null);
  }, []);

  const handleTagClick = (tag: string) => {
    const next = selectedTag === tag ? null : tag;
    setSelectedTag(next);
  };

  const totalResults = results.projects.length + results.users.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, developers, tags..."
          className="pl-9 pr-9 h-11"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tag Filters */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">Filter by tag</p>
        {tagsLoading ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {tags.slice(0, 20).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <SearchSkeleton />
      ) : !searched ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Search for projects or developers</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">
            Try different keywords or remove filters
          </p>
        </div>
      ) : (
        <Tabs defaultValue="projects">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="projects">
                Projects ({results.projects.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                Developers ({results.users.length})
              </TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">
              {totalResults} result{totalResults !== 1 && "s"}
            </p>
          </div>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            {results.projects.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No projects found
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            {results.users.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No developers found
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <Link href={`/users/${user.id}`}>
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={user.avatar ?? ""} />
          <AvatarFallback className="text-lg">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name}</p>
          {user.bio && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {user.bio}
            </p>
          )}
        </div>
        <Button size="sm" variant="outline" className="shrink-0">
          View
        </Button>
      </div>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card">
            <Skeleton className="w-full h-48 rounded-t-lg" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}