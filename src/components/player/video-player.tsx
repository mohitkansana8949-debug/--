'use client';

import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Fullscreen,
  Volume2,
  VolumeX,
  Settings,
  ArrowLeft,
  Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type VideoPlayerProps = {
    videoId: string | null;
    title: string;
};

export default function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  const router = useRouter();

  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function' && isPlaying) {
        setCurrentTime(player.getCurrentTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [player, isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const onPlayerReady = (event: any) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
      setDuration(player.getDuration());
    } else { // Paused, ended, etc.
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    resetControlsTimeout();
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    player.seekTo(newTime, true);
    resetControlsTimeout();
  };
  
  const handleSeekEnd = (value: number[]) => {
    handleSeek(value);
    if (!isPlaying) {
        player.playVideo();
    }
  }

  const handleForward = () => {
    player.seekTo(currentTime + 10, true);
    resetControlsTimeout();
  };

  const handleBackward = () => {
    player.seekTo(currentTime - 10, true);
    resetControlsTimeout();
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      player.unMute();
    } else {
      player.mute();
    }
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const handlePlaybackRateChange = (rate: number) => {
    player.setPlaybackRate(rate);
    setPlaybackRate(rate);
    resetControlsTimeout();
  };
  
  const handleFullScreen = () => {
    const iframe = player.getIframe();
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.mozRequestFullScreen) { /* Firefox */
      iframe.mozRequestFullScreen();
    } else if (iframe.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) { /* IE/Edge */
      iframe.msRequestFullscreen();
    }
    resetControlsTimeout();
  }

  const formatTime = (time: number) => {
    const date = new Date(0);
    date.setSeconds(time);
    return date.toISOString().substr(14, 5);
  };
  
  if (!videoId) {
    return (
       <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white">
          <Youtube className="h-16 w-16 mb-4 text-red-600" />
          <h2 className="text-2xl font-bold">अमान्य यूट्यूब लिंक</h2>
          <p className="text-muted-foreground">इस कोर्स में कोई मान्य यूट्यूब वीडियो लिंक नहीं है।</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-6 bg-transparent text-white">
             <ArrowLeft className="mr-2 h-4 w-4" /> वापस जाएं
          </Button>
       </div>
    );
  }

  return (
    <div 
      ref={playerContainerRef} 
      className="w-full h-full bg-black text-white flex items-center justify-center relative overflow-hidden"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      <div className="w-full h-full absolute">
        <YouTube
          videoId={videoId}
          opts={{
            height: '100%',
            width: '100%',
            playerVars: {
              autoplay: 1,
              controls: 0,
              rel: 0,
              showinfo: 0,
              modestbranding: 1,
              fs: 0,
              iv_load_policy: 3,
              hl: 'hi', // Set language to Hindi
            },
          }}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          className="w-full h-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div className={cn(
          "absolute inset-0 transition-opacity duration-300 z-10",
          showControls ? "opacity-100" : "opacity-0"
        )}
        onClick={resetControlsTimeout}
      >
        {/* Black Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/80"></div>
        
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
           <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
           </Button>
           <h1 className="text-lg font-bold truncate mx-4">{title}</h1>
           <div>{/* Right placeholder */}</div>
        </div>

        {/* Middle Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-16">
          <Button variant="ghost" size="icon" className="h-16 w-16" onClick={handleBackward}>
            <RotateCcw className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="h-24 w-24" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-16 w-16" /> : <Play className="h-16 w-16" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-16 w-16" onClick={handleForward}>
            <RotateCw className="h-8 w-8" />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                <Slider
                    min={0}
                    max={duration}
                    step={1}
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    onValueCommit={handleSeekEnd}
                />
                <span className="text-xs font-mono">{formatTime(duration)}</span>
            </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
                 <Popover>
                    <PopoverTrigger asChild>
                       <Button variant="ghost" size="icon"><Settings /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 bg-black/80 border-gray-700 text-white backdrop-blur-sm p-0">
                       <div className="flex flex-col">
                           {[0.5, 1, 1.5, 2].map(rate => (
                                <Button 
                                    key={rate} 
                                    variant="ghost" 
                                    onClick={() => handlePlaybackRateChange(rate)}
                                    className={cn("justify-start rounded-none", playbackRate === rate && "bg-red-600/50")}
                                >
                                    {rate}x
                                </Button>
                           ))}
                       </div>
                    </PopoverContent>
                </Popover>
              <Button variant="ghost" size="icon" onClick={handleFullScreen}>
                <Fullscreen />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
