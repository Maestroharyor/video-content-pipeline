#!/usr/bin/env bash
# Draft candidates for review: ./projects/<x>-thumbs/render.sh "<slides e.g. 01 02>" "<face list e.g. off t46>" ["<v list e.g. 1 2>"] [extra --var args]
# Every draft lands in renders/drafts/<slide>-v<v>-<face>.png (4K poster). Upload files come from npm run thumb. Run from the repo root.
set -euo pipefail
P=$(cd "$(dirname "$0")" && pwd); S=$(basename "$P"); R="projects/$S"
mkdir -p "$R/renders/drafts"
for s in $1; do for f in $2; do for v in ${3:-1 2}; do
  npm run -s render -- --project "$S" --slide "$s" --poster --force --var font=koho --var face="$f" --var v="$v" ${4:-} --out "$R/renders/.tmp" >/dev/null
  f0=$(ls "$R"/renders/.tmp/poster/*.png | head -1); name=$(basename "$f0" .png)
  mv "$f0" "$R/renders/drafts/$name-v$v-$f.png"
done; done; done
rm -rf "$R/renders/.tmp"
