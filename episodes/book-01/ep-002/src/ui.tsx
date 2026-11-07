import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile } from "remotion";
import { FPS, H, SceneT, story, W } from "./timeline";
import durations from "../data/durations.json";

export const C = {
  paper: "#f6f3eb",
  surface: "#fffdf7",
  ink: "#153f3a",
  muted: "#53645f",
  line: "#d2d8cc",
  red: "#b84735",
  blue: "#245f72",
  yellow: "#f1d17f",
  shadow: "#d9dfcf",
  subYellow: "#ffd75e",
};
export const SANS = '"PingFang SC","Hiragino Sans GB","Heiti SC",sans-serif';
export const SERIF = '"Songti SC","STSong",serif';
export const EN = '"Avenir Next","Helvetica Neue","PingFang SC",sans-serif';

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.inOut(Easing.cubic);
export const sp = (frame: number, cfg: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
  spring({ frame, fps: FPS, config: { damping: 12, stiffness: 140, mass: 0.8, ...cfg } });

export const WHO_COLOR: Record<string, string> = {
  lin: "#e0604a", "lin-narr": "rgba(24,24,28,.82)", "lin-inner": "#e0604a", clone: "#3d9cc0",
  both: "#c9874a", teacher: "#5aa58c", su: "#b07ad0", phone: "#999",
};

export const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      background: C.paper,
      backgroundImage: "radial-gradient(rgba(21,63,58,.07) 2px, transparent 2px)",
      backgroundSize: "34px 34px",
    }}
  />
);

export const Seal: React.FC<{ size?: number; dark?: boolean }> = ({ size = 56, dark }) => (
  <div
    style={{
      width: size * 0.85, height: size, display: "grid", placeItems: "center",
      border: `${Math.max(2, size / 22)}px solid ${dark ? C.surface : C.ink}`, borderRadius: 3,
      transform: "rotate(-5deg)", fontWeight: 900, fontSize: size * 0.52, fontFamily: SANS,
      color: dark ? C.surface : C.ink, position: "relative",
    }}
  >
    续
    <span
      style={{
        position: "absolute", right: -size * 0.1, bottom: size * 0.02, width: size * 0.22, height: size * 0.22,
        borderRadius: "50%", background: C.red, border: `${size / 22}px solid ${dark ? C.ink : C.paper}`,
      }}
    />
  </div>
);

// ---------- Camera ----------
export type Cam = { x: number; y: number; z: number };

export function camAt(s: SceneT, f: number): Cam {
  const keys = s.scene.cam
    .map((k) => ({ f: s.at(k.at, (k as { offset?: number }).offset ?? 0), x: k.x, y: k.y, z: k.z }))
    .sort((a, b) => a.f - b.f);
  let cur: Cam = keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f < a.f) break;
    if (b.f <= a.f) { cur = b; continue; }
    const p = ease(Math.min(1, (f - a.f) / (b.f - a.f)));
    cur = { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p };
    if (f < b.f) break;
  }
  if (f >= keys[keys.length - 1].f) cur = keys[keys.length - 1];
  // gentle "handheld" breathing
  return { x: cur.x + 0.004 * Math.sin(f / 37), y: cur.y + 0.004 * Math.cos(f / 43), z: cur.z * (1 + 0.012 * Math.sin(f / 60)) };
}

export type Rect = { x: number; y: number; w: number; h: number };

// z = 1 fits the panel to the frame width; larger z zooms in (full-bleed around z≈1.5–2).
export function shotRect(panel: string, cam: Cam, vw = W, vh = H): Rect {
  const [iw, ih] = (story.panels as Record<string, number[]>)[panel];
  const s = (vw / iw) * cam.z;
  const w = iw * s, h = ih * s;
  const x = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, vw / 2 - cam.x * w));
  const y = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, vh / 2 - cam.y * h));
  return { x, y, w, h };
}

export const Shot: React.FC<{ panel: string; cam: Cam; filter?: string; children?: (r: Rect) => React.ReactNode }> = ({
  panel, cam, filter, children,
}) => {
  const r = shotRect(panel, cam);
  const src = staticFile(`panels/${panel}.png`);
  return (
    <AbsoluteFill style={{ background: "#0c1514", overflow: "hidden" }}>
      <Img src={src} style={{ position: "absolute", inset: -80, width: W + 160, height: H + 160, objectFit: "cover",
        filter: "blur(36px) brightness(.5) saturate(1.2)" }} />
      <Img src={src} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, maxWidth: "none", filter,
        boxShadow: "0 0 80px rgba(0,0,0,.55)" }} />
      {children?.(r)}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.45) 100%)", pointerEvents: "none" }} />
);

export function shakeAt(f: number, at: number, len = 14, amp = 18) {
  const d = f - at;
  if (d < 0 || d > len) return { x: 0, y: 0 };
  const k = (1 - d / len) * amp;
  return { x: Math.sin(d * 2.7) * k, y: Math.cos(d * 3.3) * k * 0.6 };
}

// ---------- Anime subtitles ----------
const outline = (c: string, r = 4) =>
  [[r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, -r * 0.7]]
    .map(([x, y]) => `${x}px ${y}px 0 ${c}`)
    .concat("0 6px 18px rgba(0,0,0,.6)")
    .join(",");

const norm = (w: string) => w.toLowerCase().replace(/[^a-z]/g, "");

// Douyin safe zone (1080×1920): status bar + tabs/search cover y<250, account/caption cover the bottom ~480px,
// action buttons cover x>890 below mid-screen, and tall phones crop ~50px per side.
export const SAFE = { top: 270, bottom: 500, left: 90, right: 190 };

// Chinese translation lives in its own band at the top, away from the English line
export const ZhTop: React.FC<{ text: string; o: number; dark?: boolean; top?: number }> = ({ text, o, dark, top = 420 }) => (
  <div style={{ position: "absolute", left: SAFE.left, right: SAFE.left, top, textAlign: "center", opacity: o, pointerEvents: "none" }}>
    <span style={{ display: "inline-block", fontFamily: SANS, fontSize: 38, fontWeight: 700, lineHeight: 1.4, padding: "8px 24px", borderRadius: 14,
      color: dark ? C.ink : "#ffe9a8", background: dark ? "rgba(255,253,247,.92)" : "rgba(0,0,0,.42)",
      border: dark ? `2px solid ${C.line}` : undefined, textShadow: dark ? undefined : outline("#111", 2) }}>
      {text}
    </span>
  </div>
);

export const Subtitles: React.FC<{ s: SceneT; f: number }> = ({ s, f }) => {
  const lines = s.beats.filter((b) => b.kind === "line" && b.raw.who !== "phone");
  const idx = lines.findIndex((b, i) => {
    const next = lines[i + 1];
    const end = Math.min(b.start + b.audioFrames + 16, next ? next.start : Infinity);
    return f >= b.start && f < end;
  });
  if (idx < 0) return null;
  const b = lines[idx];
  const next = lines[idx + 1];
  const end = Math.min(b.start + b.audioFrames + 16, next ? next.start : Infinity);
  const o = Math.min(interpolate(f - b.start, [0, 4], [0, 1], clamp), interpolate(end - f, [0, 4], [0, 1], clamp));
  const r = b.raw;
  const who = r.who!;
  const inner = who.startsWith("lin-inner");
  const narr = who === "lin-narr";
  const label = story.voices[who as keyof typeof story.voices].label;
  return (
    <>
    {r.en && <ZhTop text={r.zh ?? ""} o={o} />}
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, bottom: SAFE.bottom, textAlign: "center", opacity: o,
      transform: `translateY(${(1 - o) * 12}px)`, fontFamily: SANS, color: "#fff" }}>
      <div style={{ display: "inline-block", fontSize: 26, fontWeight: 800, color: "#fff", background: WHO_COLOR[who],
        padding: "2px 16px", borderRadius: 20, marginBottom: 12, letterSpacing: 2, opacity: 0.92,
        border: narr ? "3px solid #e0604a" : undefined, fontStyle: narr ? "italic" : undefined }}>
        {narr ? "✎ Xiaoshuai · narrating" : inner ? "Xiaoshuai (thinking)" : who === "both" ? "Xiaoshuai + Clone (together)" : label}
      </div>
      {r.en ? (
        <>
          <div style={{ fontFamily: EN, fontSize: r.en.length > 130 ? 38 : r.en.length > 90 ? 42 : r.en.length > 60 ? 46 : r.en.length > 36 ? 52 : 58, fontWeight: 800, lineHeight: 1.25,
            textShadow: outline(inner ? "#1d2c4a" : "#111", 4), fontStyle: inner ? "italic" : undefined }}>
            {inner && "( "}
            {r.en.split(" ").map((w, i) => (
              <span key={i} style={{ color: r.kw && norm(w).startsWith(r.kw) ? C.subYellow : "#fff" }}>{w} </span>
            ))}
            {inner && ")"}
          </div>
        </>
      ) : (
        <div style={{ fontSize: inner ? 50 : 54, fontWeight: 800, lineHeight: 1.4, textShadow: outline(inner ? "#1d2c4a" : "#111", 4),
          fontStyle: inner ? "italic" : undefined, color: inner ? "#eaf2ff" : "#fff" }}>
          {inner ? `（${r.zh}）` : r.zh}
        </div>
      )}
    </div>
    </>
  );
};

export const PlaceCaption: React.FC<{ text: string; f: number }> = ({ text, f }) => {
  const o = Math.min(interpolate(f, [6, 16], [0, 1], clamp), interpolate(f, [70, 84], [1, 0], clamp));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, top: 362, display: "flex", alignItems: "center", gap: 18, opacity: o,
      fontFamily: SANS, color: "#fff", fontSize: 34, fontWeight: 700, letterSpacing: 4, textShadow: outline("#000", 2) }}>
      <span style={{ width: interpolate(f, [6, 22], [0, 70], clamp), height: 4, background: "#fff", boxShadow: "0 0 6px #000" }} />
      {text}
    </div>
  );
};

// ---------- Bilingual narration subtitle ----------
export const NarrationSub: React.FC<{ id: string; at: number; f: number; bottom?: number; zhTop?: number }> = ({ id, at, f, bottom = SAFE.bottom, zhTop }) => {
  const n = story.narration.find((x) => x.id === id) as { en?: string; zh: string } | undefined;
  const frames = Math.ceil(((durations as Record<string, number>)[id] ?? 0) * 30) + 10;
  if (!n?.en || f < at || f > at + frames) return null;
  const o = Math.min(interpolate(f - at, [0, 5], [0, 1], clamp), interpolate(at + frames - f, [0, 5], [0, 1], clamp));
  return (
    <>
      <ZhTop text={n.zh} o={o} top={zhTop} />
      <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, bottom, textAlign: "center", opacity: o, color: "#fff" }}>
        <div style={{ fontFamily: EN, fontSize: 48, fontWeight: 800, lineHeight: 1.3, textShadow: outline("#111", 4) }}>{n.en}</div>
      </div>
    </>
  );
};

export const AVATAR = "brand/avatar.png";

// Account badge in the top-left corner, kept below the Douyin status/tab bar
export const BrandBadge: React.FC<{ o: number; light?: boolean }> = ({ o, light }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: SAFE.left - 10, top: 50, display: "flex", alignItems: "center", gap: 14, opacity: o,
      padding: "5px 26px 5px 5px", borderRadius: 40, background: light ? "rgba(255,253,247,.9)" : "rgba(8,14,13,.45)",
      border: `2px solid ${light ? C.line : "rgba(255,255,255,.18)"}`, boxShadow: "0 4px 14px rgba(0,0,0,.18)" }}>
      <Img src={staticFile(AVATAR)} style={{ width: 60, height: 60, borderRadius: "50%", border: `3px solid ${light ? C.ink : "#fff"}` }} />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 900, letterSpacing: 3, color: light ? C.ink : "#fff" }}>英语有续集</div>
        <div style={{ fontFamily: EN, fontSize: 17, fontWeight: 700, letterSpacing: 1.5, marginTop: 4, color: light ? C.muted : "rgba(255,255,255,.8)" }}>
          English: To Be Continued
        </div>
      </div>
    </div>
  );

// ---------- Karaoke English (lesson) ----------
export const KaraokeEn: React.FC<{ text: string; progress: number; kw?: string; size: number }> = ({ text, progress, kw, size }) => {
  const words = text.split(" ");
  const lit = Math.floor(progress * words.length + 0.6);
  return (
    <span style={{ fontFamily: EN, fontSize: size, fontWeight: 800, lineHeight: 1.3, letterSpacing: -0.5 }}>
      {words.map((w, i) => {
        const isKw = !!kw && norm(w).startsWith(kw);
        return (
          <React.Fragment key={i}>
            <span style={{ color: isKw ? C.red : i < lit ? C.ink : "#b3bdb0", position: "relative", display: "inline-block" }}>
              {w}
              {isKw && (
                <span style={{ position: "absolute", left: 0, right: 0, bottom: 2, height: 6, background: "#d5a28b",
                  transform: `scaleX(${i < lit ? 1 : 0})`, transformOrigin: "left" }} />
              )}
            </span>{" "}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export const SpeakerWave: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline-block", marginLeft: 20, verticalAlign: "middle" }}>
    <path d="M3 9v6h4l5 5V4L7 9H3z" fill={C.red} />
    <path d="M16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" fill={C.red} />
  </svg>
);
