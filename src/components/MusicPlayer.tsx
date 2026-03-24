import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, Music, X } from 'lucide-react';
import YouTube from 'react-youtube';

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  const videoId = "jfKfPfyJRdk"; // Lofi hip hop radio

  const onReady = (event: any) => {
    setPlayer(event.target);
  };

  const togglePlay = () => {
    if (isPlaying) {
      player?.pauseVideo();
    } else {
      player?.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="hidden">
        <YouTube 
          videoId={videoId} 
          opts={{ playerVars: { autoplay: 0, controls: 0 } }} 
          onReady={onReady} 
          onStateChange={(e) => setIsPlaying(e.data === 1)}
        />
      </div>

      {/* Floating Widget */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="glass-card p-4 w-64 rounded-2xl shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-white/80">Now Playing</span>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center animate-pulse">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">Lofi Hip Hop Radio</p>
                  <p className="text-xs text-white/50 truncate">Beats to relax/study to</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6">
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5 rotate-180" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <div className="flex gap-1 items-end h-5">
                <motion.div animate={{ height: ["20%", "100%", "20%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                <motion.div animate={{ height: ["40%", "80%", "40%"] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-full" />
                <motion.div animate={{ height: ["60%", "100%", "60%"] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-white rounded-full" />
              </div>
            ) : (
              <Music className="w-6 h-6" />
            )}
          </motion.button>
        )}
      </motion.div>
    </>
  );
}
