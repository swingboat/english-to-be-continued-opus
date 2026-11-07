"""Synthesize all sound effects and a looping background track with numpy."""
from pathlib import Path
import wave

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
SFX = ROOT / "public/sfx"
SFX.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


def lp(x, fc, taps=201):
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc / SR * n) * np.hamming(taps)
    return np.convolve(x, h / h.sum(), mode="same")


def bp(x, lo, hi):
    return lp(x, hi) - lp(x, lo)


def tone(freq, d, decay=6.0, harmonics=((1, 1.0),), attack=0.004):
    t = t_(d)
    f = np.full_like(t, freq) if np.isscalar(freq) else freq
    phase = 2 * np.pi * np.cumsum(f) / SR
    y = sum(a * np.sin(h * phase) for h, a in harmonics)
    env = np.exp(-t * decay) * np.clip(t / attack, 0, 1)
    return y * env


def place(buf, x, at):
    i = int(at * SR)
    end = min(len(buf), i + len(x))
    buf[i:end] += x[: end - i]
    return buf


def save(name, x, peak=0.85):
    x = np.asarray(x, dtype=np.float64)
    m = np.max(np.abs(x)) or 1
    x = x / m * peak
    fade = min(len(x), int(0.01 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    data = (x * 32767).astype(np.int16)
    with wave.open(str(SFX / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def sweep(f0, f1, d, curve="exp"):
    t = t_(d) / d
    return f0 * (f1 / f0) ** t if curve == "exp" else f0 + (f1 - f0) * t


# --- effects -----------------------------------------------------------------
def paper():
    out = np.zeros(int(SR * 0.5))
    r = bp(noise(0.25), 1200, 7000) * np.exp(-t_(0.25) * 22)
    place(out, r, 0.0)
    place(out, 0.6 * bp(noise(0.18), 900, 5000) * np.exp(-t_(0.18) * 30), 0.09)
    place(out, 1.4 * tone(sweep(150, 70, 0.25), 0.25, decay=16), 0.02)
    return out


def twinkle():
    out = np.zeros(int(SR * 1.0))
    for i, f in enumerate([2093, 2637, 3136, 4186]):
        place(out, tone(f, 0.5, decay=8, harmonics=((1, 1), (2.76, 0.25))), i * 0.055)
    return out


def sparkle():
    d = 1.9
    out = np.zeros(int(SR * d))
    notes = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637, 3136]
    for i, f in enumerate(notes):
        place(out, 0.6 * tone(f, 0.35, decay=10, harmonics=((1, 1), (3, 0.15))), i * 0.075)
    sh = bp(noise(1.2), 5000, 12000) * np.linspace(0, 1, int(SR * 1.2)) ** 2 * 0.5
    place(out, sh, 0.0)
    poof = lp(noise(0.6), 900) * np.exp(-t_(0.6) * 7) * 3
    place(out, poof, 1.15)
    for f in (1047, 1319, 1568, 2093):
        place(out, 0.5 * tone(f, 0.7, decay=5, harmonics=((1, 1), (2, 0.2))), 1.15)
    return out


def notify():
    out = np.zeros(int(SR * 0.7))
    h = ((1, 1), (4, 0.18))
    place(out, tone(1318.5, 0.4, decay=11, harmonics=h), 0)
    place(out, tone(1975.5, 0.5, decay=9, harmonics=h), 0.12)
    return out


def powerdown():
    d = 0.8
    f = sweep(900, 60, d)
    y = np.tanh(2.5 * tone(f, d, decay=2.5))
    return y


def tap():
    out = np.zeros(int(SR * 0.15))
    place(out, lp(noise(0.012), 6000) * 0.8, 0)
    place(out, tone(1800, 0.05, decay=60), 0)
    return out


def whoosh(d=0.5):
    n = lp(noise(d), 1400)
    carrier = np.sin(2 * np.pi * np.cumsum(sweep(250, 2600, d)) / SR)
    env = np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) ** 2
    return n * carrier * env + 0.25 * bp(noise(d), 2000, 8000) * env


def bonk():
    out = np.zeros(int(SR * 0.4))
    place(out, tone(sweep(420, 140, 0.25), 0.25, decay=14, harmonics=((1, 1), (2, 0.3))), 0)
    place(out, lp(noise(0.02), 4000), 0)
    return out


def boing():
    d = 0.7
    t = t_(d)
    f = 180 * (1 + 2.2 * t) * (1 + 0.22 * np.sin(2 * np.pi * 16 * t))
    return tone(f, d, decay=4, harmonics=((1, 1), (2, 0.25)))


def stamp():
    out = np.zeros(int(SR * 0.7))
    place(out, 1.6 * tone(sweep(110, 50, 0.4), 0.4, decay=9), 0)
    place(out, lp(noise(0.05), 3500) * np.exp(-t_(0.05) * 60), 0)
    tail = lp(noise(0.5), 1200) * np.exp(-t_(0.5) * 12) * 0.15
    place(out, tail, 0.02)
    return out


def clap():
    d = 2.0
    out = np.zeros(int(SR * d))
    for _ in range(70):
        at = rng.uniform(0, 1.6)
        c = bp(noise(0.04), 700, 3200) * np.exp(-t_(0.04) * 110) * rng.uniform(0.4, 1)
        place(out, c, at)
    env = np.minimum(1, t_(d) / 0.25) * np.clip((d - t_(d)) / 0.8, 0, 1)
    return out * env


def scratch():
    d = 0.42
    t = t_(d) / d
    f = 180 + 1300 * np.sin(np.pi * t) ** 2 * (1 - 0.6 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    y = np.tanh(3 * (0.6 * saw + 0.5 * lp(noise(d), 3000))) * np.sin(np.pi * t) ** 0.5
    return y


def steps():
    out = np.zeros(int(SR * 1.2))
    for i in range(4):
        k = 1 - i * 0.12
        place(out, tone(sweep(120, 70, 0.08), 0.08, decay=40) * 1.3 * k, i * 0.26)
        place(out, lp(noise(0.03), 2500) * np.exp(-t_(0.03) * 90) * 0.5 * k, i * 0.26)
    return out


def brass(freq, d, decay=1.2):
    harm = tuple((n, 1 / n) for n in range(1, 9))
    t = t_(d)
    y = tone(freq, d, decay=decay, harmonics=harm, attack=0.02)
    return lp(y, 2200) * (1 + 0.06 * np.sin(2 * np.pi * 5.5 * t))


def dun():
    out = np.zeros(int(SR * 2.4))
    place(out, brass(233.1, 0.3, 5) + brass(116.5, 0.3, 5), 0)
    place(out, brass(220.0, 0.3, 5) + brass(110.0, 0.3, 5), 0.32)
    for f in (174.6, 207.7, 246.9, 87.3):
        place(out, brass(f, 1.7, 1.4), 0.66)
    return out


def error():
    out = np.zeros(int(SR * 0.5))
    sq = lambda f, d: np.tanh(4 * np.sin(2 * np.pi * f * t_(d))) * np.exp(-t_(d) * 6)
    place(out, sq(240, 0.14), 0)
    place(out, sq(170, 0.22), 0.17)
    return lp(out, 2500)


def tick():
    return place(tone(1500, 0.05, decay=80), lp(noise(0.006), 5000) * 0.5, 0)


def ding():
    out = tone(1568, 1.2, decay=3.5, harmonics=((1, 1), (2, 0.3), (2.76, 0.15)))
    return place(out, 0.6 * tone(2093, 1.0, decay=4), 0.08)


def pop():
    return tone(sweep(500, 1300, 0.07), 0.07, decay=30)


def rewind():
    d = 1.3
    t = t_(d)
    f = sweep(300, 2400, d) * (1 + 0.12 * np.sin(2 * np.pi * 22 * t))
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    y = lp(saw, 4000) * 0.5 + bp(noise(d), 1500, 6000) * 0.35
    return y * np.minimum(1, t / 0.08) * np.clip((d - t) / 0.15, 0, 1)


def tbc():
    d = 3.2
    out = np.zeros(int(SR * d))
    for f in (110, 220, 261.6, 329.6, 440):
        place(out, brass(f, d, decay=0.9), 0)
    t = t_(d)
    return out * (1 + 0.3 * np.sin(2 * np.pi * 7 * t))


def flip():
    return place(0.6 * whoosh(0.3), pop(), 0.2)


# --- background music -----------------------------------------------------------
def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def pluck(f, d):
    harm = tuple((n, 1 / n ** 1.2) for n in range(1, 7))
    t = t_(d)
    phase = 2 * np.pi * f * t
    y = sum(a * np.sin(h * phase) * np.exp(-t * (2.5 + h * 1.8)) for h, a in harm)
    return y * np.clip(t / 0.003, 0, 1)


def bgm():
    bpm = 112
    beat = 60 / bpm
    bars = 8
    length = bars * 4 * beat
    out = np.zeros(int(SR * (length + 2)))
    chords = [[60, 64, 67], [55, 59, 62, 67], [57, 60, 64], [53, 57, 60, 65]] * 2
    roots = [36, 43, 45, 41] * 2
    strum = [(0, 1.0), (1, 0.5), (1.5, 0.7), (2.5, 0.6), (3, 0.8), (3.5, 0.5)]
    melody = [
        [(0, 76, 1), (1, 79, 1), (2, 81, 1), (3, 79, 1)],
        [(0, 74, 1.5), (2, 79, 2)],
        [(0, 72, 1), (1, 76, 1), (2, 81, 1), (3, 79, 1)],
        [(0, 77, 1), (1, 76, 1), (2, 74, 2)],
        [(0, 76, 0.5), (0.5, 79, 0.5), (1, 84, 1), (2, 81, 1), (3, 79, 1)],
        [(0, 79, 1), (1, 74, 1), (2, 79, 2)],
        [(0, 81, 1), (1, 79, 1), (2, 76, 1), (3, 72, 1)],
        [(0, 74, 1), (1, 76, 1), (2, 72, 2)],
    ]
    for b in range(bars):
        t0 = b * 4 * beat
        for pos, acc in strum:
            for k, n in enumerate(chords[b]):
                place(out, 0.16 * acc * pluck(midi(n + 12), 0.9), t0 + pos * beat + k * 0.012)
        for pos in (0, 2, 3.5):
            n = roots[b] + (12 if pos == 3.5 else 0)
            place(out, 0.5 * tone(midi(n), beat * 1.4, decay=2.5, harmonics=((1, 1), (2, 0.35))), t0 + pos * beat)
        for pos, n, d in melody[b]:
            place(out, 0.14 * tone(midi(n), d * beat + 0.5, decay=3, harmonics=((1, 1), (2.76, 0.2), (5.4, 0.05))), t0 + pos * beat)
        for q in range(4):
            if q in (0, 2):
                place(out, 0.7 * tone(sweep(120, 45, 0.18), 0.18, decay=18), t0 + q * beat)
            else:
                place(out, 0.18 * bp(noise(0.12), 900, 4000) * np.exp(-t_(0.12) * 35), t0 + q * beat)
            for s in range(4):
                place(out, 0.05 * bp(noise(0.04), 6000, 12000) * np.exp(-t_(0.04) * 70) * (1.0 if s % 2 else 0.6), t0 + (q + s / 4) * beat)
    n = int(SR * length)
    loop = out[:n].copy()
    loop[: len(out) - n] += out[n:]
    return loop


if __name__ == "__main__":
    effects = {
        "paper": paper, "twinkle": twinkle, "sparkle": sparkle, "notify": notify, "powerdown": powerdown,
        "tap": tap, "whoosh": whoosh, "bonk": bonk, "boing": boing, "stamp": stamp, "clap": clap,
        "scratch": scratch, "steps": steps, "dun": dun, "error": error, "tick": tick, "ding": ding,
        "pop": pop, "rewind": rewind, "tbc": tbc, "flip": flip,
    }
    for name, fn in effects.items():
        save(name, fn())
    save("bgm", bgm(), peak=0.7)
    print("wrote", len(effects) + 1, "files to", SFX)
