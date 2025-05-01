export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognition extends EventTarget {
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

export interface SpeechSynthesisUtterance extends EventTarget {
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

export interface SpeechSynthesisVoice {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
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
  }
} 