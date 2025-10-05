'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Spline from '@splinetool/react-spline/next';

import OverlayCard, { Side } from './OverlayCard';
import stylesBtn from './Controls.module.css';

type CueId = 'orange' | 'green' | 'blue' | 'top';

export type Cue = {
  id: CueId;
  range: [number, number];
  side: Side;
  color: string;
  text: string;
};

const SCENE_URL = 'https://prod.spline.design/EBvyqV3S56u6-yNi/scene.splinecode';
const LOOP_INCREMENT = 0.002;
const RESUME_DELAY = 1200;
const KEYBOARD_INTERACTION_KEYS = new Set([
  ' ',
  'Space',
  'Spacebar',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

export const CUES: Cue[] = [
  { id: 'orange', range: [0.08, 0.22], side: 'left', color: '#F97316', text: 'Visualize Your Code' },
  { id: 'green', range: [0.28, 0.4], side: 'right', color: '#22C55E', text: 'Optimize Pipelines' },
  { id: 'blue', range: [0.46, 0.58], side: 'left', color: '#3B82F6', text: 'Secure by Design' },
  { id: 'top', range: [0.68, 0.84], side: 'right', color: '#9CA3AF', text: 'Adaptive Intelligence' },
];

const createInitialShownState = (): Record<CueId, boolean> => ({
  orange: false,
  green: false,
  blue: false,
  top: false,
});

export default function SplineStack() {
  const appRef = useRef<any>(null);
  const progressRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const playingRef = useRef<boolean>(true);
  const manualPauseRef = useRef<boolean>(false);

  const [playing, setPlaying] = useState<boolean>(true);
  const [shown, setShown] = useState<Record<CueId, boolean>>(() => createInitialShownState());

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const clearIdleTimeout = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const setSplineProgress = useCallback((value: number) => {
    try {
      appRef.current?.setVariable?.('progress', value);
    } catch (error) {
      // Ignore failures when the Spline runtime is not ready or variable missing.
    }
  }, []);

  const evaluateCues = useCallback((t: number) => {
    setShown(prev => {
      let changed = false;
      const next: Record<CueId, boolean> = { ...prev };
      for (const cue of CUES) {
        const inside = t >= cue.range[0] && t <= cue.range[1];
        if (next[cue.id] !== inside) {
          next[cue.id] = inside;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    evaluateCues(progressRef.current);
  }, [evaluateCues]);

  useEffect(() => {
    const step = () => {
      if (playingRef.current) {
        progressRef.current = (progressRef.current + LOOP_INCREMENT) % 1;
        const t = progressRef.current;
        setSplineProgress(t);
        evaluateCues(t);
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [evaluateCues, setSplineProgress]);

  const pause = useCallback((manual = false) => {
    if (manual) {
      manualPauseRef.current = true;
    }
    setPlaying(prev => {
      if (!prev) {
        return prev;
      }
      return false;
    });
  }, []);

  const play = useCallback((manual = false) => {
    if (manual) {
      manualPauseRef.current = false;
    }
    setPlaying(prev => {
      if (prev) {
        return prev;
      }
      return true;
    });
  }, []);

  const scheduleResume = useCallback(() => {
    if (manualPauseRef.current) {
      return;
    }
    clearIdleTimeout();
    idleTimerRef.current = window.setTimeout(() => {
      if (!manualPauseRef.current) {
        play(false);
      }
    }, RESUME_DELAY);
  }, [clearIdleTimeout, play]);

  const handleInteraction = useCallback(() => {
    if (manualPauseRef.current) {
      clearIdleTimeout();
      return;
    }
    pause(false);
    scheduleResume();
  }, [pause, scheduleResume, clearIdleTimeout]);

  useEffect(() => {
    const handleWheel = () => handleInteraction();
    const handleTouch = () => handleInteraction();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!KEYBOARD_INTERACTION_KEYS.has(event.key)) {
        return;
      }
      handleInteraction();
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleInteraction]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const applyPreference = (matches: boolean) => {
      if (matches) {
        pause(true);
      }
    };

    applyPreference(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyPreference(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [pause]);

  useEffect(() => () => clearIdleTimeout(), [clearIdleTimeout]);

  const onLoad = useCallback(
    (app: any) => {
      appRef.current = app;
      setSplineProgress(progressRef.current);
    },
    [setSplineProgress]
  );

  const togglePlaying = () => {
    clearIdleTimeout();
    if (playing) {
      pause(true);
    } else {
      play(true);
    }
  };

  return (
    <>
      <Spline scene={SCENE_URL} onLoad={onLoad} />
      {CUES.map(cue => (
        <OverlayCard
          key={cue.id}
          id={`card-${cue.id}`}
          side={cue.side}
          color={cue.color}
          text={cue.text}
          shown={shown[cue.id]}
        />
      ))}
      <button
        type="button"
        className={stylesBtn.fab}
        onClick={togglePlaying}
        aria-pressed={playing}
        aria-label={playing ? 'Pause animation' : 'Play animation'}
      >
        {playing ? '▮▮' : '►'}
      </button>
    </>
  );
}
