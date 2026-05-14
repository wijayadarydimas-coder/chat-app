import { useRef, useCallback, useEffect } from 'react';
import { RINGTONE_PRESETS } from '@/constants/ringtones';

export function useRingtone() {
  const audioCtxRef  = useRef(null);
  const intervalRef  = useRef(null);
  const audioElRef   = useRef(null); // untuk ringtone file upload

  const stopRingtone = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.currentTime = 0; audioElRef.current = null; }
  }, []);

  // selectedRingtone: { type: 'preset', id: 'classic' } | { type: 'file', url: '/uploads/ringtone/xxx.mp3' }
  const playRingtone = useCallback((selectedRingtone) => {
    stopRingtone();
    const cfg = selectedRingtone || { type: 'preset', id: 'classic' };

    if (cfg.type === 'file' && cfg.url) {
      // Putar file audio langsung
      try {
        const audio = new Audio(cfg.url);
        audio.loop = true;
        audio.volume = 0.7;
        audio.play().catch(() => {});
        audioElRef.current = audio;
      } catch (e) { console.warn('Ringtone file error:', e); }
      return;
    }

    // Putar preset Web Audio
    const preset = RINGTONE_PRESETS.find(p => p.id === (cfg.id || 'classic')) || RINGTONE_PRESETS[0];
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const { ring, interval } = preset.play(ctx);
      intervalRef.current = setInterval(ring, interval);
    } catch (e) { console.warn('Ringtone error:', e); }
  }, [stopRingtone]);

  useEffect(() => () => stopRingtone(), [stopRingtone]);
  return { playRingtone, stopRingtone };
}
