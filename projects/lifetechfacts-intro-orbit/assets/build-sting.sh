#!/bin/sh
# Rebuilds lf-intro-sting.wav (4.0s) for concept B "Orbit". Cue times follow slides/01-intro.js. Run from the repo root.
# soft node pops 0.1-0.5 · air swell rising to 1.6 (gravity) · whoosh peaking ~1.65 · thump 1.62 (disc) · two pops 1.64/1.70 (balls) · shimmer 2.15 (wordmark)
P=projects/lifetechfacts-intro-orbit/assets
ffmpeg -hide_banner -loglevel error -y \
 -f lavfi -i "anoisesrc=c=pink:r=48000:d=2.0:a=0.5:seed=11" -i $P/mixkit-arrow-whoosh-1491.wav -f lavfi -i "aevalsrc='0.55*sin(2*PI*58*t)*exp(-7*t)':s=48000:d=0.9" \
 -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/shim.wav \
 -filter_complex "
 [0:a]highpass=f=1400,lowpass=f=9000,volume='0.22*pow(min(t/1.6,1),2.2)*(1-min(max((t-1.6)/0.3,0),1))':eval=frame,aformat=channel_layouts=stereo[air];
 [1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.75,adelay=1330:all=1[wh];[2:a]aformat=channel_layouts=stereo,adelay=1620:all=1[sub];
 [3:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.18,adelay=120:all=1[n1];[4:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.18,adelay=280:all=1[n2];[5:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.18,adelay=440:all=1[n3];
 [6:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=1640:all=1[p1];[7:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=1700:all=1[p2];
 [8:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.55,adelay=2150:all=1[sh];
 [air][wh][sub][n1][n2][n3][p1][p2][sh]amix=inputs=9:duration=longest:normalize=0,apad,atrim=0:4,alimiter=limit=0.5:level=disabled,afade=t=out:st=3.5:d=0.5[o]" \
 -map "[o]" -ar 48000 -c:a pcm_s16le $P/lf-intro-sting.wav
