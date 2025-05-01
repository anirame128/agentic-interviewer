'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SpeechRecognition } from '../types/speech';
import { useRouter } from 'next/navigation';

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
        
        {/* Permission status */}
        {!permissionGranted && (
          <div className="mb-8 p-4 bg-yellow-900/30 rounded-xl text-yellow-200 border border-yellow-800/50 backdrop-blur-sm animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Please grant microphone permissions to start the interview
            </div>
          </div>
        )}
        
        {/* Turn-taking banner - only show during active interview */}
        {interviewActive && turnStatus && (
          <div
            className={`
              mb-8 p-6 rounded-xl text-white font-medium shadow-lg
              transition-all duration-300 transform
              ${botSpeaking 
                ? 'bg-gray-700/50 backdrop-blur-sm' 
                : 'bg-green-600/80 backdrop-blur-sm'}
            `}
          >
            <div className="flex items-center justify-center gap-3 text-lg">
              {botSpeaking ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              ) : null}
              {turnStatus}
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {!interviewActive ? (
            <button
              type="button"
              onClick={startInterview}
              disabled={!permissionGranted}
              className={`
                px-8 py-4 rounded-xl text-white font-medium shadow-lg
                transition-all duration-300 transform hover:scale-105
                ${!permissionGranted
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 cursor-pointer'}
              `}
            >
              Start Interview
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleEndInterview}
              className="px-8 py-4 rounded-xl text-white font-medium bg-red-600 hover:bg-red-500 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              End Interview
            </button>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">End Interview?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to end the interview? You&apos;ll be taken to the feedback page.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={cancelEndInterview}
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndInterview}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                >
                  End Interview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview status */}
        {interviewActive && (
          <div className="text-center text-gray-300 mb-8">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Interview in progress... Speak clearly and naturally.
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 