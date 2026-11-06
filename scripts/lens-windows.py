# Lens-contact classifier from gaze.csv: score = (dark - .478)/.03 + (py - .452)/.015 (negative = on the lens),
# smoothed with a 1 s rolling median (5 frames at 4 fps). Prints the lens share for calibration stretches and, with
# --windows, for every reveal candidate given as a,b pairs.
import csv, sys, statistics as st
R = {}
for r in csv.DictReader(open(sys.argv[1])):
    t = (int(r['file'][:5]) - 1) / 4
    if r['py'] and r['dark']:
        R[t] = (float(r['dark']) - .478) / .03 + (float(r['py']) - .452) / .015
ts = sorted(R)
sm = {}
for i, t in enumerate(ts):
    w = [R[x] for x in ts[max(0, i - 2):i + 3] if abs(x - t) <= .6]
    sm[t] = st.median(w)
def share(a, b):
    v = [sm[t] for t in ts if a <= t < b]
    return (sum(1 for x in v if x < 0) / len(v), len(v)) if v else (0, 0)
def longest_away(a, b):
    run = best = 0
    for t in ts:
        if a <= t < b:
            run = run + .25 if sm[t] >= 0 else 0; best = max(best, run)
    return best
if '--windows' in sys.argv:
    for p in sys.argv[sys.argv.index('--windows') + 1:]:
        a, b = map(float, p.split(','))
        s, n = share(a, b); print(f'{a:7.2f}-{b:7.2f} lens {s:4.0%}  longest look-away {longest_away(a, b):.2f}s  ({n} frames)')
else:
    for name, a, b in [('hook (lens)', 0, 36), ('close (lens)', 680, 735), ('away from 8:29 (user)', 509, 541), ('lists (reading)', 224, 235), ('reading', 456, 468)]:
        s, n = share(a, b); print(f'{name:24s} lens {s:4.0%} ({n})')
