import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { CallState } from '@/hooks/use-webrtc';

export function VoiceCallDialog({
  open,
  onOpenChange,
  user,
  localStream,
  callState,
  endCall,
  isMuted,
  onToggleMute,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  localStream: MediaStream | null;
  callState: CallState;
  endCall: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open && callState === 'connected') {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [open, callState]);

  useEffect(() => {
    // Set speaker output
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        // Audio output routing is handled by the browser
      });
    }
  }, [localStream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleEndCall = () => {
    endCall();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { endCall(); } onOpenChange(v); }}>
      <DialogContent
        className="max-w-[480px] h-[95vh] w-screen p-0 border-0 bg-gray-900 flex flex-col items-center justify-center transition-all duration-500 rounded-3xl mx-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Voice call with {user?.name}</DialogTitle>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full h-full rounded-3xl overflow-hidden bg-gray-900 flex flex-col items-center justify-center text-white"
        >
          {/* Background blurred image */}
          <div className="absolute inset-0">
            <img
              src={user.img}
              alt={user.name}
              className="w-full h-full object-cover opacity-30 blur-xl"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          {/* User Info */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="w-48 h-48 rounded-full overflow-hidden border-8 border-white/10 mb-8 shadow-2xl ring-4 ring-white/10">
              <img src={user.img} alt={user.name} width={192} height={192} className="object-cover w-full h-full" />
            </div>
            <h3 className="text-4xl font-bold">{user.name}</h3>
            <p className="text-xl font-mono tracking-widest mt-2">{formatDuration(callDuration)}</p>
          </div>

          {/* Calling state */}
          {(callState === 'calling' || callState === 'ringing') && (
            <div className="relative z-10 mt-8">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-t-transparent border-white animate-spin" />
              <p className="mt-4 text-lg text-white/70">
                {callState === 'calling' ? 'Calling...' : 'Incoming...'}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center justify-center w-full px-8">
            <div className="flex items-center justify-around gap-4 bg-black/40 backdrop-blur-md p-3 rounded-full shadow-lg w-full max-w-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className={cn(
                  "w-16 h-16 rounded-full text-white hover:bg-white/20",
                  isMuted && "bg-white/20"
                )}
              >
                {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={cn(
                  "w-16 h-16 rounded-full text-white hover:bg-white/20",
                  isSpeaker && "bg-white/20"
                )}
              >
                {isSpeaker ? <Volume2 size={28} /> : <VolumeX size={28} />}
              </Button>
              <Button
                size="icon"
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <PhoneOff size={32} />
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
