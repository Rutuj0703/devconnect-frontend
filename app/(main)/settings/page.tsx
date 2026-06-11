"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(200, "Bio must be under 200 characters").optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name ?? "",
      bio: user?.bio ?? "",
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    const { data } = await api.post("/upload/image/presigned", {
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

  const onSubmit = async (formData: SettingsForm) => {
    try {
      setUploading(true);
      let avatarUrl: string | undefined;

      if (avatarFile) {
        avatarUrl = await uploadToS3(avatarFile);
      }

      const res = await api.patch("/users/me", {
        name: formData.name,
        bio: formData.bio || undefined,
        ...(avatarUrl && { avatarUrl }),
      });

      setUser(res.data);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="space-y-3">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview ?? user?.avatarUrl ?? ""} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatarInput")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name *</Label>
            <Input id="name" placeholder="Your name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell the community about yourself..."
              rows={4}
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
            <p className="text-xs text-muted-foreground">Max 200 characters</p>
          </div>

          <Separator />

          {/* Email (read only) */}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting || uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? "Uploading avatar..." : "Saving..."}
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>
    </ProtectedRoute>
  );
}