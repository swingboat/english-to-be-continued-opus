import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { SceneFX, shotFilter, TopFX } from "./fx";
import { Lesson, Prev, SceneT, Simple, story } from "./timeline";
import {
  AVATAR, C, camAt, clamp, EN, KaraokeEn, NarrationSub, Paper, PlaceCaption, SAFE, sp, SANS, Seal, SERIF, shakeAt, Shot, SpeakerWave, Subtitles, Vignette,
} from "./ui";

// ---------------- Story scene (full-screen anime shot) ----------------
export const Scene: React.FC<{ s: SceneT }> = ({ s }) => {
  const f = useCurrentFrame();
  const id = s.scene.id;
  const cam = camAt(s, f);
  const shakes = [
    id === 4 ? shakeAt(f, s.at("s4-clock", 56), 12, 14) : null,
    id === 4 ? shakeAt(f, s.at("s4l2", 6), 8, 8) : null,
    id === 5 ? shakeAt(f, s.at("s5-down", 2), 8, 8) : null,
    id === 8 ? shakeAt(f, s.at("s8-ping"), 8, 6) : null,
  ].filter(Boolean) as { x: number; y: number }[];
  const shake = shakes.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
  const fadeIn = interpolate(f, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)`, opacity: fadeIn }}>
        <Shot panel={s.scene.panel} cam={cam} filter={shotFilter(s, f)}>
          {(r) => <SceneFX s={s} f={f} r={r} />}
        </Shot>
      </AbsoluteFill>
      <Vignette />
      <PlaceCaption text={s.scene.place} f={f} />
      <Subtitles s={s} f={f} />
      <TopFX s={s} f={f} />
    </AbsoluteFill>
  );
};

// ---------------- Previously on (cold open) ----------------
export const PrevView: React.FC<{ seg: Prev }> = ({ seg }) => {
  const f = useCurrentFrame();
  const cur = seg.items.find((it, i) => f < it.start + it.frames || i === seg.items.length - 1)!;
  const p = Math.min(1, Math.max(0, (f - cur.start) / cur.frames));
  const e = p * p * (3 - 2 * p);
  const cam = { x: cur.from[0] + (cur.to[0] - cur.from[0]) * e, y: cur.from[1] + (cur.to[1] - cur.from[1]) * e, z: cur.from[2] + (cur.to[2] - cur.from[2]) * e };
  const flash = interpolate(f - cur.start, [0, 6], [0.8, 0], clamp);
  const o = Math.min(interpolate(f - cur.start, [0, 6], [0, 1], clamp), interpolate(cur.start + cur.frames - f, [0, 4], [0, 1], clamp));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot panel={cur.panel} cam={cam} filter="sepia(.45) saturate(.8) contrast(1.05)" />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 6px)" }} />
      <Vignette />
      <div style={{ position: "absolute", left: SAFE.left, top: 336, fontFamily: SANS, color: "#fff", display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ background: C.red, fontFamily: EN, fontSize: 40, fontWeight: 900, padding: "6px 22px", letterSpacing: 4 }}>PREVIOUSLY</span>
        <span style={{ fontFamily: EN, fontSize: 26, letterSpacing: 4, textShadow: "0 2px 8px #000" }}>PREVIOUSLY · EP.00{story.episodeNo - 1}</span>
      </div>
      <NarrationSub id={cur.id} at={cur.start} f={f} />
    </AbsoluteFill>
  );
};

// ---------------- Title card ----------------
export const Title: React.FC<{ seg: Simple }> = ({ seg }) => {
  const f = useCurrentFrame();
  const seal = interpolate(f, [0, 7], [4, 1], clamp);
  const line = (i: number) => sp(f - 10 - i * 5, { damping: 14 });
  const out = interpolate(f, [seg.frames - 10, seg.frames], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.surface, opacity: 1 - out, background: "#000" }}>
      <Img src={staticFile("panels/p4.png")} style={{ position: "absolute", inset: -60, width: 1200, height: 2040, objectFit: "cover",
        filter: "blur(18px) brightness(.38) saturate(1.2)", transform: `scale(${1.05 + f / 1200})` }} />
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `scale(${seal})`, opacity: interpolate(f, [0, 3], [0, 1], clamp) }}>
          <Seal size={150} dark />
        </div>
        <div style={{ marginTop: 34, fontFamily: EN, fontSize: 52, fontWeight: 900, letterSpacing: 4, opacity: line(0) }}>ENGLISH: TO BE CONTINUED</div>
        <div style={{ fontFamily: EN, fontSize: 24, letterSpacing: 6, opacity: line(0) * 0.8 }}>AN ANIME ENGLISH SERIES</div>
      </div>
      <div style={{ position: "absolute", top: 760, left: 90, right: 90 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 28, opacity: line(1), letterSpacing: 2 }}>
          <span style={{ border: `2px solid ${C.surface}`, padding: "4px 12px", fontFamily: "ui-monospace, Menlo, monospace" }}>EPISODE {story.episodeNo}</span>
          <span style={{ fontFamily: EN }}>{story.season}</span>
        </div>
        {story.titleLines.map((t, i) => (
          <div key={t} style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.2, marginTop: i ? 0 : 30, letterSpacing: -2,
            opacity: line(i + 2), transform: `translateY(${(1 - line(i + 2)) * 60}px)`, textShadow: "0 8px 30px rgba(0,0,0,.6)",
            color: i === story.titleLines.length - 1 ? "#ff8a70" : undefined }}>
            {t}
          </div>
        ))}
      </div>
      <NarrationSub id="n-title" at={seg.marks.voice} f={f} zhTop={650} />
    </AbsoluteFill>
  );
};

// ---------------- Rewind ----------------
export const Rewind: React.FC<{ seg: Simple }> = ({ seg }) => {
  const f = useCurrentFrame();
  const mins = Math.max(39, 42 - Math.floor(f / 10));
  return (
    <AbsoluteFill style={{ background: "#111", fontFamily: SANS }}>
      <AbsoluteFill style={{ filter: "saturate(.5) contrast(1.2)", opacity: 0.85 }}>
        {new Array(8).fill(0).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 240, height: 240, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: (random(`r${i}-${Math.floor(f / 2)}`) - 0.5) * 120, top: -i * 240, width: 1080, height: 1920 }}>
              <Shot panel="p1" cam={{ x: 0.4, y: 0.5, z: 1.9 + f / 80 }} />
            </div>
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 3px, transparent 3px 7px)" }} />
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center", color: "#fff", textShadow: "4px 0 #ff3b3b, -4px 0 #3bd5ff" }}>
        <div style={{ fontFamily: EN, fontSize: 120, fontWeight: 900, letterSpacing: -10 }}>◀◀</div>
        <div style={{ fontFamily: EN, fontSize: 96, fontWeight: 900, letterSpacing: 2 }}>3 MINUTES EARLIER</div>
        <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 54, marginTop: 10 }}>16:{mins}</div>
      </div>
      <div style={{ position: "absolute", left: SAFE.left, top: 300, color: "#fff", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 40 }}>
        REW ◀◀ {seg.frames - f}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- To Be Continued freeze ----------------
export const TBC: React.FC<{ last: SceneT }> = ({ last }) => {
  const f = useCurrentFrame();
  const sepia = interpolate(f, [0, 10], [0, 1], clamp);
  const arrow = sp(f - 10, { damping: 15, stiffness: 90 });
  const cam = camAt(last, last.frames);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot panel={last.scene.panel} cam={cam} filter={`sepia(${sepia}) contrast(${1 + 0.15 * sepia}) brightness(${1 - 0.08 * sepia})`} />
      <AbsoluteFill style={{ background: "radial-gradient(transparent 45%, rgba(60,30,0,.6))", opacity: sepia }} />
      <div style={{ position: "absolute", left: 60, top: 1180, transform: `translateX(${(1 - arrow) * 1200}px)` }}>
        <svg width="840" height="159" viewBox="0 0 900 170">
          <path d="M8 85 L120 8 L120 45 L890 45 L890 125 L120 125 L120 162 Z" fill="#f5e6c4" stroke="#3b2a12" strokeWidth="8" strokeLinejoin="round" />
          <text x="510" y="102" textAnchor="middle" fontFamily={EN} fontWeight="900" fontStyle="italic" fontSize="56" fill="#3b2a12">To Be Continued</text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- End-of-episode lesson ----------------
export const LessonView: React.FC<{ seg: Lesson }> = ({ seg }) => {
  const f = useCurrentFrame();
  const head = sp(f, { damping: 14 });
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <Paper />
      <div style={{ position: "absolute", top: SAFE.top + 92, left: SAFE.left, right: SAFE.left, opacity: head, transform: `translateY(${(1 - head) * -40}px)` }}>
        <div style={{ fontFamily: EN, fontSize: 22, letterSpacing: 5, color: C.red, fontWeight: 800 }}>AFTER THE STORY · ENGLISH CORNER</div>
        <div style={{ fontFamily: EN, fontSize: 56, color: C.ink, fontWeight: 800, letterSpacing: -1 }}>Words of the Episode</div>
      </div>
      {f < seg.intro && (
        <div style={{ position: "absolute", top: 520, left: 70, right: 70, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {story.words.map((w, i) => (
            <span key={w.word} style={{ fontFamily: EN, fontSize: 64, fontWeight: 800, color: C.surface, background: i % 2 ? C.blue : C.red,
              padding: "10px 34px", borderRadius: 50, transform: `scale(${sp(f - 14 - i * 6, { damping: 8 })}) rotate(${(i % 2 ? 1 : -1) * 3}deg)` }}>
              {w.word}
            </span>
          ))}
        </div>
      )}
      {seg.items.map((it, i) => {
        const d = f - it.start;
        if (d < -2 || d > it.frames + 14) return null;
        const w = story.words[i];
        const inn = sp(d, { damping: 14 });
        const out = interpolate(d, [it.frames - 2, it.frames + 12], [0, 1], clamp);
        const playing = (id: string) => it.parts.some((p) => p.id === id && d >= p.start && d < p.start + p.frames + 4);
        const usOn = playing(`w-${w.id}-en`);
        const gbOn = playing(`w-${w.id}-gb`);
        const ex = it.parts.find((p) => p.id === `r-${w.id}`)!;
        return (
          <div key={w.word} style={{ position: "absolute", left: SAFE.left, right: SAFE.left, top: 500,
            transform: `translateX(${(1 - inn) * 1100 - out * 1100}px) rotate(${(1 - inn) * 6}deg)` }}>
            <div style={{ background: C.surface, border: `4px solid ${C.ink}`, borderRadius: 14, padding: 20, boxShadow: `14px 14px 0 ${C.shadow}`, transform: "rotate(-1deg)" }}>
              <div style={{ display: "flex", gap: 22 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 24, color: C.red }}>WORD / {String(i + 1).padStart(2, "0")}</div>
                  <div style={{ fontFamily: EN, fontSize: w.word.length > 14 ? 52 : w.word.length > 10 ? 60 : w.word.length > 8 ? 68 : 76, fontWeight: 800, color: C.ink, letterSpacing: -2, lineHeight: 1.15 }}>
                    {w.word}{usOn && <SpeakerWave size={52} />}
                  </div>
                {w.uk ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "6px 0 12px" }}>
                    {[{ k: "UK", ipa: w.uk, on: gbOn }, { k: "US", ipa: w.us, on: usOn }].map((p) => (
                      <span key={p.k} style={{ fontSize: 30, padding: "2px 12px", borderRadius: 10, border: `3px solid ${p.on ? C.red : C.line}`,
                        background: p.on ? "#fbe3dc" : "transparent", color: C.ink }}>
                        <b style={{ color: C.red }}>{p.k}</b> {p.ipa}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 34, color: C.muted, margin: "2px 0 12px" }}>{w.ipa}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 36, fontWeight: 700, color: C.muted }}>
                  <span style={{ fontFamily: EN, fontSize: 26, fontWeight: 700, background: C.ink, color: "#fff", padding: "4px 12px", borderRadius: 6 }}>{w.pos}</span>
                  {w.meaning}
                </div>
                </div>
                <div style={{ position: "relative", width: 300, height: 290, flexShrink: 0, overflow: "hidden", borderRadius: 8 }}>
                  <Img src={staticFile(`panels/${w.panel}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + d / 500})` }} />
                  <span style={{ position: "absolute", left: 10, top: 10, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 22, padding: "3px 12px", borderRadius: 6 }}>
                    Scene {w.scene}
                  </span>
                </div>
              </div>
              <div style={{ padding: "0 90px 0 6px" }}>
                {(() => {
                  const def = it.parts.find((p) => p.id === `w-${w.id}-def`)!;
                  return (
                    <div style={{ fontFamily: EN, fontSize: 34, fontWeight: 600, color: C.ink, marginTop: 20, lineHeight: 1.35,
                      opacity: interpolate(d - def.start, [0, 8], [0, 1], clamp), borderLeft: `6px solid ${C.yellow}`, paddingLeft: 16 }}>
                      {w.en}
                    </div>
                  );
                })()}
                <div style={{ borderTop: `2px solid ${C.line}`, marginTop: 20, paddingTop: 16 }}>
                  <KaraokeEn text={w.example} progress={Math.min(1, Math.max(0, (d - ex.start) / Math.max(1, ex.frames * 0.9)))} kw={(w as { kw?: string }).kw ?? w.word} size={50} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {seg.review && <ReviewCard f={f - seg.review.start} frames={seg.review.frames} parts={seg.review.parts} />}
      <div style={{ position: "absolute", top: SAFE.top + 104, right: SAFE.left, display: "flex", gap: 14 }}>
        {seg.items.map((it, i) => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: f >= it.start ? C.red : C.line }} />
        ))}
      </div>
      <LessonSub subs={seg.subs} f={f} />
    </AbsoluteFill>
  );
};

const LessonSub: React.FC<{ subs: Lesson["subs"]; f: number }> = ({ subs, f }) => {
  const s = subs.find((x) => f >= x.start && f < x.start + x.frames + 8);
  if (!s) return null;
  const o = Math.min(interpolate(f - s.start, [0, 4], [0, 1], clamp), interpolate(s.start + s.frames + 8 - f, [0, 4], [0, 1], clamp));
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, bottom: SAFE.bottom, background: "rgba(21,63,58,.94)", borderRadius: 20, padding: "20px 30px",
      textAlign: "center", opacity: o, boxShadow: "0 12px 30px rgba(0,0,0,.25)" }}>
      <div style={{ fontFamily: EN, fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{s.en}</div>
      <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 600, color: "#ffe9a8", lineHeight: 1.4, marginTop: 8 }}>{s.zh}</div>
    </div>
  );
};

const ReviewCard: React.FC<{ f: number; frames: number; parts: { id: string; start: number; frames: number }[] }> = ({ f, frames, parts }) => {
  if (f < -2 || f > frames + 14) return null;
  const inn = sp(f, { damping: 14 });
  const out = interpolate(f, [frames - 2, frames + 12], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: 470, transform: `translateX(${(1 - inn) * 1100 - out * 1100}px)` }}>
      <div style={{ fontFamily: EN, fontSize: 52, fontWeight: 800, color: C.ink, marginBottom: 30 }}>Back from Episode {story.reviewFrom}</div>
      {story.review.map((w) => {
        const p = parts.find((x) => x.id === `rv-${w.word}`)!;
        const prog = Math.min(1, Math.max(0, (f - p.start) / Math.max(1, p.frames * 0.9)));
        const on = f >= p.start && f < p.start + p.frames + 6;
        return (
          <div key={w.word} style={{ background: C.surface, border: `4px solid ${on ? C.red : C.ink}`, borderRadius: 14, padding: "20px 28px",
            marginBottom: 26, boxShadow: `12px 12px 0 ${on ? "#f3c9bd" : C.shadow}`, transform: `scale(${on ? 1.02 : 1})` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
              <span style={{ fontFamily: EN, fontSize: 68, fontWeight: 800, color: C.ink }}>{w.word}</span>
              <span style={{ fontSize: 40, fontWeight: 800, color: C.muted }}>{w.meaning}</span>
            </div>
            <KaraokeEn text={w.example} progress={prog} kw={w.word} size={50} />
          </div>
        );
      })}
    </div>
  );
};

// ---------------- Next episode + outro ----------------
export const Next: React.FC<{ seg: Simple }> = ({ seg }) => {
  const f = useCurrentFrame();
  const { b, c } = seg.marks;
  const k1 = sp(f - 4, { damping: 14 });
  const k2 = sp(f - b, { damping: 14 });
  const end = sp(f - c, { damping: 12 });
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile("panels/p8.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(14px) brightness(.45) saturate(.7)", transform: `scale(${1.15 + f / 900})` }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: SAFE.left, right: SAFE.left, top: 600, color: C.surface, opacity: 1 - end, transform: `translateY(${end * -200}px)` }}>
        <div style={{ fontFamily: EN, fontSize: 30, letterSpacing: 8, color: C.yellow, opacity: k1 }}>NEXT EPISODE / {story.next.no}</div>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.25, marginTop: 20, opacity: k1, transform: `translateY(${(1 - k1) * 60}px)` }}>
          {story.next.lines[0]}<br /><span style={{ color: "#ff8a70" }}>{story.next.lines[1]}</span>
        </div>
        <div style={{ fontSize: 34, marginTop: 30, lineHeight: 1.5, opacity: k2, transform: `translateY(${(1 - k2) * 40}px)` }}>
          {story.next.desc[0]}<br />{story.next.desc[1]}
        </div>
      </div>
      <NarrationSub id="n-next1" at={seg.marks.a} f={f} />
      <NarrationSub id="n-next2" at={b} f={f} />
      {f >= c && (
        <AbsoluteFill style={{ background: C.ink, opacity: end, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.surface }}>
          <div style={{ position: "relative", marginTop: -120, transform: `scale(${interpolate(f - c, [0, 8], [2.2, 1], clamp)})` }}>
            <Img src={staticFile(AVATAR)} style={{ width: 380, height: 380, borderRadius: "50%", border: `10px solid ${C.surface}`,
              boxShadow: "0 0 0 14px rgba(241,209,127,.3), 0 24px 60px rgba(0,0,0,.5)" }} />
            <div style={{ position: "absolute", right: -14, bottom: 4, background: C.ink, padding: 10, borderRadius: 10 }}>
              <Seal size={86} dark />
            </div>
          </div>
          <div style={{ fontSize: 104, fontWeight: 900, letterSpacing: 10, marginTop: 64, opacity: sp(f - c - 6) }}>英语有续集</div>
          <div style={{ fontFamily: EN, fontSize: 40, fontWeight: 900, letterSpacing: 3, marginTop: 4, color: C.yellow, opacity: sp(f - c - 6) }}>
            ENGLISH: TO BE CONTINUED
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, marginTop: 70, letterSpacing: 4, opacity: sp(f - c - 16) }}>跟着故事，学会单词</div>
          <div style={{ fontFamily: EN, fontSize: 40, fontStyle: "italic", marginTop: 8, opacity: sp(f - c - 16) * 0.85 }}>
            Follow the story. Learn the words.
          </div>
          <div style={{ marginTop: 80, display: "flex", alignItems: "center", gap: 14, background: C.red, borderRadius: 60, padding: "16px 36px",
            fontSize: 40, fontWeight: 900, letterSpacing: 1, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            opacity: sp(f - c - 40), transform: `scale(${sp(f - c - 40, { damping: 8 }) * (1 + 0.03 * Math.sin((f - c) / 5))})` }}>
            ＋ 关注 · <span style={{ fontFamily: EN }}>See you in Episode {story.episodeNo + 1}!</span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
