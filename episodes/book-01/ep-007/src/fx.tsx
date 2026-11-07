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

// ---------- per-scene effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f, r }) => {
  const at = s.at;
  const fa = (id: string, p: number) => atFrac(s, id, p);
  switch (s.scene.id) {
    case 1: {
      const pony = f - at("s1l1", 6);
      const twin = f - at("s1-twin");
      const about = f - at("s1l2", 20);
      const form = f - at("s1l4", 10);
      return (
        <>
          <NameCard f={pony} life={90} name="Ponytail" desc="Classmate · volunteer helper today" color={PO} side="left" top={LOW + 11} />
          {twin >= 0 && about < 0 && <TwinScan f={twin} a={pt(r, 0.52, 0.29)} b={pt(r, 0.75, 0.32)} size={r.w * 0.17} />}
          {about >= 0 && form < 0 && (
            <Card f={about} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>ABOUT THE CLONE</div>
              <Check on f={about} size={34}>Made by a phone copy</Check>
              <Check on={f >= fa("s1l2", 0.4)} f={f - fa("s1l2", 0.4)} size={34}>Teachers + parents know</Check>
              <Check on={f >= fa("s1l2", 0.65)} f={f - fa("s1l2", 0.65)} size={34}>After school only, with permission</Check>
            </Card>
          )}
          {form >= 0 && <RolesForm f={form} draft dupAt={at("s1-form") - at("s1l4", 10)} />}
          <Stamp f={f - at("s1-form")} text="WHICH ONE?!" x={W / 2 + 150} y={LOW - 110} rot={-8} size={64} color={C.red} />
        </>
      );
    }
    case 2: {
      const board = f - at("s2l2", 10);
      const vol = f - at("s2l4", 4);
      const rule = f - fa("s2l5", 0.45);
      return (
        <>
          {board >= 0 && (
            <Card f={board} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: C.muted, fontWeight: 800 }}>
                <span>TODAY&apos;S ROLES (said out loud)</span><span style={{ color: TE }}>{vol >= 0 ? "all voluntary ✋" : ""}</span>
              </div>
              <Role on f={board} who="Xiaoshuai" color={XS} job="schedule · organiser" />
              <Role on={f >= fa("s2l3", 0.1)} f={f - fa("s2l3", 0.1)} who="Xiaoman" color={SU} job="editor · scripts" />
              <Role on={f >= fa("s2l3", 0.55)} f={f - fa("s2l3", 0.55)} who="Clone" color={CL} job="sound check, with guidance" />
              {rule >= 0 && (
                <div style={{ fontSize: 30, fontWeight: 800, color: C.red, marginTop: 10, opacity: Math.min(1, rule / 8) }}>
                  Final form: who is who + what they do + own signature
                </div>
              )}
            </Card>
          )}
        </>
      );
    }
    case 3: {
      const test = f - at("s3-open");
      const hello = f - at("s3l1");
      const quiet = f - at("s3-silence");
      const fn = f - at("s3l2", 4);
      const list = f - at("s3l3", 10);
      const spk = pt(r, 0.9, 0.78);
      return (
        <>
          {test >= 0 && quiet < 0 && (
            <Pill style={{ left: 80, top: LOW + 88, fontSize: 32, transform: `scale(${sp(test, { damping: 9 })}) rotate(-2deg)` }}>
              <span style={{ color: TE }}>●</span> TEST MODE · in this room only <span style={{ color: C.muted }}>(not on air)</span>
            </Pill>
          )}
          {hello >= 0 && quiet < 0 && (
            <Pill style={{ left: 80, top: LOW - 40, fontSize: 64, transform: `scale(${sp(hello, { damping: 7 })}) rotate(-4deg)` }}>Hello?</Pill>
          )}
          {quiet >= 0 && fn < 0 && <Silence f={quiet} x={spk.x} y={spk.y} />}
          {fn >= 0 && list < 0 && (
            <Burst f={fn} text="FUNCTION = ?" size={96} life={9999} color={CL} style={{ left: 70, top: LOW + 44 }} />
          )}
          {list >= 0 && (
            <Card f={list} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>CHECKED SO FAR</div>
              <Check on f={list} size={34}>Power light: on</Check>
              <Check on={f >= fa("s3l3", 0.6)} f={f - fa("s3l3", 0.6)} size={34}>Buttons: look them up in the guide</Check>
              <Check on={f >= fa("s3l4", 0.45)} f={f - fa("s3l4", 0.45)} size={34} bad>Speaker: no sound</Check>
            </Card>
          )}
        </>
      );
    }
    case 4: {
      const form = f - at("s4l1", 10);
      const nd = f - at("s4l2", 120);
      const math = f - at("s4l3", 10);
      const spk = f - at("s4-speaker");
      const tick = f - fa("s4l4", 0.6);
      return (
        <>
          {form >= 0 && math < 0 && (
            <Card f={form} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>SOUND CHECK</div>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8, fontSize: 40, fontWeight: 900 }}>
                <span style={{ width: 54, height: 54, border: `4px solid ${C.ink}`, borderRadius: 8, display: "grid", placeItems: "center", color: C.red, fontSize: 40 }}>
                  {nd >= 0 ? "✗" : ""}
                </span>
                <span>Done?</span>
                <span style={{ marginLeft: "auto", fontFamily: '"Bradley Hand","Chalkboard SE",' + EN, fontSize: 46, color: C.muted, opacity: 0.7 }}>
                  signed: “the other Xiaoshuai”?
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10, color: XS, opacity: f >= fa("s4l2", 0.25) ? 1 : 0 }}>
                Same name ≠ same person ≠ same work
              </div>
            </Card>
          )}
          <Stamp f={nd} text="NOT DONE (YET)" x={W / 2} y={620} rot={-6} size={60} color={C.red} life={at("s4l3", 10) - at("s4l2", 120)} />
          {math >= 0 && spk < 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 6, textAlign: "center", transform: `scale(${sp(math, { damping: 10 })})` }}>
              <span style={{ display: "inline-block", fontFamily: EN, fontWeight: 900, fontSize: 60, background: "#fff", border: "5px solid #111", borderRadius: 20,
                padding: "14px 34px", boxShadow: "8px 8px 0 #111" }}>
                “Xiaoshuai” <span style={{ color: XS }}>× 2</span> = 🔊 <span style={{ color: C.red }}>× 0</span>
              </span>
            </div>
          )}
          {spk >= 0 && tick < 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", fontFamily: EN, fontWeight: 900, fontSize: 56, color: "#fff",
              textShadow: "0 4px 12px #000", fontStyle: "italic", opacity: interpolate(spk, [0, 8], [0, 1], clamp) }}>
              (still nothing)
            </div>
          )}
          {tick >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 33, fontSize: 42, transform: `translateX(-50%) scale(${sp(tick, { damping: 9 })}) rotate(-2deg)` }}>
              ☐ Sound check: <span style={{ color: C.red }}>not done yet</span>
            </Pill>
          )}
        </>
      );
    }
    case 5: {
      const seek = f - at("s5l1", 4);
      const list = f - at("s5l2", 10);
      const call = f - at("s5l3", 30);
      const mark = f - at("s5l4", 20);
      return (
        <>
          {seek >= 0 && list < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 22, fontSize: 40, transform: `translateX(-50%) scale(${sp(seek, { damping: 9 })}) rotate(-2deg)` }}>
              🔍 Seeking: <span style={{ color: TE }}>someone who knows this</span>
            </Pill>
          )}
          {list >= 0 && call < 0 && <HelpList f={f} s={s} mark={-1} />}
          {call >= 0 && mark < 0 && <PhoneCall f={call} />}
          {mark >= 0 && <HelpList f={f} s={s} mark={mark} />}
        </>
      );
    }
    case 6: {
      const pro = f - at("s6l1", 10);
      const adv = f - at("s6l2", 4);
      const loose = f - fa("s6l4", 0.35);
      const click = f - at("s6-click", 12);
      const hello = f - at("s6-hello");
      const notes = f - at("s6l5", 10);
      const plug = pt(r, 0.69, 0.75);
      const spk = pt(r, 0.92, 0.75);
      return (
        <>
          {pro >= 0 && adv < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 33, fontSize: 42, transform: `translateX(-50%) scale(${sp(pro, { damping: 9 })}) rotate(-2deg)` }}>
              Professional experience: <span style={{ color: TE }}>arrived ✓</span>
            </Pill>
          )}
          <NameCard f={adv} life={110} name="Radio Adviser" desc="Knows the equipment · knows about the clone" color={AD} side="right" top={LOW + 11} />
          {loose >= 0 && click < 0 && <DrawCircle f={loose} x={plug.x} y={plug.y} rad={r.w * 0.05} label="LOOSE CABLE!" />}
          <Burst f={click} text="CLICK!" size={130} life={22} color={TE} style={{ left: 90, top: 610 }} />
          {hello >= 0 && notes < 0 && <Waves f={hello} x={spk.x} y={spk.y} />}
          <Burst f={hello - 2} text="IT WORKS! 🔊" size={90} life={50} color={AD} style={{ right: 190, top: 600 }} />
          {notes >= 0 && (
            <Card f={notes} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>PREP NOTES · CHECK ORDER</div>
              <Check on f={notes} size={34}>1 · Power light</Check>
              <Check on={notes >= 8} f={notes - 8} size={34}>2 · Buttons (guide)</Check>
              <Check on={notes >= 16} f={notes - 16} size={34}>3 · Speaker cable plugged in</Check>
            </Card>
          )}
        </>
      );
    }
    case 7: {
      const resp = f - at("s7l1", 10);
      const form = f - at("s7l2");
      const end = at("s7l2") - 2;
      return (
        <>
          {resp >= 0 && form < 0 && (
            <Card f={resp} life={9999} style={{ textAlign: "center", top: LOW + 11 }}>
              <div style={{ fontSize: 30, color: C.muted, fontWeight: 800 }}>Responsible =</div>
              <div style={{ fontSize: 44, fontWeight: 900 }}>do your part <span style={{ color: C.muted }}>+</span> <span style={{ color: TE }}>know when to ask</span></div>
            </Card>
          )}
          {form >= 0 && (
            <RolesForm f={form} signs={[fa("s7l2", 1) - end, fa("s7l3", 1) - end, fa("s7l4", 1) - end]} />
          )}
          <Stamp f={f - fa("s7l5", 1)} text="CLEAR ✓" x={W - 230} y={LOW - 110} rot={-10} size={70} color={TE} />
        </>
      );
    }
    case 8: {
      const cal = f - fa("s8l1", 0.45);
      const circle = f - at("s8-cal");
      const todo = f - at("s8l2", 10);
      const own = f - at("s8l4", 20);
      const c = pt(r, 0.858, 0.146);
      return (
        <>
          {cal >= 0 && circle < 0 && (
            <Card f={cal} life={9999} style={{ textAlign: "center", top: LOW - 30 }}>
              <div style={{ fontSize: 30, color: AD, fontWeight: 900, letterSpacing: 2 }}>TRIAL SLOT</div>
              <div style={{ fontSize: 46, fontWeight: 900, margin: "4px 0 12px" }}>Next Wednesday · after school</div>
              <Digits text="16:40–16:50" color="#ffd75e" size={84} />
            </Card>
          )}
          {circle >= 0 && todo < 0 && <DrawCircle f={circle} x={c.x} y={c.y} rad={r.w * 0.031} label="10 MIN · OURS" />}
          {todo >= 0 && own < 0 && (
            <Card f={todo} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>
                <span style={{ color: C.muted }}>STILL TO DO</span><span style={{ color: C.red }}>not on air yet</span>
              </div>
              <Status on text="Script, first draft (Xiaoman)" />
              <Status on={f >= fa("s8l2", 0.6)} text="Interview material" />
              <Status on={f >= fa("s8l3", 0.6)} text="Recording computer: learn next time" />
            </Card>
          )}
          {own >= 0 && (
            <Pill style={{ left: 80, top: LOW + 33, fontSize: 40, transform: `scale(${sp(own, { damping: 9 })}) rotate(-2deg)` }}>
              Signed by <span style={{ color: CL }}>Xiaoshuai (clone)</span>: his own job ✓
            </Pill>
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
  if (id === 1 && f >= s.at("s1-twin") && f < s.at("s1l2", 20)) {
    const d = f - s.at("s1-twin");
    return (
      <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(d, [0, 4], [0, 0.5], clamp),
        background: "repeating-linear-gradient(0deg, rgba(80,255,180,.10) 0 2px, transparent 2px 7px)" }} />
    );
  }
  if (id === 6 && f >= s.at("s6-click", 12) && f < s.at("s6-click", 22)) {
    return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f - s.at("s6-click", 12), [0, 2, 10], [0, 0.55, 0], clamp), pointerEvents: "none" }} />;
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 3 && f >= s.at("s3-silence") && f < s.at("s3l2")) return "saturate(.6) brightness(.85)";
  if (s.scene.id === 4 && f >= s.at("s4-speaker") && f < s.at("s4l4")) return "saturate(.6) brightness(.88)";
  return undefined;
};

// ---------- pieces ----------
const TwinScan: React.FC<{ f: number; a: { x: number; y: number }; b: { x: number; y: number }; size: number }> = ({ f, a, b, size }) => {
  const k = sp(f, { damping: 12 });
  const pct = Math.min(100, Math.round(interpolate(f, [4, 30], [0, 100], clamp)));
  const box = (p: { x: number; y: number }, col: string) => (
    <div style={{ position: "absolute", left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, transform: `scale(${1.4 - 0.4 * k})`, opacity: k }}>
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([cx, cy], i) => (
        <div key={i} style={{ position: "absolute", left: cx ? undefined : 0, right: cx ? 0 : undefined, top: cy ? undefined : 0, bottom: cy ? 0 : undefined,
          width: 46, height: 46, borderColor: col, borderStyle: "solid", borderWidth: `${cy ? 0 : 7}px ${cx ? 7 : 0}px ${cy ? 7 : 0}px ${cx ? 0 : 7}px` }} />
      ))}
    </div>
  );
  return (
    <>
      {box(a, XS)}
      {box(b, CL)}
      <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 44, textAlign: "center" }}>
        <span style={{ display: "inline-block", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 900, fontSize: 52, color: "#7dffa0", background: "rgba(0,0,0,.8)",
          border: "4px solid #7dffa0", borderRadius: 12, padding: "8px 28px", transform: `scale(${pct === 100 ? 1 + 0.05 * Math.sin(f) : 1})` }}>
          FACE MATCH: {pct}%
        </span>
      </div>
    </>
  );
};

const SIGN_PATHS = [
  "M5 30 C 20 5, 30 45, 45 20 S 70 10, 80 28 S 110 35, 130 12",
  "M5 26 C 15 8, 28 40, 40 22 C 52 6, 60 40, 75 24 S 105 8, 135 30",
  "M5 22 C 22 40, 34 4, 48 26 S 72 40, 88 14 S 118 30, 140 20",
];

const Signature: React.FC<{ f: number; i: number; color: string }> = ({ f, i, color }) => {
  const p = interpolate(f, [0, 12], [0, 1], clamp);
  return (
    <svg width="150" height="46" viewBox="0 0 145 46" style={{ flex: "none" }}>
      <path d={SIGN_PATHS[i]} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

const RolesForm: React.FC<{ f: number; draft?: boolean; dupAt?: number; signs?: number[] }> = ({ f, draft, dupAt = 0, signs }) => {
  const rows: [string, string, string, string][] = draft
    ? [["Organiser", "Xiaoshuai", "", XS], ["Organiser", "Xiaoshuai", "", XS], ["Editor", "Su Xiaoman", "", SU]]
    : [["Editor", "Su Xiaoman", "scripts", SU], ["Organiser", "Xiaoshuai (real)", "people + time", XS], ["Sound helper", "Xiaoshuai (clone)", "with guidance", CL]];
  const dup = draft && f >= dupAt;
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 30, background: "#fffef8", border: "5px solid #111", borderRadius: 14, padding: "18px 26px",
      fontFamily: EN, color: C.ink, boxShadow: "0 24px 60px rgba(0,0,0,.5)", transform: `translateY(${(1 - sp(f, { damping: 13 })) * 400}px) rotate(${draft ? -1.5 : 1}deg)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>
        <span>TRIAL SHOW · ROLES</span>
        <span style={{ color: draft ? C.red : TE }}>{draft ? "DRAFT" : "FINAL"}</span>
      </div>
      {rows.map(([role, name, job, col], i) => {
        const bad = dup && i < 2;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderTop: `2px solid ${C.line}`,
            background: bad ? `rgba(255,60,40,${0.12 + 0.08 * Math.sin(f / 3)})` : undefined }}>
            <span style={{ width: 210, flex: "none", fontSize: 30, fontWeight: 800, color: C.muted }}>{role}</span>
            <span style={{ fontSize: 36, fontWeight: 900, color: col, fontFamily: '"Bradley Hand","Chalkboard SE",' + EN }}>{name}</span>
            {job && <span style={{ fontSize: 26, color: C.muted, fontWeight: 700 }}>· {job}</span>}
            <span style={{ marginLeft: "auto" }}>
              {bad ? <span style={{ fontSize: 40, fontWeight: 900, color: C.red }}>??</span>
                : signs ? <Signature f={f - signs[i]} i={i} color={col} /> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Silence: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => (
  <>
    <div style={{ position: "absolute", left: x - 260, top: y - 330, fontFamily: EN, fontWeight: 900, fontSize: 90, color: "#fff", textShadow: "0 4px 14px #000",
      opacity: interpolate(f, [4, 12], [0, 1], clamp) }}>
      {".".repeat(Math.min(3, 1 + Math.floor(f / 10)))}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 55, textAlign: "center" }}>
      <span style={{ display: "inline-block", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 900, fontSize: 46, color: "#ff8a70", background: "rgba(0,0,0,.75)",
        borderRadius: 12, padding: "8px 26px", transform: `scale(${sp(f - 10, { damping: 9 })})` }}>
        SPEAKER 🔇 · VOLUME ▁▁▁▁▁ 0
      </span>
    </div>
  </>
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

const PhoneCall: React.FC<{ f: number }> = ({ f }) => {
  const k = sp(f, { damping: 13 });
  return (
    <div style={{ position: "absolute", left: 200, right: 200, top: LOW - 40, background: "#111", borderRadius: 44, padding: 18, border: "6px solid #333",
      transform: `translateY(${(1 - k) * 500}px) rotate(2deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
      <div style={{ background: "linear-gradient(#2c3e50,#1b2631)", borderRadius: 30, padding: "26px 20px", textAlign: "center", fontFamily: EN, color: "#fff" }}>
        <div style={{ fontSize: 24, opacity: 0.7 }}>Head teacher&apos;s phone</div>
        <div style={{ fontSize: 44, fontWeight: 900, marginTop: 6 }}>Radio Adviser</div>
        <div style={{ fontSize: 30, marginTop: 8, color: "#7dffa0" }}>calling{".".repeat(1 + (Math.floor(f / 8) % 3))}</div>
        <div style={{ margin: "14px auto 0", width: 84, height: 84, borderRadius: "50%", background: "#2ecc71", display: "grid", placeItems: "center", fontSize: 42,
          boxShadow: `0 0 0 ${10 + 8 * Math.abs(Math.sin(f / 6))}px rgba(46,204,113,.3)` }}>📞</div>
      </div>
    </div>
  );
};

const HelpList: React.FC<{ f: number; s: SceneT; mark: number }> = ({ f, s, mark }) => {
  const at = s.at;
  return (
    <Card f={mark >= 0 ? mark + 30 : f - at("s5l2", 10)} life={9999} style={{ top: LOW - 20 }}>
      <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>WHAT WE KNOW · FOR THE ADVISER</div>
      <Check on={f >= at("s5l2", 20)} f={f - at("s5l2", 20)} size={34}>Buttons: checked with the guide</Check>
      <Check on={f >= at("s5l2", 70)} f={f - at("s5l2", 70)} size={34}>Power light: on</Check>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "8px 0", borderTop: `2px solid ${C.line}`, fontSize: 34, fontWeight: 800,
        opacity: f >= at("s5l2", 120) ? 1 : 0.3, background: mark >= 0 ? C.yellow : undefined, borderRadius: 8 }}>
        <span style={{ width: 50, height: 50, flex: "none", border: `4px solid ${C.ink}`, borderRadius: 8, display: "grid", placeItems: "center", fontSize: 36, fontWeight: 900 }}>?</span>
        Speaker connection: not sure {mark >= 0 && <span style={{ color: CL, fontSize: 28 }}>← marked by the clone</span>}
      </div>
    </Card>
  );
};

const MicIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: "middle" }}>
    <rect x="9" y="2" width="6" height="12" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const DrawCircle: React.FC<{ f: number; x: number; y: number; rad: number; label?: string }> = ({ f, x, y, rad, label }) => {
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
      <div style={{ position: "absolute", left: x, top: y + rad * 1.35, transform: `translateX(-50%) scale(${sp(f - 12, { damping: 8 })})`, fontFamily: EN, fontWeight: 900,
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

