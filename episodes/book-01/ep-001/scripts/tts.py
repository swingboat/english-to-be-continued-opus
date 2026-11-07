"""Generate all voice lines with edge-tts, trim silence, apply character FX, and record durations."""
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
STORY = json.loads((ROOT / "data/story.json").read_text())
OUT = ROOT / "public/audio"
RAW = ROOT / ".cache/tts"
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)

TRIM = (
    "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.03,"
    "areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06,areverse"
)


def jobs():
    for scene in STORY["scenes"]:
        for beat in scene["beats"]:
            if beat["kind"] == "line":
                yield beat["id"], beat["who"], beat.get("en") or beat["zh"]
    for n in STORY["narration"]:
        yield n["id"], n["who"], n.get("en") or n["zh"]
    for w in STORY["words"]:
        yield f"w-{w['word']}-en", "word-us", w["word"]
        yield f"w-{w['word']}-def", "lesson", w["en"]
        yield f"r-{w['word']}", "word-us", w["example"]
    yield "w-schedule-gb", "word-gb", "schedule"


async def synth(job_id, who, text):
    v = STORY["voices"][who]
    raw = RAW / f"{job_id}.mp3"
    key = RAW / f"{job_id}.key"
    # spoken spelling only; subtitles keep the original names
    for k in sorted(STORY.get("pronounce", {}), key=len, reverse=True):
        text = text.replace(k, STORY["pronounce"][k])
    sig = json.dumps([v, text], ensure_ascii=False)
    if not raw.exists() or not key.exists() or key.read_text() != sig:
        for attempt in range(5):
            try:
                await edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"]).save(str(raw))
                break
            except edge_tts.exceptions.NoAudioReceived:
                if attempt == 4:
                    raise
                await asyncio.sleep(2 + attempt * 2)
        key.write_text(sig)
    af = TRIM + ",apad=pad_dur=0.04"
    if v.get("fx"):
        af += "," + v["fx"]
    out = OUT / f"{job_id}.wav"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-ar", "44100", "-ac", "1", str(out)],
        check=True,
    )
    dur = float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)]
        )
    )
    return job_id, round(dur, 3)


async def main():
    sem = asyncio.Semaphore(3)

    async def run(j):
        async with sem:
            try:
                return await synth(*j)
            except Exception:
                print("FAILED JOB:", j, STORY["voices"][j[1]], flush=True)
                raise

    results = await asyncio.gather(*(run(j) for j in jobs()))
    durations = dict(sorted(results))
    (ROOT / "data/durations.json").write_text(json.dumps(durations, indent=2, ensure_ascii=False))
    print(f"{len(durations)} clips, total {sum(durations.values()):.1f}s")


asyncio.run(main())
