#!/bin/sh
# usage: sh enc.sh <slideId> [audioFile]
ID=$1
AUD=$2
IN="frames/$ID/%04d.png"
HOLD="tpad=stop_mode=clone:stop_duration=1"

mkdir -p gif mp4

# ---- MP4 : full resolution ----
if [ -n "$AUD" ] && [ -f "$AUD" ]; then
  ffmpeg -loglevel error -y -framerate 20 -i "$IN" -i "$AUD" \
    -filter_complex "[0:v]$HOLD,format=yuv420p[v]" \
    -map "[v]" -map 1:a -c:v libx264 -crf 19 -preset slow -r 20 \
    -c:a aac -b:a 160k -shortest -movflags +faststart "mp4/$ID.mp4"
else
  ffmpeg -loglevel error -y -framerate 20 -i "$IN" \
    -vf "$HOLD,format=yuv420p" -c:v libx264 -crf 19 -preset slow -r 20 \
    -movflags +faststart "mp4/$ID.mp4"
fi

# ---- GIF : half resolution ----
ffmpeg -loglevel error -y -framerate 20 -i "$IN" \
  -vf "$HOLD,fps=20,scale=540:960:flags=lanczos,palettegen=stats_mode=diff" -y "/tmp/pal_$ID.png"
ffmpeg -loglevel error -y -framerate 20 -i "$IN" -i "/tmp/pal_$ID.png" \
  -lavfi "[0:v]$HOLD,fps=20,scale=540:960:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  "gif/$ID.gif"

echo "encoded $ID"
