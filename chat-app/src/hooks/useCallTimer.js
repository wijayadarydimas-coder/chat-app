import { useState, useRef, useCallback, useEffect } from 'react';

export function useCallTimer() {
  const [seconds, setSeconds] = useState(0);
  const secRef    = useRef(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    secRef.current = 0; setSeconds(0);
    intervalRef.current = setInterval(() => { secRef.current += 1; setSeconds(secRef.current); }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    return secRef.current;
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    secRef.current = 0; setSeconds(0);
  }, []);

  const fmt = useCallback(s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  return { seconds, start, stop, reset, fmt };
}
