
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { startLiveVibeSession, createPcmBlob } from '../services/liveService';

// Fix: Manual decode implementation (base64 to Uint8Array) as per SDK guidelines.
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix: Manual implementation of audio buffer creation from raw PCM bytes as per SDK guidelines.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAgent: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopActiveSources = useCallback(() => {
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const handlers = {
        onAudioChunk: async (base64: string) => {
          if (!outputContextRef.current) return;
          setIsModelSpeaking(true);
          // Fix: Use the guidelines-compliant decode and decodeAudioData functions to process raw PCM streams.
          const buffer = await decodeAudioData(decode(base64), outputContextRef.current, 24000, 1);
          const source = outputContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(outputContextRef.current.destination);
          
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          
          sourcesRef.current.add(source);
          source.onended = () => {
            sourcesRef.current.delete(source);
            if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
          };
        },
        onTranscription: (text: string, isUser: boolean) => {
          setTranscription(text);
          if (isUser) setIsUserSpeaking(true);
        },
        onError: (err: any) => console.error("Live Error:", err),
        onInterrupted: () => {
          stopActiveSources();
          setIsModelSpeaking(false);
        },
        onTurnComplete: () => {
          setIsUserSpeaking(false);
        }
      };

      const sessionPromise = startLiveVibeSession(handlers);
      sessionRef.current = await sessionPromise;

      // Microphone Stream
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const pcm = createPcmBlob(input);
        // Fix: Use sessionPromise.then to ensure the session is active before sending input, as per SDK guidelines.
        sessionPromise.then(session => {
           session.sendRealtimeInput({ media: pcm });
        });
      };
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      setIsActive(true);
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to start session:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    stopActiveSources();
    setIsActive(false);
  };

  return (
    <div className="vibe-glass rounded-3xl p-8 flex flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        {/* Animated Rings */}
        {(isActive || isConnecting) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`absolute w-32 h-32 rounded-full border-4 border-indigo-500/30 animate-ping ${isUserSpeaking ? 'duration-700' : 'duration-1000'}`}></div>
            <div className={`absolute w-40 h-40 rounded-full border-2 border-purple-500/20 animate-pulse`}></div>
          </div>
        )}
        
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isActive ? 'bg-red-500 shadow-lg shadow-red-500/50 hover:scale-105' : 
            'bg-indigo-600 shadow-lg shadow-indigo-500/50 hover:scale-110'
          }`}
        >
          {isConnecting ? <Loader2 className="w-10 h-10 animate-spin" /> : 
           isActive ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
          {isActive ? 'VibeMaster is Listening' : 'Talk to VibeMaster'}
          {isActive && <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />}
        </h3>
        <p className="text-gray-400 max-w-xs mx-auto">
          {isActive ? 'Go ahead, speak your mind. I\'m all ears!' : 'Experience high-fidelity mood support through real-time voice conversation.'}
        </p>
      </div>

      {isActive && transcription && (
        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
          <p className="text-indigo-200 italic">"{transcription}"</p>
        </div>
      )}

      {isActive && (
        <div className="mt-6 flex gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isUserSpeaking ? 'bg-indigo-500/40 text-indigo-100' : 'bg-white/5 text-gray-500'}`}>
            <Mic className="w-3 h-3" /> USER
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isModelSpeaking ? 'bg-purple-500/40 text-purple-100' : 'bg-white/5 text-gray-500'}`}>
            <Volume2 className="w-3 h-3" /> VIBEMASTER
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
