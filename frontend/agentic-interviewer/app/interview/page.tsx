"use client";

import type { OnMount } from "@monaco-editor/react";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { io, Socket } from "socket.io-client";
import { Copy, RefreshCw, Mic, MicOff } from "lucide-react";

import { SpeechRecognition } from "@/types/speech";
import Timer from "@/components/timer";
import CodeEditor from "@/components/CodeEditor";


const PAUSE_THRESHOLD_MS = 5000;

export default function Interview() {
  const router = useRouter();
  const params = useSearchParams();
  const timerParam = params.get("timer");
  const interviewSeconds = timerParam ? Number(timerParam) : 30 * 60; // fallback 30 min
  const [timerKey, setTimerKey] = useState(0);
  const timerSecondsRef = useRef(interviewSeconds);
  const onTimerCompleteRef = useRef<(() => void) | null>(null);

  const [listening, setListening] = useState(false);
  const [botSpeaking, setBotSpeakingState] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [interviewActive, setInterviewActive] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const botSpeakingRef = useRef(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const editorRef = useRef<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [code, setCode] = useState("// Start coding here...\n");
  const [chat, setChat] = useState<{ sender: "bot" | "user"; text: string }[]>([]);

  // split speech vs code
  const speechBufferRef = useRef<string>("");
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Mirror state to ref
  const setBotSpeaking = (val: boolean) => {
    botSpeakingRef.current = val;
    setBotSpeakingState(val);
  };

  const setMicEnabled = (on: boolean) => {
    mediaStreamRef.current
      ?.getAudioTracks()
      .forEach(track => (track.enabled = on));
  };

  // Effect to handle mic muting during bot speech
  useEffect(() => {
    setMicEnabled(!botSpeaking);
    if (botSpeaking) {
      flushSpeechBuffer(); // end any pending user turn
    }
  }, [botSpeaking]);

  // derive a little human-friendly "turn" status
  const turnStatus = botSpeaking
    ? "🤖 Interviewer speaking… please wait"
    : listening
      ? "🎤 Your turn—please speak now"
      : "";

  // --- Speech Buffer Logic ---
  const flushSpeechBuffer = () => {
    if (!speechBufferRef.current.trim()) return;
    console.log('[SpeechBuffer] flushing=', speechBufferRef.current);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    const txt = speechBufferRef.current.trim();
    if (txt) socketRef.current?.emit("userText", txt);
    speechBufferRef.current = "";
  };

  const scheduleSpeechFlush = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(flushSpeechBuffer, PAUSE_THRESHOLD_MS);
  };

  // --- SpeechRecognition Setup ---
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const recog = new SpeechRec();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-US";
    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onerror = (e) => {
      if (e.error !== "aborted") stopListening();
    };
    recog.onresult = (evt) => {
      if (botSpeakingRef.current) return;
      let transcript = "";
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        if (evt.results[i].isFinal) {
          transcript += evt.results[i][0].transcript.trim() + " ";
        }
      }
      if (transcript) {
        speechBufferRef.current += transcript;
        scheduleSpeechFlush();
      }
    };
    recogRef.current = recog;
  }, []);

  // --- Microphone Control ---
  useEffect(() => {
    if (botSpeaking) {
      // Always stop mic immediately when bot is speaking
      if (listening) stopListening();
    } else if (!botSpeaking && interviewActive && permissionGranted) {
      // Only start mic when bot is not speaking, interview is active, and permission is granted
      if (!listening) startListening();
    }
  }, [botSpeaking, interviewActive, permissionGranted, listening]);

  // Request permissions when component mounts
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        mediaStreamRef.current = stream;
        setPermissionGranted(true);
        setPermissionError(null);
      } catch (err) {
        console.error("Permission denied:", err);
        setPermissionGranted(false);
        setPermissionError(err instanceof Error ? err.message : "Failed to access microphone");
      } finally {
        setIsLoading(false);
      }
    };
    requestPermissions();
  }, []);

  const requestMicrophonePermission = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      mediaStreamRef.current = stream;
      setPermissionGranted(true);
      setPermissionError(null);
    } catch (err) {
      console.error("Permission denied:", err);
      setPermissionGranted(false);
      setPermissionError(err instanceof Error ? err.message : "Failed to access microphone");
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (listening || botSpeakingRef.current || window.speechSynthesis.speaking)
      return;
    try {
      recogRef.current?.start();
      setListening(true);
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setListening(false);
    }
  };

  const stopListening = () => {
    if (!listening) return;
    try {
      recogRef.current?.stop();
      setListening(false);
    } catch (err) {
      console.error("Error stopping speech recognition:", err);
    }
  };

  const startInterview = () => {
    if (!permissionGranted || interviewActive || connecting) return;
    setConnecting(true);
    const socket = socketRef.current!;

    console.log('[Socket] Starting interview with new connection');
    socket.connect();
    socket.once("connect", () => {
      setConnecting(false);
      setInterviewActive(true);
      socket.emit("startInterview");
    });
  };

  const handleEndInterview = () => {
    setShowConfirmation(true);
  };

  const confirmEndInterview = () => {
    console.log('confirmEndInterview called');
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
    router.push("/feedback");
  };

  const cancelEndInterview = () => {
    setShowConfirmation(false);
    // Clear any pending speech flush
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    // Restore the timer state and force a reset
    timerSecondsRef.current = interviewSeconds;
    setTimerKey(k => k + 1);
  };

  function playAudio(base64: string) {
    const audio = new Audio("data:audio/mp3;base64," + base64);
    audioRef.current = audio;
    audio.onplay = () => setBotSpeaking(true);
    audio.onended = () => {
      setBotSpeaking(false);
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

  // --- Code Editor: emit code changes immediately, don't touch speech buffer ---
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeModelContent(() => {
      socketRef.current?.emit("userCode", editor.getValue());
    });
  };

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      autoConnect: false,              // don't try to connect until we explicitly call .connect()
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected successfully');
      setIsLoading(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsLoading(true);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      setIsLoading(false);
      if (interviewActive) {
        console.log('[Socket] Restarting interview after reconnect');
        socket.emit('startInterview');
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnection error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setIsLoading(true);
    });

    socket.on("botText", (txt) => {
      if (txt === '[THINKING]') {
        setChat(c => [...c, { sender: "bot", text: "..." }]);
        setBotSpeaking(false);
      } else if (txt === '[ENCOURAGE]') {
        setChat(c => [...c, { sender: "bot", text: "Go on." }]);
        setBotSpeaking(false);
      } else {
        setChat(c => [...c, { sender: "bot", text: txt }]);
        setBotSpeaking(true);
      }
    });

    socket.on("botAudio", playAudio);
    socket.on("error", msg => {
      console.error('[Socket] Error:', msg);
      alert(msg);
    });

    socketRef.current = socket;
    return () => {
      console.log('[Socket] Cleaning up socket connection');
      socket.disconnect();
    };
  }, []); // Empty dependency array - socket is created once on mount

  // --- UI helpers ---
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };
  const handleResetCode = () => {
    setCode("// Start coding here...\n");
  };

  // --- Chat rendering ---
  const renderChat = () => (
    <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto px-1 py-2">
      {chat.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`rounded-xl px-4 py-2 max-w-[80%] text-sm shadow-md ${
              msg.sender === "user"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                : "bg-white/10 text-white"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );

  // --- Clean up everything on unmount (or navigate away) ---
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      recogRef.current?.stop();
      window.speechSynthesis.cancel();
      audioRef.current?.pause();
      socketRef.current?.disconnect();
      mediaStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    };
  }, []);

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navbar */}
      <nav className="bg-black/80 backdrop-blur-md border-b border-white/10 px-4 fixed w-full z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Candid
          </div>
          <div className="flex items-center space-x-4">
            <Timer
              key={timerKey}
              initialSeconds={timerSecondsRef.current}
              onComplete={() => onTimerCompleteRef.current?.()}
              variant="small"
            />
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 flex-1 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Code Editor Card */}
          <Card className="bg-black/80 border border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="font-semibold text-lg text-white">Code Editor</span>
              <div className="flex gap-2">
                <Button
                  isIconOnly
                  variant="light"
                  aria-label="Copy code"
                  onClick={handleCopyCode}
                  className="hover:bg-white/10"
                >
                  <Copy size={18} />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  aria-label="Reset code"
                  onClick={handleResetCode}
                  className="hover:bg-white/10"
                >
                  <RefreshCw size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0 h-[500px]">
              <div className="h-full">
                <CodeEditor
                  value={code}
                  onChange={v => setCode(v ?? "")}
                  onMount={handleEditorMount}
                  language="typescript"
                />
              </div>
            </CardBody>
          </Card>

          {/* Chat/Interview Card */}
          <Card className="bg-black/80 border border-white/10 shadow-xl rounded-2xl flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="font-semibold text-lg text-white">Interview</span>
              <div className="flex items-center gap-2">
                {permissionError ? (
                  <Button
                    onClick={requestMicrophonePermission}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Grant Microphone Access
                  </Button>
                ) : (
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      listening
                        ? "bg-green-500/20 text-green-400"
                        : permissionGranted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {listening ? <Mic size={16} /> : <MicOff size={16} />}
                    {permissionGranted
                      ? listening
                        ? "Listening"
                        : "Mic Ready"
                      : "Mic Denied"}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardBody className="flex flex-col flex-1 p-0">
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
                {renderChat()}
              </div>
              <div className="border-t border-white/10 px-4 py-3 bg-black/70 flex flex-col gap-2">
                {interviewActive && (
                  <div className="mb-2 text-white/80 text-sm text-center">
                    {turnStatus}
                  </div>
                )}
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={startInterview}
                    disabled={interviewActive || !permissionGranted || connecting}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                  >
                    Start Interview
                  </Button>
                  <Button
                    onClick={handleEndInterview}
                    disabled={!interviewActive}
                    className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 shadow-lg"
                  >
                    End Interview
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">End Interview?</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to end the interview? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="ghost"
                onClick={cancelEndInterview}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={confirmEndInterview}
                className="bg-red-500 hover:bg-red-600"
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}