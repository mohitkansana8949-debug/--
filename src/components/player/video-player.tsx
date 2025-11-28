
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
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const stopProgressUpdates = () => {
    if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
        progressUpdateRef.current = null;
    }
  }

  const startProgressUpdates = () => {
      stopProgressUpdates();
      progressUpdateRef.current = setInterval(() => {
        if (player && typeof player.getCurrentTime === 'function') {
            setCurrentTime(player.getCurrentTime());
        }
      }, 500);
  }

  useEffect(() => {
    // Cleanup interval on unmount
    return () => stopProgressUpdates();
  }, [player]);


  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
        if(isPlaying) {
            setShowControls(false);
        }
    }, 4000);
  };

  const onPlayerReady = (event: any) => {
    setPlayer(event.target);
    // The playVideo() call will trigger the onStateChange event with data=1 (playing)
    event.target.playVideo(); 
    resetControlsTimeout();
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === 1) { // Playing
      setIsPlaying(true);
      setDuration(player.getDuration());
      startProgressUpdates();
      resetControlsTimeout();
    } else { // Paused, ended, etc.
      setIsPlaying(false);
      stopProgressUpdates();
      // Keep controls visible when paused
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
    // No need to call resetControlsTimeout here, onPlayerStateChange will handle it
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime); // Optimistically update UI
    player.seekTo(newTime, true);
    resetControlsTimeout();
  };

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
    if(isNaN(time) || time === 0) return '00:00';
    const date = new Date(0);
    date.setSeconds(time);
    const timeString = date.toISOString().substr(11, 8);
    return duration >= 3600 ? timeString : timeString.substr(3);
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
      className="w-full h-full bg-black text-white flex items-center justify-center relative overflow-hidden group/player"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => { if(isPlaying) setShowControls(false) }}
    >
      <div className="w-full h-full absolute" id="youtube-player-container">
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
      <div 
        className={cn(
            "absolute inset-0 transition-opacity duration-300 z-10",
            showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Click to play/pause */}
        <div 
            className="absolute inset-0 w-full h-full"
            onClick={(e) => {
                if (e.target === e.currentTarget) handlePlayPause();
            }}
        />

        {/* Black Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        
        {/* Top Controls Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
           </Button>
           <h1 className="text-lg font-bold truncate">{title}</h1>
        </div>

        {/* Middle Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-16 pointer-events-none">
          <Button variant="ghost" size="icon" className="h-16 w-16 pointer-events-auto" onClick={handleBackward}>
            <RotateCcw className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="h-24 w-24 pointer-events-auto" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-16 w-16" /> : <Play className="h-16 w-16" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-16 w-16 pointer-events-auto" onClick={handleForward}>
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
                    <PopoverContent className="w-40 bg-black/80 border-gray-700 text-white backdrop-blur-sm p-0 mb-2">
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
