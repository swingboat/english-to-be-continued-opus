import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { atFrac, SceneT, W } from "./timeline";
import { C, clamp, EN, Rect, sp } from "./ui";

type P = { s: SceneT; f: number; r: Rect };
const LOW = 820; // overlay zone below the faces and above the subtitles

// ---------- building blocks ----------
const Pill: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", fontFamily: EN, fontWeight: 800, background: C.surface, border: "4px solid #111",
    borderRadius: 40, padding: "10px 28px", fontSize: 38, color: "#111", boxShadow: "6px 6px 0 #111", whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

const Stamp: React.FC<{ f: number; text: string; x: number; y: number; rot: number; size?: number; color?: string; life?: number }> = ({
  f, text, x, y, rot, size = 92, color = C.red, life = 9999,
}) => {
  if (f < 0 || f > life) return null;
  const k = interpolate(f, [0, 6], [2.6, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${k})`,
      opacity: Math.min(interpolate(f, [0, 4], [0, 0.95], clamp), interpolate(f, [life - 8, life], [0.95, 0], clamp)),
      border: `9px solid ${color}`, color, borderRadius: 14, padding: "6px 30px",
      fontFamily: EN, fontWeight: 900, fontSize: size, letterSpacing: 4, background: "rgba(255,253,247,.9)", whiteSpace: "nowrap",
      boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
      {text}
    </div>
  );
};

const Burst: React.FC<{ f: number; text: string; style: React.CSSProperties; size?: number; life?: number; color?: string }> = ({
  f, text, style, size = 180, life = 40, color = "#ff5a3c",
}) => {
  if (f < 0 || f > life) return null;
  return (
    <div style={{ position: "absolute", fontFamily: EN, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "7px #fff",
      paintOrder: "stroke fill", textShadow: "0 8px 20px rgba(0,0,0,.5)", whiteSpace: "nowrap",
      transform: `rotate(-8deg) scale(${sp(f, { damping: 6, stiffness: 260 })})`, opacity: interpolate(f, [life - 10, life], [1, 0], clamp), ...style }}>
      {text}
    </div>
  );
};

const Card: React.FC<{ f: number; life: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ f, life, style, children }) => {
  if (f < 0 || f > life + 10) return null;
  const k = sp(f, { damping: 13 });
  const out = interpolate(f, [life, life + 10], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW, background: C.surface, border: "5px solid #111", borderRadius: 20,
      padding: "22px 32px", fontFamily: EN, color: C.ink, boxShadow: "0 24px 60px rgba(0,0,0,.5)",
      transform: `translateY(${(1 - k) * 80 + out * 120}px) scale(${0.9 + 0.1 * k}) rotate(-1deg)`, opacity: k * (1 - out), ...style }}>
      {children}
    </div>
  );
};

const NameCard: React.FC<{ f: number; name: string; desc: string; color: string; side: "left" | "right"; top: number; life?: number }> = ({
  f, name, desc, color, side, top, life = 95,
}) => {
  if (f < 0 || f > life) return null;
  const k = sp(f, { damping: 15 });
  const out = interpolate(f, [life - 15, life], [0, 1], clamp);
  const dir = side === "left" ? -1 : 1;
  return (
    <div style={{ position: "absolute", [side]: side === "right" ? 170 : 30, top, transform: `translateX(${dir * ((1 - k) * 800 + out * 800)}px)`, fontFamily: EN, textAlign: side }}>
      <div style={{ display: "inline-block", background: color, color: "#fff", padding: "10px 60px", transform: "skewX(-12deg)", boxShadow: "8px 8px 0 rgba(0,0,0,.4)" }}>
        <div style={{ transform: "skewX(12deg)", fontSize: 60, fontWeight: 900, letterSpacing: 2 }}>{name}</div>
      </div>
      <div style={{ marginTop: 10, [side === "left" ? "marginLeft" : "marginRight"]: 40 }}>
        <span style={{ display: "inline-block", background: "rgba(0,0,0,.72)", color: "#fff", fontSize: 30, padding: "6px 18px", borderRadius: 6 }}>{desc}</span>
      </div>
    </div>
  );
};

const Check: React.FC<{ on: boolean; f: number; children: React.ReactNode; size?: number; bad?: boolean }> = ({ on, f, children, size = 36, bad }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "8px 0", borderTop: `2px solid ${C.line}`, fontSize: size, fontWeight: 800 }}>
    <span style={{ width: 50, height: 50, flex: "none", border: `4px solid ${C.ink}`, borderRadius: 8, display: "grid", placeItems: "center",
      background: on ? (bad ? C.red : "#2d7d4f") : "transparent", color: "#fff", fontSize: 36, transform: `scale(${on ? sp(f, { damping: 7 }) : 1})` }}>
      {on ? (bad ? "✗" : "✓") : ""}
    </span>
    <span style={{ color: on ? C.ink : C.muted }}>{children}</span>
  </div>
);

const Digits: React.FC<{ text: string; color?: string; size?: number }> = ({ text, color = "#7dffa0", size = 120 }) => (
  <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 900, fontSize: size, color, background: "#111", borderRadius: 16,
    padding: "4px 26px", border: "5px solid #444", textShadow: `0 0 18px ${color}` }}>{text}</span>
);


const XS = "#e0604a"; // Xiaoshuai
const CL = "#3d9cc0"; // clone
const SU = "#8a4fb0"; // Xiaoman
const TE = "#2d7d4f"; // teacher / done
const AD = "#c0703a"; // radio adviser
const PO = "#d06a8c"; // ponytail helper

const pt = (r: Rect, x: number, y: number) => ({ x: r.x + x * r.w, y: r.y + y * r.h });

const MU = "#c58a3a"; // Mum

// ---------- per-scene effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f, r }) => {
  const at = s.at;
  const fa = (id: string, p: number) => atFrac(s, id, p);
  switch (s.scene.id) {
    case 1: {
      const loan = f - at("s1l1", 10);
      const mission = f - at("s1l2", 6);
      const note = f - at("s1l3", 10);
      const brag = f - at("s1l4", 6);
      return (
        <>
          {loan >= 0 && mission < 0 && (
            <Card f={loan} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: MU, fontWeight: 900, letterSpacing: 2 }}>WEEKEND LOAN · SIGNED OUT</div>
              <Check on f={loan} size={34}>💻 School laptop · back on Monday</Check>
              <Check on={f >= fa("s1l1", 0.4)} f={f - fa("s1l1", 0.4)} size={34}>Parents know · Mum is home</Check>
              <Check on={f >= fa("s1l1", 0.4)} f={f - fa("s1l1", 0.4)} size={34}>Mic + speaker: stayed at school</Check>
            </Card>
          )}
          {mission >= 0 && note < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 44, fontSize: 40, transform: `translateX(-50%) scale(${sp(mission, { damping: 9 })}) rotate(-2deg)` }}>
              🎯 Mission: <span style={{ color: SU }}>1 useful lead each</span>
            </Pill>
          )}
          {note >= 0 && <LeadsNote f={note} leads={0} />}
          {brag >= 0 && (
            <Pill style={{ left: 80, top: 610, fontSize: 40, transform: `scale(${sp(brag, { damping: 8 })}) rotate(-4deg)` }}>
              Clone&apos;s promise: <span style={{ color: CL }}>“LOADS of material!”</span>
            </Pill>
          )}
          <Clock f={f} hour={9} />
        </>
      );
    }
    case 2: {
      const tabs = f - at("s2l2", 10);
      const sm = f - at("s2l4", 4);
      return (
        <>
          {tabs >= 0 && sm < 0 && <TabStack f={tabs} n={Math.min(9, 1 + Math.floor(tabs / 12))} />}
          {sm >= 0 && <RabbitHole f={sm} />}
        </>
      );
    }
    case 3: {
      const cat = f - at("s3l1", 30);
      const surf = f - at("s3l2", 4);
      const reply = f - at("s3l3", 10);
      const save = f - at("s3l4", 20);
      const meter = f - at("s3l6", 6);
      return (
        <>
          {cat >= 0 && reply < 0 && <Burst f={cat} text="MEOW~ 🐱" size={100} life={60} color="#f0a03c" style={{ left: 80, top: 610 }} />}
          {surf >= 0 && reply < 0 && (
            <Pill style={{ left: 80, top: LOW + 55, fontSize: 40, transform: `scale(${sp(surf, { damping: 9 })}) rotate(-2deg)` }}>
              🏄 surfing… <span style={{ color: C.red }}>funny videos</span>
            </Pill>
          )}
          {reply >= 0 && save < 0 && <ReplyBubble f={reply} />}
          {save >= 0 && meter < 0 && <InviteRain f={save} />}
          {meter >= 0 && <ChatMeter f={meter} />}
        </>
      );
    }
    case 4: {
      const clock = f - at("s4-clock");
      const lunch = f - at("s4l1", 10);
      const twenty = f - at("s4l2", 6);
      const page = f - at("s4l3", 10);
      const cat = f - at("s4l4", 20);
      return (
        <>
          {clock >= 0 && lunch < 0 && <TimeWarp f={clock} />}
          {twenty >= 0 && page < 0 && <InviteCounter f={twenty} />}
          {page >= 0 && <Scoreboard f={page} cat={cat} />}
        </>
      );
    }
    case 5: {
      const down = f - at("s5-down", 4);
      const ask = f - fa("s5l1", 0.6);
      const media = f - at("s5l2", 4);
      const rules = f - at("s5l3", 10);
      const close = f - fa("s5l4", 0.75);
      return (
        <>
          {down >= 0 && ask < 0 && (
            <Pill style={{ left: 80, top: LOW + 55, fontSize: 40, transform: `scale(${sp(down, { damping: 9 })}) rotate(-2deg)` }}>
              📱 face down · <span style={{ color: TE }}>focus mode</span>
            </Pill>
          )}
          {media >= 0 && rules < 0 && <MediaFamily f={media} />}
          {rules >= 0 && (
            <Card f={rules} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>BEFORE IT GOES ON AIR</div>
              <Check on f={rules} size={34}>Whose experience is it?</Check>
              <Check on={f >= fa("s5l3", 0.45)} f={f - fa("s5l3", 0.45)} size={34}>Do they want to share it?</Check>
              <Check on={f >= fa("s5l3", 0.75)} f={f - fa("s5l3", 0.75)} size={34} bad>Copy a popular comment</Check>
            </Card>
          )}
          <Stamp f={close} text="20 TABS → CLOSED" x={W / 2} y={640} rot={-6} size={56} color={CL} />
        </>
      );
    }
    case 6: {
      const mine = f - at("s6l1", 20);
      const call = f - at("s6l3", 30);
      const yes = f - at("s6l4", 10);
      return (
        <>
          {mine >= 0 && call < 0 && (
            <Card f={mine} life={9999} style={{ top: LOW - 20, background: "#fffbe8" }}>
              <div style={{ fontSize: 28, color: XS, fontWeight: 900, letterSpacing: 2 }}>LEAD ① · XIAOSHUAI&apos;S OWN FIRST DAY</div>
              <div style={{ fontSize: 38, fontWeight: 800, marginTop: 8, fontFamily: '"Bradley Hand","Chalkboard SE",' + EN, lineHeight: 1.3 }}>
                Scared of saying it wrong… <span style={{ color: SU }}>she waited till I finished.</span>
              </div>
              <div style={{ fontSize: 28, color: TE, fontWeight: 900, marginTop: 6, opacity: f >= fa("s6l1", 0.85) ? 1 : 0 }}>source: me · it really happened ✓</div>
            </Card>
          )}
          {call >= 0 && <CallScreen f={call} yes={yes} />}
          <Stamp f={yes - 150} text="SHE SAID YES ✓" x={W / 2} y={640} rot={-6} size={58} color={PO} />
        </>
      );
    }
    case 7: {
      const map = f - at("s7-map");
      const leads = f - at("s7l2", 10);
      const ic = pt(r, 0.24, 0.39);
      return (
        <>
          {f >= at("s7l1", 30) && leads < 0 && <DrawCircle f={f - at("s7l1", 30)} x={ic.x} y={ic.y} rad={r.w * 0.06} label={map >= 0 ? "CHECK ON MONDAY" : "LIBRARY 📖"} />}
          {leads >= 0 && <LeadsNote f={leads + 30} leads={Math.min(3, 1 + Math.floor(leads / 40))} pending={f >= fa("s7l3", 0.55)} />}
          <Stamp f={f - fa("s7l3", 0.9)} text="NOT FINAL YET" x={W - 270} y={640} rot={-8} size={56} color={C.red} />
        </>
      );
    }
    case 8: {
      const rec = f - at("s8l1");
      const save = f - at("s8l2", 10);
      const ours = f - at("s8l3", 10);
      const ping = f - at("s8-ping");
      const ph = pt(r, 0.214, 0.796);
      return (
        <>
          {rec >= 0 && save < 0 && (
            <Pill style={{ left: 80, top: 610, fontSize: 36, transform: `scale(${sp(rec, { damping: 9 })})` }}>
              <span style={{ color: "#ff4d4d" }}>●</span> REC · built-in mic · <span style={{ color: C.muted }}>{Math.min(30, Math.floor(rec / 5))}s</span>
            </Pill>
          )}
          {save >= 0 && ping < 0 && <ProjectFolder f={save} ours={ours} />}
          {ping >= 0 && <Waves f={ping % 30} x={ph.x} y={ph.y} />}
          {ping >= 0 && (
            <div style={{ position: "absolute", left: 80, right: 190, top: 580, transform: `translateY(${(1 - sp(ping, { damping: 12 })) * -300}px)` }}>
              <div style={{ background: "rgba(245,245,250,.96)", borderRadius: 26, padding: "18px 24px", fontFamily: EN, boxShadow: "0 16px 40px rgba(0,0,0,.4)",
                display: "flex", gap: 18, alignItems: "center" }}>
                <div style={{ width: 70, height: 70, borderRadius: 16, background: "#2ecc71", display: "grid", placeItems: "center", fontSize: 40 }}>💬</div>
                <div>
                  <div style={{ fontSize: 26, color: "#666", fontWeight: 700 }}>New message · just now</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#222" }}>🔔 +1 notification…</div>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
    default:
      return null;
  }
};

export const TopFX: React.FC<{ s: SceneT; f: number }> = ({ s, f }) => {
  const id = s.scene.id;
  if (id === 4 && f >= s.at("s4-clock") && f < s.at("s4-clock", 60)) {
    const d = f - s.at("s4-clock");
    return (
      <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(d, [0, 6, 50, 60], [0, 0.6, 0.6, 0], clamp),
        background: "repeating-conic-gradient(from 0deg at 86% 17%, rgba(255,255,255,0) 0deg 5deg, rgba(255,255,255,.5) 5deg 6deg)" }} />
    );
  }
  if (id === 4 && f >= s.at("s4-clock", 56) && f < s.at("s4-clock", 66)) {
    return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f - s.at("s4-clock", 56), [0, 2, 10], [0, 0.6, 0], clamp), pointerEvents: "none" }} />;
  }
  if (id === 8 && f >= s.at("s8-ping")) {
    const k = interpolate(f - s.at("s8-ping"), [0, 20], [0, 1], clamp);
    return (
      <>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 100 * k, background: "#000" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60 * k, background: "#000" }} />
      </>
    );
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 3 && f >= s.at("s3l6")) return "saturate(1.3) hue-rotate(-8deg)";
  if (s.scene.id === 8 && f >= s.at("s8-ping")) return "brightness(.85) saturate(.8)";
  return undefined;
};

// ---------- pieces ----------
const Clock: React.FC<{ f: number; hour: number }> = ({ f, hour }) => {
  if (f > 90) return null;
  const o = interpolate(f, [0, 8, 80, 90], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", right: 190, top: 580, opacity: o, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 46, fontWeight: 900,
      color: "#fff", background: "rgba(0,0,0,.65)", borderRadius: 14, padding: "6px 20px" }}>SAT {String(hour).padStart(2, "0")}:00</div>
  );
};

const LeadsNote: React.FC<{ f: number; leads: number; pending?: boolean }> = ({ f, leads, pending }) => {
  const rows: [string, string, string][] = [
    ["① My own first day", "source: me", XS],
    ["② Helper agrees to talk", "source: phone call", PO],
    ["③ Library on the map", "source: school guide", CL],
  ];
  return (
    <Card f={f} life={9999} style={{ top: LOW - 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>
        <span style={{ color: C.muted }}>📒 DIGITAL NOTEBOOK · LEADS</span>
        <span style={{ color: leads ? TE : C.red }}>{leads}/3</span>
      </div>
      {leads === 0 ? (
        <div style={{ fontSize: 34, fontWeight: 800, color: C.muted, padding: "18px 0 6px", fontStyle: "italic" }}>(empty columns… for now)</div>
      ) : rows.slice(0, leads).map(([a, b, c]) => (
        <div key={a} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderTop: `2px solid ${C.line}` }}>
          <span style={{ fontSize: 34, fontWeight: 900, color: c }}>{a}</span>
          <span style={{ marginLeft: "auto", fontSize: 26, fontWeight: 800, color: C.muted }}>{b}</span>
        </div>
      ))}
      {pending && <div style={{ fontSize: 28, fontWeight: 900, color: C.red, marginTop: 6 }}>⏳ interview time + route: confirm on Monday</div>}
    </Card>
  );
};

const TabStack: React.FC<{ f: number; n: number }> = ({ f, n }) => (
  <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 11, height: 360 }}>
    {new Array(n).fill(0).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: i * 40, top: i * 26, width: 560, background: "#fff", border: "4px solid #333", borderRadius: 12,
        boxShadow: "0 10px 24px rgba(0,0,0,.35)", fontFamily: EN, transform: `rotate(${(i % 2 ? 1 : -1) * 2}deg) scale(${i === n - 1 ? sp(f - (n - 1) * 12, { damping: 9 }) : 1})` }}>
        <div style={{ background: "#e8ecf3", padding: "6px 14px", fontSize: 24, fontWeight: 800, color: "#556", borderRadius: "8px 8px 0 0" }}>
          {["First day stories", "Related: more stories", "Comments (1.2k)", "Trending now", "You might like", "Cat videos 🐱", "Hot debate!", "Group: First days", "Group: New students"][i]}
        </div>
        <div style={{ height: 50 }} />
      </div>
    ))}
    <div style={{ position: "absolute", right: 0, top: -70, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 44, fontWeight: 900, color: "#fff",
      background: "#111", borderRadius: 12, padding: "4px 18px" }}>TABS: {n}</div>
  </div>
);

const RabbitHole: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    {["🔍 search", "🔗 link", "💬 social media", "💬💬 comments", "🌀 …"].map((t, i) => {
      const k = sp(f - i * 8, { damping: 10 });
      return (
        <span key={t} style={{ fontFamily: EN, fontWeight: 900, fontSize: 42 - i * 3, color: "#fff", background: i < 2 ? "#4a7bd0" : C.red,
          border: "4px solid #111", borderRadius: 30, padding: "4px 24px", transform: `scale(${k * (1 - i * 0.08)}) rotate(${(i % 2 ? 1 : -1) * i * 3}deg)`, opacity: k }}>{t}</span>
      );
    })}
  </div>
);

const ReplyBubble: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 20, transform: `scale(${sp(f, { damping: 12 })})`, fontFamily: EN }}>
    <div style={{ display: "inline-block", background: "#fff", borderRadius: "22px 22px 22px 6px", padding: "14px 22px", fontSize: 32, fontWeight: 700, color: "#333",
      boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>🧑 “The first day is easy. Nobody needs help.”</div>
    <div style={{ textAlign: "right", marginTop: 14 }}>
      <span style={{ display: "inline-block", background: SU, color: "#fff", borderRadius: "22px 22px 6px 22px", padding: "14px 22px", fontSize: 34, fontWeight: 800,
        boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}>
        {"Actually, that's backwards. Many students…".slice(0, Math.floor(f * 1.6))}<span style={{ opacity: Math.floor(f / 6) % 2 }}>|</span>
      </span>
    </div>
  </div>
);

const InviteRain: React.FC<{ f: number }> = ({ f }) => {
  const n = Math.min(20, Math.floor(f / 6) + 1);
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 40, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
      {new Array(n).fill(0).map((_, i) => (
        <span key={i} style={{ fontFamily: EN, fontWeight: 900, fontSize: 26, color: "#fff", background: ["#2ecc71", "#3d9cc0", "#f0a03c", "#d06a8c"][i % 4],
          borderRadius: 20, padding: "4px 14px", border: "3px solid #111", transform: `scale(${sp(f - i * 6, { damping: 7 })}) rotate(${((i * 37) % 11) - 5}deg)` }}>
          💬 Group {i + 1} ☆
        </span>
      ))}
    </div>
  );
};

const ChatMeter: React.FC<{ f: number }> = ({ f }) => (
  <Card f={f} life={9999} style={{ top: LOW - 20 }}>
    <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>HOW WE SPENT THE MORNING</div>
    {([["Chat", 0.88, C.red], ["Search", 0.12, "#4a7bd0"]] as [string, number, string][]).map(([t, v, c], i) => (
      <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
        <span style={{ width: 150, fontSize: 36, fontWeight: 900 }}>{t}</span>
        <div style={{ flex: 1, height: 34, borderRadius: 17, background: "#eee", border: "3px solid #111", overflow: "hidden" }}>
          <div style={{ width: `${interpolate(f - i * 8, [0, 24], [0, v * 100], clamp)}%`, height: "100%", background: c }} />
        </div>
      </div>
    ))}
  </Card>
);

const TimeWarp: React.FC<{ f: number }> = ({ f }) => {
  const mins = Math.floor(interpolate(f, [0, 56], [9 * 60, 12 * 60], { ...clamp, easing: (t) => t * t }));
  const done = f >= 56;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 20, textAlign: "center" }}>
      <Digits text={`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`} color={done ? "#ff8a70" : "#7dffa0"} size={130} />
      <div style={{ fontFamily: EN, fontSize: 56, fontWeight: 900, color: "#fff", textShadow: "0 4px 12px #000", marginTop: 20, opacity: done ? 1 : 0,
        transform: `scale(${done ? sp(f - 56, { damping: 8 }) : 0})` }}>3 HOURS LATER…</div>
    </div>
  );
};

const InviteCounter: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 11, textAlign: "center", transform: `scale(${sp(f, { damping: 7 })})` }}>
    <span style={{ display: "inline-block", fontFamily: EN, fontWeight: 900, fontSize: 70, color: "#fff", background: "#2ecc71", border: "6px solid #111", borderRadius: 24,
      padding: "10px 36px", boxShadow: "8px 8px 0 #111" }}>💬 × {Math.min(20, Math.floor(f / 1.5))} saved invites</span>
    <div style={{ fontFamily: EN, fontSize: 30, fontWeight: 800, color: "#fff", textShadow: "0 3px 8px #000", marginTop: 14 }}>(saved, not joined)</div>
  </div>
);

const Scoreboard: React.FC<{ f: number; cat: number }> = ({ f, cat }) => (
  <Card f={f} life={9999} style={{ top: LOW - 30 }}>
    <div style={{ fontSize: 28, color: C.red, fontWeight: 900, letterSpacing: 2 }}>3-HOUR SCOREBOARD</div>
    {([["Group invites saved", "20", "#2ecc71", 0], ["Popular comments copied", "1", SU, 0], ["Cat faces remembered", "∞", "#f0a03c", 1], ["Interview material", "0", C.red, 0]] as [string, string, string, number][]).map(([t, v, c, needCat], i) => (
      <div key={t} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderTop: `2px solid ${C.line}`, opacity: (needCat ? cat >= 0 : f >= i * 10) ? 1 : 0.15 }}>
        <span style={{ fontSize: 34, fontWeight: 800 }}>{t}</span>
        <span style={{ marginLeft: "auto", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 44, fontWeight: 900, color: c }}>{v}</span>
      </div>
    ))}
  </Card>
);

const MediaFamily: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 10, textAlign: "center" }}>
    <div style={{ fontFamily: EN, fontSize: 40, fontWeight: 900, color: "#fff", textShadow: "0 3px 10px #000", marginBottom: 14 }}>THE MEDIA</div>
    <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
      {[["📺", "TV"], ["📰", "news"], ["📱", "social"], ["📻", "RADIO"]].map(([e, t], i) => (
        <div key={t} style={{ width: 200, background: i === 3 ? C.yellow : "#fff", border: `5px solid ${i === 3 ? C.red : "#111"}`, borderRadius: 18, padding: "10px 0",
          fontFamily: EN, transform: `scale(${sp(f - i * 8, { damping: 8 }) * (i === 3 ? 1.12 : 1)})` }}>
          <div style={{ fontSize: 70 }}>{e}</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{t}</div>
        </div>
      ))}
    </div>
  </div>
);

const CallScreen: React.FC<{ f: number; yes: number }> = ({ f, yes }) => {
  const k = sp(f, { damping: 13 });
  const sec = Math.max(0, yes);
  return (
    <div style={{ position: "absolute", left: 210, right: 210, top: LOW - 50, background: "#111", borderRadius: 44, padding: 16, border: "6px solid #333",
      transform: `translateY(${(1 - k) * 500}px) rotate(-2deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
      <div style={{ background: "linear-gradient(#2c3e50,#1b2631)", borderRadius: 30, padding: "22px 20px", textAlign: "center", fontFamily: EN, color: "#fff" }}>
        <div style={{ fontSize: 24, opacity: 0.7 }}>Xiaoshuai&apos;s phone · borrowed with OK</div>
        <div style={{ fontSize: 42, fontWeight: 900, marginTop: 6, color: "#ffb3c8" }}>Ponytail (helper)</div>
        <div style={{ fontSize: 30, marginTop: 8, color: "#7dffa0" }}>
          {yes < 0 ? `calling${".".repeat(1 + (Math.floor(f / 8) % 3))}` : `00:${String(Math.floor(sec / 30)).padStart(2, "0")}`}
        </div>
        {yes >= 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, height: 40, alignItems: "center" }}>
            {new Array(14).fill(0).map((_, i) => (
              <div key={i} style={{ width: 8, borderRadius: 4, background: "#ffb3c8", height: 8 + 28 * Math.abs(Math.sin(f / 3 + i)) }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectFolder: React.FC<{ f: number; ours: number }> = ({ f, ours }) => (
  <div style={{ position: "absolute", left: 90, right: 190, top: LOW - 20, background: "#f4f6fa", border: "4px solid #333", borderRadius: 16, overflow: "hidden",
    fontFamily: EN, boxShadow: "0 24px 60px rgba(0,0,0,.5)", transform: `scale(${sp(f, { damping: 12 })})` }}>
    <div style={{ background: "#dfe4ec", padding: "8px 16px", fontSize: 26, fontWeight: 900, color: "#445" }}>📁 Radio prep project</div>
    <div style={{ padding: "12px 24px" }}>
      {([["🎙 test_clip_01", "Ep.8 · speaker test", 0], ["🎙 first_day_draft", "30 s · Xiaoshuai · spoken draft", 1]] as [string, string, number][]).map(([a, b, isNew]) => (
        <div key={a} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderTop: `2px solid ${C.line}`,
          opacity: isNew ? interpolate(f, [10, 18], [0, 1], clamp) : 1, background: isNew && ours >= 0 ? "rgba(255,215,94,.35)" : undefined, borderRadius: 8 }}>
          <span style={{ fontSize: 34, fontWeight: 900 }}>{a}</span>
          <span style={{ marginLeft: "auto", fontSize: 24, fontWeight: 800, color: C.muted }}>{b}</span>
          {isNew ? <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", background: C.red, borderRadius: 8, padding: "2px 10px" }}>NEW</span> : null}
        </div>
      ))}
      <div style={{ fontSize: 26, fontWeight: 800, color: C.muted, marginTop: 6 }}>not edited · not on air · real interviews: later</div>
    </div>
  </div>
);

const Waves: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => (
  <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }} width={W} height={1920}>
    {[0, 1, 2, 3].map((i) => {
      const d = (f - i * 6) / 30;
      if (d < 0 || d > 1) return null;
      const rr = 60 + d * 420;
      return <circle key={i} cx={x} cy={y} r={rr} fill="none" stroke="#ffd75e" strokeWidth={12 * (1 - d)} opacity={1 - d} />;
    })}
  </svg>
);

const MicIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: "middle" }}>
    <rect x="9" y="2" width="6" height="12" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const DrawCircle: React.FC<{ f: number; x: number; y: number; rad: number; label?: string; above?: boolean }> = ({ f, x, y, rad, label, above }) => {
  const p = interpolate(f, [0, 14], [0, 1], clamp);
  const C2 = 2 * Math.PI * rad;
  const pulse = 1 + 0.05 * Math.sin(f / 3) * (f > 14 ? 1 : 0);
  return (
    <>
      <svg style={{ position: "absolute", left: x - rad * 1.6, top: y - rad * 1.3, overflow: "visible" }} width={rad * 3.2} height={rad * 2.6}>
        <ellipse cx={rad * 1.6} cy={rad * 1.3} rx={rad * 1.45 * pulse} ry={rad * 1.05 * pulse} fill="none" stroke="#ff2d2d" strokeWidth={14} strokeLinecap="round"
          strokeDasharray={C2 * 1.3} strokeDashoffset={C2 * 1.3 * (1 - p)} transform={`rotate(-12 ${rad * 1.6} ${rad * 1.3})`}
          style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,.9))" }} />
      </svg>
      <div style={{ position: "absolute", left: x, top: above ? y - rad * 1.35 - 80 : y + rad * 1.35, transform: `translateX(-50%) scale(${sp(f - 12, { damping: 8 })})`, fontFamily: EN, fontWeight: 900,
        fontSize: 52, color: "#fff", background: "#ff2d2d", border: "4px solid #111", borderRadius: 14, padding: "4px 22px", whiteSpace: "nowrap" }}>
        {label ?? "JUST THIS ONE"}
      </div>
    </>
  );
};

const Role: React.FC<{ on: boolean; f: number; who: string; color: string; job: string }> = ({ on, f, who, color, job }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 0", borderTop: `2px solid ${C.line}`, opacity: on ? 1 : 0.25,
    transform: `translateX(${on ? (1 - sp(f, { damping: 11 })) * 60 : 0}px)` }}>
    <span style={{ width: 210, flex: "none", textAlign: "center", fontSize: 32, fontWeight: 900, color: "#fff", background: color, borderRadius: 30, padding: "4px 0" }}>{who}</span>
    <span style={{ fontSize: 38, fontWeight: 800 }}>{on ? job : "…"}</span>
  </div>
);

const Status: React.FC<{ on: boolean; text: string }> = ({ on, text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "8px 0", borderTop: `2px solid ${C.line}`, fontSize: 32, fontWeight: 800, opacity: on ? 1 : 0.2 }}>
    <span style={{ width: 50, height: 50, flex: "none", border: `4px solid ${C.ink}`, borderRadius: 8, display: "grid", placeItems: "center", fontSize: 30, background: C.yellow }}>⏳</span>
    <span>{text}</span>
  </div>
);

