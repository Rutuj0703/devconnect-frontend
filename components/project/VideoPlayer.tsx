"use client";

import ReactPlayer from "react-player";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const playerConfig = {
    file: {
      attributes: {
        controlsList: "nodownload",
      },
    },
  } as any;

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      {!ready && !error && <Skeleton className="absolute inset-0 w-full h-full" />}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80 px-4 text-center">
          Unable to load video. Please check the demo URL or try again later.
        </div>
      ) : (
        <ReactPlayer
          src={url}
          width="100%"
          height="100%"
          controls
          onReady={() => setReady(true)}
          onError={() => setError(true)}
          config={playerConfig}
        />
      )}
    </div>
  );
}