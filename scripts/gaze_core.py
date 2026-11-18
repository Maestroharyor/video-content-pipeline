# Shared parts of the MediaPipe lens detector: eye measurements from a video, the per-frame features, a small logistic
# regression and run finding. Used by scripts/gaze-mp.py (one video, labels given on the command line) and
# scripts/gaze-model.py (one model trained on many past videos, saved in assets/gaze-models/ and loaded by default).
# Runs on any OS: MediaPipe + ffmpeg + numpy, no Apple Vision.
import math, subprocess

import numpy as np

# MediaPipe face mesh indices. "A" = image-left eye (subject's right), "B" = image-right eye.
EYES = {'A': dict(outer=33, inner=133, top=159, bot=145, iris=468),
        'B': dict(outer=263, inner=362, top=386, bot=374, iris=473)}
RAW_COLS = ['t', 'ok', 'hA', 'hB', 'vA', 'vB', 'openA', 'openB', 'pitch', 'yaw', 'roll',
            'lookDown', 'lookUp', 'lookIn', 'lookOut', 'blink']
NAMES = ['v_m', 'open_m', 'pitch_m', 'lookDown_m', 'lookUp_m', 'h_m', 'h_sd', 'snaps', 'drift']
DEFAULT_TASK = 'assets/.cache/gaze-models/face_landmarker.task'
TASK_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'


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


def probe(src):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                          '-of', 'csv=p=0', src], capture_output=True, text=True, check=True).stdout.strip()
    w, h = out.split('\n')[0].split(',')[:2]
    return int(w), int(h)


def _frames(src, fps, vf, W, H, ss=None, to=None):
    cmd = ['ffmpeg', '-v', 'error']
    if ss is not None: cmd += ['-ss', f'{ss:.3f}']
    cmd += ['-i', src]
    if to is not None: cmd += ['-t', f'{to - (ss or 0):.3f}']
    cmd += ['-vf', f'fps={fps},{vf}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    ff = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H * 3
    while True:
        buf = ff.stdout.read(size)
        if len(buf) < size: break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    ff.wait()


def auto_crop(src, task=DEFAULT_TASK, ss=None, to=None, samples=6):
    """A square crop around the face, found on a few downscaled frames, so no per-video crop has to be recorded.
    Returns ffmpeg crop w:h:x:y in source pixels (face box x 1.9, clamped to the frame)."""
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    W, H = probe(src)
    sw = 960
    sh = int(round(H * sw / W / 2)) * 2
    a = ss or 0
    span = (to - a) if to is not None else None
    fps = samples / span if span else 0.1
    lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=task), running_mode=vision.RunningMode.IMAGE, num_faces=1))
    boxes = []
    for img in _frames(src, fps, f'scale={sw}:{sh}', sw, sh, ss, to):
        r = lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
        if r.face_landmarks:
            P = np.array([[p.x * W, p.y * H] for p in r.face_landmarks[0]])
            boxes.append((*P.min(0), *P.max(0)))
        if len(boxes) >= samples: break
    if not boxes: raise SystemExit(f'gaze: no face found in {src}')
    x0, y0, x1, y1 = np.median(np.array(boxes), axis=0)
    side = min(int(max(x1 - x0, y1 - y0) * 1.9) // 2 * 2, W, H)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    x = int(min(max(cx - side / 2, 0), W - side)) // 2 * 2
    y = int(min(max(cy - side / 2, 0), H - side)) // 2 * 2
    return f'{side}:{side}:{x}:{y}'


def extract(src, fps=8, crop='auto', task=DEFAULT_TASK, ss=None, to=None, size=640, log=None):
    """Per-frame eye rows (RAW_COLS) at `fps`. t is source time (ss included). The face crop is scaled to `size`."""
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision
    if crop == 'auto': crop = auto_crop(src, task, ss, to)
    lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=task), running_mode=vision.RunningMode.VIDEO, num_faces=1,
        output_face_blendshapes=True, output_facial_transformation_matrixes=True))
    rows, k, t0 = [], 0, ss or 0
    for img in _frames(src, fps, f'crop={crop},scale={size}:{size}', size, size, ss, to):
        t = t0 + k / fps
        r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)),
                                int(round(k * 1000 / fps)))
        k += 1
        if not r.face_landmarks:
            rows.append([t, 0] + [float('nan')] * (len(RAW_COLS) - 2)); continue
        P = np.array([[p.x * size, p.y * size] for p in r.face_landmarks[0]])
        (hA, vA, oA), (hB, vB, oB) = eye_feats(P, EYES['A']), eye_feats(P, EYES['B'])
        bs = {c.category_name: c.score for c in r.face_blendshapes[0]}
        side = lambda n: (bs[n + 'Left'] + bs[n + 'Right']) / 2
        rows.append([t, 1, hA, hB, vA, vB, oA, oB, *euler(r.facial_transformation_matrixes[0]),
                     side('eyeLookDown'), side('eyeLookUp'), side('eyeLookIn'), side('eyeLookOut'), side('eyeBlink')])
        if log and k % 400 == 0: log(f'  {t:7.1f}s')
    return rows, crop


def roll(x, win, fn):
    n, h, out = len(x), win // 2, np.full(len(x), np.nan)
    for i in range(n):
        seg = x[max(0, i - h):i + h + 1]
        seg = seg[~np.isnan(seg)]
        if len(seg) >= 3: out[i] = fn(seg)
    return out


def features(D, fps):
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
    win = int(round(2 * fps)) | 1
    hd = h - roll(h, int(3 * fps) | 1, np.median)
    f['h_sd'] = roll(hd, win, np.std)                                       # how much the iris moves sideways
    dh = np.diff(hd, prepend=np.nan)
    sdd = np.nanstd(dh)
    # snap-backs: a leftward jump (reading return sweep) bigger than 1.5 sd of all frame-to-frame motion
    f['snaps'] = roll(np.where(np.isnan(dh), np.nan, (dh < -1.5 * sdd).astype(float)), win, np.mean)
    f['drift'] = roll(np.where(np.isnan(dh), np.nan, np.clip(dh, 0, None)), win, np.mean)  # rightward progress
    # smoothed versions of the level features (2 s median), so blinks and single noisy frames do not decide
    for c in ('v', 'open', 'pitch', 'lookDown', 'lookUp', 'h'): f[c + '_m'] = roll(f[c], win, np.median)
    return f


def fit_lr(X, y, sw=None, l2=1.0, it=3000, lr=0.1):
    """Logistic regression by gradient descent. sw = per-sample weights (default: balance the two classes)."""
    w, b = np.zeros(X.shape[1]), 0.0
    if sw is None:
        pw = len(y) / (2 * np.bincount(y.astype(int), minlength=2).clip(1))
        sw = np.where(y == 1, pw[1], pw[0])
    for _ in range(it):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        g = (p - y) * sw
        w -= lr * (X.T @ g / len(y) + l2 * w / len(y))
        b -= lr * g.mean()
    return w, b


def runs_of(t, on, step):
    out, s = [], None
    for ti, o in zip(t, on):
        if o and s is None: s = ti
        if not o and s is not None: out.append([s, ti]); s = None
    if s is not None: out.append([s, t[-1] + step])
    return out


def lens_runs(t, ps, step, bridge=1.0, min_len=6.0):
    on = np.nan_to_num(ps, nan=0) > 0.5
    merged = []
    for r in runs_of(t, on, step):
        if merged and r[0] - merged[-1][1] < bridge: merged[-1][1] = r[1]
        else: merged.append(r)
    return [r for r in merged if r[1] - r[0] >= min_len]


def load_raw(path):
    import csv
    rows = list(csv.DictReader(open(path)))
    return {c: np.array([float(r[c]) for r in rows]) for c in RAW_COLS}


def save_raw(path, rows):
    import csv
    with open(path, 'w', newline='') as f:
        w = csv.writer(f); w.writerow(RAW_COLS); w.writerows(rows)
