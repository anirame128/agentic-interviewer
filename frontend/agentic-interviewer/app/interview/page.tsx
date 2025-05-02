'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SpeechRecognition } from '../types/speech';
import { useRouter, useSearchParams } from 'next/navigation';
import CodeEditor from '../components/CodeEditor';
import PermissionStatus from '../components/PermissionStatus';
import TurnStatus from '../components/TurnStatus';
import ControlButtons from '../components/ControlButtons';
import ConfirmationDialog from '../components/ConfirmationDialog';
import Timer from '../components/Timer';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import * as monaco from 'monaco-editor';

const PAUSE_THRESHOLD_MS = 5000;

export default function Interview() {
  const router = useRouter();
  const params = useSearchParams();
  const timerParam = params.get('timer');
  const interviewSeconds = timerParam ? Number(timerParam) : 30 * 60; // fallback 30 min
  const timerSecondsRef = useRef(interviewSeconds);
  const onTimerCompleteRef = useRef<(() => void) | null>(null);

  const [listening, setListening] = useState(false);
  const [botSpeaking, setBotSpeakingState] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [interviewActive, setInterviewActive] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const botSpeakingRef = useRef(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const expiryTimestampRef = useRef<number>(0);
  const speechBufferRef = useRef<string>("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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
      : '';

  // Flush helper (clears countdown too)
  const flushSpeechBuffer = () => {
    console.log("[SpeechBuffer] 🔥 flush:", speechBufferRef.current);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const txt = speechBufferRef.current.trim();
    if (txt) socketRef.current?.emit('userText', txt);
    speechBufferRef.current = "";
  };

  // Starts or restarts both the debounce timer AND the countdown logger
  const scheduleFlush = () => {
    // 1) clear any existing flush timer
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    // 2) set the new expiry timestamp
    expiryTimestampRef.current = Date.now() + PAUSE_THRESHOLD_MS;
    // 3) start (or restart) the countdown logger
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = window.setInterval(() => {
      const rem = expiryTimestampRef.current - Date.now();
      const s = Math.max(0, Math.round(rem / 1000));
      console.log(`[SpeechBuffer] ⏳ flush in ${s}s`);
      if (rem <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
      }
    }, 200);

    // 4) schedule the actual flush
    pauseTimeoutRef.current = window.setTimeout(
      flushSpeechBuffer,
      PAUSE_THRESHOLD_MS
    );
  };

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
          // 1) accumulate
          const part = evt.results[i][0].transcript.trim();
          speechBufferRef.current += (speechBufferRef.current ? " " : "") + part;
          // 2) restart debounce
          scheduleFlush();
        }
      }
    };

    recogRef.current = recog;
  }, []);

  // Hook up editor keystrokes to also reset the debounce
  useEffect(() => {
    if (!editorRef.current) return;
    const disposable = editorRef.current.onDidChangeModelContent(() => {
      scheduleFlush();
    });
    return () => disposable.dispose();
  }, [editorRef.current]);

  // Request permissions when component mounts
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionGranted(true);
      } catch (err) {
        console.error('Permission denied:', err);
        setPermissionGranted(false);
      } finally {
        setIsLoading(false);
      }
    };
    requestPermissions();
  }, []);

  const startListening = () => {
    if (listening || botSpeakingRef.current || window.speechSynthesis.speaking) return;
    try { recogRef.current?.start(); } catch {};
  };

  const stopListening = () => {
    if (!listening) return;
    try { recogRef.current?.stop(); } catch {};
  };

  const startInterview = async () => {
    if (!permissionGranted) {
      alert('Please grant microphone permissions to start the interview');
      return;
    }

    setIsLoading(true);

    try {
      // 1) Clean up any previous socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // 2) Create a fresh connection
      socketRef.current = io('http://localhost:4000', { autoConnect: true });

      // 3) Re-bind your handlers
      socketRef.current.on('botText', txt => {
        console.log('Bot text:', txt);
      });
      socketRef.current.on('botAudio', b64 => playAudio(b64));
      socketRef.current.on('userText', txt => console.log('User text:', txt));
      socketRef.current.on('error', msg => {
        alert(msg);
        stopListening();
      });

      // 4) Kick off the interview
      setInterviewActive(true);
      socketRef.current.emit('startInterview');
      
      // Don't start listening immediately - wait for bot's first message
      // The playAudio function will start listening after the bot finishes speaking
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = () => {
    setShowConfirmation(true);
  };

  const confirmEndInterview = () => {
    setIsLoading(true);

    // Stop the currently playing interview audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop speech synthesis if it's speaking
    window.speechSynthesis.cancel();

    // Stop listening
    stopListening();

    // remove all listeners & disconnect
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Reset states
    setInterviewActive(false);
    setShowConfirmation(false);
    setBotSpeakingState(false);
    botSpeakingRef.current = false;

    // Navigate to feedback page
    router.push('/feedback');
  };

  const cancelEndInterview = () => {
    setShowConfirmation(false);
    // Restore the timer state
    timerSecondsRef.current = interviewSeconds;
  };

  function playAudio(base64: string) {
    stopListening();
    // stop any old audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // create and store new audio
    const audio = new Audio('data:audio/mp3;base64,' + base64);
    audioRef.current = audio;
    audio.onplay = () => setBotSpeaking(true);
    audio.onended = () => {
      setBotSpeaking(false);
      startListening();
      audioRef.current = null;
    };
    audio.play().catch(console.error);
  }

  const handleAutoEnd = () => {
    if (interviewActive) {
      handleEndInterview();
    }
  };

  // Update the ref when handleAutoEnd changes
  useEffect(() => {
    onTimerCompleteRef.current = handleAutoEnd;
  }, [handleAutoEnd]);

  if (isLoading) {
    return (
      <PageLayout title="AI Mock Interview">
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="AI Mock Interview"
      subtitle="Practice your technical interview skills with AI"
      maxWidth="4xl"
    >
      <div className="space-y-8 animate-fade-in">
        {interviewActive && (
          <div className="flex justify-end mb-4">
            <Timer
              initialSeconds={timerSecondsRef.current}
              onComplete={() => onTimerCompleteRef.current?.()}
              variant="large"
            />
          </div>
        )}
        
        <PermissionStatus permissionGranted={permissionGranted} />
        
        <div className="space-y-4">
          <TurnStatus
            isActive={interviewActive}
            botSpeaking={botSpeaking}
            turnStatus={turnStatus}
          />
          
          <ControlButtons
            interviewActive={interviewActive}
            permissionGranted={permissionGranted}
            onStartInterview={startInterview}
            onEndInterview={handleEndInterview}
          />
        </div>

        <div className="mt-8">
          <CodeEditor
            isVisible={interviewActive}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        <ConfirmationDialog
          isOpen={showConfirmation}
          onConfirm={confirmEndInterview}
          onCancel={cancelEndInterview}
        />
      </div>
    </PageLayout>
  );
} 