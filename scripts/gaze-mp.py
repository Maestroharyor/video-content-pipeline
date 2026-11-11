# Lens vs teleprompter detector built on MediaPipe Face Landmarker (iris landmarks 468-477 + blendshapes + head pose).
#
#   assets/.cache/gaze-venv/bin/python -I scripts/gaze-mp.py projects/<slug>/aroll-clean.mp4 \
#       [--crop auto|w:h:x:y] --fps 8 --out projects/<slug>/gaze-mp.csv \
#       --lens 0-30,30.8-35 --read 307-320,347.5-363 [--min 4] [--bridge 1] [--smooth 2] [--reuse]
#
# For a model trained once on many past videos and reused, see scripts/gaze-model.py; this script fits one video.
#
# Why: scripts/gaze.swift + lens-runs.py cluster Vision's eye darkness / lid / pupil height with 2-means and no labels.
# On react-to-solid the teleprompter sits so close to the lens that those cues barely move, and the clusters split on
# lighting and head angle instead of gaze. This script measures the eye geometry directly (iris centre inside each eye,
# from the corners and lids; eye openness; MediaPipe's eyeLook* blendshapes; head pitch/yaw from the face transform)
# plus reading saccades (iris x drifting rightwards and snapping back, over a 2 s window), then fits a small logistic
# regression on spans the speaker labelled himself (--lens / --read, recording time) and reports leave-one-span-out
# accuracy so you can see whether the fit generalises before trusting its runs.
#
# Setup (once): /opt/miniconda3/bin/python3.12 -m venv assets/.cache/gaze-venv
#   assets/.cache/gaze-venv/bin/pip install mediapipe opencv-python-headless numpy
#   curl -L -o assets/.cache/gaze-models/face_landmarker.task \
#     https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
#
# Output: the CSV (t, raw + rolling features, p_lens, p_smooth, lens) and the lens runs >= --min seconds, smoothed with
# a --smooth s rolling median and gaps < --bridge s bridged. Raw per-frame features are cached beside the CSV
# (<out>.raw.csv); --reuse skips the video pass. Proposals only: never override what the speaker says he did.
import csv, math, os, subprocess, sys

import numpy as np

args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
SRC = args[0]
CROP = opt('--crop', 'auto')                # 'auto' finds the face; or ffmpeg w:h:x:y
FPS = float(opt('--fps', 8))
OUT = opt('--out', os.path.join(os.path.dirname(SRC), 'gaze-mp.csv'))
RAW = OUT.replace('.csv', '') + '.raw.csv'
MIN, BRIDGE, SMOOTH = float(opt('--min', 4)), float(opt('--bridge', 1)), float(opt('--smooth', 2))
MODEL = opt('--model', 'assets/.cache/gaze-models/face_landmarker.task')
spans = lambda s: [tuple(map(float, p.split('-'))) for p in s.split(',')] if s else []
LENS, READ = spans(opt('--lens', '')), spans(opt('--read', ''))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gaze_core import RAW_COLS, NAMES, fit_lr, runs_of as _runs, roll, load_raw, save_raw  # noqa: E402
import gaze_core as G  # noqa: E402


def extract():
    rows, _ = G.extract(SRC, FPS, CROP, MODEL, log=lambda m: print(m, file=sys.stderr, flush=True))
    save_raw(RAW, rows)


features = lambda D: G.features(D, FPS)
runs_of = lambda t, on: _runs(t, on, 1 / FPS)


def main():
    if '--reuse' not in args or not os.path.exists(RAW): extract()
    D = load_raw(RAW)
    t = D['t']
    F = features(D)
    names = NAMES
    Xall = np.column_stack([F[n] for n in names])
    labels = [(a, b, 1) for a, b in LENS] + [(a, b, 0) for a, b in READ]
    span_id = np.full(len(t), -1)
    for j, (a, b, _) in enumerate(labels): span_id[(t >= a) & (t < b)] = j
    y_all = np.array([labels[j][2] if j >= 0 else -1 for j in span_id])
    good = ~np.isnan(Xall).any(axis=1)
    L = good & (span_id >= 0)

    print('feature means, lens vs reading (labelled frames), and separation d = (lens - read) / pooled sd:')
    for i, n in enumerate(names):
        a, b = Xall[L & (y_all == 1), i], Xall[L & (y_all == 0), i]
        d = (a.mean() - b.mean()) / (math.sqrt((a.var() + b.var()) / 2) or 1)
        print(f'  {n:11s} lens {a.mean():8.4f}  read {b.mean():8.4f}  d {d:+.2f}')

    mu, sd = Xall[L].mean(0), Xall[L].std(0) + 1e-9
    Z = (Xall - mu) / sd

    print('\nleave-one-span-out (fit on the other spans, score the held-out one):')
    for j, (a, b, c) in enumerate(labels):
        tr, te = L & (span_id != j), L & (span_id == j)
        w, b0 = fit_lr(Z[tr], y_all[tr])
        p = 1 / (1 + np.exp(-(Z[te] @ w + b0)))
        print(f'  {"lens" if c else "read"} {a:6.1f}-{b:6.1f}  acc {((p > .5) == c).mean():5.1%}  mean p_lens {p.mean():.2f}')

    w, b0 = fit_lr(Z[L], y_all[L])
    print('\nfull-fit weights (standardised):', ', '.join(f'{n} {wi:+.2f}' for n, wi in zip(names, w)), f'bias {b0:+.2f}')
    p = np.full(len(t), np.nan)
    p[good] = 1 / (1 + np.exp(-(Z[good] @ w + b0)))
    ps = roll(p, int(round(SMOOTH * FPS)) | 1, np.median)
    on = np.nan_to_num(ps, nan=0) > 0.5
    print(f'in-sample accuracy per span (smoothed): ' + ', '.join(
        f'{a:g}-{b:g} {(on[(t >= a) & (t < b)] == bool(c)).mean():.0%}' for a, b, c in labels))

    R = runs_of(t, on)
    merged = []
    for r in R:
        if merged and r[0] - merged[-1][1] < BRIDGE: merged[-1][1] = r[1]
        else: merged.append(r)
    keep = [r for r in merged if r[1] - r[0] >= MIN]
    print(f'\nlens runs >= {MIN:g}s (recording time, {SMOOTH:g}s median, gaps < {BRIDGE:g}s bridged): {len(keep)}')
    for a, b in keep:
        seg = ps[(t >= a) & (t < b)]
        print(f'  {a:7.2f} - {b:7.2f}  ({b - a:5.1f}s)  mean p {np.nanmean(seg):.2f}')
    print(f'  total {sum(b - a for a, b in keep):.1f}s of {t[-1]:.1f}s')

    with open(OUT, 'w', newline='') as f:
        wr = csv.writer(f)
        cols = ['h', 'v', 'open', 'pitch', 'yaw', 'lookDown', 'lookUp', 'lookIn', 'lookOut'] + names
        cols = list(dict.fromkeys(cols))
        wr.writerow(['t'] + cols + ['p_lens', 'p_smooth', 'lens'])
        fmt = lambda x: '' if np.isnan(x) else f'{x:.4f}'
        for i in range(len(t)):
            wr.writerow([f'{t[i]:.3f}'] + [fmt(F[c][i]) for c in cols] + [fmt(p[i]), fmt(ps[i]), int(on[i])])
    print('wrote', OUT)


main()
