"""Shared list of voice jobs, used by clone.py (Qwen3-TTS env), check.py and tts.py (project env)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STORY = json.loads((ROOT / "data/story.json").read_text())
VOICES = STORY["voices"]
CLONE = ROOT / ".cache/clone"


def jobs():
    """(job_id, voice key, text) for every clip in the episode."""
    for scene in STORY["scenes"]:
        for beat in scene["beats"]:
            if beat["kind"] == "line":
                yield beat["id"], beat["who"], beat.get("en") or beat["zh"]
    for n in STORY["narration"]:
        yield n["id"], n["who"], n.get("en") or n["zh"]
    for w in STORY["words"]:
        yield f"w-{w['id']}-en", "word-us", w["word"]
        yield f"w-{w['id']}-def", "lesson", w["en"]
        yield f"r-{w['id']}", "word-us", w["example"]
        if w.get("uk"):
            yield f"w-{w['id']}-gb", "word-gb", w["word"]
    for w in STORY.get("review", []):
        yield f"rv-{w['word']}", "word-us", w["example"]


def parts(job_id, who, text):
    """Expand a job into single-speaker parts (mixed lines become one part per speaker)."""
    v = VOICES[who]
    if "mix" in v:
        return [(f"{job_id}-{m}", m, text) for m in v["mix"]]
    return [(job_id, who, text)]


def clone_parts():
    """Single-speaker parts voiced by a character reference clone."""
    for j in jobs():
        for p in parts(*j):
            if "ref" in VOICES[p[1]]:
                yield p
