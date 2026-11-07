"""Assemble all voice clips: character lines use the Qwen3-TTS reference clones picked by check.py,
lesson/word voices use edge-tts. Trims silence, applies character FX and records durations."""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

import edge_tts

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lines import CLONE, ROOT, STORY, VOICES, jobs, parts  # noqa: E402

OUT = ROOT / "public/audio"
RAW = ROOT / ".cache/tts"
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)
PICK = json.loads((CLONE / "pick.json").read_text()) if (CLONE / "pick.json").exists() else {}

TRIM = (
    "silenceremove=start_periods=1:start_threshold=-46dB:start_silence=0.03,"
    "areverse,silenceremove=start_periods=1:start_threshold=-46dB:start_silence=0.06,areverse"
)
LEVEL = "loudnorm=I=-19:TP=-2:LRA=9"


async def edge(job_id, v, text):
    # spoken spelling only; subtitles keep the original names
    for k in sorted(STORY.get("pronounce", {}), key=len, reverse=True):
        text = text.replace(k, STORY["pronounce"][k])
    raw = RAW / f"{job_id}.mp3"
    key = RAW / f"{job_id}.key"
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
    return raw


async def source(job_id, who, text):
    if "ref" in VOICES[who]:
        if job_id not in PICK or PICK[job_id]["text"] != text:
            raise SystemExit(f"{job_id}: no checked clone take; run clone.py and check.py")
        return CLONE / PICK[job_id]["take"]
    return await edge(job_id, VOICES[who], text)


async def synth(job_id, who, text):
    out = OUT / f"{job_id}.wav"
    ps = parts(job_id, who, text)
    if len(ps) > 1:
        # several characters saying the same line at once
        raws = [await source(*p) for p in ps]
        chain = "".join(f"[{i}]{TRIM},{LEVEL},adelay={i * 60}:all=1,volume={1 - i * 0.12}[a{i}];" for i in range(len(raws)))
        labels = "".join(f"[a{i}]" for i in range(len(raws)))
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for r in raws:
            cmd += ["-i", str(r)]
        cmd += ["-filter_complex", f"{chain}{labels}amix=inputs={len(raws)}:normalize=0:duration=longest,volume=0.72,apad=pad_dur=0.04",
                "-ar", "44100", "-ac", "1", str(out)]
        subprocess.run(cmd, check=True)
    else:
        raw = await source(job_id, who, text)
        af = f"{TRIM},{LEVEL},apad=pad_dur=0.04"
        if VOICES[who].get("fx"):
            af += "," + VOICES[who]["fx"]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-ar", "44100", "-ac", "1", str(out)], check=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)]))
    return job_id, round(dur, 3)


async def main():
    sem = asyncio.Semaphore(3)

    async def run(j):
        async with sem:
            return await synth(*j)

    results = await asyncio.gather(*(run(j) for j in jobs()))
    durations = dict(sorted(results))
    keep = {f"{k}.wav" for k in durations}
    for f in OUT.glob("*.wav"):
        if f.name not in keep:
            f.unlink()
    (ROOT / "data/durations.json").write_text(json.dumps(durations, indent=2, ensure_ascii=False))
    print(f"{len(durations)} clips, total {sum(durations.values()):.1f}s")


asyncio.run(main())
