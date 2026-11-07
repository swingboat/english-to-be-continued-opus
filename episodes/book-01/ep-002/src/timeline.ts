import story from "../data/story.json";
import durations from "../data/durations.json";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export type Word = (typeof story.words)[number];
export type SceneData = (typeof story.scenes)[number];
export type RawBeat = SceneData["beats"][number] & {
  id: string; who?: string; zh?: string; en?: string; kw?: string; em?: string;
  sfx?: string; sfxEnd?: string; frames?: number;
};

const dur = (id: string): number => {
  const d = (durations as Record<string, number>)[id];
  if (d === undefined) throw new Error(`Missing audio duration for ${id}`);
  return d;
};
export const fr = (sec: number) => Math.ceil(sec * FPS);

export type AudioEvent = { src: string; from: number; volume: number; voice?: boolean; frames: number };
export type Part = { id: string; start: number; frames: number };

export type Beat = { kind: "line" | "pause"; id: string; start: number; frames: number; raw: RawBeat; audioFrames: number };

export type SceneT = {
  type: "scene";
  start: number;
  frames: number;
  scene: SceneData;
  beats: Beat[];
  at: (id: string, offset?: number) => number;
};

export type Simple = { type: "title" | "rewind" | "tbc" | "next"; start: number; frames: number; marks: Record<string, number> };
export type Prev = { type: "prev"; start: number; frames: number; items: { start: number; frames: number; panel: string; from: number[]; to: number[]; id: string }[] };
export type Sub = { start: number; frames: number; en: string; zh: string };
export type Lesson = {
  type: "lesson"; start: number; frames: number; intro: number;
  items: { start: number; frames: number; parts: Part[] }[];
  review?: { start: number; frames: number; parts: Part[] };
  subs: Sub[];
};
export type Segment = SceneT | Simple | Lesson | Prev;

const LINE_GAP = 10;
const SCENE_LEAD = 12;
const SCENE_TAIL = 12;

export function buildTimeline() {
  const audio: AudioEvent[] = [];
  const segments: Segment[] = [];
  let cursor = 0;

  const voice = (id: string, from: number) =>
    audio.push({ src: `audio/${id}.wav`, from, volume: 1, voice: true, frames: fr(dur(id)) });
  const sfx = (name: string, from: number, volume = 0.5) =>
    audio.push({ src: `sfx/${name}.wav`, from, volume, frames: 90 });

  const addScene = (scene: SceneData) => {
    const start = cursor;
    const beats: Beat[] = [];
    let t = SCENE_LEAD;
    for (const b of scene.beats as RawBeat[]) {
      if (b.kind === "line") {
        const a = fr(dur(b.id));
        beats.push({ kind: "line", id: b.id, start: t, frames: a + LINE_GAP, raw: b, audioFrames: a });
        voice(b.id, start + t);
        if (b.sfx) sfx(b.sfx, start + t, sfxVol(b.sfx));
        if (b.sfxEnd) sfx(b.sfxEnd, start + t + a - 2, sfxVol(b.sfxEnd));
        t += a + LINE_GAP;
      } else {
        beats.push({ kind: "pause", id: b.id, start: t, frames: b.frames!, raw: b, audioFrames: 0 });
        if (b.sfx) sfx(b.sfx, start + t, sfxVol(b.sfx));
        t += b.frames!;
      }
    }
    const frames = t + SCENE_TAIL;
    const map = Object.fromEntries(beats.map((b) => [b.id, b.start]));
    const at = (id: string, offset = 0) => {
      if (id === "start") return offset;
      if (id === "end") return frames + offset;
      if (!(id in map)) throw new Error(`Unknown beat ${id}`);
      return map[id] + offset;
    };
    const seg: SceneT = { type: "scene", start, frames, scene, beats, at };
    if (scene.id !== 1) sfx("whoosh", start, 0.2);
    sceneExtras(seg, sfx);
    segments.push(seg);
    cursor += frames;
  };

  const scenes = story.scenes;

  // Cold open: "previously on" recap with last episode's panels, straight into scene 1
  {
    const start = cursor;
    let t = 8;
    const items = story.prev.map((p) => {
      const a = fr(dur(p.id));
      voice(p.id, start + t);
      sfx("whoosh", start + t - 4, 0.18);
      const item = { start: t, frames: a + 8, panel: p.panel, from: p.from, to: p.to, id: p.id };
      t += a + 8;
      return item;
    });
    segments.push({ type: "prev", start, frames: t + 4, items });
    cursor += t + 4;
  }
  addScene(scenes[0]);

  // Title card
  {
    const start = cursor;
    const n = 22;
    voice("n-title", start + n);
    sfx("stamp", start + 6, 0.6);
    const frames = n + fr(dur("n-title")) + 30;
    segments.push({ type: "title", start, frames, marks: { voice: n } });
    cursor += frames;
  }
  for (const s of scenes.slice(1)) addScene(s);

  // To be continued freeze
  {
    const start = cursor;
    sfx("tbc", start, 0.5);
    const frames = 105;
    segments.push({ type: "tbc", start, frames, marks: {} });
    cursor += frames;
  }
  // English mini-class: word -> English definition -> (UK/US) -> story sentence, with bilingual subtitles
  {
    const start = cursor;
    const subs: Sub[] = [];
    const narr = (id: string) => story.narration.find((n) => n.id === id) as { en: string; zh: string };
    voice("n-recap", start + 14);
    subs.push({ start: 14, frames: fr(dur("n-recap")), ...narr("n-recap") });
    const intro = 14 + fr(dur("n-recap")) + 12;
    let t = intro;
    const items = story.words.map((w) => {
      const lines: [string, string, string][] = [
        [`w-${w.word}-en`, w.word, w.meaning],
        [`w-${w.word}-def`, w.en, w.enZh],
      ];
      if (w.word === "schedule") lines.push(["w-schedule-gb", "British: schedule", "英音"], [`w-${w.word}-en`, "American: schedule", "美音"]);
      lines.push([`r-${w.word}`, w.example, w.exampleZh]);
      let p = 10;
      const parts = lines.map(([id, en, zh]) => {
        const part = { id, start: p, frames: fr(dur(id)) };
        voice(id, start + t + p);
        subs.push({ start: t + p, frames: part.frames + 5, en, zh });
        p += part.frames + 6;
        return part;
      });
      sfx("flip", start + t, 0.35);
      const item = { start: t, frames: p + 14, parts };
      t += item.frames;
      return item;
    });
    // Review card: words from earlier episodes reused in this story
    let review: Lesson["review"];
    if (story.review?.length) {
      let p = 10;
      const parts: Part[] = [];
      const lines: [string, string, string][] = [
        ["n-review", narr("n-review").en, narr("n-review").zh],
        ...story.review.map((w) => [`rv-${w.word}`, w.example, w.exampleZh] as [string, string, string]),
      ];
      for (const [id, en, zh] of lines) {
        parts.push({ id, start: p, frames: fr(dur(id)) });
        voice(id, start + t + p);
        subs.push({ start: t + p, frames: fr(dur(id)) + 6, en, zh });
        p += fr(dur(id)) + 10;
      }
      sfx("flip", start + t, 0.35);
      review = { start: t, frames: p + 20, parts };
      t += review.frames;
    }
    segments.push({ type: "lesson", start, frames: t + 8, intro, items, review, subs });
    cursor += t + 8;
  }
  // Next episode + outro
  {
    const start = cursor;
    const a = 18;
    voice("n-next1", start + a);
    const b = a + fr(dur("n-next1")) + 10;
    voice("n-next2", start + b);
    const c = b + fr(dur("n-next2")) + 18;
    sfx("stamp", start + c, 0.5);
    voice("n-outro", start + c + 14);
    const frames = c + 14 + fr(dur("n-outro")) + 70;
    segments.push({ type: "next", start, frames, marks: { a, b, c } });
    cursor += frames;
  }

  const sc = (id: number) => segments.find((s) => s.type === "scene" && s.scene.id === id) as SceneT;
  const lesson = segments.find((s) => s.type === "lesson")!;
  const s5 = sc(5), s6 = sc(6), s8 = sc(8);
  // Light BGM -> silence + heartbeat in the office -> calm piano for the decision -> light BGM -> cut for the awkward pause
  const music = [
    { src: "sfx/bgm.wav", from: 0, to: s5.start },
    { src: "sfx/bgm-calm.wav", from: s6.start, to: s8.start },
    { src: "sfx/bgm.wav", from: s8.start, to: s8.start + s8.at("s8l5") },
    { src: "sfx/bgm.wav", from: lesson.start, to: cursor },
  ];
  const speech = audio.filter((a) => a.voice).map((a) => [a.from, a.from + a.frames] as const);

  return { segments, audio, total: cursor, music, speech };
}

function sfxVol(name: string) {
  const v: Record<string, number> = { scratch: 0.5, dun: 0.55, error: 0.4, clap: 0.45, steps: 0.5, sparkle: 0.5, paper: 0.6, knock: 0.7, heartbeat: 0.8, scribble: 0.6 };
  return v[name] ?? 0.45;
}

function sceneExtras(s: SceneT, sfx: (n: string, f: number, v?: number) => void) {
  const g = (id: string, o = 0) => s.start + s.at(id, o);
  switch (s.scene.id) {
    case 1:
      sfx("pop", g("s1-open", 4), 0.3);
      sfx("pop", g("s1n1", 12), 0.35);
      sfx("pop", g("s1n3", 8), 0.35);
      break;
    case 2:
      [0, 1, 2].forEach((i) => sfx("tick", g("s2n2", 6 + i * 10), 0.4));
      break;
    case 3:
      [0, 1, 2].forEach((i) => sfx("pop", g("s3-draw", 10 + i * 11), 0.22));
      sfx("pop", g("s3-draw", 44), 0.3);
      sfx("error", g("s3l1", 6), 0.3);
      sfx("stamp", g("s3l2", 10), 0.4);
      [0, 1, 2, 3, 4].forEach((i) => sfx("pop", g("s3l3", 20 + i * 12), 0.25));
      break;
    case 4:
      sfx("whoosh", g("s4n2", 4), 0.3);
      break;
    case 5:
      sfx("pop", g("s5n1", 24), 0.3);
      break;
    case 6:
      sfx("paper", g("s6n1", 4), 0.4);
      sfx("tick", g("s6n2", 8), 0.4);
      break;
    case 8:
      sfx("stamp", g("s8-awk", 2), 0.4);
      [0, 1, 2].forEach((i) => sfx("tick", g("s8-awk", 20 + i * 10), 0.35));
      break;
  }
}

export const TL = buildTimeline();
export { story };
