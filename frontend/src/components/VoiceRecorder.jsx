/**
 * VoiceRecorder Component
 * Uses Web Speech API for voice-to-text answer input
 */

import React, { useState, useRef, useEffect } from 'react';

// Check browser support
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const VoiceRecorder = ({ onTranscript, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const supported = !!SpeechRecognition;

  useEffect(() => {
    if (!supported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += chunk;
        } else {
          interimTranscript += chunk;
        }
      }

      const full = (transcript + finalTranscript).trim();
      setTranscript(full || interimTranscript);
      if (finalTranscript) onTranscript(full);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Voice error: ${event.error}. Please try again.`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [supported, transcript, onTranscript]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setError('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const reset = () => {
    setTranscript('');
    onTranscript('');
    setError('');
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-surface-800 px-3 py-2 rounded-lg border border-surface-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Voice input not supported in this browser. Use Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Record / Stop button */}
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950
            ${isListening
              ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 recording-pulse'
              : 'bg-surface-800 hover:bg-surface-700 text-slate-300 border border-surface-700 focus:ring-brand-500'
            }
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <>
              <span className="w-2 h-2 rounded-sm bg-white animate-pulse" />
              Stop Recording
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Answer
            </>
          )}
        </button>

        {/* Clear button (only when there's a transcript) */}
        {transcript && (
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-300 bg-surface-800 rounded-xl border border-surface-700 transition-colors"
          >
            Clear
          </button>
        )}

        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            Listening...
          </div>
        )}
      </div>

      {/* Live transcript preview */}
      {transcript && (
        <div className="bg-surface-800/60 border border-surface-700 rounded-xl p-3 text-sm text-slate-300 italic">
          "{transcript}"
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default VoiceRecorder;
