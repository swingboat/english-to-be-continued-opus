"""Transcribe every cloned take with Whisper and pick the best one per line -> .cache/clone/pick.json."""
import difflib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

os.environ.setdefault("HF_HUB_OFFLINE", "1")
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lines import CLONE, clone_parts  # noqa: E402

NAMES = {"xiaoman": "xiaoman", "xiaoshuai": "xiaoshuai"}


def words(s):
    return re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("’", "'")).split()


def score(expected, heard):
    a, b = words(expected), words(heard)
    # pinyin names come back spelled in many ways; compare them leniently
    b = [next((n for n in NAMES if difflib.SequenceMatcher(None, n, w).ratio() > 0.6), w) for w in b]
    return difflib.SequenceMatcher(None, a, b).ratio()


def load(path):
    import numpy as np
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"])
    return np.frombuffer(raw, np.float32)


def main():
    cache_file = CLONE / "asr.json"
    cache = json.loads(cache_file.read_text()) if cache_file.exists() else {}
    model = None
    picks, weak = {}, []
    # manual choices after listening, e.g. {"s1n1": 1} = take 1
    override_file = CLONE.parent.parent / "data/voice-picks.json"
    override = json.loads(override_file.read_text()) if override_file.exists() else {}
    for job_id, who, text in clone_parts():
        takes = sorted(CLONE.glob(f"{job_id}.t*.wav"))
        if not takes:
            raise SystemExit(f"no takes for {job_id}; run clone.py first")
        rows = []
        for t in takes:
            sig = f"{t.stat().st_size}-{t.stat().st_mtime_ns}"
            if cache.get(t.name, {}).get("sig") != sig:
                if model is None:
                    from faster_whisper import WhisperModel
                    model = WhisperModel("small", device="cpu", compute_type="int8")
                audio = load(t)
                segs, _ = model.transcribe(audio, language="en", beam_size=5)
                cache[t.name] = {"sig": sig, "text": " ".join(s.text.strip() for s in segs), "dur": len(audio) / 16000}
            c = cache[t.name]
            expect = 0.45 + 0.36 * len(words(text))
            rows.append((round(score(text, c["text"]), 3), -abs(c["dur"] - expect), t.name, c["text"], c["dur"]))
        best = max(rows)
        if job_id in override:
            best = next(r for r in rows if r[2] == f"{job_id}.t{override[job_id]}.wav")
        picks[job_id] = {"take": best[2], "score": best[0], "heard": best[3], "text": text}
        if best[0] < 0.85:
            weak.append(job_id)
        print(f"{best[0]:.2f} {job_id:10s} {best[2]:16s} {best[3]}")
    cache_file.write_text(json.dumps(cache, indent=1, ensure_ascii=False))
    (CLONE / "pick.json").write_text(json.dumps(picks, indent=1, ensure_ascii=False))
    print(f"picked {len(picks)} lines; weak: {weak or 'none'}")


main()
