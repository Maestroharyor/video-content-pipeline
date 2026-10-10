#!/bin/sh
# Rebuilds lf-intro-sting.wav (5.6s): rising air → whoosh + sub thump on the disc fill (2.95s) → pops on the orbit balls → shimmer on the wordmark.
# Cue times follow slides/01-intro.js. Run from the repo root.
P=projects/lifetechfacts-intro/assets
ffmpeg -hide_banner -loglevel error -y \
 -f lavfi -i "anoisesrc=c=pink:r=48000:d=3.3:a=0.5:seed=7" \
 -i $P/mixkit-arrow-whoosh-1491.wav \
 -f lavfi -i "aevalsrc='0.55*sin(2*PI*58*t)*exp(-7*t)':s=48000:d=0.9" \
 -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/shim.wav \
 -filter_complex "
 [0:a]highpass=f=1400,lowpass=f=9000,volume='0.20*pow(min(t/2.9,1),2.4)*(1-min(max((t-2.9)/0.35,0),1))':eval=frame,aformat=channel_layouts=stereo[air];
 [1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.75,adelay=2620:all=1[wh];
 [2:a]aformat=channel_layouts=stereo,adelay=2950:all=1[sub];
 [3:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.30,adelay=1760:all=1[p0];
 [4:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=3000:all=1[p1];
 [5:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=3080:all=1[p2];
 [6:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.55,adelay=3780:all=1[sh];
 [air][wh][sub][p0][p1][p2][sh]amix=inputs=7:duration=longest:normalize=0,apad,atrim=0:5.6,alimiter=limit=0.5:level=disabled,afade=t=out:st=5.1:d=0.5[o]" \
 -map "[o]" -ar 48000 -c:a pcm_s16le $P/lf-intro-sting.wav
