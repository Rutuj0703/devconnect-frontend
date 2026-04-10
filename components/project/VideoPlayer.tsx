"use client";

import ReactPlayer from "react-player/lazy";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      {!ready && <Skeleton className="absolute inset-0 w-full h-full" />}
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls
        onReady={() => setReady(true)}
        config={{
          file: {
            attributes: {
              controlsList: "nodownload",
            },
          },
        }}
      />
    </div>
  );
}