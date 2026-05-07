import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, AudioSource, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// Audio sources. These are intentionally short loops with permissive hotlink
// policies. Pixabay's CDN started gating direct hotlinks in mid-2025, so we
// route through samplelib + mixkit. For production, mirror these to your own
// bucket (e.g. Firebase Storage at coco-sih.appspot.com) and update the URLs.

export const sleepSoundCatalog: { id: string; name: string; emoji: string; uri: string }[] = [
  { id: 'rain', name: 'Rain on a tin roof', emoji: '🌧️', uri: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' },
  { id: 'forest', name: 'Forest at dusk', emoji: '🌲', uri: 'https://assets.mixkit.co/active_storage/sfx/2516/2516-preview.mp3' },
  { id: 'ocean', name: 'Ocean shoreline', emoji: '🌊', uri: 'https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3' },
  { id: 'fire', name: 'Crackling fireplace', emoji: '🔥', uri: 'https://download.samplelib.com/mp3/sample-15s.mp3' },
  { id: 'fan', name: 'White noise / fan', emoji: '🌀', uri: 'https://download.samplelib.com/mp3/sample-12s.mp3' },
  { id: 'cafe', name: 'Soft cafe ambience', emoji: '☕', uri: 'https://download.samplelib.com/mp3/sample-9s.mp3' },
];

export const meditationCatalog: { id: string; uri: string }[] = [
  { id: 'wind-down', uri: 'https://assets.mixkit.co/active_storage/sfx/2516/2516-preview.mp3' },
  { id: 'rain-sounds', uri: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' },
  { id: 'body-scan', uri: 'https://download.samplelib.com/mp3/sample-15s.mp3' },
  { id: 'open-aware', uri: 'https://assets.mixkit.co/active_storage/sfx/2434/2434-preview.mp3' },
  { id: 'focus-flow', uri: 'https://download.samplelib.com/mp3/sample-12s.mp3' },
  { id: 'panic-reset', uri: 'https://download.samplelib.com/mp3/sample-9s.mp3' },
];

let audioModeReady = false;
async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    });
    audioModeReady = true;
  } catch {
    // older or web environments
  }
}

export type AudioState = {
  loading: boolean;
  playing: boolean;
  durationMs: number;
  positionMs: number;
  ready: boolean;
};

// useTrack creates a single, stable player. Switching tracks happens via
// playSource() which calls player.replace(); this avoids the
// NativeSharedObjectNotFoundException that occurs when calling .play() on a
// player whose source was changed mid-render.
export function useTrack(opts: { loop?: boolean; volume?: number } = {}) {
  // Pass null so the same player instance survives across source changes.
  const player = useAudioPlayer(null) as AudioPlayer;
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => { ensureAudioMode(); }, []);

  // Keep loop / volume in sync without recreating the player
  useEffect(() => {
    try {
      if (typeof opts.loop === 'boolean') player.loop = opts.loop;
      if (typeof opts.volume === 'number') player.volume = Math.max(0, Math.min(1, opts.volume));
    } catch {
      // player not yet usable; effect will re-run on next render anyway
    }
  }, [player, opts.loop, opts.volume]);

  // Pause on unmount so audio doesn't leak across screens
  useEffect(() => {
    const p = playerRef.current;
    return () => {
      try { p.pause(); } catch {}
    };
  }, []);

  const state: AudioState = {
    loading: !!status?.isBuffering,
    playing: !!status?.playing,
    durationMs: Math.round(((status?.duration as number | undefined) ?? 0) * 1000),
    positionMs: Math.round(((status?.currentTime as number | undefined) ?? 0) * 1000),
    ready: !!status,
  };

  return {
    state,
    error,
    activeUri,

    async playSource(source: AudioSource) {
      try {
        setError(null);
        await ensureAudioMode();
        const uri = typeof source === 'object' && source && 'uri' in source ? (source as { uri: string }).uri : null;
        // Same source already playing? Resume rather than reload (avoids buffering jank)
        if (uri && uri === activeUri && status?.playing) return;
        if (uri && uri !== activeUri) {
          player.replace(source);
          setActiveUri(uri);
        }
        // Brief delay so replace() completes natively before play()
        setTimeout(() => {
          try { player.play(); } catch (e) { setError((e as Error).message); }
        }, 50);
      } catch (e) {
        setError((e as Error).message);
      }
    },

    pause() {
      try { player.pause(); } catch (e) { setError((e as Error).message); }
    },

    toggle() {
      try {
        if (status?.playing) player.pause();
        else { ensureAudioMode().then(() => { try { player.play(); } catch (e) { setError((e as Error).message); } }); }
      } catch (e) {
        setError((e as Error).message);
      }
    },

    stop() {
      try { player.pause(); player.seekTo(0); setActiveUri(null); } catch (e) { setError((e as Error).message); }
    },

    seekToMs(ms: number) {
      try { player.seekTo(ms / 1000); } catch (e) { setError((e as Error).message); }
    },
  };
}
