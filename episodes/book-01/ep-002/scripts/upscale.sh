#!/bin/zsh
# Crop storyboard panels (storyboard + panelRects in data/story.json) and upscale 4x with Real-ESRGAN anime model.
set -e
cd "${0:A:h}/.."
ESR=../../../.tools/realesrgan
SRC=$(python3 -c "import json;print(json.load(open('data/story.json'))['storyboard'])")
RECTS=($(python3 -c "import json;print(' '.join(':'.join(map(str,r)) for r in json.load(open('data/story.json'))['panelRects']))"))
mkdir -p public/panels .cache/crops
chmod +x $ESR/realesrgan-ncnn-vulkan 2>/dev/null || true
i=1
for p in $RECTS; do
  IFS=: read x y w h <<< "$p"
  ffmpeg -v error -y -i "$SRC" -vf "crop=$w:$h:$x:$y" ".cache/crops/p$i.png"
  if $ESR/realesrgan-ncnn-vulkan -i ".cache/crops/p$i.png" -o "public/panels/p$i.png" -n realesrgan-x4plus-anime -s 4 -m $ESR/models >/dev/null 2>&1; then
    echo "p$i: realesrgan"
  else
    ffmpeg -v error -y -i ".cache/crops/p$i.png" -vf "scale=iw*4:ih*4:flags=lanczos" "public/panels/p$i.png"
    echo "p$i: lanczos"
  fi
  i=$((i+1))
done
