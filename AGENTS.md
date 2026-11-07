# 项目规则

## 触发方式

用户给出一个 HTML 地址（如 `/Users/huyin/Swingboat/english-to-be-continued/episodes/book-01/ep-002.html`）时，
直接按下面的“制作流程”和“视频风格”完成：先审阅 HTML，再生成成片，无需再次确认。目标：生动、有趣、尽情发挥。

- 例外：HTML 的“成片说明”（如 `episode.json` 的 `production_language`）与本规则冲突时（例如要求改为第一人称解说），
  先用 ask_user 确认一次组织方式，再制作。
- 用户说某集 HTML 已修改时：以最新的 HTML 与 `production/.../episode.json` 为准，在原单集目录内更新（不新建目录）；
  先对比旧 `story.json` 与新剧本，在汇报中列出改动（解说、对白、配音设定、称呼等），再改剧本、配音、特效并重新渲染覆盖原成片。

## 目录规则

- 每个视频一个独立目录，目录路径与提供的 HTML 尽量保持一致：
  `…/english-to-be-continued/episodes/book-01/ep-001.html` → `episodes/book-01/ep-001/`。
- 生成该视频的所有代码与输出都放在该目录内：剧本数据（`data/`）、生成脚本（`scripts/`）、
  Remotion 源码（`src/`）、素材（`public/`）、缓存与预览（`.cache/`）、成片（`out/`）、
  以及 `package.json`、`tsconfig.json`、`remotion.config.ts`。
- 成片命名与 HTML 同名：`out/ep-001.mp4`。
- 根目录只放共享环境：npm workspaces 的 `package.json` 与 `node_modules/`、Python `.venv/`、
  第三方工具 `.tools/`（如 Real-ESRGAN 动漫超分）。
  新增一集时在其目录中新建 `package.json`（name 形如 `book-01-ep-002`），根目录无需改动。
- 单集 `remotion.config.ts` 通过 `Config.setBrowserExecutable` 复用根目录 `node_modules/.remotion` 中的浏览器，避免每集重复下载。
- 不修改原 HTML 项目中的文件，只读取其剧本与图片。
- 主人公在视频中统一叫“小帅”（英文 Xiaoshuai）：HTML 中的“林一”在台词、字幕、名牌、特效文字和旁白中都替换为“小帅”，
  英文台词中的 “Lin Yi” 替换为 “Xiaoshuai”。edge-tts 配音通过 `story.json` 的 `pronounce` 把人名读作 “Shiao Shwai”、“Shiao Man”，字幕保持原拼写；
  Qwen3-TTS 克隆配音直接读拼音原文（不经 `pronounce`）。

## 制作流程

1. **审阅 HTML**：读取剧本、分镜说明、音效参考、单词卡、连续性与下集预告。检查并在汇报中列出问题
   （如配图裁切串格、人物称呼前后不一致、文件体积、英文台词占比），不修改原文件。
2. **找素材**：优先使用原项目 `production/book-XX/ep-XXX/` 中的 `episode.json`（剧本、单词、`art.panels` 分格坐标）
   和 `storyboard.png`；没有时从 HTML 中提取内嵌 base64 图片与各分格 `<svg viewBox>` 坐标。
3. **建目录**：复制最新一集目录作模板（不复制 `out/`、`.cache/`、`public/audio/`、`public/panels/`、`node_modules/`），
   修改 `package.json` 的 name、render 的合成 id（`EpXXX`）与输出名，同步 `src/Root.tsx` 和 `scripts/preview.sh` 中的合成 id，
   然后在根目录执行 `npm install` 链接 workspace。模板早于 ep-002 时，从 ep-002 补拷音频脚本
   `scripts/lines.py`、`clone.py`、`check.py`、`tts.py` 与 `package.json` 的 `audio` 命令。
4. **写 `data/story.json`**：`episode` / `episodeNo` / `titleLines` / `season` / `next`（下集编号、标题、简介）、
   `storyboard` 与 `panelRects`（分格坐标）、角色配音 `voices`、分格尺寸 `panels`（超分后 4 倍）、
   `prev`（前情提要镜头）、单词（音标、英文词性 `pos`、中文释义、简短英文释义 `en` 及其中文字幕 `enZh`、剧中例句）、`review`（复现的旧词）、
   每场节拍（`line` / `pause`，含 `sfx` / `sfxEnd`）、镜头关键帧 `cam`、旁白。
   台词、人物、道具与连续性必须与 HTML 一致；笑点只做视觉化、夸张化表达，不改变剧情事实。
5. **分镜超分**：`scripts/upscale.sh` 读取 `story.json` 的 `storyboard` 与 `panelRects`，用 Real-ESRGAN
   `realesrgan-x4plus-anime` 放大 4 倍；前情提要用上一集 `public/panels/` 的图复制为 `prevN.png`。
6. **音频**：`npm run audio`（`clone.py` 用人物参考音色克隆角色台词 → `check.py` 用 Whisper 校对并挑选最佳一条 → `tts.py` 合成课堂/单词的 edge-tts 并统一裁剪响度 → `sfx.py` numpy 合成音效与 BGM，均无版权问题）。
7. **本集专属内容**：
   - `src/fx.tsx`：`SceneFX` / `TopFX` / `shotFilter` 按场景编号重新设计特效与笑点（叠加层用屏幕坐标，
     人物相关位置用 `Rect` 换算；避开人物脸部和底部字幕区）；
   - `src/timeline.ts`：片段顺序、`sceneExtras` 的音效时间点、`music` 配乐分段（轻快 / 静音 / 舒缓 / 切断）；
   - `src/segments.tsx`：`Scene` 中的震屏时间点。
8. **预览**：`npx tsc -p .` → `npx remotion bundle --out-dir=.cache/bundle` → `scripts/preview.sh <帧号...>` 生成拼图，
   覆盖每场的关键时刻，检查字幕遮挡、特效位置、特写清晰度，修正后再渲染。
9. **渲染与校验**：`npm run render --prefix <单集目录>`（先渲染到 `.cache/raw.mp4`，再用 ffmpeg `loudnorm` 把响度统一到 −16 LUFS 输出到 `out/`），
   用 ffprobe 检查时长、分辨率与音轨。
10. **汇报**：HTML 审阅发现、视频结构与亮点、成片路径。

## 视频风格

- 竖屏 1080×1920、30fps、H.264。
- 抖音账号品牌（参考地理故事工坊的做法）：
  - 头像源文件 `/Users/huyin/Swingboat/english-to-be-continued/branding/douyin/英语有续集-抖音头像-1254x1254.png`，
    用 `sips -Z 512` 缩到单集 `public/brand/avatar.png`；
  - 抖音安全区（`ui.tsx` 的 `SAFE = { top: 270, bottom: 500, left: 90, right: 190 }`，ep-001 起）：手机上视频会铺满裁掉左右各 ~50px；
    顶部 ~250px 被状态栏、频道栏和搜索图标遮挡；底部 ~480px 被账号名、标题和音乐条遮挡；右侧 ~190px（y 860–1650）被点赞/评论按钮遮挡。
    所有文字与关键特效都放在安全区内（台标例外：固定在顶部 `left 80, top 50`，只避开左侧裁切），用 `SAFE=1 scripts/preview.sh <帧号...>`（红色为遮挡区）预览检查；
  - 左上角台标 `BrandBadge`（`left 80, top 50`，圆形头像 + “英语有续集 / English: To Be Continued”，半透明深色胶囊底），
    在 `Episode.tsx` 中全局叠加：从开头淡入，片头卡期间隐藏，片尾账号卡出现前淡出；课后小课堂等浅色背景用浅色版；
    不放右上角（会被抖音搜索图标挡住）：地点字幕 `top 362`、顶部中文字幕条默认 `top 420`（两行时底边约 545，上部特效从 ~580 起）、
    片头卡旁白中文条 `top 650`（可能两行，底边约 760）、课堂标题 `top 362`、单词卡 `top 500`（左文右图横排，约 620 高）；
  - 片头卡（`segments.tsx` 的 `Title`，ep-002 起）顶部用账号 logo，与片尾账号卡一致：190px 圆形头像（白边 + 淡金光圈）
    + 右下角“续”字印章角标，不再单独放“续”字印章；logo 区 `top 290`，其下 “ENGLISH: TO BE CONTINUED”，
    “EPISODE N”与标题行下移到 `top 800`，避开两行的旁白中文条；
  - 片尾账号卡（最后约 6 秒，替代原印章片尾）：大圆形头像 + “续”字印章角标、“英语有续集”、黄色 “ENGLISH: TO BE CONTINUED”、
    “跟着故事，学会单词 / Follow the story. Learn the words.”、跳动的红色“＋ 关注 · See you in Episode N+1!”按钮。
- 结构：冷开场 → 片头“第 N 话” → 动漫正片 → 定格“To Be Continued” → 课后小课堂 → 下集预告 → 片尾。
  第 1 集冷开场“先给结果”再回溯；续集冷开场用“前情提要”（上一集分镜 + 旁白），直接接本集第 1 场的钩子，再进片头。
- 角色第一次在正片出现时，用动漫式名牌介绍（名字 + 一句身份），包括主人公小帅（如“Red shirt · the original · telling this story”）
  和老师等成年角色；名牌放在人物脸部以下、底部字幕以上（约 `top 848–1010`），不挡脸，并让镜头在名牌出现时停在该人物上。
- 正片是完整的全英文动漫：所有角色台词译成自然、高中生听得懂的英文并用英文配音（`line` 写 `en` + 原文 `zh` 作字幕），
  剧情事实不变；重点词沿用 HTML 的英文原句。地点字幕、名牌、特效字、片头片尾等屏幕文字全部用英文；
  中文只出现在字幕第二行、单词卡释义和账号品牌（账号名“英语有续集”、标语“跟着故事，学会单词”、“关注”按钮）上。不插入单词卡或讲解：
  - 全屏镜头：`z=1` 为适配宽度（上下用模糊画面填充），特写 `z≈1.8–2.8`；每句台词配合推、拉、摇或切换到说话人；
  - 动漫字幕：英文在安全区底部（`bottom 500`、`left 90`、`right 190`；白字黑描边，配说话人色牌，重点词标黄，心声用括号加斜体），
    中文翻译单独放在上方的半透明字幕条里（`top 420`），不与英文挤在一起；旁白同样处理；
  - 每场开头显示地点字幕，画面加暗角；
  - 每场至少一个视觉笑点或特效（速度线、？！、印章、手机 UI、聊天梗、分屏对比、粒子、震屏、闪白等），
    按剧本“音效参考”配音效；悬念处切掉音乐并定格。
- 课后小课堂（English Corner）约 45 秒以内，用英文讲解、配中英双语字幕，不用中文配音：
  每个单词依次播放单词发音 → 简短英文释义（一句话、高中生能听懂）→ 剧中原句，配原分镜图；
  卡片上显示单词、音标、英文词性 + 中文释义、英文释义、例句；底部字幕框（安全区底部）显示正在说的英文，中文翻译作为框内第二行；
  英美发音不同时对比英音和美音；
  单词按剧情出现顺序排列；HTML 中“上集的词”用一张复习卡带过。
- 人物配音以原项目 `voices/book-01/` 为准（ep-002 起）：`cast.json` 中已定义参考音色的角色（小帅、分身、苏小满、班主任、妈妈、爸爸等），
  用 Qwen3-TTS Base（`mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit`，环境复用 `audio-research/experiments/tts/qwen3-tts`）
  以 `characters/<人物>/<人物>.wav` + 同名 `.txt` 克隆配音；`story.json` 的 `voices` 写 `ref: "<人物>"`，每句生成 3 条，Whisper 自动挑选。
  画外音、电话、心声沿用本人音色（心声加回声）。HTML 指定小帅第一人称英文解说时，正片按解说顺序走：叙述句用小帅音色、
  字幕标“✎ Xiaoshuai · narrating”（深色色牌 + 红边，斜体），带引号的转述改由被引用角色亲口说出原话，
  去掉 “I said / Xiaoman replied” 之类的说话人标签，只在铺垫笑点时保留引导语（如 “My clone counted:”）；
  前情提要、片头、下集预告也用小帅第一人称、小帅音色。
  每句克隆配音裁掉首尾静音后用 `loudnorm=I=-19` 统一响度；心声回声用 `aecho=0.8:0.7:70|140:0.28|0.14`（比对白低约 4 dB，仍清楚）。
  Whisper 只是辅助，人名拼音常被听写成别的拼法；人工试听后要换条时写入 `data/voice-picks.json`（如 `{ "s1n1": 1 }` 表示用第 1 条）。
  下面的 edge-tts 设定只用于课堂讲解、单词发音，以及尚未定义参考音色的角色：
- 配音（edge-tts，全部英文）。高中生角色一律用少年声音，成年角色用成年声音：
  小帅 `zh-CN-YunxiNeural`（云希说英文，带一点中式口音，对白 `+6%`、`+2Hz`，重点句 `-4%`）；
  分身用同一个云希但更快更高、更自信（对白 `+12%`、`+6Hz`，重点句 `+2%`、`+6Hz`）；
  苏小满 `zh-TW-HsiaoChenNeural`（晓臻说英文，甜而清亮的高中女生声音，对白 `+4%`、`+6Hz`，重点句 `+0%`、`+6Hz`；`en-GB-MaisieNeural` 太像小孩，不要用）；其他同学角色也优先选少年声或调高音调（寸头男生 `zh-TW-YunJheNeural` `+4%`、`+4Hz`；高马尾女生 `zh-CN-XiaoyiNeural` `+4%`、`+4Hz`）；
  老师 `en-US-ChristopherNeural`；妈妈 `zh-CN-XiaoxiaoNeural`（`-2%`、`-2Hz`）；爸爸 `zh-CN-YunjianNeural`（`-4%`、`-2Hz`，画外加低通与轻回声）；手机提示 `en-US-MichelleNeural` 加机械滤镜；
  心声加回声；两人同时说话用 `mix` 混合两人声音；
  旁白一律用英文（片头、前情提要、回溯、下集预告）：`en-US-AvaNeural`，戴回声的戏剧旁白 `en-US-GuyNeural`，
  均配中英双语字幕（`narration` 条目写 `en` + `zh`）；角色台词保持剧本原语言；
  课堂英文讲解 `en-US-JennyNeural`；单词美音 `en-US-AriaNeural`、英音 `en-GB-SoniaNeural`。
  新角色选择辨识度高的声音，并写入 `story.json` 的 `voices`，后续各集沿用。
- 配乐按情绪分段：轻快 `bgm` / 紧张处静音配心跳等音效 / 抉择处舒缓 `bgm-calm` / 尴尬或悬念处切断；有人说话时自动压低。

## 工具注意事项

- 终端命令开头的 `cd` 可能被省略：使用 `npm run <script> --prefix <目录>` 或绝对路径。
- 长命令的输出重定向到 `/tmp/*.log` 再用 `tail` 查看。
- Real-ESRGAN 首次使用需 `chmod +x .tools/realesrgan/realesrgan-ncnn-vulkan`。
- Remotion 的 `volume` 回调会收到小数帧，查表前要先取整。
- Qwen3-TTS 每条约 3–6 秒，`clone.py` 放后台跑（输出到 `/tmp/*.log`），已生成且参数未变的条目会跳过；
  从 Hugging Face 下载模型时加 `HF_HUB_DISABLE_XET=1`，运行时用 `HF_HUB_OFFLINE=1`。
- `check.py` 用根目录 `.venv` 的 `faster-whisper`（本机已缓存 `Systran/faster-whisper-small`）；它与当前 `av` 版本不兼容，
  音频要先用 ffmpeg 解码成 16 kHz numpy 数组再传入，不能直接传文件路径。
