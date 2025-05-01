'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SpeechRecognition } from '../types/speech';
import { useRouter } from 'next/navigation';
import CodeEditor from '../components/CodeEditor';
import PermissionStatus from '../components/PermissionStatus';
import TurnStatus from '../components/TurnStatus';
import ControlButtons from '../components/ControlButtons';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Interview() {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [botSpeaking, setBotSpeakingState] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [interviewActive, setInterviewActive] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const botSpeakingRef = useRef(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          socketRef.current?.emit('userText', text);
        }
      }
    };

    recogRef.current = recog;
  }, []);

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
    startListening();
  };

  const handleEndInterview = () => {
    setShowConfirmation(true);
  };

  const confirmEndInterview = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">AI Mock Interview</h1>
          <p className="text-gray-400">Practice your technical interview skills with AI</p>
        </div>
        
        <PermissionStatus permissionGranted={permissionGranted} />
        <TurnStatus isActive={interviewActive} botSpeaking={botSpeaking} turnStatus={turnStatus} />
        <ControlButtons
          interviewActive={interviewActive}
          permissionGranted={permissionGranted}
          onStartInterview={startInterview}
          onEndInterview={handleEndInterview}
        />
        <CodeEditor isVisible={interviewActive} />
        <ConfirmationDialog
          isOpen={showConfirmation}
          onConfirm={confirmEndInterview}
          onCancel={cancelEndInterview}
        />
      </div>
    </div>
  );
} 