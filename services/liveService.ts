
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

export interface LiveSessionHandlers {
  onAudioChunk: (data: string) => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (error: any) => void;
  onInterrupted: () => void;
  onTurnComplete: () => void;
}

// Fix: Manual implementation of the encode function to convert bytes to base64, as required by the SDK guidelines.
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const startLiveVibeSession = async (handlers: LiveSessionHandlers) => {
  // Fix: Initializing GoogleGenAI with exactly process.env.API_KEY as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => {
        console.log('Live Vibe Session Connected');
      },
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
          handlers.onTranscription(message.serverContent.outputTranscription.text, false);
        } else if (message.serverContent?.inputTranscription) {
          handlers.onTranscription(message.serverContent.inputTranscription.text, true);
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
          handlers.onAudioChunk(base64Audio);
        }

        if (message.serverContent?.interrupted) {
          handlers.onInterrupted();
        }

        if (message.serverContent?.turnComplete) {
          handlers.onTurnComplete();
        }
      },
      onerror: (e: any) => handlers.onError(e),
      onclose: () => console.log('Live Vibe Session Closed'),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: 'You are "VibeMaster", an AI companion designed to boost the user\'s mood. Your voice should be expressive, empathetic, and full of life. You can tell jokes, offer exercises, or just listen. You are fluent in all languages.',
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });

  return sessionPromise;
};

// Fix: Updated createPcmBlob to use the manual encode function.
export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
