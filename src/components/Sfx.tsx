"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Tiny UI sounds, made on the fly with Web Audio (no sound files to download).
 * Browsers only allow sound after the visitor clicks something, so nothing ever plays on page load.
 * Muted state is remembered in this browser.
 */
type Name = "pop" | "ding" | "whoosh" | "tick";

let ctx: AudioContext | null = null;
const KEY = "ss-muted";

function muted() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(a: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + at + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + at);
  g.gain.exponentialRampToValueAtTime(vol, a.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + at);
  o.stop(a.currentTime + at + dur + 0.02);
}

export function playSfx(name: Name) {
  if (muted()) return;
  const a = audio();
  if (!a) return;
  if (name === "pop") tone(a, 520, 0, 0.09, "triangle", 0.12, 880);
  if (name === "tick") tone(a, 1400, 0, 0.03, "square", 0.025);
  if (name === "ding") {
    tone(a, 880, 0, 0.35, "sine", 0.14);
    tone(a, 1320, 0.09, 0.45, "sine", 0.12);
    tone(a, 1760, 0.18, 0.6, "sine", 0.08);
  }
  if (name === "whoosh") {
    const len = Math.floor(a.sampleRate * 0.45);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len);
    const src = a.createBufferSource();
    const f = a.createBiquadFilter();
    const g = a.createGain();
    f.type = "bandpass";
    f.frequency.setValueAtTime(400, a.currentTime);
    f.frequency.exponentialRampToValueAtTime(2400, a.currentTime + 0.4);
    g.gain.value = 0.18;
    src.buffer = buf;
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }
}

/** Plays a sound once when it mounts (e.g. the +1 credit burst, the podium). */
export function SfxOnMount({ name, delay = 0 }: { name: Name; delay?: number }) {
  useEffect(() => {
    const t = setTimeout(() => playSfx(name), delay);
    return () => clearTimeout(t);
  }, [name, delay]);
  return null;
}

/** Click sounds for every main button and tab, plus the mute switch shown in the header. */
export function SoundToggle() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(muted());
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".btn, .btn-quiet, [data-sfx], [role=tab]");
      if (el) playSfx(el.getAttribute("data-sfx") === "tick" ? "tick" : "pop");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  const flip = () => {
    const next = !off;
    setOff(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // private window: the switch still works for this page
    }
    if (!next) playSfx("pop");
  };
  return (
    <button onClick={flip} aria-label={off ? "Turn sounds on" : "Turn sounds off"} aria-pressed={!off}
      className="flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-mute sm:w-9 transition hover:bg-white/[.05] hover:text-cream">
      {off ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
