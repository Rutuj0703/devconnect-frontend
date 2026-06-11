"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  liveUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const router = useRouter();

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    coverImage: boolean;
    video: boolean;
  }>({ coverImage: false, video: false });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 8) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // Handle cover image selection
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  // Handle video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }
    setVideo(file);
    toast.success("Video selected: " + file.name);
  };

  // Upload file to S3 via presigned URL
  const uploadToS3 = async (
    file: File,
    type: "image" | "video"
  ): Promise<string> => {
    const endpoint = type === "image" ? "/upload/image/presigned" : "/upload/video/presigned";

    const { data } = await api.post(endpoint, {
      fileName: file.name,
      contentType: file.type,
    });

    await fetch(data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    return data.fileUrl;
  };

  const onSubmit = async (formData: ProjectForm) => {
    try {
      setUploading(true);
      let coverImageUrl = "";
      let demoVideoUrl = "";

      // Upload cover image
      if (coverImage) {
        setUploadProgress((prev) => ({ ...prev, coverImage: true }));
        coverImageUrl = await uploadToS3(coverImage, "image");
        setUploadProgress((prev) => ({ ...prev, coverImage: false }));
      }

      // Upload video
      if (video) {
        setUploadProgress((prev) => ({ ...prev, video: true }));
        demoVideoUrl = await uploadToS3(video, "video");
        setUploadProgress((prev) => ({ ...prev, video: false }));
      }

      // Create project
      const res = await api.post("/projects", {
        title: formData.title,
        description: formData.description,
        repoUrl: formData.repoUrl || undefined,
        liveUrl: formData.liveUrl || undefined,
        coverImage: coverImageUrl || undefined,
        demoVideoUrl: demoVideoUrl || undefined,
        tags,
      });
      console.log("Response:", res.data);
      toast.success("Project created successfully!");
      router.push(`/projects/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setUploading(false);
    }
  };

  const isLoading = isSubmitting || uploading;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Post a Project</h1>
        <p className="text-muted-foreground mt-1">
          Share your work with the developer community
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            placeholder="My Awesome Project"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe your project, what it does, tech stack used, challenges faced..."
            rows={5}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Repo + Live URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="repoUrl">GitHub Repo URL</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/..."
              {...register("repoUrl")}
            />
            {errors.repoUrl && (
              <p className="text-sm text-destructive">
                {errors.repoUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="liveUrl">Live Demo URL</Label>
            <Input
              id="liveUrl"
              placeholder="https://myproject.vercel.app"
              {...register("liveUrl")}
            />
            {errors.liveUrl && (
              <p className="text-sm text-destructive">
                {errors.liveUrl.message}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label htmlFor="tags">
            Tags{" "}
            <span className="text-muted-foreground text-xs">
              (press Enter or comma to add, max 8)
            </span>
          </Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? "react, nodejs, typescript..." : ""}
              className="flex-1 min-w-24 bg-transparent outline-none text-sm"
              disabled={tags.length >= 8}
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-1.5">
          <Label>Cover Image</Label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => document.getElementById("coverImageInput")?.click()}
          >
            {coverImagePreview ? (
              <div className="relative">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="max-h-48 mx-auto rounded-lg object-cover"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Click to change
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload cover image
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}
          </div>
          <input
            id="coverImageInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverImageChange}
          />
          {uploadProgress.coverImage && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading image...
            </p>
          )}
        </div>

        {/* Demo Video */}
        <div className="space-y-1.5">
          <Label>Demo Video</Label>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => document.getElementById("videoInput")?.click()}
          >
            {video ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{video.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(video.size / (1024 * 1024)).toFixed(1)}MB — Click to change
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload demo video
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM up to 100MB
                </p>
              </div>
            )}
          </div>
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />
          {uploadProgress.video && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading video... this may take a moment
            </p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress.video
                ? "Uploading video..."
                : uploadProgress.coverImage
                ? "Uploading image..."
                : "Creating project..."}
            </span>
          ) : (
            "Post Project"
          )}
        </Button>
      </form>
    </div>
  );
}