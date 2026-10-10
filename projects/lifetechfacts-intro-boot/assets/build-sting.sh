#!/bin/sh
# Rebuilds lf-intro-sting.wav (4.0s) for concept A "Boot". Cue times follow slides/01-intro.js. Run from the repo root.
# key ticks 0.06-0.85 (irregular, fixed) · three rising confirm blips 0.92/1.04/1.16 · whoosh from 1.55 (dot flight) · thump + pop 1.95 (ball lands, disc bursts) · shimmer 2.3 (wordmark)
P=projects/lifetechfacts-intro-boot/assets
TICKS="60 118 171 236 281 344 392 441 507 552 610 668 717 771 826"
IN=""; FL=""; MIX=""; n=0
for t in $TICKS; do IN="$IN -f lavfi -i anoisesrc=c=white:r=48000:d=0.018:a=0.5:seed=$t"; FL="$FL[$n:a]highpass=f=2500,lowpass=f=7000,afade=t=out:st=0.004:d=0.014,volume=0.5,aformat=channel_layouts=stereo,adelay=$t:all=1[k$n];"; MIX="$MIX[k$n]"; n=$((n+1)); done
b=$n
ffmpeg -hide_banner -loglevel error -y $IN \
 -f lavfi -i "aevalsrc='0.22*sin(2*PI*880*t)*exp(-22*t)':s=48000:d=0.2" -f lavfi -i "aevalsrc='0.22*sin(2*PI*1108*t)*exp(-22*t)':s=48000:d=0.2" -f lavfi -i "aevalsrc='0.24*sin(2*PI*1318*t)*exp(-18*t)':s=48000:d=0.25" \
 -i $P/mixkit-arrow-whoosh-1491.wav -f lavfi -i "aevalsrc='0.55*sin(2*PI*56*t)*exp(-7*t)':s=48000:d=0.9" -i assets/audio/pop.wav -i assets/audio/shim.wav \
 -filter_complex "$FL
 [$b:a]aformat=channel_layouts=stereo,adelay=920:all=1[b1];[$((b+1)):a]aformat=channel_layouts=stereo,adelay=1040:all=1[b2];[$((b+2)):a]aformat=channel_layouts=stereo,adelay=1160:all=1[b3];
 [$((b+3)):a]aresample=48000,aformat=channel_layouts=stereo,volume=0.7,adelay=1600:all=1[wh];[$((b+4)):a]aformat=channel_layouts=stereo,adelay=1950:all=1[sub];
 [$((b+5)):a]aresample=48000,aformat=channel_layouts=stereo,volume=0.45,adelay=1980:all=1[pp];[$((b+6)):a]aresample=48000,aformat=channel_layouts=stereo,volume=0.55,adelay=2300:all=1[sh];
 $MIX[b1][b2][b3][wh][sub][pp][sh]amix=inputs=$((n+7)):duration=longest:normalize=0,apad,atrim=0:4,alimiter=limit=0.5:level=disabled,afade=t=out:st=3.5:d=0.5[o]" \
 -map "[o]" -ar 48000 -c:a pcm_s16le $P/lf-intro-sting.wav
