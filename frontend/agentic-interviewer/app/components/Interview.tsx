'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';

interface LogEntry {
  who: string;
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
  const [timeLeft, setTimeLeft] = useState(60 * 45);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const socketInitialized = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
        appendLog({ who:'bot', txt });
      });

      socket.on('userText', (txt: string) => {
        console.log('[Frontend] ← Received user text:', txt);
        appendLog({ who:'you', txt });
      });

      socket.on('botAudio', (base64: string) => {
        console.log('[Frontend] ← Received audio data, length:', base64.length);
        playAudio(base64);
      });

      socket.on('error', (err) => {
        console.error('[Frontend] Socket error:', err);
      });

      socket.on('timeUp', () => {
        console.log('[Frontend] Time is up!');
        if (recording) {
          onStopClick();
        }
        alert('Time is up! The interview has ended.');
      });
    }

    return () => {
      console.log('[Frontend] Socket effect cleanup');
    };
  }, [recording]);

  // Timer effect
  useEffect(() => {
    if (recording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            socket.emit('timeUp');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording, timeLeft]);

  const startInterview = async () => {
    console.log('[Frontend] → startInterview() called');
    try {
      console.log('[Frontend] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Frontend] Microphone access granted');
      
      mediaRecorder.current = new MediaRecorder(stream, { mimeType:'audio/webm' });
      console.log('[Frontend] MediaRecorder created');
      
      mediaRecorder.current.ondataavailable = async (e: BlobEvent) => {
        if (e.data.size > 0) {
          const base64 = await blobToBase64(e.data);
          console.log('[Frontend] Sending audio chunk to server');
          socket.emit('audioChunk', { audioBase64: base64 });
        }
      };
      
      mediaRecorder.current.onstop = () => {
        console.log('[Frontend] MediaRecorder stopped');
      };
      
      console.log('[Frontend] Starting MediaRecorder');
      mediaRecorder.current.start(1000);
      
      console.log('[Frontend] Setting recording state to true');
      setRecording(true);
      
      console.log('[Frontend] → Emitting startInterview with duration:', timeLeft/60);
      socket.emit('startInterview', { durationMinutes: timeLeft/60 });
    } catch (error) {
      console.error('[Frontend] Error in startInterview:', error);
    }
  };

  function appendLog(entry: LogEntry) {
    setLog(l => [...l, entry]);
  }

  function playAudio(b64: string) {
    console.log('[Frontend] Creating audio element');
    const audio = new Audio('data:audio/wav;base64,' + b64);
    
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

  function onStopClick() {
    console.log('[Frontend] Stop button clicked');
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    setRecording(false);
    socket.emit('stopInterview');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise(res => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result?.toString().split(',')[1] || '');
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div style={{ padding:20 }}>
      <h1>AI Mock Interview</h1>
      <div>
        <button 
          type="button"
          onClick={startInterview}
          disabled={recording}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: recording ? 'not-allowed' : 'pointer',
            backgroundColor: recording ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {recording ? 'Interview in Progress...' : 'Start Interview (45m)'}
        </button>
        {recording && (
          <button 
            type="button"
            onClick={onStopClick}
            style={{
              marginLeft: '10px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Stop Interview
          </button>
        )}
        <span style={{ marginLeft:20, fontFamily: 'monospace', fontSize: '1.2em' }}>
          Time Left: {Math.floor(timeLeft/60)}:
          {(timeLeft%60).toString().padStart(2,'0')}
        </span>
      </div>

      <div style={{ display:'flex', marginTop:20 }}>
        <div style={{ 
          flex:1, 
          marginRight:10, 
          height:400, 
          overflowY:'auto', 
          border:'1px solid #ccc', 
          padding:10,
          borderRadius: '4px',
          backgroundColor: '#000000',
          color: '#ffffff'
        }}>
          {log.map((e,i) => (
            <div key={i} style={{
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: e.who === 'bot' ? '#333333' : '#1a1a1a',
              borderRadius: '4px',
              color: '#ffffff'
            }}>
              <strong style={{ color: e.who === 'bot' ? '#4CAF50' : '#2196F3' }}>{e.who === 'bot' ? '🤖 Bot' : '👤 You'}:</strong> {e.txt}
            </div>
          ))}
        </div>
        <div style={{ flex:1, height:400 }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            defaultValue={`// Write your code here\n`}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              automaticLayout: true
            }}
          />
        </div>
      </div>
    </div>
  );
} 