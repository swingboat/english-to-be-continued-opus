import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { H, SceneT, W } from "./timeline";
import { C, clamp, EN, Rect, sp, SANS, Seal } from "./ui";

type P = { s: SceneT; f: number; r: Rect };

const Pill: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      position: "absolute", fontFamily: SANS, fontWeight: 800, background: C.surface, border: `4px solid #111`,
      borderRadius: 40, padding: "10px 28px", fontSize: 38, color: "#111", boxShadow: "6px 6px 0 #111", ...style,
    }}
  >
    {children}
  </div>
);

const Stamp: React.FC<{ f: number; text: string; x: number; y: number; rot: number; size?: number }> = ({ f, text, x, y, rot, size = 92 }) => {
  if (f < 0) return null;
  const k = interpolate(f, [0, 6], [2.6, 1], clamp);
  const o = interpolate(f, [0, 4], [0, 0.95], clamp);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${k})`, opacity: o,
        border: `9px solid ${C.red}`, color: C.red, borderRadius: 14, padding: "8px 34px", fontFamily: SANS,
        fontWeight: 900, fontSize: size, letterSpacing: 6, background: "rgba(255,253,247,.88)", whiteSpace: "nowrap",
        boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      }}
    >
      {text}
    </div>
  );
};

const Burst: React.FC<{ f: number; text: string; style: React.CSSProperties; size?: number; life?: number }> = ({ f, text, style, size = 200, life = 40 }) => {
  if (f < 0 || f > life) return null;
  return (
    <div style={{ position: "absolute", fontFamily: SANS, fontWeight: 900, fontSize: size, color: "#ff5a3c",
      WebkitTextStroke: "7px #fff", paintOrder: "stroke fill", textShadow: "0 8px 20px rgba(0,0,0,.5)",
      transform: `rotate(-8deg) scale(${sp(f, { damping: 6, stiffness: 260 })})`, opacity: interpolate(f, [life - 10, life], [1, 0], clamp), ...style }}>
      {text}
    </div>
  );
};

// ---------- In-shot effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f, r }) => {
  const at = s.at;
  switch (s.scene.id) {
    case 2: {
      const off = f - at("s2l2");
      const phone = f - at("s2l3");
      const tap = f - at("s2-tap");
      return (
        <>
          {off >= 0 && phone < 10 && (
            <Pill style={{ left: 90, top: 600, transform: `scale(${sp(off)})`, opacity: phone > 0 ? 1 - phone / 10 : 1 }}>
              <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: "50%", background: "#999", marginRight: 14 }} />
              Brain: OFFLINE
              <span style={{ fontSize: 24, color: C.muted, marginLeft: 12 }}>reconnecting{".".repeat(1 + (Math.floor(off / 8) % 3))}</span>
            </Pill>
          )}
          {phone >= 0 && <PhoneMock f={phone} tap={tap} />}
        </>
      );
    }
    case 3: {
      const g = f - at("s3-gen");
      return g >= 0 && g < 60 ? <Particles f={g} r={r} /> : null;
    }
    case 4: {
      const hand = f - at("s4l3");
      const vs = f - at("s4-vs");
      return (
        <>
          {hand >= 0 && hand < 30 && <SpeedLines f={hand} />}
          <Burst f={hand} text="!" life={30} size={220} style={{ left: 700, top: 560, fontFamily: EN }} />
          <Burst f={f - at("s4l4")} text="？！" style={{ right: 210, top: 880 }} />
          {vs >= 0 && <VsCard f={vs} frames={s.beats.find((b) => b.id === "s4-vs")!.frames} />}
        </>
      );
    }
    case 5: {
      const clap = f - at("s5l3", s.beats.find((b) => b.id === "s5l3")!.audioFrames - 4);
      const st = f - at("s5-stamp");
      return (
        <>
          {clap >= 0 && clap < 70 &&
            [0, 1, 2, 3, 4, 5].map((i) => {
              const d = clap - i * 6;
              if (d < 0) return null;
              return (
                <div key={i} style={{ position: "absolute", left: 110 + i * 130, top: 1100 - d * 7, fontFamily: EN, fontWeight: 900,
                  fontSize: 72, color: "#fff", WebkitTextStroke: `5px ${i % 2 ? C.blue : C.red}`, paintOrder: "stroke fill",
                  opacity: interpolate(d, [30, 50], [1, 0], clamp) }}>
                  +1
                </div>
              );
            })}
          <Stamp f={st} text="TRIAL: 1 WEEK" x={W / 2} y={820} rot={-12} size={96} />
          <Stamp f={st - 14} text="INVITES: NOT CONFIRMED" x={W * 0.5} y={1060} rot={6} size={40} />
        </>
      );
    }
    case 6:
      return <ScheduleTable s={s} f={f} />;
    case 7: {
      const c = f - at("s7-check");
      const stop = f - at("s7l1");
      const grow = f - at("s7l2", 40);
      const draw = interpolate(c, [4, 26], [0, 0.6], clamp);
      return (
        <>
          {c >= 0 && stop < 50 && (
            <div style={{ position: "absolute", right: 200, top: 600, width: 230, height: 230, background: C.surface,
              border: "7px solid #111", borderRadius: 20, opacity: interpolate(stop, [36, 50], [1, 0], clamp), boxShadow: "0 10px 30px rgba(0,0,0,.4)" }}>
              <svg viewBox="0 0 100 100" width="216" height="216">
                <path d="M18 52 L42 76 L86 22" fill="none" stroke={C.blue} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="120" strokeDashoffset={120 * (1 - draw)} />
                {stop >= 0 && (
                  <g stroke={C.red} strokeWidth="12" strokeLinecap="round" opacity={sp(stop)}>
                    <path d="M15 15 L85 85" /><path d="M85 15 L15 85" />
                  </g>
                )}
              </svg>
            </div>
          )}
          {stop >= 0 && stop < 50 && (
            <Pill style={{ left: 90, top: 630, background: C.red, color: "#fff", fontSize: 58, transform: `rotate(-6deg) scale(${sp(stop, { damping: 7, stiffness: 240 })})` }}>
              Don&apos;t check!
            </Pill>
          )}
          {grow >= 0 && (
            <Pill style={{ left: 90, top: 600, fontSize: 42, transform: `scale(${sp(grow, { damping: 8 })}) translateY(${-Math.min(grow, 30)}px)` }}>
              <span style={{ color: C.red }}>Xiaoshuai</span> Courage +1
            </Pill>
          )}
        </>
      );
    }
    case 8: {
      const dun = f - at("s8-dun");
      const recall = f - at("s8-recall");
      return (
        <>
          {dun >= 0 && recall < 0 && (
            <div style={{ position: "absolute", left: "50%", top: 600, fontFamily: SANS, fontWeight: 900, fontSize: 100, color: C.red,
              background: C.yellow, border: "6px solid #111", padding: "6px 40px", whiteSpace: "nowrap", boxShadow: "8px 8px 0 #111",
              transform: `translateX(-50%) rotate(-4deg) scale(${sp(dun, { damping: 6, stiffness: 240 })})` }}>
              Xiaoshuai ×2 ?!
            </div>
          )}
          {recall >= 0 && <RecallUI f={recall} />}
        </>
      );
    }
    default:
      return null;
  }
};

// ---------- Effects above subtitles ----------
export const TopFX: React.FC<{ s: SceneT; f: number }> = ({ s, f }) => {
  const at = s.at;
  if (s.scene.id === 2) {
    const d = f - (s.frames - 9);
    if (d < 0) return null;
    return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(d, [0, 8], [0, 1], clamp) }} />;
  }
  if (s.scene.id === 3) {
    const g = f - at("s3-gen");
    const n = f - at("s3l1");
    const nEnd = at("s3l2") - at("s3l1");
    const flash = g >= 0 && g < 60 ? interpolate(g, [0, 8, 36, 40, 54], [1, 0, 0, 0.9, 0], clamp) : 0;
    const y = n < 0 ? -260 : interpolate(n, [0, 8, nEnd, nEnd + 8], [-260, 580, 580, -260], clamp);
    return (
      <>
        {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash }} />}
        <div style={{ position: "absolute", left: 90, right: 90, top: y, background: "rgba(250,250,250,.96)", borderRadius: 34,
          padding: "22px 30px", display: "flex", gap: 22, alignItems: "center", boxShadow: "0 18px 50px rgba(0,0,0,.35)", fontFamily: SANS }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, background: C.blue, display: "grid", placeItems: "center" }}>
            <Seal size={50} dark />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#666" }}>
              <span>Clone Maker · Beta</span><span>now</span>
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: "#111" }}>Clone created. (1 / 1)</div>
            <div style={{ fontSize: 24, color: "#666" }}>Task: say Hello for you</div>
          </div>
        </div>
      </>
    );
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 3) {
    const g = f - s.at("s3-gen");
    if (g < 40) return `blur(${interpolate(g, [0, 40], [14, 0], clamp)}px) saturate(${interpolate(g, [0, 40], [0.2, 1], clamp)}) hue-rotate(${interpolate(g, [0, 40], [-40, 0], clamp)}deg)`;
  }
  if (s.scene.id === 8) {
    const d = f - s.at("s8-dun");
    if (d >= 0 && d < 8) return "contrast(1.4) saturate(1.3)";
  }
  return undefined;
};

// ---------- pieces ----------
const PhoneMock: React.FC<{ f: number; tap: number }> = ({ f, tap }) => {
  const e = sp(f, { damping: 12 });
  const pressed = tap >= 0 && tap < 6;
  return (
    <div style={{ position: "absolute", right: 200, top: 580, width: 340, height: 580, borderRadius: 48, background: "#1d1d1f",
      padding: 14, transform: `translateY(${(1 - e) * 1400}px) rotate(4deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 36, background: "linear-gradient(160deg,#eaf3f6,#cfe2e8)",
        fontFamily: SANS, padding: "50px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 20, color: C.muted }}>Beta · one use only</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: C.ink, margin: "16px 0 6px" }}>Create a Clone</div>
        <div style={{ fontSize: 20, color: C.muted, lineHeight: 1.5 }}>Task:<br />say one Hello</div>
        <div style={{ margin: "60px auto 0", width: 200, height: 200, borderRadius: "50%", background: pressed ? "#1b4d5c" : C.blue,
          color: "#fff", display: "grid", placeItems: "center", fontSize: 44, fontWeight: 900,
          transform: `scale(${pressed ? 0.9 : 1 + 0.04 * Math.sin(f / 4)})`, boxShadow: "0 0 0 12px rgba(36,95,114,.2)" }}>
          CREATE
        </div>
        {tap >= 0 && (
          <div style={{ position: "absolute", left: 156 - tap * 9, top: 360 - tap * 9, width: tap * 18, height: tap * 18,
            borderRadius: "50%", border: `6px solid ${C.blue}`, opacity: interpolate(tap, [0, 14], [1, 0], clamp) }} />
        )}
      </div>
    </div>
  );
};

const Particles: React.FC<{ f: number; r: Rect }> = ({ f, r }) => {
  const p = interpolate(f, [0, 34], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const fade = interpolate(f, [36, 46], [1, 0], clamp);
  const cx = r.x + 0.7 * r.w, cy = r.y + 0.5 * r.h;
  return (
    <>
      {new Array(160).fill(0).map((_, i) => {
        const sx = random(`sx${i}`) * W, sy = random(`sy${i}`) * H;
        const a = random(`a${i}`) * Math.PI * 2, rr = Math.sqrt(random(`r${i}`));
        const tx = cx + Math.cos(a) * rr * r.w * 0.16, ty = cy + Math.sin(a) * rr * r.h * 0.36;
        const size = 12 + random(`s${i}`) * 20;
        return (
          <div key={i} style={{ position: "absolute", left: sx + (tx - sx) * p, top: sy + (ty - sy) * p, width: size, height: size,
            background: i % 3 ? "#4fb3d9" : "#9fe3ff", opacity: fade * 0.9, boxShadow: "0 0 14px #6fd0ff" }} />
        );
      })}
    </>
  );
};

const SpeedLines: React.FC<{ f: number }> = ({ f }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: interpolate(f, [0, 3, 20, 30], [0, 1, 1, 0], clamp) }}>
    {new Array(64).fill(0).map((_, i) => {
      const a = (i / 64) * Math.PI * 2 + f * 0.02;
      const r1 = 380 + random(`l${i}`) * 160;
      const cx = W / 2, cy = H * 0.4;
      return (
        <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * 1600} y2={cy + Math.sin(a) * 1600}
          stroke="#fff" strokeWidth={3 + random(`w${i}`) * 9} opacity={0.85} />
      );
    })}
  </svg>
);

const VsCard: React.FC<{ f: number; frames: number }> = ({ f, frames }) => {
  const t = sp(f, { damping: 13 });
  const b = sp(f - 6, { damping: 13 });
  const vs = sp(f - 14, { damping: 6, stiffness: 260 });
  const out = interpolate(f, [frames - 8, frames], [1, 0], clamp);
  const half = (bg: string, who: string, goal: string, icon: React.ReactNode, k: number, dir: number) => (
    <div style={{ flex: 1, background: bg, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 24, transform: `translateX(${(1 - k) * dir * 1100}px)`, fontFamily: SANS }}>
      {icon}
      <div style={{ fontSize: 44, opacity: 0.9 }}>{who}&apos;s goal</div>
      <div style={{ fontSize: 100, fontWeight: 900 }}>{goal}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", opacity: out }}>
      {half(C.blue, "Clone", "Be class monitor", <Crown />, t, -1)}
      {half(C.red, "Xiaoshuai", "Get home safely", <House />, b, 1)}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${vs}) rotate(${(1 - vs) * 180}deg)`,
        width: 230, height: 230, borderRadius: "50%", background: C.yellow, border: "8px solid #111", display: "grid",
        placeItems: "center", fontFamily: EN, fontWeight: 900, fontSize: 100, color: "#111" }}>VS</div>
    </AbsoluteFill>
  );
};

const Crown = () => (
  <svg width="220" height="168" viewBox="0 0 100 76">
    <path d="M6 66 L12 18 L32 40 L50 8 L68 40 L88 18 L94 66 Z" fill={C.yellow} stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);
const House = () => (
  <svg width="210" height="184" viewBox="0 0 100 88">
    <path d="M10 44 L50 8 L90 44" fill="none" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
    <path d="M22 40 V82 H78 V40" fill={C.yellow} stroke="#fff" strokeWidth="5" />
    <rect x="42" y="56" width="16" height="26" fill={C.red} />
  </svg>
);

const ScheduleTable: React.FC<{ s: SceneT; f: number }> = ({ s, f }) => {
  const at = s.at;
  const start = at("s6l2");
  const clash = at("s6-clash");
  const end = at("s6l6", 10);
  if (f < start || f > end + 12) return null;
  const out = interpolate(f, [end, end + 12], [0, 1], clamp);
  const rows = [["English sharing", "English Club"], ["Moving desks", "Class prep team"], ["Basketball tryouts", "Sports team"]];
  const boom = f - (clash + 40);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 620, background: C.surface, border: "5px solid #111",
      borderRadius: 18, padding: "24px 30px", fontFamily: SANS, transform: `translateY(${out * 1200}px) rotate(-1deg)`,
      boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 800, color: C.ink, marginBottom: 10 }}>
        <span>After-school invitations</span>
        <span style={{ fontFamily: EN, color: C.muted, fontSize: 26 }}>SCHEDULE</span>
      </div>
      {rows.map(([name, from], i) => {
        const k = sp(f - start - 8 - i * 16, { damping: 14 });
        const hot = f >= clash + 2 + i * 12;
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 0", borderTop: `2px solid ${C.line}`,
            opacity: k, transform: `translateX(${(1 - k) * 200}px)` }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: C.ink, width: 220 }}>{name}</span>
            <span style={{ fontSize: 26, color: C.muted, flex: 1 }}>{from}</span>
            <span style={{ fontSize: 40, fontWeight: 900, padding: "2px 14px", borderRadius: 8, fontFamily: EN,
              color: hot ? "#fff" : C.ink, background: hot ? C.red : "transparent",
              transform: `scale(${hot ? 1 + 0.25 * Math.max(0, 1 - (f - clash - 2 - i * 12) / 8) : 1})` }}>
              Fri 14:00
            </span>
            <span style={{ fontSize: 24, color: C.muted, border: `2px dashed ${C.muted}`, padding: "2px 10px" }}>pending</span>
          </div>
        );
      })}
      {boom >= 0 && <Stamp f={boom} text="CLASH ×3" x={640} y={-40} rot={-8} size={84} />}
    </div>
  );
};

const RecallUI: React.FC<{ f: number }> = ({ f }) => {
  const e = sp(f, { damping: 13 });
  const menu = f >= 8 && f < 34;
  const fail = f - 34;
  return (
    <div style={{ position: "absolute", left: 90, right: 190, top: 860, background: "#ededed", borderRadius: 24, padding: "28px 28px 30px",
      fontFamily: SANS, transform: `translateY(${(1 - e) * 1000}px)`, boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, position: "relative" }}>
        <div style={{ background: "#95ec69", borderRadius: 14, padding: "16px 24px", fontFamily: EN, fontSize: 40, fontWeight: 700, color: "#111" }}>
          Hello, everyone. I&apos;m Xiaoshuai.
        </div>
        <div style={{ width: 76, height: 76, borderRadius: 12, background: C.blue, color: "#fff", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800 }}>Clone</div>
        {menu && (
          <div style={{ position: "absolute", right: 120, top: -86, background: "#4c4c4c", color: "#fff", borderRadius: 12, display: "flex", fontSize: 30, overflow: "hidden" }}>
            {["Copy", "Forward", "Recall"].map((m) => (
              <span key={m} style={{ padding: "14px 24px", background: m === "Recall" && f >= 24 ? "#6b6b6b" : undefined }}>{m}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", marginTop: 22, fontSize: 30, color: "#888", minHeight: 44 }}>
        {fail >= 0 && (
          <span style={{ background: "#d9d9d9", padding: "6px 18px", borderRadius: 8, color: C.red, fontWeight: 700, display: "inline-block",
            transform: `translateX(${Math.sin(fail * 2.6) * Math.max(0, 10 - fail) * 2}px)` }}>
            Recall failed: over 2 minutes, and the whole class heard it.
          </span>
        )}
      </div>
    </div>
  );
};
