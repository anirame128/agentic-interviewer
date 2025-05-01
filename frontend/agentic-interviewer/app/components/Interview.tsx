'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

interface LogEntry {
  who: 'bot' | 'you';
  txt: string;
}

// SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechSynthesisUtterance extends EventTarget {
  text: string;
  lang: string;
  pitch: number;
  rate: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
  onstart: ((this: SpeechSynthesisUtterance, ev: Event) => void) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: Event) => void) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: Event) => void) | null;
}

interface SpeechSynthesisVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

interface SpeechSynthesis extends EventTarget {
  speaking: boolean;
  pending: boolean;
  paused: boolean;
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
    SpeechSynthesisUtterance: {
      new (text?: string): SpeechSynthesisUtterance;
    };
    speechSynthesis: SpeechSynthesis;
  }
}

// Create socket instance outside component
const socket = io('http://localhost:4000', {
  autoConnect: false
});

export default function Interview() {
  console.log('[Frontend] Interview component rendering');
  
  const [log, setLog] = useState<LogEntry[]>([]);
  const [listening, setListening] = useState(false);
  const [botSpeaking, setBotSpeakingState] = useState(false);
  const botSpeakingRef = useRef(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const socketInitialized = useRef(false);

  // Mirror state to ref
  const setBotSpeaking = (val: boolean) => {
    botSpeakingRef.current = val;
    setBotSpeakingState(val);
  };

  // derive a little human-friendly "turn" status
  const turnStatus = botSpeaking
    ? '🤖 Interviewer speaking… please wait'
    : listening
      ? '🎤 Your turn—please speak now'
      : '⏳ Ready…';

  // Initialize socket only once
  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;
    socket.connect();

    socket.on('botText', txt => {
      setLog(prev => [...prev, { who: 'bot', txt }]);
    });

    socket.on('botAudio', (b64: string) => {
      playAudio(b64);
    });

    socket.on('userText', txt => setLog(prev => [...prev, { who: 'you', txt }]));
    socket.on('error', msg => {
      alert(msg);
      stopListening();
    });
  }, []);

  // Setup SpeechRecognition
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const recog = new SpeechRec();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onerror = e => {
      if (e.error !== 'aborted') stopListening();
    };
    recog.onresult = evt => {
      if (botSpeakingRef.current) return; // ignore during bot speech
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        if (evt.results[i].isFinal) {
          const text = evt.results[i][0].transcript.trim();
          socket.emit('userText', text);
        }
      }
    };

    recogRef.current = recog;
  }, []);

  const startListening = () => {
    if (listening || botSpeakingRef.current || window.speechSynthesis.speaking) return;
    try { recogRef.current?.start(); } catch {};
  };

  const stopListening = () => {
    if (!listening) return;
    try { recogRef.current?.stop(); } catch {};
  };

  const startInterview = () => {
    socket.emit('startInterview');
    startListening();
  };

  function playAudio(base64: string) {
    stopListening();
    const audio = new Audio('data:audio/mp3;base64,' + base64);
    audio.onplay = () => setBotSpeaking(true);
    audio.onended = () => {
      setBotSpeaking(false);
      startListening();
    };
    audio.play().catch(console.error);
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">AI Mock Interview</h1>
      
      {/* 🟡 Turn-taking banner */}
      <div
        className={`
          mb-4 p-3 rounded-md text-white font-medium
          ${botSpeaking 
            ? 'bg-gray-600' 
            : listening 
              ? 'bg-green-600' 
              : 'bg-yellow-600'}
        `}
      >
        {turnStatus}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={startInterview}
          disabled={botSpeaking || listening}
          className={`
            px-4 py-2 rounded-md text-white font-medium
            ${botSpeaking || listening
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }
          `}
        >
          {listening || botSpeaking 
            ? 'Interview in Progress…' 
            : 'Start Interview'}
        </button>
        {listening && (
          <button 
            type="button"
            onClick={stopListening}
            className="px-4 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700"
          >
            Stop & End
          </button>
        )}
      </div>

      <div className="mt-5 h-[400px] overflow-y-auto border border-gray-300 rounded-md p-4 bg-black text-white">
        {log.map((e,i) => (
          <div 
            key={i} 
            className={`
              mb-3 p-2 rounded-md
              ${e.who === 'bot' 
                ? 'bg-gray-800' 
                : 'bg-gray-900'
              }
            `}
          >
            <strong className={e.who === 'bot' ? 'text-green-500' : 'text-blue-400'}>
              {e.who === 'bot' ? '🤖 Bot' : '👤 You'}:
            </strong>{' '}
            {e.txt}
          </div>
        ))}
      </div>
    </div>
  );
} 