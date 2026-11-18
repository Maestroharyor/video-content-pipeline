# Face windows from a gaze.csv (scripts/gaze.swift on 4 fps full-face crops), calibrated on the video itself.
#
#   python3 -I scripts/lens-runs.py projects/<slug>/gaze.csv [--timeline projects/<slug>/timeline.json] [--min 6] [--dark 0.485]
#
# Why: the fixed constants in lens-windows.py came from one recording and failed on the next (ai-concepts: a stretch
# where he was reading scored 77% "lens", and lens stretches mid-video got no face). Every recording has its own light,
# distance and prompter, so the two states are found per video instead: 2-means on Vision's eye darkness centroid
# (`dark`), lid openness (`lid`) and pupil height (`py`), all z-scored. `py` was added on review 2 of ai-concepts: with
# dark + lid alone, a reading stretch in s30 passed as lens; the pupil sits measurably lower on the prompter. The cluster with the lower darkness and the more open lids is the
# lens (on the lens the iris sits centred with white below it; reading the prompter, the lids drop and the iris rests
# on the lower lid). A 2.25 s median smooths blinks, gaps under 1 s are bridged, and runs of --min seconds or more are
# the face windows. Judging per frame, not per slide, is the point: a slide that is 70% lens gets the face only for
# the part where he holds it.
#
# Each run also prints the window to write: the face must be fully gone a second before the run ends (user, review 2:
# the .45 s fade-out showed him already looking away), so `to` = run end - 1 - out ramp.
#
# With --timeline it also prints, per run, the slides it covers, so the windows can be written into PROJECT.reveals
# (edges on word starts inside the run; over for text-light scenes, split for diagrams). The output only proposes:
# look at an eye sheet of any doubtful run before using it, and never override what the user says he did.
import csv, json, statistics as st, sys

args = sys.argv[1:]
src = args[0]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
MIN = float(opt('--min', 6))

R = {}
for r in csv.DictReader(open(src)):
    try: R[(int(r['file'][:5]) - 1) / 4] = (float(r['dark']), float(r['lid']), float(r['py']))
    except (ValueError, KeyError): pass
ts = sorted(R)
if len(ts) < 40: sys.exit('lens-runs: too few gaze frames in ' + src)

K = 3
cols = list(zip(*[R[t] for t in ts]))
mu = [st.mean(c) for c in cols]; sd = [st.pstdev(c) or 1 for c in cols]
X = [tuple((R[t][i] - mu[i]) / sd[i] for i in range(K)) for t in ts]
c = [(-1.0, 1.0, -1.0), (1.0, -1.0, 1.0)]           # seeds: lens = less dark, lids open, pupil high; reading = the opposite
d2 = lambda x, k: sum((x[i] - k[i]) ** 2 for i in range(K))
for _ in range(50):
    g = [[], []]
    for x in X: g[0 if d2(x, c[0]) < d2(x, c[1]) else 1].append(x)
    if not g[0] or not g[1]: break
    c = [tuple(st.mean(a[i] for a in gg) for i in range(K)) for gg in g]
raw = lambda k: tuple(mu[i] + k[i] * sd[i] for i in range(K))
print('calibration  lens dark %.3f lid %.3f py %.3f  |  reading dark %.3f lid %.3f py %.3f' % (raw(c[0]) + raw(c[1])))

score = [d2(x, c[1]) - d2(x, c[0]) for x in X]       # > 0: nearer the lens cluster
sm = [st.median(score[max(0, i - 4):i + 5]) for i in range(len(ts))]   # ~2.25 s
# --dark T: a fixed threshold on the eye-darkness centroid instead of the 2-means split, set from stretches he has
# labelled himself. worst-week review 2: the clusters put a reading stretch (s23) on the lens and missed his
# "subscribe" and trend intros; on his labels the lens medians sat at 0.44-0.48 and reading at 0.50-0.52, so
# --dark 0.485 with a 1.75 s median matched every one. Print the medians of a few labelled spans first and pick T
# between the two groups.
DARK = opt('--dark')
if DARK is not None:
    dk = [R[t][0] for t in ts]
    sm = [float(DARK) - st.median(dk[max(0, i - 3):i + 4]) for i in range(len(ts))]
runs, cur = [], None
for t, v in zip(ts, sm):
    if v <= 0: continue
    if cur and t - cur[1] <= 1.0: cur[1] = t
    else:
        if cur: runs.append(cur)
        cur = [t, t]
if cur: runs.append(cur)
runs = [r for r in runs if r[1] - r[0] >= MIN]

slides = []
tl = opt('--timeline')
if tl:
    T = json.load(open(tl)); slides = T.get('slides', T) if isinstance(T, dict) else T
for a, b in runs:
    cov = ''
    if slides:
        hit = []
        for s in slides:
            lo, hi = max(a, s['start']), min(b, s['end'])
            if hi - lo > .5: hit.append(f"{s['id']} {100 * (hi - lo) / (s['end'] - s['start']):.0f}%")
        cov = '  ' + ', '.join(hit)
    print(f'{a:8.2f}-{b:8.2f}  {b - a:5.1f}s  face to <= {b - 1.45:.2f} with out .45{cov}')
print(f'{len(runs)} run(s) of {MIN:g}s+, {sum(b - a for a, b in runs):.0f}s on the lens of {ts[-1]:.0f}s')
