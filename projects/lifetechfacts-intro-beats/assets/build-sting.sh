#!/bin/sh
# Rebuilds lf-intro-sting.wav (4.0s) for concept C "Three beats". Cue times follow slides/01-intro.js. Run from the repo root.
# three rising hits 0.00/0.42/0.84 (thump + click) · whoosh through the iris contraction (from 1.2) · big thump 1.70 (disc lands) · pops 1.76/1.82 (balls) · shimmer 1.6 (wordmark)
P=projects/lifetechfacts-intro-beats/assets
ffmpeg -hide_banner -loglevel error -y \
 -f lavfi -i "aevalsrc='0.5*sin(2*PI*62*t)*exp(-9*t)':s=48000:d=0.5" -f lavfi -i "aevalsrc='0.5*sin(2*PI*74*t)*exp(-9*t)':s=48000:d=0.5" -f lavfi -i "aevalsrc='0.5*sin(2*PI*88*t)*exp(-9*t)':s=48000:d=0.5" \
 -f lavfi -i "anoisesrc=c=white:r=48000:d=0.03:a=0.5:seed=3" -f lavfi -i "anoisesrc=c=white:r=48000:d=0.03:a=0.5:seed=4" -f lavfi -i "anoisesrc=c=white:r=48000:d=0.03:a=0.5:seed=5" \
 -i $P/mixkit-arrow-whoosh-1491.wav -f lavfi -i "aevalsrc='0.6*sin(2*PI*52*t)*exp(-6*t)':s=48000:d=1.0" -i assets/audio/pop.wav -i assets/audio/pop.wav -i assets/audio/shim.wav \
 -filter_complex "
 [0:a]aformat=channel_layouts=stereo,adelay=5:all=1[h1];[1:a]aformat=channel_layouts=stereo,adelay=420:all=1[h2];[2:a]aformat=channel_layouts=stereo,adelay=840:all=1[h3];
 [3:a]highpass=f=1800,afade=t=out:st=0.005:d=0.025,volume=0.45,aformat=channel_layouts=stereo,adelay=5:all=1[c1];[4:a]highpass=f=1800,afade=t=out:st=0.005:d=0.025,volume=0.45,aformat=channel_layouts=stereo,adelay=420:all=1[c2];[5:a]highpass=f=1800,afade=t=out:st=0.005:d=0.025,volume=0.45,aformat=channel_layouts=stereo,adelay=840:all=1[c3];
 [6:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.75,adelay=1280:all=1[wh];[7:a]aformat=channel_layouts=stereo,adelay=1700:all=1[sub];
 [8:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=1760:all=1[p1];[9:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=1820:all=1[p2];
 [10:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.5,adelay=1900:all=1[sh];
 [h1][h2][h3][c1][c2][c3][wh][sub][p1][p2][sh]amix=inputs=11:duration=longest:normalize=0,apad,atrim=0:4,alimiter=limit=0.5:level=disabled,afade=t=out:st=3.5:d=0.5[o]" \
 -map "[o]" -ar 48000 -c:a pcm_s16le $P/lf-intro-sting.wav
