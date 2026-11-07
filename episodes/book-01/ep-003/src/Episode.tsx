import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { LessonView, Next, PrevView, Rewind, Scene, TBC, Title } from "./segments";
import { SceneT, Simple, TL } from "./timeline";
import { BrandBadge, clamp } from "./ui";

const BGM_LOUD = 0.2;
const BGM_DUCK = 0.075;

// Per-frame music volume: ducked while anyone speaks, with short ramps.
const musicVol = (() => {
  const raw = new Float32Array(TL.total + 1).fill(BGM_LOUD);
  for (const [a, b] of TL.speech) for (let i = Math.max(0, a - 4); i < Math.min(TL.total, b + 4); i++) raw[i] = BGM_DUCK;
  const out = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    let sum = 0, n = 0;
    for (let k = -6; k <= 6; k++) {
      const j = i + k;
      if (j >= 0 && j < raw.length) { sum += raw[j]; n++; }
    }
    out[i] = sum / n;
  }
  return out;
})();

// Corner badge for the whole video, hidden on the title card and the closing account card
const Brand: React.FC = () => {
  const f = useCurrentFrame();
  const title = TL.segments.find((s) => s.type === "title")!;
  const next = TL.segments.find((s) => s.type === "next") as Simple;
  const card = next.start + next.marks.c;
  const fade = (a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
  const onTitle = fade(title.start - 8, title.start) * (1 - fade(title.start + title.frames - 4, title.start + title.frames + 8));
  const o = fade(4, 14) * (1 - onTitle) * (1 - fade(card - 8, card));
  const seg = TL.segments.find((s) => f >= s.start && f < s.start + s.frames);
  return <BrandBadge o={o} light={seg?.type === "lesson"} />;
};

export const Episode: React.FC = () => {
  const lastScene = TL.segments.filter((s) => s.type === "scene").slice(-1)[0] as SceneT;
  return (
    <AbsoluteFill style={{ background: "#f6f3eb" }}>
      {TL.segments.map((s, i) => (
        <Sequence key={i} from={s.start} durationInFrames={s.frames} name={s.type === "scene" ? `Scene ${s.scene.id}` : s.type}>
          {s.type === "scene" && <Scene s={s} />}
          {s.type === "prev" && <PrevView seg={s} />}
          {s.type === "title" && <Title seg={s} />}
          {s.type === "rewind" && <Rewind seg={s} />}
          {s.type === "tbc" && <TBC last={lastScene} />}
          {s.type === "lesson" && <LessonView seg={s} />}
          {s.type === "next" && <Next seg={s} />}
        </Sequence>
      ))}
      <Brand />
      {TL.music.map((m, i) => (
        <Sequence key={`m${i}`} from={m.from} durationInFrames={m.to - m.from} name="BGM">
          <Html5Audio
            src={staticFile(m.src)}
            loop
            volume={(f) => {
              const i = Math.min(TL.total, Math.max(0, Math.floor(m.from + f)));
              return musicVol[i] * Math.max(0, Math.min(1, f / 15, (m.to - m.from - f) / 6));
            }}
          />
        </Sequence>
      ))}
      {TL.audio.map((a, i) => (
        <Sequence key={`a${i}`} from={a.from} name={a.src} durationInFrames={a.voice ? a.frames + 30 : 150}>
          <Html5Audio src={staticFile(a.src)} volume={a.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
