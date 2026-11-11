# One lens-vs-prompter model for a speaker, trained on the videos already edited, saved as a small JSON and reused on
# every new video, on any machine (MediaPipe, no Apple Vision).
#
#   python -I scripts/gaze-model.py train   [--labels assets/gaze-models/lifetechfacts.labels.json] [--out <model.json>]
#   python -I scripts/gaze-model.py predict <footage.mp4> [--model <model.json>] [--timeline projects/<slug>/timeline.json]
#                                           [--min 6] [--bridge 1] [--out <csv>]
#   (python = assets/.cache/gaze-venv/bin/python; setup notes in scripts/gaze-mp.py)
#
# Why: per-video calibration needed his labels every time (worst-week, ai-concepts, reverse-proxy reviews), and
# gaze.swift only runs on macOS. The labels file lists, per past project, the footage and the spans he confirmed: on
# the lens, or reading. Training extracts only those spans (plus 3 s either side for the rolling features), so it takes
# minutes, and reports leave-one-video-out accuracy: each video is scored by a model that never saw it.
#
# The model file holds feature means, weights and the smoothing settings: numbers only, no images, so it can be
# committed and used on another PC without retraining. Extracted eye rows are cached in assets/.cache/gaze-rows/ (ignored).
# predict only proposes: check every window on an eye sheet before a preview, and his labels always win.
import argparse, hashlib, json, os, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gaze_core as G  # noqa: E402

DEF_LABELS = 'assets/gaze-models/lifetechfacts.labels.json'
DEF_MODEL = 'assets/gaze-models/lifetechfacts.json'
CACHE = 'assets/.cache/gaze-rows'
FPS, PAD, SMOOTH = 8, 3.0, 2.0


def log(*a): print(*a, file=sys.stderr, flush=True)


def cached_rows(src, ss=None, to=None):
    st = os.stat(src)
    key = hashlib.sha1(f'{os.path.abspath(src)}|{st.st_size}|{st.st_mtime}|{ss}|{to}|{FPS}'.encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + '.raw.csv')
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        log(f'  extract {os.path.basename(src)} {"" if ss is None else f"{ss:.1f}-{to:.1f}s"}')
        rows, crop = G.extract(src, FPS, 'auto', ss=ss, to=to, log=log)
        G.save_raw(path, rows)
    return G.load_raw(path)


def span_frames(src, a, b):
    """Features for the frames inside [a, b] of src (seconds of the footage)."""
    D = cached_rows(src, max(0.0, a - PAD), b + PAD)
    F = G.features(D, FPS)
    X = np.column_stack([F[n] for n in G.NAMES])
    t = D['t']
    keep = (t >= a) & (t < b) & ~np.isnan(X).any(axis=1)
    return X[keep], t[keep]


def smooth_p(p):
    return G.roll(p, int(round(SMOOTH * FPS)) | 1, np.median)


def gather(labels):
    data = []                                               # (video, span index, label, X)
    for vid, v in labels['videos'].items():
        if v.get('skip'): continue
        src = v['src']
        if not os.path.exists(src): log(f'  missing {src}, skipped'); continue
        for lab, key in ((1, 'lens'), (0, 'read')):
            for a, b in v.get(key, []):
                X, _ = span_frames(src, a, b)
                if len(X): data.append((vid, f'{a:g}-{b:g}', lab, X))
    return data


def fit(data):
    X = np.vstack([d[3] for d in data])
    y = np.concatenate([np.full(len(d[3]), d[2]) for d in data])
    vids = np.concatenate([np.full(len(d[3]), d[0]) for d in data])
    # every video weighs the same, and the two classes weigh the same overall
    sw = np.zeros(len(y))
    for v in set(vids): sw[vids == v] = 1 / (vids == v).sum()
    for c in (0, 1): sw[y == c] *= len(y) / 2 / sw[y == c].sum()
    mu, sd = X.mean(0), X.std(0) + 1e-9
    w, b = G.fit_lr((X - mu) / sd, y, sw)
    return dict(mu=mu, sd=sd, w=w, b=b)


def prob(m, X):
    return 1 / (1 + np.exp(-(((X - np.asarray(m['mu'])) / np.asarray(m['sd'])) @ np.asarray(m['w']) + m['b'])))


def train(a):
    labels = json.load(open(a.labels))
    data = gather(labels)
    vids = sorted({d[0] for d in data})
    log(f'{len(data)} labelled spans from {len(vids)} videos')
    print('leave-one-video-out (each video scored by a model trained without it), frames right per span:')
    tot = {0: [0, 0], 1: [0, 0]}
    for v in vids:
        m = fit([d for d in data if d[0] != v])
        for vid, span, lab, X in [d for d in data if d[0] == v]:
            p = smooth_p(prob(m, X))
            ok = ((np.nan_to_num(p, nan=.5) > .5) == bool(lab))
            tot[lab][0] += ok.sum(); tot[lab][1] += len(ok)
            print(f'  {vid:30s} {"lens" if lab else "read"} {span:>13s}  {ok.mean():5.0%}')
    for lab in (1, 0):
        print(f'  overall {"lens" if lab else "read"}: {tot[lab][0] / max(1, tot[lab][1]):.1%} of {tot[lab][1]} frames')
    m = fit(data)
    out = dict(kind='lens-vs-prompter logistic regression (scripts/gaze-model.py)', speaker=labels.get('speaker', ''),
               features=G.NAMES, fps=FPS, smooth=SMOOTH, mu=m['mu'].round(6).tolist(), sd=m['sd'].round(6).tolist(),
               w=m['w'].round(6).tolist(), b=round(float(m['b']), 6), trained_on=vids,
               frames=int(sum(len(d[3]) for d in data)))
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(out, open(a.out, 'w'), indent=1)
    print('weights:', ', '.join(f'{n} {wi:+.2f}' for n, wi in zip(G.NAMES, m['w'])), f'bias {m["b"]:+.2f}')
    print('wrote', a.out)


def predict(a):
    m = json.load(open(a.model))
    if m['fps'] != FPS: sys.exit(f'model fps {m["fps"]} != {FPS}')
    D = cached_rows(a.src)
    F = G.features(D, FPS)
    X = np.column_stack([F[n] for n in m['features']])
    t = D['t']
    good = ~np.isnan(X).any(axis=1)
    p = np.full(len(t), np.nan)
    p[good] = prob(m, X[good])
    ps = G.roll(p, int(round(m['smooth'] * FPS)) | 1, np.median)
    runs = G.lens_runs(t, ps, 1 / FPS, a.bridge, a.min)
    slides = []
    if a.timeline:
        tl = json.load(open(a.timeline))
        slides = tl.get('slides', tl) if isinstance(tl, dict) else tl
    print(f'lens runs >= {a.min:g}s ({m["smooth"]:g}s median, gaps < {a.bridge:g}s bridged); window `to` = end - 1 - .45:')
    for r0, r1 in runs:
        cov = [s['id'] for s in slides if s['start'] < r1 and s['end'] > r0]
        print(f'  {r0:7.2f} - {r1:7.2f}  ({r1 - r0:5.1f}s)  p {np.nanmean(ps[(t >= r0) & (t < r1)]):.2f}  '
              f'to <= {r1 - 1.45:7.2f}  {" ".join(cov)}')
    print(f'  total {sum(b - a for a, b in runs):.1f}s of {t[-1]:.1f}s')
    if a.out:
        import csv
        with open(a.out, 'w', newline='') as f:
            w = csv.writer(f); w.writerow(['t', 'p_lens', 'p_smooth', 'lens'])
            for i in range(len(t)):
                w.writerow([f'{t[i]:.3f}', '' if np.isnan(p[i]) else f'{p[i]:.4f}',
                            '' if np.isnan(ps[i]) else f'{ps[i]:.4f}', int(np.nan_to_num(ps[i]) > .5)])
        print('wrote', a.out)


ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest='cmd', required=True)
t = sub.add_parser('train'); t.add_argument('--labels', default=DEF_LABELS); t.add_argument('--out', default=DEF_MODEL)
p = sub.add_parser('predict'); p.add_argument('src'); p.add_argument('--model', default=DEF_MODEL)
p.add_argument('--timeline'); p.add_argument('--min', type=float, default=6); p.add_argument('--bridge', type=float, default=1)
p.add_argument('--out')
a = ap.parse_args()
train(a) if a.cmd == 'train' else predict(a)
