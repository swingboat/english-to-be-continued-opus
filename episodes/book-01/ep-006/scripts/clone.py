"""Voice every character line by cloning the reference voices in voices/book-01 with Qwen3-TTS Base.

Run with the shared Qwen3-TTS environment (see package.json "audio"). Each part gets several takes
(different seeds); check.py transcribes them and picks the best one.
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import mlx.core as mx
import numpy as np
from mlx_audio.audio_io import write
from mlx_audio.tts.utils import load_model

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lines import CLONE, STORY, VOICES, clone_parts  # noqa: E402

ENGINE = Path("/Users/huyin/Swingboat/audio-research/experiments/tts/qwen3-tts")
MODEL = "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit"
REVISION = "e7dd0585652209fa0d7783659aad4e8a324de11c"
TAKES = int(os.environ.get("TAKES", "3"))
PARAMS = {"temperature": 0.7, "top_p": 0.9, "top_k": 50}
REFS = Path(STORY["voiceRefs"])


def ref_of(name):
    wav = REFS / name / f"{name}.wav"
    return wav, (REFS / name / f"{name}.txt").read_text().strip(), hashlib.sha256(wav.read_bytes()).hexdigest()[:16]


def main():
    CLONE.mkdir(parents=True, exist_ok=True)
    todo = []
    only = set(filter(None, os.environ.get("ONLY", "").split(",")))
    for job_id, who, text in clone_parts():
        if only and job_id not in only:
            continue
        wav, ref_text, digest = ref_of(VOICES[who]["ref"])
        for k in range(1, TAKES + 1):
            sig = json.dumps([MODEL, REVISION, digest, ref_text, text, k, PARAMS], ensure_ascii=False)
            out, key = CLONE / f"{job_id}.t{k}.wav", CLONE / f"{job_id}.t{k}.key"
            if not out.exists() or not key.exists() or key.read_text() != sig:
                todo.append((job_id, k, text, wav, ref_text, out, key, sig))
    print(f"clone: {len(todo)} takes to generate", flush=True)
    if not todo:
        return
    model = load_model(str(ENGINE / "cache/huggingface/hub" / ("models--" + MODEL.replace("/", "--")) / "snapshots" / REVISION))
    for i, (job_id, k, text, wav, ref_text, out, key, sig) in enumerate(todo, 1):
        t = time.time()
        mx.random.seed(1000 * k + 7)
        chunks = [np.array(r.audio) for r in model.generate(
            text=text, ref_audio=str(wav), ref_text=ref_text, lang_code="english", max_tokens=600, **PARAMS)]
        audio = np.concatenate(chunks).astype(np.float32)
        if not np.isfinite(audio).all() or np.abs(audio).max() < 1e-3:
            raise RuntimeError(f"bad audio for {job_id} take {k}")
        write(str(out), audio, model.sample_rate)
        key.write_text(sig)
        print(f"[{i}/{len(todo)}] {job_id}.t{k} {len(audio) / model.sample_rate:.2f}s ({time.time() - t:.1f}s) {text}", flush=True)
        mx.clear_cache()


main()
