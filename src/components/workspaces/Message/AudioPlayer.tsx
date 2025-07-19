import * as React from "react";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Play, Pause } from "lucide-react";

type AudioPlayerProps = {
  src: string;
};

const formatTime = (seconds: number = 0): string =>
  [seconds / 60, seconds % 60]
    .map((v) => `0${Math.floor(v)}`.slice(-2))
    .join(":");

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number>(0);

  const { wavesurfer, isPlaying, currentTime = 0 } = useWavesurfer({
    container: containerRef,
    height: 40,
    waveColor: "#d1d5db", // neutral-300
    progressColor: "#22c55e", // green-500
    cursorColor: "#22c55e",
    url: src,
    plugins: useMemo(() => [], []),
    barWidth: 2,
    barGap: 1,
    barRadius: 1,
  });

  const onPlayPause = useCallback(() => {
    if (wavesurfer) wavesurfer.playPause();
  }, [wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setDuration(wavesurfer.getDuration());
    };

    wavesurfer.on("ready", handleReady);

    return () => {
      wavesurfer.un("ready", handleReady);
    };
  }, [wavesurfer]);

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow flex flex-col gap-2 p-4">
      <div className="w-full flex items-center gap-4">
        <button
          onClick={onPlayPause}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 active:scale-95 transition"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div
          ref={containerRef}
          className="min-w-0 w-50 flex-1 overflow-hidden"
        />
      </div>

      <div className="flex justify-end gap-1 text-xs text-gray-600 tabular-nums">
        <span>{formatTime(currentTime)}</span>/<span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
