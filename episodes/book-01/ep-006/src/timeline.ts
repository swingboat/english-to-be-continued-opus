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
    voice("n-recap", start + 8);
    subs.push({ start: 8, frames: fr(dur("n-recap")), ...narr("n-recap") });
    const intro = 8 + fr(dur("n-recap")) + 6;
    let t = intro;
    const items = story.words.map((w) => {
      const lines: [string, string, string][] = [
        [`w-${w.id}-en`, w.word, w.meaning],
        [`w-${w.id}-def`, w.en, w.enZh],
      ];
      if (w.uk) lines.push([`w-${w.id}-gb`, `British: ${w.word}`, "英音"], [`w-${w.id}-en`, `American: ${w.word}`, "美音"]);
      lines.push([`r-${w.id}`, w.example, w.exampleZh]);
      let p = 6;
      const parts = lines.map(([id, en, zh]) => {
        const part = { id, start: p, frames: fr(dur(id)) };
        voice(id, start + t + p);
        subs.push({ start: t + p, frames: part.frames + 5, en, zh });
        p += part.frames + 3;
        return part;
      });
      sfx("flip", start + t, 0.35);
      const item = { start: t, frames: p + 4, parts };
      t += item.frames;
      return item;
    });
    // Review card: words from earlier episodes, lit up in turn while their shared story sentence is read
    let review: Lesson["review"];
    if (story.review?.length) {
      let p = 10;
      const parts: Part[] = [];
      const lines: [string, string, string][] = [
        ["n-review", narr("n-review").en, narr("n-review").zh],
        ["rv-example", story.reviewExample.en, story.reviewExample.zh],
      ];
      for (const [id, en, zh] of lines) {
        parts.push({ id, start: p, frames: fr(dur(id)) });
        voice(id, start + t + p);
        subs.push({ start: t + p, frames: fr(dur(id)) + 6, en, zh });
        p += fr(dur(id)) + (id === "rv-example" ? 8 : 6);
      }
      sfx("flip", start + t, 0.35);
      review = { start: t, frames: p + 14, parts };
      t += review.frames;
    }
    segments.push({ type: "lesson", start, frames: t + 4, intro, items, review, subs });
    cursor += t + 4;
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
  const [s2, s3, s4, s6, s7, s8] = [2, 3, 4, 6, 7, 8].map(sc);
  // Light BGM for the cold open -> calm while Xiaoman pitches -> light when the clone's timetable unrolls,
  // cut as the red pen circles one box -> light again for the roles -> silence before the clone's confession,
  // calm for "learn it by practice" -> light for the hands-up -> calm verdict, cut before the inner line
  const music = [
    { src: "sfx/bgm.wav", from: 0, to: s2.start },
    { src: "sfx/bgm-calm.wav", from: s2.start, to: s3.start },
    { src: "sfx/bgm.wav", from: s3.start, to: s4.start + s4.at("s4n1") },
    { src: "sfx/bgm.wav", from: s4.start + s4.at("s4l3"), to: s6.start + s6.at("s6-hmm") },
    { src: "sfx/bgm-calm.wav", from: s6.start + s6.at("s6n1"), to: s7.start },
    { src: "sfx/bgm.wav", from: s7.start, to: s8.start },
    { src: "sfx/bgm-calm.wav", from: s8.start, to: s8.start + s8.at("s8-quiet") },
    { src: "sfx/bgm.wav", from: lesson.start, to: cursor },
  ];
  const speech = audio.filter((a) => a.voice).map((a) => [a.from, a.from + a.frames] as const);

  return { segments, audio, total: cursor, music, speech };
}

function sfxVol(name: string) {
  const v: Record<string, number> = { scratch: 0.5, dun: 0.55, error: 0.4, clap: 0.35, steps: 0.5, sparkle: 0.4, paper: 0.6, knock: 0.7, heartbeat: 0.8, scribble: 0.6,
    bell: 0.3, rustle: 0.6, breath: 0.5, cough: 0.55, cricket: 0.45, zipper: 0.5, giggle: 0.4, buzzer: 0.4,
    thud: 0.6, door: 0.4, clink: 0.4, water: 0.35, beep: 0.5, rewind: 0.35, notify: 0.4, click: 0.5, birds: 0.35, unfold: 0.6, marker: 0.6, jingle: 0.35 };
  return v[name] ?? 0.45;
}

// Frame inside a line at fraction p of its spoken audio
export const atFrac = (s: SceneT, id: string, p: number) => {
  const b = s.beats.find((x) => x.id === id)!;
  return b.start + Math.round(b.audioFrames * p);
};

function sceneExtras(s: SceneT, sfx: (n: string, f: number, v?: number) => void) {
  const g = (id: string, o = 0) => s.start + s.at(id, o);
  const m = (id: string, p: number) => s.start + atFrac(s, id, p);
  switch (s.scene.id) {
    case 1:
      sfx("pop", g("s1l2", 30), 0.3);
      sfx("tick", g("s1l3", 6), 0.35);
      sfx("stamp", g("s1n2", 14), 0.4);
      break;
    case 2:
      [0, 8, 16, 24].forEach((o) => sfx("pop", g("s2-voices", o), 0.3));
      sfx("sparkle", g("s2-voices", 26), 0.25);
      sfx("flip", g("s2n1", 4), 0.3);
      sfx("pop", g("s2n2", 10), 0.3);
      break;
    case 3:
      sfx("whoosh", m("s3n3", 0.6), 0.25);
      sfx("thud", m("s3n3", 0.85), 0.45);
      sfx("dun", g("s3l3", 6), 0.35);
      break;
    case 4:
      [0, 0.24, 0.48].forEach((p) => sfx("pop", m("s4l1", p) + 4, 0.3));
      sfx("scratch", g("s4n1", 2), 0.35);
      sfx("bonk", g("s4l3", 60), 0.3);
      break;
    case 5:
      sfx("click", g("s5n1", 16), 0.35);
      sfx("click", g("s5n2", 16), 0.35);
      sfx("click", g("s5n3", 16), 0.35);
      break;
    case 6:
      sfx("error", g("s6n1", 8), 0.3);
      sfx("ding", g("s6l3", 20), 0.3);
      break;
    case 7:
      sfx("ding", g("s7l2", 6), 0.3);
      sfx("ding", g("s7l3", 6), 0.3);
      sfx("scribble", g("s7n2", 6), 0.4);
      break;
    case 8:
      sfx("ding", g("s8n2", 10), 0.3);
      sfx("ding", g("s8n3", 6), 0.3);
      sfx("rustle", g("s8l2", 24), 0.4);
      sfx("heartbeat", g("s8-quiet", 4), 0.45);
      break;
  }
}

export const TL = buildTimeline();
export { story };
