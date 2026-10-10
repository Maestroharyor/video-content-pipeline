"""Forced alignment: re-times every word of a whisper vo.json against its own recording with torchaudio's MMS_FA.

Whisper's word times drift up to ~0.6s (it put "com" in "example dot com" 0.6s before it is said), which is enough
for a cut at a word edge to clip a word. MMS_FA knows the words already and only finds where each one is, typically
within a couple of frames (20ms each). Each whisper segment is aligned on its own, padded 1.5s either side with a
wildcard token at both ends to soak up the neighbours' speech, because one pass over a whole voiceover would need
tens of GB for the model's attention.

Runs in the private venv assets/.cache/align-venv (torch + torchaudio 2.8; 2.9 removed forced_align):
  assets/.cache/align-venv/bin/python scripts/align.py <vo.json> <out.json>
Words with no letters (a bare number) keep whisper's times, clamped between their aligned neighbours.
"""
import json
import os
import re
import subprocess
import sys

import torch
from torchaudio.pipelines import MMS_FA as BUNDLE

PAD = 1.5


def norm(w):
    return re.sub(r"[^a-z']", "", w.lower().replace("’", "'"))


def main(src, out):
    vo = json.load(open(src))
    # vo.json names its recording relative to its own folder, or (a project's source/ transcript) to the project
    here = os.path.dirname(os.path.abspath(src))
    audio = next(f for f in (os.path.join(here, vo["audio"]), os.path.join(os.path.dirname(here), vo["audio"]), os.path.abspath(vo["audio"])) if os.path.exists(f))
    # ffmpeg decodes (the pipeline's own decoder; torchaudio has no audio backend without another package)
    SR = BUNDLE.sample_rate
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    wav = torch.frombuffer(bytearray(pcm), dtype=torch.float32).unsqueeze(0)
    total = wav.shape[1] / SR
    model = BUNDLE.get_model(with_star=True)
    labels = BUNDLE.get_dict(star="*")
    aligner = BUNDLE.get_aligner()
    words = vo["words"]
    # whisper's segments are word runs split at its segment times; a word belongs to the segment its start is in
    segs = vo.get("segments") or [{"s": words[0]["s"], "e": words[-1]["e"]}]
    groups, k = [], 0
    for i, g in enumerate(segs):
        last = i == len(segs) - 1
        idx = []
        while k < len(words) and (last or words[k]["s"] < segs[i + 1]["s"]):
            idx.append(k)
            k += 1
        if idx:
            groups.append(idx)
    new = [None] * len(words)
    for idx in groups:
        a = max(0.0, words[idx[0]]["s"] - PAD)
        b = min(total, words[idx[-1]]["e"] + PAD)
        chunk = wav[:, int(a * SR):int(b * SR)]
        keep = [i for i in idx if norm(words[i]["w"])]
        if not keep:
            continue
        with torch.inference_mode():
            emission, _ = model(chunk)
        tokens = [[labels[c] for c in norm(words[i]["w"]) if c in labels] for i in keep]
        spans = aligner(emission[0], [[labels["*"]]] + tokens + [[labels["*"]]])[1:-1]
        ratio = chunk.shape[1] / emission.shape[1] / SR
        for i, sp in zip(keep, spans):
            new[i] = {"s": round(a + sp[0].start * ratio, 3), "e": round(a + sp[-1].end * ratio, 3)}
    # unaligned words (numbers): whisper's times, kept inside their aligned neighbours
    for i, w in enumerate(words):
        if new[i] is None:
            lo = next((new[j]["e"] for j in range(i - 1, -1, -1) if new[j]), 0)
            hi = next((new[j]["s"] for j in range(i + 1, len(words)) if new[j]), total)
            new[i] = {"s": round(min(max(w["s"], lo), hi), 3), "e": round(min(max(w["e"], lo), hi), 3)}
    vo["words"] = [{**w, "s": n["s"], "e": n["e"]} for w, n in zip(words, new)]
    vo["audio"] = os.path.relpath(audio, os.path.dirname(os.path.abspath(out)))
    vo["aligned"] = "torchaudio MMS_FA"
    json.dump(vo, open(out, "w"), indent=None)
    open(out, "a").write("\n")
    print(f"{len(words)} words aligned → {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
