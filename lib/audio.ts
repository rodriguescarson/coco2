import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, AudioSource, setAudioModeAsync } from 'expo-audio';

// Royalty-free ambient streams (Pixabay / Internet Archive). Replace with bundled
// assets once you've curated your own library.
export const sleepSoundCatalog: { id: string; name: string; emoji: string; uri: string }[] = [
  { id: 'rain', name: 'Rain on a tin roof', emoji: '🌧️', uri: 'https://cdn.pixabay.com/audio/2022/06/07/audio_3a17bf2efe.mp3' },
  { id: 'forest', name: 'Forest at dusk', emoji: '🌲', uri: 'https://cdn.pixabay.com/audio/2022/03/14/audio_3a8a6a1a45.mp3' },
  { id: 'ocean', name: 'Ocean shoreline', emoji: '🌊', uri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_4736b3094c.mp3' },
  { id: 'fire', name: 'Crackling fireplace', emoji: '🔥', uri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_3158b6df60.mp3' },
  { id: 'fan', name: 'White noise / fan', emoji: '🌀', uri: 'https://cdn.pixabay.com/audio/2021/10/19/audio_d0a719f9a4.mp3' },
  { id: 'cafe', name: 'Soft cafe ambience', emoji: '☕', uri: 'https://cdn.pixabay.com/audio/2022/01/27/audio_25f09e9bc9.mp3' },
];

export const meditationCatalog: { id: string; uri: string }[] = [
  { id: 'wind-down', uri: 'https://cdn.pixabay.com/audio/2022/03/14/audio_3a8a6a1a45.mp3' },
  { id: 'rain-sounds', uri: 'https://cdn.pixabay.com/audio/2022/06/07/audio_3a17bf2efe.mp3' },
  { id: 'body-scan', uri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_3158b6df60.mp3' },
  { id: 'open-aware', uri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_4736b3094c.mp3' },
  { id: 'focus-flow', uri: 'https://cdn.pixabay.com/audio/2021/10/19/audio_d0a719f9a4.mp3' },
  { id: 'panic-reset', uri: 'https://cdn.pixabay.com/audio/2022/01/27/audio_25f09e9bc9.mp3' },
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
};

// Hook that drives playback for a single audio source (URL or local require()).
export function useTrack(source: AudioSource | null, opts: { loop?: boolean; volume?: number } = {}) {
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);
  const lastSource = useRef<AudioSource | null>(null);

  useEffect(() => { ensureAudioMode(); }, []);

  useEffect(() => {
    try {
      player.loop = !!opts.loop;
      if (typeof opts.volume === 'number') player.volume = Math.max(0, Math.min(1, opts.volume));
    } catch {
      // player may not be ready yet
    }
  }, [player, opts.loop, opts.volume]);

  useEffect(() => {
    return () => {
      try { player.pause(); } catch {}
    };
  }, [player]);

  // When source changes, reset position
  useEffect(() => {
    if (source !== lastSource.current) {
      lastSource.current = source;
      try { player.seekTo(0); } catch {}
    }
  }, [source, player]);

  const state: AudioState = {
    loading: !!status?.isBuffering,
    playing: !!status?.playing,
    durationMs: Math.round(((status?.duration as number | undefined) ?? 0) * 1000),
    positionMs: Math.round(((status?.currentTime as number | undefined) ?? 0) * 1000),
  };

  return {
    state,
    error,
    play: async () => {
      try { setError(null); await ensureAudioMode(); player.play(); } catch (e) { setError((e as Error).message); }
    },
    pause: async () => {
      try { player.pause(); } catch (e) { setError((e as Error).message); }
    },
    toggle: async () => {
      if (status?.playing) player.pause(); else { await ensureAudioMode(); player.play(); }
    },
    stop: async () => {
      try { player.pause(); player.seekTo(0); } catch (e) { setError((e as Error).message); }
    },
    seekToMs: async (ms: number) => {
      try { player.seekTo(ms / 1000); } catch (e) { setError((e as Error).message); }
    },
  };
}
