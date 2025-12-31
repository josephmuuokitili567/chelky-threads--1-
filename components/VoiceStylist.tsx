import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, Volume2, Loader2, Sparkles } from 'lucide-react';

const VoiceStylist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // Constants
  const INPUT_SAMPLE_RATE = 16000;
  const OUTPUT_SAMPLE_RATE = 24000;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen && isActive) {
      disconnect();
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      // Get Microphone Stream
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a helpful, trendy fashion stylist assistant for Chelky Threads, a Kenyan fashion brand. You help users pick outfits, give style advice, and answer questions about fashion trends in Nairobi. Keep responses concise and conversational.",
        }
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: async () => {
            console.log("Session opened");
            setIsActive(true);
            setIsConnecting(false);
            
            // Setup Input Processing
            if (!inputContextRef.current || !streamRef.current) return;
            
            inputSourceRef.current = inputContextRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = float32ToInt16(inputData);
              const base64Data = arrayBufferToBase64(pcmData.buffer);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              await playAudio(audioData, outputContextRef.current);
            }
            
            if (msg.serverContent?.interrupted) {
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Session error:", err);
            setError("Connection error. Please try again.");
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect:", err);
      setError("Could not access microphone or connect.");
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
        sessionRef.current.then((session: any) => session.close());
    }
    
    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close contexts
    if (inputContextRef.current) inputContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();

    // Reset Refs
    inputContextRef.current = null;
    outputContextRef.current = null;
    inputSourceRef.current = null;
    processorRef.current = null;
    streamRef.current = null;
    sessionRef.current = null;
    nextStartTimeRef.current = 0;

    setIsActive(false);
    setIsConnecting(false);
  };

  // Audio Utils
  const float32ToInt16 = (float32: Float32Array) => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playAudio = async (base64String: string, context: AudioContext) => {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = context.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32Data, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const currentTime = context.currentTime;
    // Ensure we schedule slightly in the future if context time is ahead
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
          ? 'bg-slate-900 rotate-45' 
          : isActive 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-brand-gold hover:bg-yellow-600'
        }`}
        aria-label="Voice Stylist"
      >
        {isOpen ? <X className="text-white h-6 w-6" /> : <Mic className="text-white h-6 w-6" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="bg-slate-900 p-4 flex justify-between items-center">
            <h3 className="text-white font-serif font-bold flex items-center">
              <Sparkles className="h-4 w-4 text-brand-gold mr-2" />
              Chelky Stylist
            </h3>
            {isActive && <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>}
          </div>
          
          <div className="p-6 flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                isActive ? 'bg-brand-gold/10' : 'bg-slate-50'
              }`}>
                {isConnecting ? (
                  <Loader2 className="h-8 w-8 text-brand-gold animate-spin" />
                ) : isActive ? (
                  <div className="flex space-x-1 items-end h-8">
                     <div className="w-1 bg-brand-gold h-4 animate-bounce-slight" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-1 bg-brand-gold h-8 animate-bounce-slight" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-1 bg-brand-gold h-6 animate-bounce-slight" style={{ animationDelay: '300ms' }}></div>
                     <div className="w-1 bg-brand-gold h-3 animate-bounce-slight" style={{ animationDelay: '75ms' }}></div>
                  </div>
                ) : (
                  <Mic className="h-8 w-8 text-slate-400" />
                )}
              </div>
            </div>

            <h4 className="text-lg font-semibold text-slate-900 mb-2">
              {isActive ? "Listening..." : "Need Style Advice?"}
            </h4>
            <p className="text-sm text-slate-500 mb-6">
              {isActive 
                ? "Go ahead, I'm listening! Ask me about outfit ideas." 
                : "Talk to our AI stylist for real-time fashion tips and trends."}
            </p>

            {error && (
               <p className="text-xs text-red-500 mb-4 bg-red-50 p-2 rounded w-full">{error}</p>
            )}

            {!isActive ? (
              <button 
                onClick={connect}
                disabled={isConnecting}
                className="w-full py-3 bg-brand-gold text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
              >
                <Volume2 className="h-4 w-4 mr-2" /> Start Conversation
              </button>
            ) : (
              <button 
                onClick={disconnect}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
              >
                <MicOff className="h-4 w-4 mr-2" /> End Session
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceStylist;
