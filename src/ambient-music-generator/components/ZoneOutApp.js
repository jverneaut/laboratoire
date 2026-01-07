import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DroneEngine } from '../lib/audio/droneEngine';
import { Visualizer } from './Visualizer';

const LucideShuffle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <polyline
      points="16 3 21 3 21 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="4"
      y1="20"
      x2="21"
      y2="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="21 16 21 21 16 21"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="15"
      y1="15"
      x2="21"
      y2="21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="4"
      y1="4"
      x2="9"
      y2="9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LucideMaximize2 = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M15 3h6v6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 21H3v-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 3l-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 21l7-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LucidePlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <polygon
      points="8 5 19 12 8 19 8 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LucidePause = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <line
      x1="9"
      y1="6"
      x2="9"
      y2="18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="15"
      y1="6"
      x2="15"
      y2="18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ZoneOutApp = () => {
  const engineRef = useRef(null);
  const stageRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastGestureMsRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [volume] = useState(1);
  const [analyser, setAnalyser] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const hoverCapable = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    const touch = (navigator.maxTouchPoints ?? 0) > 0;
    if (coarse || touch) return false;
    return window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches ?? false;
  }, []);

  useEffect(() => {
    const engine = new DroneEngine({ volume });
    engineRef.current = engine;

    return () => {
      void engine.dispose();
      engineRef.current = null;
    };
  }, [volume]);

  const start = async () => {
    let engine = engineRef.current;
    if (!engine) {
      engine = new DroneEngine({ volume });
      engineRef.current = engine;
    }
    if (engine.getState() !== 'stopped') return;

    try {
      await engine.start();
      setAnalyser(engine.getAnalyserNode());
      setIsRunning(true);
      setControlsVisible(false);
    } catch (error) {
      // Helpful when debugging iOS Safari via remote inspector.
      // eslint-disable-next-line no-console
      console.error('[ambient-music-generator] Failed to start audio engine', error);
      setControlsVisible(true);
      setIsRunning(false);
    }
  };

  const stop = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.getState() !== 'running') return;
    await engine.stop();
    setAnalyser(null);
    setIsRunning(false);
    setControlsVisible(true);
  };

  const reseed = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = Date.now() >>> 0;
    engine.setSeed(next);

    if (engine.getState() === 'running') await engine.stop();
    await engine.start();
    setAnalyser(engine.getAnalyserNode());
    setIsRunning(true);
  };

  const fullscreenSupported = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const request =
      typeof HTMLElement.prototype.requestFullscreen === 'function' ||
      typeof HTMLElement.prototype.webkitRequestFullscreen === 'function' ||
      typeof HTMLElement.prototype.webkitRequestFullScreen === 'function';
    return request;
  }, []);

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (!fullscreenSupported) return;

    try {
      const fsEl =
        document.fullscreenElement ??
        document.webkitFullscreenElement ??
        document.webkitCurrentFullScreenElement ??
        null;

      const exit =
        document.exitFullscreen ??
        document.webkitExitFullscreen ??
        document.webkitCancelFullScreen ??
        null;

      const request =
        el.requestFullscreen ??
        el.webkitRequestFullscreen ??
        el.webkitRequestFullScreen ??
        null;

      if (fsEl && exit) await exit.call(document);
      else if (request) await request.call(el);
    } catch {
      // Ignore (unsupported / blocked)
    }
  };

  useEffect(() => {
    if (hoverCapable) return undefined;
    if (!isRunning) {
      setControlsVisible(true);
      return undefined;
    }
    if (!controlsVisible) return undefined;
    const t = window.setTimeout(() => setControlsVisible(false), 2000);
    return () => window.clearTimeout(t);
  }, [controlsVisible, hoverCapable, isRunning]);

  useEffect(() => {
    if (!hoverCapable) return undefined;
    if (!isRunning) {
      setControlsVisible(true);
      return undefined;
    }

    const stage = stageRef.current;
    if (!stage) return undefined;

    const scheduleHide = () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
        hideTimerRef.current = null;
      }, 2000);
    };

    const onMove = () => {
      setControlsVisible(true);
      scheduleHide();
    };

    stage.addEventListener('mousemove', onMove, { passive: true });
    stage.addEventListener('pointermove', onMove, { passive: true });
    scheduleHide();

    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('pointermove', onMove);
    };
  }, [hoverCapable, isRunning]);

  const shouldAcceptGesture = () => {
    const now = Date.now();
    if (now - lastGestureMsRef.current < 450) return false;
    lastGestureMsRef.current = now;
    return true;
  };

  const onStageGesture = () => {
    if (!shouldAcceptGesture()) return;
    if (!isRunning) {
      void start();
      return;
    }
    if (!hoverCapable) setControlsVisible(true);
  };

  return (
    <div
      className="stage"
      ref={stageRef}
      data-running={isRunning ? '1' : '0'}
      data-controls={controlsVisible ? '1' : '0'}
      // On iOS Safari, starting audio on `touchstart` can fail to unlock audio output
      // (especially when an HTMLMediaElement unlock is needed). Prefer `click`.
      onPointerDown={hoverCapable ? onStageGesture : undefined}
      onClick={onStageGesture}
    >
      <Visualizer analyser={analyser} className="viz" />

      <div className="hudOverlay">
        <div className="hud" role="group" aria-label="Controls">
          <button
            type="button"
            className="hudBtn"
            onPointerDown={(e) => {
              if (!hoverCapable) return;
              e.stopPropagation();
              if (!shouldAcceptGesture()) return;
              if (!isRunning) void start();
              else void reseed();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!shouldAcceptGesture()) return;
              if (!isRunning) void start();
              else void reseed();
            }}
            aria-label="Change seed"
          >
            <LucideShuffle />
          </button>

          <button
            type="button"
            className="hudBtn"
            onPointerDown={(e) => {
              if (!hoverCapable) return;
              e.stopPropagation();
              if (!shouldAcceptGesture()) return;
              void toggleFullscreen();
              if (!isRunning) void start();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!shouldAcceptGesture()) return;
              void toggleFullscreen();
              if (!isRunning) void start();
            }}
            aria-label="Toggle fullscreen"
          >
            <LucideMaximize2 />
          </button>

          <button
            type="button"
            className="hudBtn"
            onPointerDown={(e) => {
              if (!hoverCapable) return;
              e.stopPropagation();
              if (!shouldAcceptGesture()) return;
              if (isRunning) void stop();
              else void start();
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!shouldAcceptGesture()) return;
              if (isRunning) void stop();
              else void start();
            }}
            aria-label={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <LucidePause /> : <LucidePlay />}
          </button>
        </div>
      </div>
    </div>
  );
};
