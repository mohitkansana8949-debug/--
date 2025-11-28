
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
import { getYouTubeID } from '@/lib/youtube';

type VideoPlayerProps = {
    videoUrl: string | null;
    title?: string;
};

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const router = useRouter();

  const isYoutubeVideo = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
  const videoId = isYoutubeVideo ? getYouTubeID(videoUrl) : null;

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
  const videoRef = useRef<HTMLVideoElement>(null);


  const stopProgressUpdates = () => {
    if (progressUpdateRef.current) {
        clearInterval(progressUpdateRef.current);
        progressUpdateRef.current = null;
    }
  }

  const startProgressUpdates = () => {
      stopProgressUpdates();
      progressUpdateRef.current = setInterval(() => {
        if (isYoutubeVideo && player && typeof player.getCurrentTime === 'function' && player.getPlayerState() === 1) {
            setCurrentTime(player.getCurrentTime());
        } else if (!isYoutubeVideo && videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
      }, 500);
  }

  useEffect(() => {
    return () => stopProgressUpdates();
  }, [player, isYoutubeVideo]);


  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 4000);
    }
  };
  
  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying]);


  const onPlayerReady = (event: any) => {
    setPlayer(event.target);
    event.target.playVideo(); 
    resetControlsTimeout();
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === YouTube.PlayerState.PLAYING) { 
      setIsPlaying(true);
      setDuration(player.getDuration());
      startProgressUpdates();
    } else { 
      setIsPlaying(false);
      stopProgressUpdates();
    }
    if (event.data === YouTube.PlayerState.PAUSED || event.data === YouTube.PlayerState.ENDED) {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  };
  
  const handleNonYoutubePlayerEvents = () => {
      if(!videoRef.current) return;
      videoRef.current.onplay = () => { setIsPlaying(true); startProgressUpdates(); setDuration(videoRef.current?.duration || 0); };
      videoRef.current.onpause = () => { setIsPlaying(false); stopProgressUpdates(); };
      videoRef.current.onended = () => { setIsPlaying(false); stopProgressUpdates(); setShowControls(true); };
      videoRef.current.ontimeupdate = () => setCurrentTime(videoRef.current?.currentTime || 0);
  };

  useEffect(() => {
      handleNonYoutubePlayerEvents();
  }, [videoRef.current]);


  const handlePlayPauseToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYoutubeVideo && player) {
        isPlaying ? player.pauseVideo() : player.playVideo();
    } else if (videoRef.current) {
        isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
  };
  
  const handleContainerClick = () => {
     if (isYoutubeVideo && player) {
        isPlaying ? player.pauseVideo() : player.playVideo();
    } else if (videoRef.current) {
        isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
  }


  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
     if (isYoutubeVideo && player) {
        player.seekTo(newTime, true);
    } else if (videoRef.current) {
        videoRef.current.currentTime = newTime;
    }
    resetControlsTimeout();
  };

  const handleForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTime = currentTime + 10;
    if (isYoutubeVideo && player) player.seekTo(newTime, true);
    else if (videoRef.current) videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  };

  const handleBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTime = currentTime - 10;
     if (isYoutubeVideo && player) player.seekTo(newTime, true);
    else if (videoRef.current) videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYoutubeVideo && player) {
        isMuted ? player.unMute() : player.mute();
    } else if (videoRef.current) {
        videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (isYoutubeVideo && player) player.setPlaybackRate(rate);
    else if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    resetControlsTimeout();
  };
  
  const handleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = (isYoutubeVideo ? player.getIframe() : videoRef.current) as any;
    if (!element) return;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { /* Firefox */
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { /* IE/Edge */
      element.msRequestFullscreen();
    }
    resetControlsTimeout();
  }
  
  const handleBackClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.back();
  }

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  if (!videoUrl) {
    return (
       <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white">
          <Youtube className="h-16 w-16 mb-4 text-red-600" />
          <h2 className="text-2xl font-bold">अमान्य वीडियो लिंक</h2>
          <p className="text-muted-foreground">इस कोर्स में कोई मान्य वीडियो लिंक नहीं है।</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-6 bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:ring-0 focus-visible:ring-offset-0">
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
      onClick={handleContainerClick}
    >
      <div className="w-full h-full absolute" id="video-player-container">
        {isYoutubeVideo && videoId ? (
            <YouTube
            videoId={videoId}
            opts={{ height: '100%', width: '100%', playerVars: { autoplay: 1, controls: 0, rel: 0, showinfo: 0, modestbranding: 1, fs: 0, iv_load_policy: 3, hl: 'hi' }}}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="w-full h-full"
            />
        ) : (
            <video ref={videoRef} src={videoUrl} autoPlay className="w-full h-full" />
        )}
      </div>

      <div className={cn("absolute inset-0 transition-opacity duration-300 z-10", showControls ? "opacity-100" : "opacity-0")}>
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
        
        <header className="absolute top-0 left-0 right-0 p-2 flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={handleBackClick} className="hover:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0">
                <ArrowLeft />
           </Button>
           <p className="font-semibold truncate">{title}</p>
        </header>

        <div className="absolute inset-0 flex items-center justify-center gap-16" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-16 w-16 hover:bg-white/10" onClick={handleBackward}><RotateCcw className="h-8 w-8" /></Button>
          <Button variant="ghost" size="icon" className="h-24 w-24 hover:bg-white/10" onClick={handlePlayPauseToggle}>{isPlaying ? <Pause className="h-16 w-16" /> : <Play className="h-16 w-16" />}</Button>
          <Button variant="ghost" size="icon" className="h-16 w-16 hover:bg-white/10" onClick={handleForward}><RotateCw className="h-8 w-8" /></Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 px-2">
                <span className="text-xs font-mono select-none">{formatTime(currentTime)}</span>
                <Slider min={0} max={duration} step={1} value={[currentTime]} onValueChange={handleSeek} />
                <span className="text-xs font-mono select-none">{formatTime(duration)}</span>
            </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={handleMuteToggle} className="hover:bg-white/10">{isMuted ? <VolumeX /> : <Volume2 />}</Button></div>
            <div className="flex items-center gap-2">
                 <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-white/10"><Settings /></Button></PopoverTrigger>
                    <PopoverContent className="w-40 bg-black/80 border-gray-700 text-white p-0 mb-2">
                       <div className="flex flex-col">
                           {[0.5, 1, 1.5, 2].map(rate => (
                                <Button key={rate} variant="ghost" onClick={() => handlePlaybackRateChange(rate)} className={cn("justify-start rounded-none hover:bg-white/10", playbackRate === rate && "bg-red-600/50")}>
                                    {rate === 1 ? "Normal" : `${rate}x`}
                                </Button>
                           ))}
                       </div>
                    </PopoverContent>
                </Popover>
              <Button variant="ghost" size="icon" onClick={handleFullScreen} className="hover:bg-white/10"><Fullscreen /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
