import { useState, useEffect, useRef } from 'react';
import { useModeStore } from '../stores/mode-store';

export function ControlHint() {
  const mode = useModeStore((s) => s.mode);
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHidden(false);
    timerRef.current = setTimeout(() => setHidden(true), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'var(--ink-muted)',
        fontSize: '10px',
        letterSpacing: '1.5px',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 100,
        opacity: hidden ? 0 : 1,
        transition: 'opacity 1s ease',
        textShadow: '0 2px 12px rgba(0,0,0,.9)',
      }}
    >
      {mode === 'edit'
        ? 'DRAG · SCROLL TO ZOOM · RIGHT-DRAG TO PAN'
        : 'WASD TO STEER · TAB TO SWITCH VESSEL'}
    </div>
  );
}
