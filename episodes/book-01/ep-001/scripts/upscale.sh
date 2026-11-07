#!/bin/zsh
# Crop the 8 storyboard panels and upscale 4x with Real-ESRGAN (anime model); falls back to lanczos.
set -e
cd "${0:A:h}/.."
SRC=/Users/huyin/Swingboat/english-to-be-continued/production/book-01/ep-001/storyboard.png
ESR=../../../.tools/realesrgan
mkdir -p public/panels .cache/crops
i=1
for p in 3:3:474:433 486:3:398:433 3:445:438:394 449:445:435:394 3:847:438:387 449:847:435:387 3:1242:438:528 449:1242:435:528; do
  IFS=: read x y w h <<< "$p"
  ffmpeg -v error -y -i "$SRC" -vf "crop=$w:$h:$x:$y" ".cache/crops/p$i.png"
  if [[ -x $ESR/realesrgan-ncnn-vulkan ]] && \
     $ESR/realesrgan-ncnn-vulkan -i ".cache/crops/p$i.png" -o "public/panels/p$i.png" -n realesrgan-x4plus-anime -s 4 -m $ESR/models >/dev/null 2>&1; then
    echo "p$i: realesrgan"
  else
    ffmpeg -v error -y -i ".cache/crops/p$i.png" -vf "scale=iw*4:ih*4:flags=lanczos" "public/panels/p$i.png"
    echo "p$i: lanczos"
  fi
  i=$((i+1))
done
