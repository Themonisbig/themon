#!/usr/bin/env python3
"""
Builds the full soundtrack for the promo, 100% generated in code:

  * every sound effect (heartbeat, whoosh, impacts, scan beam, pop, crowd cheer...)
  * a driving 120 BPM electronic beat that stops dead on every RED LIGHT
  * the doll's voice: local TTS (Piper; falls back to macOS `say` or espeak-ng),
    pitched down + reverb with ffmpeg

Timing comes from src/timeline.json (shared with the React video code).

Outputs
  public/audio/soundtrack.wav        final mastered mix used by the video
  public/audio/voice_<id>.wav        processed doll lines (for reference)
  src/generated/voice.json           per-frame mouth envelope + word timings for lip-sync
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
SR = 48000
DUR = float(TL["duration"])
N = int(DUR * SR)
BEAT = 60.0 / TL["bpm"]
SIX = BEAT / 4
RNG = np.random.default_rng(7)

VOICE_DIR = ROOT / ".voice"
PIPER_MODEL = VOICE_DIR / "en-us-ryan-high.onnx"
PIPER_URL = "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz"


# ----------------------------------------------------------------------------- helpers
def t2s(t: float) -> int:
    return int(round(t * SR))


def tl(n: int) -> np.ndarray:
    return np.arange(n) / SR


def env_exp(n: int, tau: float) -> np.ndarray:
    return np.exp(-tl(n) / tau)


def ramp_in(sig: np.ndarray, sec: float) -> np.ndarray:
    k = min(len(sig), max(1, int(sec * SR)))
    sig = sig.copy()
    sig[:k] *= np.linspace(0, 1, k)
    return sig


def ramp_out(sig: np.ndarray, sec: float) -> np.ndarray:
    k = min(len(sig), max(1, int(sec * SR)))
    sig = sig.copy()
    sig[-k:] *= np.linspace(1, 0, k)
    return sig


def sos(kind: str, f, order: int = 2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def lp(x, f, order=2):
    return signal.sosfilt(sos("lowpass", min(f, SR / 2 - 100), order), x)


def hp(x, f, order=2):
    return signal.sosfilt(sos("highpass", f, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos("bandpass", [lo, min(hi, SR / 2 - 100)], order), x)


def noise(n: int) -> np.ndarray:
    return RNG.uniform(-1, 1, n)


def saw(freq, n: int, phase: float = 0.0) -> np.ndarray:
    ph = (np.cumsum(np.broadcast_to(freq, (n,))) / SR + phase) % 1.0
    return 2 * ph - 1


def sine_sweep(f0: float, f1: float, n: int, curve: str = "exp") -> np.ndarray:
    if curve == "exp":
        f = f0 * (f1 / f0) ** (np.arange(n) / max(1, n - 1))
    else:
        f = np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def swept_filter_noise(n: int, f0: float, f1: float, q: float = 1.2, chunk: int = 512) -> np.ndarray:
    """Noise through a band-pass whose centre moves f0 -> f1 (whoosh)."""
    src = noise(n)
    out = np.zeros(n)
    zi = None
    centres = f0 * (f1 / f0) ** (np.arange(0, n, chunk) / max(1, n))
    for i, c in zip(range(0, n, chunk), centres):
        lo, hi = c / (1 + 1 / q), min(c * (1 + 1 / q), SR / 2 - 200)
        s = signal.butter(2, [lo, hi], btype="bandpass", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(s) * 0
        seg, zi = signal.sosfilt(s, src[i : i + chunk], zi=zi)
        out[i : i + chunk] = seg
    return out


class Bus:
    """Stereo mix bus."""

    def __init__(self, n: int = N):
        self.x = np.zeros((n, 2))

    def add(self, sig: np.ndarray, t: float, gain: float = 1.0, pan: float = 0.0):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414], axis=1)
        i = t2s(t)
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(len(self.x), i + len(sig))
        if j > i:
            self.x[i:j] += sig[: j - i] * gain


def reverb(x: np.ndarray, decay: float = 1.6, mix: float = 0.3, pre: float = 0.012, damp: float = 5000) -> np.ndarray:
    """Cheap stereo convolution reverb with a synthetic decaying-noise impulse."""
    n = int(decay * SR)
    out = np.zeros_like(x if x.ndim == 2 else np.stack([x, x], 1))
    mono = x if x.ndim == 1 else None
    for ch in range(2):
        ir = noise(n) * np.exp(-tl(n) * 6.9 / decay)
        ir = lp(ir, damp)
        ir = np.concatenate([np.zeros(int(pre * SR)), ir])
        ir /= np.sqrt(np.sum(ir**2)) + 1e-9
        src = mono if mono is not None else x[:, ch]
        wet = signal.fftconvolve(src, ir)[: len(src)]
        out[:, ch] = src * (1 - mix) + wet * mix
    return out


# ----------------------------------------------------------------------------- instruments / SFX
def kick(level: float = 1.0) -> np.ndarray:
    n = t2s(0.45)
    body = sine_sweep(160, 42, n) * env_exp(n, 0.17)
    click = hp(noise(n), 3000) * env_exp(n, 0.004) * 0.5
    return np.tanh((body + click) * 2.2) * 0.8 * level


def clap() -> np.ndarray:
    n = t2s(0.35)
    e = np.zeros(n)
    for d in (0.0, 0.009, 0.018, 0.027):
        k = t2s(d)
        e[k:] += env_exp(n - k, 0.012 if d < 0.02 else 0.11)
    return bp(noise(n), 900, 5000) * e * 0.55


def hat(open_: bool = False) -> np.ndarray:
    n = t2s(0.28 if open_ else 0.06)
    return hp(noise(n), 7500, 4) * env_exp(n, 0.08 if open_ else 0.014) * 0.35


def bass_note(freq: float, length: float) -> np.ndarray:
    n = t2s(length)
    s = saw(freq, n) * 0.6 + saw(freq * 1.005, n) * 0.4 + np.sin(2 * np.pi * freq / 2 * tl(n)) * 0.8
    cutoff_env = 180 + 1400 * env_exp(n, 0.05)
    out = np.zeros(n)
    # time-varying lowpass in chunks
    zi = None
    for i in range(0, n, 256):
        s_ = signal.butter(2, cutoff_env[i], fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(s_) * 0
        out[i : i + 256], zi = signal.sosfilt(s_, s[i : i + 256], zi=zi)
    amp = np.minimum(1, tl(n) / 0.003) * env_exp(n, length * 0.9)
    return np.tanh(out * amp * 2.0) * 0.45


def stab(freqs, length: float = 0.22) -> np.ndarray:
    n = t2s(length)
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.012, 0, 0.011):
            s += saw(f * (1 + det), n, RNG.random())
    s = lp(s, 2600) * env_exp(n, length * 0.35) / (len(freqs) * 3)
    return s * 0.9


def lead_note(freq: float, length: float) -> np.ndarray:
    n = t2s(length)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tl(n))
    s = saw(freq * vib, n) * 0.5 + saw(freq * 2.002 * vib, n) * 0.2 + np.sign(np.sin(2 * np.pi * freq * tl(n))) * 0.15
    s = lp(s, 3800) * np.minimum(1, tl(n) / 0.01) * env_exp(n, length * 0.6)
    return s * 0.32


def heartbeat(level: float = 1.0) -> np.ndarray:
    n = t2s(0.55)
    out = np.zeros(n)
    for dt, f, a in ((0.0, 58, 1.0), (0.2, 50, 0.75)):
        k = t2s(dt)
        m = n - k
        thump = sine_sweep(f * 1.6, f, m) * env_exp(m, 0.07) * np.minimum(1, tl(m) / 0.004)
        thump += lp(noise(m), 180) * env_exp(m, 0.03) * 0.8
        out[k:] += thump * a
    return np.tanh(out * 2.5) * 0.9 * level


def whoosh(length: float = 0.6, f0: float = 300, f1: float = 4500, level: float = 1.0) -> np.ndarray:
    n = t2s(length)
    w = swept_filter_noise(n, f0, f1, q=1.6)
    e = np.sin(np.pi * np.clip(tl(n) / length, 0, 1)) ** 2
    return w * e * 1.6 * level


def impact(level: float = 1.0, tail: float = 1.6) -> np.ndarray:
    n = t2s(tail)
    boom = sine_sweep(110, 30, n) * env_exp(n, 0.35)
    crack = bp(noise(n), 400, 8000) * env_exp(n, 0.06) * 0.7
    rumble = lp(noise(n), 120) * env_exp(n, 0.5) * 2.0
    s = np.tanh((boom * 1.4 + crack + rumble) * 1.8) * 0.85
    return reverb(s, 1.8, 0.35) * level


def riser(length: float = 0.6, level: float = 1.0) -> np.ndarray:
    n = t2s(length)
    w = swept_filter_noise(n, 400, 9000, q=2.5)
    tone = sine_sweep(200, 1400, n) * 0.25
    e = (tl(n) / length) ** 2
    return (w * 1.4 + tone) * e * level


def creak(length: float) -> np.ndarray:
    """Porcelain / wooden neck grinding while the doll head turns."""
    n = t2s(length)
    out = np.zeros(n)
    t = 0.0
    while t < length:
        k = t2s(t)
        m = min(n - k, t2s(0.03))
        out[k : k + m] += bp(noise(m), 600, 2400) * env_exp(m, 0.006) * RNG.uniform(0.4, 1)
        t += RNG.uniform(0.012, 0.045)
    groan = saw(70 + 15 * np.sin(2 * np.pi * 0.8 * tl(n)), n)
    out += bp(groan, 150, 900) * 0.35
    e = np.sin(np.pi * tl(n) / length) ** 0.6
    return out * e * 0.9


def shimmer(freq: float = 1800, length: float = 1.0) -> np.ndarray:
    n = t2s(length)
    s = sum(np.sin(2 * np.pi * freq * r * tl(n) + RNG.random() * 6) / (i + 1) for i, r in enumerate((1, 1.5, 2.01, 3.0)))
    return s * env_exp(n, length * 0.35) * np.minimum(1, tl(n) / 0.004) * 0.25


def bell(freq: float, length: float = 0.7) -> np.ndarray:
    n = t2s(length)
    s = sum(
        np.sin(2 * np.pi * freq * r * tl(n)) * a * env_exp(n, length * d)
        for r, a, d in ((1, 1, 0.4), (2.76, 0.5, 0.18), (5.4, 0.25, 0.08), (8.9, 0.12, 0.04))
    )
    return s * 0.3


def pop(level: float = 1.0, pitch: float = 1.0) -> np.ndarray:
    n = t2s(0.25)
    p = sine_sweep(900 * pitch, 180 * pitch, n) * env_exp(n, 0.03)
    puff = bp(noise(n), 300, 3000) * env_exp(n, 0.07) * 0.6
    return (p + puff) * 0.8 * level


def scan_beam(length: float) -> np.ndarray:
    n = t2s(length)
    t = tl(n)
    sweep = 380 + 260 * np.sin(2 * np.pi * 1.6 * t)
    buzz = np.sign(np.sin(2 * np.pi * np.cumsum(sweep) / SR)) * 0.35
    buzz += np.sin(2 * np.pi * np.cumsum(sweep * 2) / SR) * 0.4
    buzz *= 0.6 + 0.4 * np.sin(2 * np.pi * 22 * t)  # electric tremolo
    hum = np.sin(2 * np.pi * 55 * t) * 0.5
    s = lp(buzz, 3200) + hum
    e = np.minimum(1, t / 0.06) * np.minimum(1, (length - t) / 0.15)
    return s * e * 0.45


def alarm(n_beeps: int = 2) -> np.ndarray:
    beep_len, gap = 0.11, 0.06
    total = t2s(n_beeps * (beep_len + gap))
    out = np.zeros(total)
    for i in range(n_beeps):
        k = t2s(i * (beep_len + gap))
        m = t2s(beep_len)
        sq = np.sign(np.sin(2 * np.pi * 1320 * tl(m))) * 0.5 + np.sin(2 * np.pi * 660 * tl(m))
        out[k : k + m] += lp(sq, 5000) * 0.35 * np.minimum(1, (m - np.arange(m)) / 200)
    return out


def tick() -> np.ndarray:
    n = t2s(0.04)
    return np.sin(2 * np.pi * 2400 * tl(n)) * env_exp(n, 0.006) * 0.4


def red_stab() -> np.ndarray:
    """Dark brassy minor-second cluster for RED LIGHT."""
    n = t2s(1.4)
    s = np.zeros(n)
    for f in (41.2, 82.4, 87.3, 123.5, 164.8):
        s += saw(f, n, RNG.random()) + saw(f * 1.006, n, RNG.random())
    s = lp(s, 900) * np.minimum(1, tl(n) / 0.01) * env_exp(n, 0.5)
    return np.tanh(s * 0.5) * 0.6


def drone(length: float, base: float = 41.2, level: float = 1.0) -> np.ndarray:
    n = t2s(length)
    t = tl(n)
    s = np.zeros(n)
    for f in (base, base * 1.5, base * 2.0, base * 2.12):
        s += saw(f * (1 + 0.002 * np.sin(2 * np.pi * 0.13 * t + f)), n, RNG.random())
    s = lp(s, 320)
    s += bp(noise(n), 60, 400) * 0.6
    s *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.5 * t)
    return ramp_out(ramp_in(s * 0.18, 0.5), 0.3) * level


def crowd_cheer(length: float) -> np.ndarray:
    n = t2s(length)
    t = tl(n)
    swell = np.minimum(1, t / 0.25) * np.clip((length - t) / 1.2, 0, 1)
    body = np.zeros(n)
    for lo, hi, a in ((250, 900, 1.0), (700, 2200, 0.8), (1800, 4500, 0.4)):
        am = lp(RNG.standard_normal(n), 6) * 8
        body += bp(noise(n), lo, hi) * (0.6 + np.clip(am, -0.5, 0.6)) * a
    # individual "woo!" voices
    for _ in range(40):
        st = RNG.uniform(0, length * 0.7)
        ln = RNG.uniform(0.35, 1.0)
        m = t2s(ln)
        f0 = RNG.uniform(260, 520)
        f = f0 * (1 + 0.45 * np.sin(np.pi * np.clip(tl(m) / ln, 0, 1))) * (1 + 0.01 * np.sin(2 * np.pi * 6 * tl(m)))
        v = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in (1, 2, 3, 4))
        v = bp(v, 300, 3000) * np.sin(np.pi * tl(m) / ln) * 0.35
        k = t2s(st)
        body[k : k + m] += v[: n - k]
    # applause: many short claps
    claps = np.zeros(n)
    for _ in range(int(length * 70)):
        k = t2s(RNG.uniform(0, length))
        m = min(t2s(0.03), n - k)
        claps[k : k + m] += bp(noise(m), 800, 6000) * env_exp(m, 0.008) * RNG.uniform(0.2, 0.8)
    s = (body * 0.55 + claps * 0.8) * swell
    return reverb(s, 1.2, 0.25)


def footsteps(length: float, rate: float = 18) -> np.ndarray:
    n = t2s(length)
    out = np.zeros(n)
    for _ in range(int(length * rate)):
        k = t2s(RNG.uniform(0, length))
        m = min(t2s(0.08), n - k)
        out[k : k + m] += lp(noise(m), 500) * env_exp(m, 0.02) * RNG.uniform(0.3, 1)
    return out * 0.5


# ----------------------------------------------------------------------------- music
CHORDS = [  # (bass root Hz, stab chord) per bar - E minor / phrygian menace
    (82.41, (329.6, 392.0, 493.9)),
    (82.41, (329.6, 392.0, 493.9)),
    (65.41, (261.6, 329.6, 392.0)),
    (61.74, (246.9, 311.1, 370.0)),
]
LEAD = [659.3, 0, 784.0, 659.3, 0, 987.8, 880.0, 784.0, 659.3, 0, 587.3, 659.3, 0, 784.0, 0, 493.9]


def build_music() -> np.ndarray:
    bus = Bus()
    start, end = TL["scenes"]["green"][0], DUR
    lead_from = TL["scenes"]["winner"][0]
    k, c, ho, hc = kick(), clap(), hat(True), hat(False)
    t = start
    step = int(round(start / SIX))
    while t < end - 1e-6:
        bar = int(t // (BEAT * 4))
        s16 = step % 16
        root, chord = CHORDS[bar % 4]
        if s16 % 4 == 0:
            bus.add(k, t, 1.0)
        if s16 in (4, 12):
            bus.add(c, t, 0.9, 0.05)
        if s16 % 4 == 2:
            bus.add(ho, t, 0.8, 0.3)
        else:
            bus.add(hc, t, 0.5 + 0.2 * (s16 % 2 == 0), -0.3)
        if s16 % 4 != 0:  # rolling off-kick bass
            f = root * (2 if s16 % 4 == 2 else 1)
            bus.add(bass_note(f, SIX * 0.95), t, 1.0)
        if s16 in (3, 6, 10, 14):
            bus.add(stab(chord), t, 0.9, -0.35 if s16 in (3, 10) else 0.35)
        if t >= lead_from and LEAD[s16]:
            bus.add(lead_note(LEAD[s16] * (0.5 if bar % 2 else 1), SIX * 1.8), t, 1.0, 0.15)
        t += SIX
        step += 1
    music = reverb(bus.x, 0.9, 0.12)
    # pump (sidechain feel) on everything but the kick - gentle duck on each beat
    tt = np.arange(N) / SR
    pump = 1 - 0.28 * np.exp(-((tt % BEAT) / 0.07))
    music *= pump[:, None]
    # hard stops on RED LIGHT
    gate = np.ones(N)
    for a, b in TL["musicStops"]:
        ia, ib = t2s(a), t2s(b)
        gate[ia:ib] = 0
        gate[max(0, ia - 96) : ia] = np.linspace(1, 0, min(96, ia))  # 2 ms de-click
    # final fade
    fade_from = t2s(DUR - 0.5)
    gate[fade_from:] *= np.linspace(1, 0, N - fade_from) ** 2
    return music * gate[:, None]


# ----------------------------------------------------------------------------- voice
def ensure_piper() -> bool:
    try:
        import piper  # noqa: F401
    except ImportError:
        print("  installing piper-tts ...")
        if subprocess.call([sys.executable, "-m", "pip", "install", "-q", "piper-tts"]) != 0:
            return False
    if not PIPER_MODEL.exists():
        VOICE_DIR.mkdir(exist_ok=True)
        print("  downloading Piper voice (en-us-ryan-high) ...")
        tgz = VOICE_DIR / "voice.tgz"
        urllib.request.urlretrieve(PIPER_URL, tgz)
        with tarfile.open(tgz) as tf:
            tf.extractall(VOICE_DIR, filter="data")
        tgz.unlink()
    return PIPER_MODEL.exists()


def tts(text: str, out: Path):
    """Text-to-speech with whatever local engine is available."""
    if ensure_piper():
        subprocess.run(
            [sys.executable, "-m", "piper", "-m", str(PIPER_MODEL), "-f", str(out), "--length-scale", "1.18"],
            input=text.encode(),
            check=True,
            capture_output=True,
        )
    elif shutil.which("say"):
        subprocess.run(["say", "-v", "Alex", "-r", "140", "-o", str(out), "--data-format=LEI16@22050", text], check=True)
    elif shutil.which("espeak-ng"):
        subprocess.run(["espeak-ng", "-v", "en-us+m3", "-s", "130", "-p", "20", "-w", str(out), text], check=True)
    else:
        raise RuntimeError("No TTS engine found (install piper-tts, or espeak-ng)")


def read_wav(path: Path) -> tuple[int, np.ndarray]:
    sr, x = wavfile.read(path)
    x = x.astype(np.float64)
    if x.dtype.kind in "iu" or np.abs(x).max() > 2:
        x /= 32768.0
    if x.ndim == 2:
        x = x.mean(1)
    return sr, x


def trim_silence(x: np.ndarray, sr: int, thresh: float = 0.01) -> np.ndarray:
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    pad = int(0.02 * sr)
    return x[max(0, idx[0] - pad) : idx[-1] + pad]


PITCH = 0.72  # asetrate factor: lowers pitch AND slows the delivery (creepier)


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def build_voice_line(line: dict, tmp: Path) -> tuple[np.ndarray, list[dict]]:
    parts, sr = [], None
    for i, text in enumerate(line["parts"]):
        p = tmp / f"{line['id']}_{i}.wav"
        tts(text, p)
        sr, x = read_wav(p)
        parts.append(trim_silence(x, sr))
    gap = np.zeros(int(line["gap"] * sr))
    raw = []
    timings, cursor = [], 0.0
    for i, x in enumerate(parts):
        if i:
            raw.append(gap)
            cursor += len(gap) / sr
        timings.append({"text": line["parts"][i], "start": cursor, "end": cursor + len(x) / sr})
        cursor += len(x) / sr
        raw.append(x)
    raw = np.concatenate(raw)
    raw_path = tmp / f"{line['id']}_raw.wav"
    wavfile.write(raw_path, sr, (raw / (np.abs(raw).max() + 1e-9) * 0.9 * 32767).astype(np.int16))

    stretch = 1 / PITCH
    natural = len(raw) / sr * stretch
    tempo = max(1.0, natural / line["maxDur"])  # speed up only if it would overrun its scene
    dry_path = tmp / f"{line['id']}_dry.wav"
    wet_path = ROOT / "public" / "audio" / f"voice_{line['id']}.wav"
    # Pitch down (asetrate) + sub-octave layer (rubberband) + chest EQ + dark reverb (aecho).
    chain = (
        f"[0:a]asetrate={sr}*{PITCH},aresample=48000,atempo={tempo:.4f},asplit=2[a][b];"
        f"[b]rubberband=pitch=0.5,lowpass=f=900[sub];"
        f"[a][sub]amix=inputs=2:weights='1 0.7':normalize=0,"
        f"highpass=f=55,equalizer=f=140:t=q:w=1.2:g=6,equalizer=f=2600:t=q:w=1.5:g=3,lowpass=f=7000,"
        f"acompressor=threshold=-18dB:ratio=4:attack=5:release=120:makeup=4"
    )
    ffmpeg("-i", str(raw_path), "-filter_complex", chain + "[out]", "-map", "[out]", "-ac", "1", str(dry_path))
    ffmpeg(
        "-i", str(dry_path),
        "-af",
        "apad=pad_dur=1.6,aecho=0.85:0.75:45|95|170|290:0.42|0.30|0.20|0.12,"
        "aecho=0.8:0.6:600:0.18,lowpass=f=7500,aformat=channel_layouts=stereo",
        "-ar", "48000", str(wet_path),
    )
    _, dry = read_wav(dry_path)
    sr2, wet = wavfile.read(wet_path)
    wet = wet.astype(np.float64)
    if np.abs(wet).max() > 2:
        wet /= 32768.0
    factor = stretch / tempo
    timings = [{"text": t["text"], "start": round(t["start"] * factor, 3), "end": round(t["end"] * factor, 3)} for t in timings]
    return wet, dry, timings


def mouth_envelope(dry: np.ndarray, fps: int) -> list[float]:
    hop = SR // fps
    frames = int(np.ceil(len(dry) / hop))
    rms = np.array([np.sqrt(np.mean(dry[i * hop : (i + 1) * hop] ** 2) + 1e-12) for i in range(frames)])
    rms = rms / (rms.max() + 1e-9)
    rms = np.clip((rms - 0.06) / 0.94, 0, 1) ** 0.7
    return [round(float(v), 3) for v in rms]


# ----------------------------------------------------------------------------- arrangement
def build() -> None:
    (ROOT / "public" / "audio").mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "generated").mkdir(parents=True, exist_ok=True)
    sc = TL["scenes"]
    fx = Bus()

    print("• music")
    music = build_music()

    print("• sound effects")
    # INTRO ---------------------------------------------------------------
    fx.add(drone(2.1, 36.7, 1.2), 0.0, 1.0)
    for i, t in enumerate(TL["intro"]["heartbeats"]):
        fx.add(heartbeat(0.7 + 0.08 * i), t, 1.0)
    a, b = TL["intro"]["headTurn"]
    fx.add(creak(b - a), a, 0.55, -0.1)
    fx.add(shimmer(1450, 1.2), TL["intro"]["eyesGlow"], 0.5)
    fx.add(riser(0.45, 0.8), sc["green"][0] - 0.45, 0.8)

    # GREEN LIGHT ---------------------------------------------------------
    g = sc["green"][0]
    fx.add(impact(1.0), g, 1.0)
    fx.add(whoosh(0.5, 600, 6000), g - 0.05, 0.7, 0.3)
    fx.add(footsteps(sc["green"][1] - g + 3, 26), g + 0.15, 0.55)
    fx.add(whoosh(0.35, 400, 5000, 0.6), 3.0, 0.6, -0.4)
    fx.add(whoosh(0.35, 400, 5000, 0.6), 4.0, 0.6, 0.4)

    # GIFTS ---------------------------------------------------------------
    fx.add(whoosh(0.45, 2000, 300), sc["gifts"][0] - 0.1, 0.6)
    notes = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0]
    for i, t in enumerate(TL["gifts"]["drops"]):
        fx.add(bell(notes[i % 5], 0.5), t, 0.5, RNG.uniform(-0.6, 0.6))
        fx.add(pop(0.55, 1.2 + 0.1 * (i % 4)), t + 0.06, 0.7, RNG.uniform(-0.5, 0.5))
    for i, (t, _) in enumerate(TL["gifts"]["combo"]):
        fx.add(impact(0.45, 0.9), t, 0.6)
        fx.add(shimmer(1800 * (1.25**i), 0.8), t, 0.7)
        fx.add(whoosh(0.3, 500, 7000, 0.5), t - 0.15, 0.6)
    fx.add(riser(0.6, 0.9), sc["red"][0] - 0.6, 0.85)

    # RED LIGHT -----------------------------------------------------------
    r = sc["red"][0]
    fx.add(impact(1.3, 2.2), r, 1.1)
    fx.add(red_stab(), r, 0.9)
    fx.add(drone(sc["ask"][1] - r, 41.2, 1.5), r, 1.0)
    s0, s1 = TL["red"]["spin"]
    fx.add(whoosh(s1 - s0 + 0.1, 200, 3500, 1.0), s0, 0.9)
    fx.add(creak(0.4), s0 + 0.05, 0.4)
    a, b = TL["red"]["scan"]
    fx.add(scan_beam(b - a), a, 0.9)
    fx.add(alarm(3), TL["red"]["caught"], 0.6)
    fx.add(pop(1.2, 0.8), TL["red"]["puff"], 1.0)
    fx.add(impact(0.5, 1.0), TL["red"]["puff"], 0.5)

    # ASK THE DOLL ---------------------------------------------------------
    c = TL["ask"]["comment"]
    fx.add(pop(0.7, 1.8), c, 0.8)
    fx.add(bell(1568, 0.4), c + 0.03, 0.35)
    for t in np.arange(11.3, 16.6, 0.85):
        fx.add(heartbeat(0.45), float(t), 0.7)
    fx.add(whoosh(1.4, 120, 900, 0.8), TL["ask"]["zoom"][0], 0.7)
    fx.add(riser(0.8, 1.0), sc["montage"][0] - 0.8, 0.9)

    # MONTAGE --------------------------------------------------------------
    prev = None
    for t, kind, count in TL["montage"]["phases"]:
        if kind == "green":
            fx.add(impact(0.8, 1.0), t, 0.85)
            fx.add(whoosh(0.3, 500, 6000, 0.6), t - 0.1, 0.6)
        else:
            fx.add(impact(1.1, 1.2), t, 1.0)
            fx.add(red_stab(), t, 0.5)
            fx.add(scan_beam(0.45), t + 0.02, 0.5)
            if prev is not None and count < prev:
                for j in range(6):
                    fx.add(tick(), t + 0.05 + j * 0.05, 0.8)
                for j in range(3):
                    fx.add(pop(0.5, 1 + 0.2 * j), t + 0.18 + j * 0.07, 0.6, RNG.uniform(-0.6, 0.6))
        prev = count
    fx.add(whoosh(0.45, 300, 5000, 0.8), TL["montage"]["leaderboard"] - 0.1, 0.7, -0.5)
    fx.add(riser(0.5, 1.0), sc["winner"][0] - 0.5, 0.9)

    # WINNER ---------------------------------------------------------------
    w = sc["winner"][0]
    fx.add(impact(0.9), w, 0.8)
    x = TL["winner"]["cross"]
    fx.add(impact(1.2, 2.0), x, 1.0)
    fx.add(shimmer(2093, 1.6), x, 0.9)
    fx.add(shimmer(2637, 1.6), x + 0.08, 0.7)
    fx.add(crowd_cheer(sc["winner"][1] - x + 1.2), x - 0.05, 0.95)
    for j in range(5):
        fx.add(pop(0.5, 1.5 + 0.2 * j), x + 0.05 + j * 0.09, 0.6, RNG.uniform(-0.8, 0.8))

    # END CARD -------------------------------------------------------------
    e = TL["end"]["hit"]
    fx.add(whoosh(0.5, 300, 7000), e - 0.3, 0.7)
    fx.add(impact(1.1, 2.0), e, 1.0)
    fx.add(shimmer(1760, 1.2), e + 1.0, 0.5)
    fx.add(shimmer(2093, 1.2), e + 2.0, 0.5)
    fx.add(impact(0.8, 1.6), DUR - 1.0, 0.7)

    print("• doll voice (TTS -> pitch down -> reverb)")
    vbus = Bus()
    meta = {"fps": TL["fps"], "lines": []}
    with tempfile.TemporaryDirectory() as td:
        for line in TL["voice"]:
            wet, dry, timings = build_voice_line(line, Path(td))
            vbus.add(wet, line["start"], 1.0)
            meta["lines"].append(
                {
                    "id": line["id"],
                    "start": line["start"],
                    "duration": round(len(dry) / SR, 3),
                    "words": [{**t, "start": round(line["start"] + t["start"], 3), "end": round(line["start"] + t["end"], 3)} for t in timings],
                    "mouth": mouth_envelope(dry, TL["fps"]),
                }
            )
            print(f"   {line['id']}: {len(dry) / SR:.2f}s starting at {line['start']}s")
    (ROOT / "src" / "generated" / "voice.json").write_text(json.dumps(meta, indent=1))

    print("• mix + master")
    # duck music & fx under the voice
    venv = np.abs(vbus.x).mean(1)
    venv = lp(venv, 8)
    duck = 1 - 0.45 * np.clip(venv / (venv.max() + 1e-9) * 3, 0, 1)
    mix = music * 0.62 + fx.x * 0.8 * duck[:, None] + vbus.x * 1.5
    mix = hp(mix.T, 25).T
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.95  # soft-clip glue
    tmp_mix = ROOT / "public" / "audio" / "_premaster.wav"
    wavfile.write(tmp_mix, SR, (mix * 32767).astype(np.int16))
    ffmpeg(
        "-i", str(tmp_mix),
        "-af", "loudnorm=I=-12:TP=-1.0:LRA=9,alimiter=limit=0.89",
        "-ar", "48000", "-t", str(DUR), str(ROOT / "public" / "audio" / "soundtrack.wav"),
    )
    tmp_mix.unlink()
    print("✓ public/audio/soundtrack.wav")


if __name__ == "__main__":
    os.chdir(ROOT)
    build()
