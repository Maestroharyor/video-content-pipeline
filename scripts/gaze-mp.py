# Lens vs teleprompter detector built on MediaPipe Face Landmarker (iris landmarks 468-477 + blendshapes + head pose).
#
#   assets/.cache/gaze-venv/bin/python -I scripts/gaze-mp.py projects/<slug>/aroll-clean.mp4 \
#       --crop 1300:1300:1150:120 --fps 8 --out projects/<slug>/gaze-mp.csv \
#       --lens 0-30,30.8-35 --read 307-320,347.5-363 [--min 4] [--bridge 1] [--smooth 2] [--reuse]
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
CROP = opt('--crop', '1300:1300:1150:120')
FPS = float(opt('--fps', 8))
OUT = opt('--out', os.path.join(os.path.dirname(SRC), 'gaze-mp.csv'))
RAW = OUT.replace('.csv', '') + '.raw.csv'
MIN, BRIDGE, SMOOTH = float(opt('--min', 4)), float(opt('--bridge', 1)), float(opt('--smooth', 2))
MODEL = opt('--model', 'assets/.cache/gaze-models/face_landmarker.task')
spans = lambda s: [tuple(map(float, p.split('-'))) for p in s.split(',')] if s else []
LENS, READ = spans(opt('--lens', '')), spans(opt('--read', ''))

# MediaPipe face mesh indices. "A" = image-left eye (subject's right), "B" = image-right eye.
EYES = {'A': dict(outer=33, inner=133, top=159, bot=145, iris=468),
        'B': dict(outer=263, inner=362, top=386, bot=374, iris=473)}
RAW_COLS = ['t', 'ok', 'hA', 'hB', 'vA', 'vB', 'openA', 'openB', 'pitch', 'yaw', 'roll',
            'lookDown', 'lookUp', 'lookIn', 'lookOut', 'blink']


def eye_feats(P, e):
    """Iris position inside one eye: h along the corner axis (0 = image-left corner, 1 = image-right), v below the
    corner line in eye widths (+ = lower), openness = lid gap / width."""
    o, i, tp, bt, ir = (P[e[k]] for k in ('outer', 'inner', 'top', 'bot', 'iris'))
    left, right = (o, i) if o[0] < i[0] else (i, o)
    ax = right - left
    w = np.linalg.norm(ax)
    u = ax / w
    n = np.array([-u[1], u[0]])                      # image y grows downward, so +n points down when the eye is level
    d = ir - left
    return float(d @ u / w), float(d @ n / w), float(np.linalg.norm(bt - tp) / w)


def euler(M):
    R = np.asarray(M)[:3, :3]
    pitch = math.degrees(math.atan2(R[2, 1], R[2, 2]))
    yaw = math.degrees(math.asin(max(-1.0, min(1.0, -R[2, 0]))))
    roll = math.degrees(math.atan2(R[1, 0], R[0, 0]))
    return pitch, yaw, roll


def extract():
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    W, H = map(int, CROP.split(':')[:2])
    lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL), running_mode=vision.RunningMode.VIDEO, num_faces=1,
        output_face_blendshapes=True, output_facial_transformation_matrixes=True))
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-hwaccel', 'videotoolbox', '-i', SRC, '-vf',
                           f'fps={FPS},crop={CROP}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    rows, k, size = [], 0, W * H * 3
    while True:
        buf = ff.stdout.read(size)
        if len(buf) < size: break
        t = k / FPS
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.frombuffer(buf, np.uint8).reshape(H, W, 3))
        r = lm.detect_for_video(img, int(round(t * 1000)))
        k += 1
        if not r.face_landmarks:
            rows.append([t, 0] + [float('nan')] * (len(RAW_COLS) - 2)); continue
        P = np.array([[p.x * W, p.y * H] for p in r.face_landmarks[0]])
        (hA, vA, oA), (hB, vB, oB) = eye_feats(P, EYES['A']), eye_feats(P, EYES['B'])
        bs = {c.category_name: c.score for c in r.face_blendshapes[0]}
        side = lambda n: (bs[n + 'Left'] + bs[n + 'Right']) / 2
        rows.append([t, 1, hA, hB, vA, vB, oA, oB, *euler(r.facial_transformation_matrixes[0]),
                     side('eyeLookDown'), side('eyeLookUp'), side('eyeLookIn'), side('eyeLookOut'), side('eyeBlink')])
        if k % 400 == 0: print(f'  {t:7.1f}s', file=sys.stderr, flush=True)
    ff.wait()
    with open(RAW, 'w', newline='') as f:
        w = csv.writer(f); w.writerow(RAW_COLS); w.writerows(rows)


def roll(x, win, fn):
    n, h, out = len(x), win // 2, np.full(len(x), np.nan)
    for i in range(n):
        seg = x[max(0, i - h):i + h + 1]
        seg = seg[~np.isnan(seg)]
        if len(seg) >= 3: out[i] = fn(seg)
    return out


def features(D):
    """Frame features + rolling saccade scores. Iris h is averaged over both eyes, and its slow trend (3 s median) is
    removed so head turns do not read as saccades; what is left is the fast left-right sweep of reading."""
    f = {}
    blink = (D['blink'] > 0.45) | (D['ok'] < 1)
    m = lambda a: np.where(blink, np.nan, a)
    h = m((D['hA'] + D['hB']) / 2)
    f['h'] = h
    f['v'] = m((D['vA'] + D['vB']) / 2)
    f['open'] = np.where(D['ok'] < 1, np.nan, (D['openA'] + D['openB']) / 2)
    for c in ('pitch', 'yaw', 'lookDown', 'lookUp', 'lookIn', 'lookOut'): f[c] = m(D[c])
    win = int(round(2 * FPS)) | 1
    hd = h - roll(h, int(3 * FPS) | 1, np.median)
    f['h_sd'] = roll(hd, win, np.std)                                       # how much the iris moves sideways
    dh = np.diff(hd, prepend=np.nan)
    sdd = np.nanstd(dh)
    # snap-backs: a leftward jump (reading return sweep) bigger than 1.5 sd of all frame-to-frame motion
    f['snaps'] = roll(np.where(np.isnan(dh), np.nan, (dh < -1.5 * sdd).astype(float)), win, np.mean)
    f['drift'] = roll(np.where(np.isnan(dh), np.nan, np.clip(dh, 0, None)), win, np.mean)  # rightward progress
    # smoothed versions of the level features (2 s median), so blinks and single noisy frames do not decide
    for c in ('v', 'open', 'pitch', 'lookDown', 'lookUp', 'h'): f[c + '_m'] = roll(f[c], win, np.median)
    return f


def fit_lr(X, y, l2=1.0, it=3000, lr=0.1):
    w, b = np.zeros(X.shape[1]), 0.0
    pw = len(y) / (2 * np.bincount(y.astype(int), minlength=2).clip(1))   # balance classes
    sw = np.where(y == 1, pw[1], pw[0])
    for _ in range(it):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        g = (p - y) * sw
        w -= lr * (X.T @ g / len(y) + l2 * w / len(y))
        b -= lr * g.mean()
    return w, b


def runs_of(t, on):
    out, s = [], None
    for ti, o in zip(t, on):
        if o and s is None: s = ti
        if not o and s is not None: out.append([s, ti]); s = None
    if s is not None: out.append([s, t[-1] + 1 / FPS])
    return out


def main():
    if '--reuse' not in args or not os.path.exists(RAW): extract()
    rows = list(csv.DictReader(open(RAW)))
    D = {c: np.array([float(r[c]) for r in rows]) for c in RAW_COLS}
    t = D['t']
    F = features(D)
    names = ['v_m', 'open_m', 'pitch_m', 'lookDown_m', 'lookUp_m', 'h_m', 'h_sd', 'snaps', 'drift']
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
