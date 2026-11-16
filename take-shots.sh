#!/bin/bash
# Take DUSKFERRY v2 screenshots in Falkon headless under Xvfb, one per shot in shots.json.
# Usage: ./take-shots.sh  (run from the entry dir; serve.ts must be running on :8080)
set -u
cd ~/workspace/makefun/best-game-entry-v2
export HOME="$HOME/workspace/falkon"
export XDG_RUNTIME_DIR=/tmp/runtime-root
mkdir -p "$XDG_RUNTIME_DIR" "$HOME/.config/falkon"
export QTWEBENGINE_CHROMIUM_FLAGS="--no-sandbox --disable-gpu --disable-dev-shm-usage"

Xvfb :97 -screen 0 1280x800x24 >/tmp/xvfb97.log 2>&1 &
XVFB_PID=$!
sleep 2

for spec in "1-start.jpg|?shot=start&seed=7" "2-play.jpg|?shot=play&seed=7" "3-boon.jpg|?shot=boon&seed=7" "4-dawn.jpg|?shot=dawn&seed=7"; do
  name="${spec%%|*}"
  query="${spec#*|}"
  echo "== $name $query"
  DISPLAY=:97 falkon -geometry 1280x800+0+0 "http://localhost:8080/$query" >/tmp/falkon97.log 2>&1 &
  FPID=$!
  sleep 7
  DISPLAY=:97 ffmpeg -y -v error -f x11grab -video_size 1280x800 -i :97 -frames:v 1 "/tmp/shot-$name.png"
  kill $FPID 2>/dev/null || true
  sleep 1
  # Crop off Falkon's tab/address bar (top ~80px) and convert to JPEG.
  ffmpeg -y -v error -i "/tmp/shot-$name.png" -vf "crop=1280:720:0:80" -q:v 6 "screenshots/$name"
  ls -la "screenshots/$name"
done

kill $XVFB_PID 2>/dev/null || true
echo DONE
