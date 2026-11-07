# 英语有续集 · 视频制作

每集视频一个目录，路径与原 HTML 对应（规则见 [AGENTS.md](AGENTS.md)）。

| 集数 | 原 HTML | 视频目录 | 成片 |
| --- | --- | --- | --- |
| 001 | `episodes/book-01/ep-001.html` | [episodes/book-01/ep-001](episodes/book-01/ep-001) | [ep-001.mp4](episodes/book-01/ep-001/out/ep-001.mp4) |
| 002 | `episodes/book-01/ep-002.html` | [episodes/book-01/ep-002](episodes/book-01/ep-002) | [ep-002.mp4](episodes/book-01/ep-002/out/ep-002.mp4) |
| 003 | `episodes/book-01/ep-003.html` | [episodes/book-01/ep-003](episodes/book-01/ep-003) | [ep-003.mp4](episodes/book-01/ep-003/out/ep-003.mp4) |
| 004 | `episodes/book-01/ep-004.html` | [episodes/book-01/ep-004](episodes/book-01/ep-004) | [ep-004.mp4](episodes/book-01/ep-004/out/ep-004.mp4) |
| 005 | `episodes/book-01/ep-005.html` | [episodes/book-01/ep-005](episodes/book-01/ep-005) | [ep-005.mp4](episodes/book-01/ep-005/out/ep-005.mp4) |

## 单集目录结构

- `data/story.json`：分镜节拍、角色配音、镜头运动、单词卡与测验内容
- `scripts/clone.py` / `check.py`：用 `voices/book-01` 的人物参考音色（Qwen3-TTS Base）克隆角色台词，Whisper 校对选优（ep-002 起）
- `scripts/tts.py`：汇总配音（课堂与单词用 edge-tts）→ `public/audio/`，时长写入 `data/durations.json`
- `scripts/sfx.py`：numpy 合成音效与循环 BGM → `public/sfx/`
- `scripts/upscale.sh`：裁出 8 格分镜，用 Real-ESRGAN 动漫模型放大 4 倍 → `public/panels/`
- `scripts/preview.sh`：渲染若干帧并拼成预览图
- `src/`：时间轴与画面组件（Remotion）
- `out/`：成片

## 命令

```bash
# 首次：在根目录准备共享环境
python3 -m venv .venv && .venv/bin/pip install edge-tts numpy faster-whisper && npm install

# 在单集目录内
cd episodes/book-01/ep-001
npm run audio     # 修改台词后重新生成配音与音效
scripts/upscale.sh  # 重新裁切并超分分镜图
npm run studio    # 预览
npm run render    # 输出 out/ep-001.mp4
```
