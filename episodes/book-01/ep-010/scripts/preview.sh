#!/bin/zsh
# Render preview stills from the cached bundle and tile them into contact sheets.
# Usage: scripts/preview.sh 200 330 480 ...
set -e
cd "${0:A:h}/.."
mkdir -p .cache/stills
rm -f .cache/stills/*.png(N) .cache/sheet_*.jpg(N)
for f in "$@"; do
  npx remotion still .cache/bundle Ep010 ".cache/stills/$(printf %05d $f).png" --frame="$f" --log=error
done
# SAFE=1 shades areas covered by the Douyin app UI (top bar, caption, action buttons, side crop)
mask=""
[[ -n "$SAFE" ]] && mask="drawbox=x=0:y=0:w=1080:h=250:color=red@0.35:t=fill,drawbox=x=0:y=1420:w=890:h=500:color=red@0.35:t=fill,drawbox=x=890:y=860:w=190:h=790:color=red@0.35:t=fill,drawbox=x=0:y=0:w=50:h=1920:color=red@0.35:t=fill,drawbox=x=1030:y=0:w=50:h=1920:color=red@0.35:t=fill,"
ffmpeg -v error -y -pattern_type glob -i '.cache/stills/*.png' -vf "${mask}scale=360:640,tile=5x1:padding=6:color=white" -frames:v 99 .cache/sheet_%02d.jpg
ls .cache/sheet_*.jpg
