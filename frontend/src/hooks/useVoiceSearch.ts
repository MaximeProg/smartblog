'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseVoiceSearchOptions {
  lang?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
}

// Minimal interface matching the Web Speech API — avoids reliance on optional DOM lib types
interface SpeechRecog extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart:  ((e: Event) => void) | null;
  onend:    ((e: Event) => void) | null;
  onerror:  ((e: Event) => void) | null;
  onresult: ((e: SpeechRecogEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecogEvent extends Event {
  resultIndex: number;
  results: { isFinal: boolean; 0: { transcript: string } }[];
}

type SpeechRecogCtor = new () => SpeechRecog;

function getSR(): SpeechRecogCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w['SpeechRecognition'] ?? w['webkitSpeechRecognition']) as SpeechRecogCtor | undefined;
}

export function useVoiceSearch({ lang = 'fr-FR', onResult }: UseVoiceSearchOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef    = useRef<SpeechRecog | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => { setSupported(!!getSR()); }, []);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) return;

    recogRef.current?.abort();

    const recog = new SR();
    recog.lang             = lang;
    recog.interimResults   = true;
    recog.continuous       = false;
    recog.maxAlternatives  = 1;

    recog.onstart  = () => setListening(true);
    recog.onerror  = () => setListening(false);
    recog.onend    = () => setListening(false);

    recog.onresult = (e: SpeechRecogEvent) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final   += text;
        else                      interim += text;
      }
      onResultRef.current(final || interim, !!final);
    };

    recogRef.current = recog;
    recog.start();
  }, [lang]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else           start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
