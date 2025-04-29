'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

interface LogEntry {
  who: 'bot' | 'you';
  txt: string;
}

// Create socket instance outside component
const socket = io('http://localhost:4000', {
  autoConnect: false
});

export default function Interview() {
  console.log('[Frontend] Interview component rendering');
  
  const [log, setLog] = useState<LogEntry[]>([]);
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioStream = useRef<MediaStream | null>(null);
  const socketInitialized = useRef(false);

  // Socket connection effect
  useEffect(() => {
    if (!socketInitialized.current) {
      console.log('[Frontend] Initializing socket connection');
      socketInitialized.current = true;

      socket.connect();

      socket.on('connect', () => {
        console.log('[Frontend] Socket connected');
      });

      socket.on('botText', (txt: string) => {
        console.log('[Frontend] ← Received bot text:', txt);
        setLog(prev => [...prev, { who:'bot', txt }]);
      });

      socket.on('userText', (txt: string) => {
        console.log('[Frontend] ← Received user text:', txt);
        setLog(prev => [...prev, { who:'you', txt }]);
      });

      socket.on('botAudio', (base64: string) => {
        console.log('[Frontend] ← Received audio data, length:', base64.length);
        playAudio(base64);
      });

      socket.on('error', (msg: string) => {
        console.error('[Frontend] Socket error:', msg);
        alert(msg);
        if (recording) onStopClick();
      });
    }

    return () => {
      console.log('[Frontend] Socket effect cleanup');
      if (audioStream.current) {
        audioStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startInterview = async () => {
    console.log('[Frontend] → startInterview() called');
    try {
      console.log('[Frontend] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      console.log('[Frontend] Microphone access granted with echo cancellation and noise suppression');
      audioStream.current = stream;
      
      mediaRecorder.current = new MediaRecorder(stream, { mimeType:'audio/webm' });
      console.log('[Frontend] MediaRecorder created');
      
      // Reset chunks array
      chunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          console.log('[Frontend] Adding chunk of size:', e.data.size);
          chunks.current.push(e.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        console.log('[Frontend] MediaRecorder stopped, sending complete audio');
        // Build one complete WebM file from all chunks
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = []; // Clear chunks array
        const base64 = await blobToBase64(blob);
        console.log('[Frontend] Sending complete audio blob, size:', blob.size);
        socket.emit('audioBlob', { audioBase64: base64 });
      };
      
      console.log('[Frontend] Starting MediaRecorder');
      mediaRecorder.current.start();
      
      console.log('[Frontend] Setting recording state to true');
      setRecording(true);
      
      console.log('[Frontend] → Emitting startInterview');
      socket.emit('startInterview');
    } catch (error) {
      console.error('[Frontend] Error in startInterview:', error);
    }
  };

  function playAudio(b64: string) {
    console.log('[Frontend] Creating audio element');
    const audio = new Audio('data:audio/mp3;base64,' + b64);
    
    audio.onerror = (e) => {
      console.error('[Frontend] Audio element error:', e);
    };

    audio.oncanplaythrough = () => {
      console.log('[Frontend] Audio can play through, attempting to play...');
      audio.play().catch(e => console.error('[Frontend] Audio.play() failed:', e));
    };

    audio.onplay = () => {
      console.log('[Frontend] Audio started playing');
    };

    audio.onended = () => {
      console.log('[Frontend] Audio finished playing');
    };
  }

  const onStopClick = () => {
    console.log('[Frontend] Stop button clicked');
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
  };

  const sendResponse = () => {
    console.log('[Frontend] Send Response button clicked');
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      // Restart recording immediately
      mediaRecorder.current.start();
    }
  };

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise(res => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result?.toString().split(',')[1] || '');
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">AI Mock Interview</h1>
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={startInterview}
          disabled={recording}
          className={`
            px-4 py-2 rounded-md text-white font-medium
            ${recording 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }
          `}
        >
          {recording ? 'Interview in Progress...' : 'Start Interview'}
        </button>
        {recording && (
          <>
            <button 
              type="button"
              onClick={sendResponse}
              className="px-4 py-2 rounded-md text-white font-medium bg-green-600 hover:bg-green-700"
            >
              Send Response
            </button>
            <button 
              type="button"
              onClick={onStopClick}
              className="px-4 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700"
            >
              Stop & End
            </button>
          </>
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