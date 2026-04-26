import { useEffect } from 'react';

export function useSpeechToText(onResult: (text: string) => void, onEnd: () => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return { isSupported: false, start: () => {}, stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0])
      .map((result: any) => result.transcript)
      .join('');
    onResult(transcript);
  };

  recognition.onend = () => {
    onEnd();
  };

  return {
    isSupported: true,
    start: (lang: string = 'en-US') => {
      recognition.lang = lang;
      recognition.start();
    },
    stop: () => {
      recognition.stop();
    }
  };
}
