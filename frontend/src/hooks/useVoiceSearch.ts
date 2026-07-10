'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseVoiceSearchOptions {
  lang?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
}

export function useVoiceSearch({ lang = 'fr-FR', onResult }: UseVoiceSearchOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = useCallback(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any ongoing recognition before starting a new one
    recogRef.current?.abort();

    const recog = new SR();
    recog.lang = lang;
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => setListening(true);

    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else interim += text;
      }
      onResultRef.current(final || interim, !!final);
    };

    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);

    recogRef.current = recog;
    recog.start();
  }, [lang]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
