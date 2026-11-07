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
export type Sub = { start: number; frames: number; en: string; zh: string };
export type Lesson = { type: "lesson"; start: number; frames: number; intro: number; items: { start: number; frames: number; parts: Part[] }[]; subs: Sub[] };
export type Segment = SceneT | Simple | Lesson;

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
  // Rewind
  {
    const start = cursor;
    sfx("rewind", start, 0.45);
    voice("n-rewind", start + 12);
    const frames = 52;
    segments.push({ type: "rewind", start, frames, marks: {} });
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
    const recap = story.narration.find((n) => n.id === "n-recap") as { en: string; zh: string };
    voice("n-recap", start + 14);
    subs.push({ start: 14, frames: fr(dur("n-recap")), en: recap.en, zh: recap.zh });
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
    segments.push({ type: "lesson", start, frames: t + 8, intro, items, subs });
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

  const s8 = segments.find((s) => s.type === "scene" && s.scene.id === 8) as SceneT;
  const lesson = segments.find((s) => s.type === "lesson")!;
  const music = [
    { from: 0, to: s8.start + s8.at("s8l1") },
    { from: lesson.start, to: cursor },
  ];
  const speech = audio.filter((a) => a.voice).map((a) => [a.from, a.from + a.frames] as const);

  return { segments, audio, total: cursor, music, speech };
}

function sfxVol(name: string) {
  const v: Record<string, number> = { scratch: 0.5, dun: 0.55, error: 0.4, clap: 0.45, steps: 0.6, sparkle: 0.5, paper: 0.7 };
  return v[name] ?? 0.45;
}

function sceneExtras(s: SceneT, sfx: (n: string, f: number, v?: number) => void) {
  const g = (id: string, o = 0) => s.start + s.at(id, o);
  switch (s.scene.id) {
    case 4:
      sfx("boing", g("s4l3", 4), 0.35);
      sfx("whoosh", g("s4-vs", 0), 0.3);
      break;
    case 5:
      sfx("stamp", g("s5-stamp", 14), 0.45);
      break;
    case 6:
      [0, 1, 2].forEach((i) => sfx("tick", g("s6l2", 8 + i * 16), 0.35));
      [0, 1, 2].forEach((i) => sfx("ding", g("s6-clash", 2 + i * 12), 0.3));
      sfx("bonk", g("s6-clash", 40), 0.5);
      break;
    case 7:
      sfx("tap", g("s7-check", 4), 0.4);
      break;
    case 8:
      sfx("pop", g("s8-recall", 2), 0.35);
      sfx("tap", g("s8-recall", 26), 0.4);
      sfx("error", g("s8-recall", 34), 0.45);
      break;
  }
}

export const TL = buildTimeline();
export { story };
