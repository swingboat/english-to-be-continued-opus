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
      padding: "24px 32px", fontFamily: EN, color: C.ink, boxShadow: "0 24px 60px rgba(0,0,0,.5)",
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
    <div style={{ position: "absolute", [side]: side === "right" ? 190 : 30, top, transform: `translateX(${dir * ((1 - k) * 800 + out * 800)}px)`, fontFamily: EN, textAlign: side }}>
      <div style={{ display: "inline-block", background: color, color: "#fff", padding: "10px 60px", transform: "skewX(-12deg)", boxShadow: "8px 8px 0 rgba(0,0,0,.4)" }}>
        <div style={{ transform: "skewX(12deg)", fontSize: 66, fontWeight: 900, letterSpacing: 3 }}>{name}</div>
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

// ---------- per-scene effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f }) => {
  const at = s.at;
  const fa = (id: string, p: number) => atFrac(s, id, p);
  const lf = (id: string) => s.beats.find((b) => b.id === id)!.audioFrames;
  switch (s.scene.id) {
    case 1: {
      const intro = f - at("s1n1", 6);
      const dyn = f - at("s1l1");
      const plan = f - fa("s1l1", 0.45);
      const life = f - at("s1n2", 4);
      const limit = f - fa("s1n3", 0.55);
      const home = f - at("s1l3", 10);
      return (
        <>
          <NameCard f={intro} life={lf("s1n1") - 2} name="Xiaoshuai" desc="Red shirt · the original · telling this story" color="#d4553f" side="right" top={1010} />
          <NameCard f={intro - 14} life={lf("s1n1") - 16} name="The Clone" desc="Blue shirt · the copy · plans everything" color={C.blue} side="left" top={848} />
          <Burst f={dyn} text="ENERGY!" size={120} life={fa("s1l1", 0.45) - at("s1l1") + 6} color={C.blue} style={{ left: 120, top: LOW + 40 }} />
          {plan >= 0 && home < 0 && <PlanNote f={plan} hot={limit >= 0 ? limit : -1} />}
          {life >= 0 && f < at("s1n3") && (
            <Pill style={{ left: W / 2, top: LOW - 120, transform: `translateX(-50%) scale(${sp(life, { damping: 9 })}) rotate(-2deg)` }}>
              Dream lifestyle: <span style={{ color: C.red }}>everything on a timer</span>
            </Pill>
          )}
          <Stamp f={limit} text="REST: 10 SEC" x={W / 2} y={LOW - 90} rot={-6} size={64} life={at("s1l3", 10) - fa("s1n3", 0.55)} />
          {home >= 0 && (
            <Card f={home} life={9999} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 30, color: C.muted }}>Today</div>
              <div style={{ fontSize: 44, fontWeight: 900 }}>
                <span style={{ color: "#e0604a" }}>Xiaoshuai → school</span> · <span style={{ color: "#3d9cc0" }}>Clone → stays home</span>
              </div>
            </Card>
          )}
        </>
      );
    }
    case 2: {
      const ask = f - at("s2l1", 10);
      const agree = f - at("s2n2");
      const home = f - at("s2n3", 4);
      const watch = f - at("s2n4");
      return (
        <>
          {ask >= 0 && f < at("s2l2") && (
            <Pill style={{ left: 80, top: LOW + 22, transform: `scale(${sp(ask, { damping: 9 })}) rotate(-2deg)` }}>
              Step 1: <span style={{ color: "#2d7d4f" }}>ASK</span> · Step 2: then run
            </Pill>
          )}
          <NameCard f={f - at("s2l2", 4)} life={lf("s2l2") + 6} name="Su Xiaoman" desc="Deskmate · wants to walk first" color="#8a4fb0" side="left" top={LOW + 66} />
          <NameCard f={f - at("s2l3", 4)} life={lf("s2l3") + 6} name="Buzz-cut" desc="Classmate · okay with slow" color="#4f8a3c" side="right" top={LOW + 66} />
          <NameCard f={f - at("s2l4", 4)} life={lf("s2l4") + 6} name="Head Teacher" desc="Right by the track · stop anytime" color="#2f7d63" side="right" top={LOW - 200} />
          {agree >= 0 && home < 0 && (
            <Card f={agree} life={9999} style={{ top: LOW + 80 }}>
              <div style={{ fontSize: 30, color: C.muted }}>Before we run</div>
              <Check on={f >= fa("s2n2", 0.15)} f={f - fa("s2n2", 0.15)} size={34}>Xiaoman: walk first, then half a lap</Check>
              <Check on={f >= fa("s2n2", 0.35)} f={f - fa("s2n2", 0.35)} size={34}>Buzz-cut: slow is fine</Check>
              <Check on={f >= fa("s2n2", 0.55)} f={f - fa("s2n2", 0.55)} size={34}>Teacher: warm up · watching</Check>
            </Card>
          )}
          {home >= 0 && (
            <Card f={home} life={9999} style={{ textAlign: "center", top: LOW + 150 }}>
              <div style={{ fontSize: 44, fontWeight: 900 }}>
                📍 Clone: <span style={{ color: C.blue }}>at home</span>
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, marginTop: 14, opacity: watch >= 0 ? sp(watch) : 0 }}>
                ⏱ His stopwatch: <span style={{ color: "#e0604a" }}>with me</span>
              </div>
            </Card>
          )}
        </>
      );
    }
    case 3: {
      const run = f - at("s3-run");
      const drag = f - at("s3n1");
      const gentle = f - fa("s3n2", 0.5);
      const pony = f - at("s3l1", 4);
      const meter = f - fa("s3l1", 0.45);
      const bench = f - at("s3n3", 10);
      return (
        <>
          {run >= 0 && drag < 0 && (
            <Pill style={{ left: 80, top: LOW + 44, transform: `scale(${sp(run, { damping: 9 })})` }}>Pace: “slow” …?</Pill>
          )}
          {drag >= 0 && gentle < 0 && <HeavyFeet f={drag} />}
          <Stamp f={gentle} text="GENTLE START? ✗" x={W / 2 - 40} y={LOW + 120} rot={-6} size={60} life={at("s3l1") - fa("s3n2", 0.5)} />
          <NameCard f={pony} life={fa("s3l1", 0.45) - at("s3l1", 4)} name="Ponytail" desc="Classmate · her own idea of “slow”" color="#d06a8c" side="right" top={LOW + 66} />
          {meter >= 0 && bench < 0 && <SlowMeter f={meter} />}
          {bench >= 0 && (
            <Pill style={{ right: 190, top: LOW + 77, fontSize: 52, background: C.yellow, transform: `translateX(${Math.sin(bench / 4) * 10}px) scale(${sp(bench, { damping: 9 })})` }}>
              BENCH →
            </Pill>
          )}
        </>
      );
    }
    case 4: {
      const start = at("s4n1", 10);
      const beep = at("s4-beep");
      const t = f - start;
      const sit = f - at("s4-sit");
      const left = Math.max(0, 10 - (10 * (f - start)) / (beep - start));
      const ring = f - beep;
      return (
        <>
          {t >= 0 && f < at("s4l2", 20) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 160, textAlign: "center", transform: `scale(${sp(t, { damping: 10 }) * (ring >= 0 && ring < 30 ? 1 + 0.06 * Math.sin(ring * 2) : 1)})` }}>
              <div style={{ fontFamily: EN, fontSize: 32, fontWeight: 800, color: "#fff", textShadow: "0 2px 8px #000", marginBottom: 10 }}>REST TIMER (clone&apos;s plan)</div>
              <Digits text={`00:${String(Math.ceil(left)).padStart(2, "0")}`} color={ring >= 0 ? "#ff5a3c" : "#7dffa0"} />
            </div>
          )}
          {sit >= 0 && f < at("s4n3") && (
            <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 120, display: "flex", justifyContent: "center", gap: 18 }}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{ fontFamily: EN, fontSize: 40, fontWeight: 900, background: "#fff", border: "4px solid #111", borderRadius: 30,
                  padding: "6px 20px", transform: `scale(${sit >= i * 9 ? sp(sit - i * 9, { damping: 7 }) : 0})` }}>SIT</span>
              ))}
            </div>
          )}
          <Burst f={ring} text="BEEP!" size={140} life={40} color="#ff5a3c" style={{ left: 120, top: LOW + 77 }} />
          {f >= at("s4l2", 20) && (
            <Pill style={{ left: 80, top: LOW + 44, transform: `scale(${sp(f - at("s4l2", 20), { damping: 9 })}) rotate(-2deg)` }}>
              Breath caught: <span style={{ color: C.red }}>not yet</span>
            </Pill>
          )}
        </>
      );
    }
    case 5: {
      const card = f - at("s5n1", 10);
      const race = f - fa("s5l2", 0.5);
      const sched = f - at("s5l3");
      const help = f - at("s5l4", 20);
      return (
        <>
          {card >= 0 && race < 0 && (
            <Card f={card} life={9999}>
              <div style={{ fontSize: 30, color: "#8a4fb0", fontWeight: 800 }}>Xiaoman</div>
              <Check on f={card} size={36}>Runs in her leisure time</Check>
              <Check on={f >= fa("s5l1", 0.6)} f={f - fa("s5l1", 0.6)} size={36} bad>A race first thing in the morning</Check>
            </Card>
          )}
          <Stamp f={race} text="REST = RACE?" x={W / 2} y={LOW - 170} rot={-7} size={76} life={at("s5l3") - fa("s5l2", 0.5)} />
          {sched >= 0 && help < 0 && <ScheduleEdit f={sched} />}
          {help >= 0 && (
            <Card f={help} life={9999} style={{ textAlign: "center", background: "#fffbe8" }}>
              <div style={{ fontSize: 30, color: C.muted }}>Head teacher</div>
              <div style={{ fontSize: 52, fontWeight: 900 }}>A schedule is there to <span style={{ color: "#2d7d4f" }}>help people</span>.</div>
            </Card>
          )}
        </>
      );
    }
    case 6: {
      const tend = f - at("s6n1", 10);
      const off = f - fa("s6n2", 0.2);
      const board = f - at("s6l2");
      const ok = f - fa("s6l4", 1);
      const fit = f - at("s6n3", 4);
      return (
        <>
          {off >= 0 && board < 0 && (
            <div style={{ position: "absolute", left: 80, top: LOW + 200, transform: `scale(${sp(off, { damping: 8 })}) rotate(-3deg)` }}>
              <Digits text="❚❚ OFF" color="#ffd75e" size={80} />
            </div>
          )}
          {tend >= 0 && board < 0 && (
            <Card f={tend} life={9999}>
              <div style={{ fontSize: 40, fontWeight: 900, color: C.muted, textDecoration: off >= 0 ? "line-through" : undefined, textDecorationColor: C.red, textDecorationThickness: 6 }}>
                Before: YES → questions?
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#2d7d4f", marginTop: 10, opacity: off >= 0 ? sp(off) : 0 }}>Now: questions → then decide</div>
            </Card>
          )}
          {board >= 0 && (
            <Card f={board} life={9999} style={{ top: LOW - 60 }}>
              <div style={{ fontSize: 30, color: C.muted }}>New plan</div>
              <Check on={f >= at("s6l2", 6)} f={f - at("s6l2", 6)} size={34}>Walk a lap + stretch</Check>
              <Check on={f >= at("s6l3", 6)} f={f - at("s6l3", 6)} size={34}>Run, even slower</Check>
              <Check on={f >= fa("s6l4", 0.3)} f={f - fa("s6l4", 0.3)} size={34}>Rest first · running is a choice</Check>
            </Card>
          )}
          <Stamp f={ok} text="APPROVED" x={W / 2 + 180} y={LOW + 182} rot={-10} size={66} color="#2d7d4f" />
          {fit >= 0 && (
            <Pill style={{ left: W / 2 - 60, top: LOW + 270, transform: `translateX(-50%) scale(${sp(fit, { damping: 9 })}) rotate(-2deg)` }}>
              Plan ⟶ fits <span style={{ color: "#2d7d4f" }}>people</span> ✓
            </Pill>
          )}
        </>
      );
    }
    case 7: {
      const jog = f - at("s7n1", 4);
      const walk = f - at("s7n2", 4);
      const vol = f - at("s7n3", 20);
      const right = f - at("s7l1", 10);
      const laps = f - at("s7l2", 30);
      const lane = (t: string, c: string, k: number) => (
        <div style={{ flex: 1, textAlign: "center", fontFamily: EN, fontSize: 40, fontWeight: 900, color: "#fff", background: c,
          border: "4px solid #111", borderRadius: 16, padding: "10px 0", opacity: k, transform: `scale(${k})` }}>{t}</div>
      );
      return (
        <>
          {jog >= 0 && (
            <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 110, display: "flex", gap: 18 }}>
              {lane("SLOW JOG", "#e0604a", sp(jog, { damping: 9 }))}
              {lane("WALK + STRETCH", "#b07ad0", walk >= 0 ? sp(walk, { damping: 9 }) : 0)}
            </div>
          )}
          {vol >= 0 && right < 0 && (
            <Pill style={{ left: 80, top: LOW + 22, transform: `scale(${sp(vol, { damping: 9 })}) rotate(-2deg)` }}>
              Volunteered — <span style={{ color: "#2d7d4f" }}>after asking ✓</span>
            </Pill>
          )}
          {right >= 0 && laps < 0 && <Burst f={right} text="The RIGHT slow ✓" size={70} life={9999} color="#4f8a3c" style={{ left: 80, top: LOW + 11 }} />}
          {laps >= 0 && (
            <Pill style={{ right: 190, top: LOW + 22, transform: `scale(${sp(laps, { damping: 9 })}) rotate(2deg)` }}>
              Lap race: <span style={{ color: C.red }}>cancelled</span>
            </Pill>
          )}
        </>
      );
    }
    case 8: {
      const lunch = f - at("s8l1", 30);
      const trial = f - at("s8l2", 30);
      const ten = f - at("s8l3", 20);
      const pocket = f - fa("s8n3", 0.85);
      return (
        <>
          {lunch >= 0 && ten < 0 && (
            <Card f={lunch} life={9999} style={{ top: LOW + 20 }}>
              <div style={{ fontSize: 30, color: C.muted }}>Lunch break</div>
              <div style={{ fontSize: 44, fontWeight: 900 }}>10 min reserved: <span style={{ color: "#8a4fb0" }}>Xiaoman&apos;s radio plan</span></div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8, opacity: trial >= 0 ? 1 : 0, color: C.blue }}>Then: ask the teacher about a trial broadcast</div>
            </Card>
          )}
          {ten >= 0 && f < at("s8n3") && (
            <div style={{ position: "absolute", left: 0, right: 110, top: LOW + 60, textAlign: "center", transform: `scale(${sp(ten, { damping: 9 })}) rotate(-3deg)` }}>
              <span style={{ position: "relative", display: "inline-block" }}>
                <Digits text="00:10 TIME'S UP" color="#ff5a3c" size={70} />
                <span style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 12, background: C.red, transform: `rotate(-8deg) scaleX(${interpolate(ten, [8, 16], [0, 1], clamp)})` }} />
              </span>
            </div>
          )}
          <Stamp f={pocket} text="STOPWATCH: OFF DUTY" x={W / 2} y={LOW + 187} rot={-6} size={56} color={C.blue} />
        </>
      );
    }
    default:
      return null;
  }
};

export const TopFX: React.FC<{ s: SceneT; f: number }> = ({ s, f }) => {
  if (s.scene.id === 4 && f >= s.at("s4-beep") && f < s.at("s4-beep", 10)) {
    return <AbsoluteFill style={{ background: "#ff3b3b", opacity: interpolate(f - s.at("s4-beep"), [0, 2, 10], [0, 0.3, 0], clamp), pointerEvents: "none" }} />;
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 3 && f >= s.at("s3n1") && f < s.at("s3l1")) return "saturate(.7) brightness(.92)";
  return undefined;
};

// ---------- pieces ----------
const PlanNote: React.FC<{ f: number; hot: number }> = ({ f, hot }) => {
  const rows: [string, string, boolean][] = [["Run", "3:00", false], ["Rest", "0:10", true], ["Run", "3:00", false], ["Rest", "0:10", true]];
  return (
    <div style={{ position: "absolute", left: 140, right: 190, top: LOW - 20, background: "#fff7c2", border: "4px solid #8b6b3d", padding: "18px 30px",
      fontFamily: '"Bradley Hand","Chalkboard SE",' + EN, color: "#3b2a12", boxShadow: "0 20px 40px rgba(0,0,0,.4)",
      transform: `rotate(-3deg) translateY(${(1 - sp(f, { damping: 12 })) * 300}px)` }}>
      <div style={{ fontSize: 30, fontWeight: 800, fontFamily: EN }}>Clone&apos;s Morning Plan</div>
      {rows.map(([a, b, rest], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 700, opacity: sp(f - 8 - i * 6),
          color: rest ? C.red : undefined, transform: rest && hot >= 0 ? `scale(${1 + 0.08 * Math.abs(Math.sin(hot / 3))})` : undefined }}>
          <span>{a}</span><span>{b}{rest ? " ⏱" : ""}</span>
        </div>
      ))}
    </div>
  );
};

const HeavyFeet: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 22, display: "flex", justifyContent: "center", gap: 60 }}>
    {[0, 1].map((i) => {
      const k = sp(f - i * 6, { damping: 8, stiffness: 200 });
      return (
        <div key={i} style={{ transform: `translateY(${(1 - k) * -500}px) rotate(${i ? 4 : -4}deg)`, textAlign: "center" }}>
          <svg width="220" height="170" viewBox="0 0 110 85">
            <path d="M30 20 H80 L100 80 H10 Z" fill="#555" stroke="#111" strokeWidth="4" />
            <rect x="42" y="4" width="26" height="20" rx="8" fill="none" stroke="#111" strokeWidth="6" />
            <text x="55" y="64" textAnchor="middle" fontSize="26" fontWeight="900" fill="#fff" fontFamily="Avenir Next">10kg</text>
          </svg>
        </div>
      );
    })}
    <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", fontFamily: EN, fontSize: 46, fontWeight: 900, color: "#fff",
      textShadow: "0 3px 10px #000", fontStyle: "italic", opacity: interpolate(f, [14, 22], [0, 1], clamp) }}>
      drag… drag…
    </div>
  </div>
);

const SlowMeter: React.FC<{ f: number }> = ({ f }) => {
  const bars: [string, number, string][] = [["The plan's “slow”", 0.85, C.red], ["Xiaoshuai's “slow”", 0.55, "#e0604a"], ["Her “slow”", 0.3, "#d06a8c"]];
  return (
    <Card f={f} life={9999}>
      <div style={{ fontSize: 30, color: C.muted, marginBottom: 6 }}>Same word, different speeds</div>
      {bars.map(([t, v, c], i) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          <span style={{ width: 360, fontSize: 32, fontWeight: 800 }}>{t}</span>
          <div style={{ flex: 1, height: 30, borderRadius: 15, background: "#eee", overflow: "hidden", border: "3px solid #111" }}>
            <div style={{ width: `${interpolate(f - i * 8, [0, 20], [0, v * 100], clamp)}%`, height: "100%", background: c }} />
          </div>
        </div>
      ))}
    </Card>
  );
};

const ScheduleEdit: React.FC<{ f: number }> = ({ f }) => (
  <Card f={f} life={9999} style={{ background: "#fff7c2", textAlign: "center" }}>
    <div style={{ fontSize: 30, color: C.muted }}>The schedule</div>
    <div style={{ fontSize: 48, fontWeight: 900 }}>
      Rest: <span style={{ textDecoration: "line-through", textDecorationColor: C.red, textDecorationThickness: 6, color: C.muted }}>0:10</span>{" "}
      <span style={{ color: "#2d7d4f", opacity: interpolate(f, [14, 22], [0, 1], clamp) }}>as long as you need?</span>
    </div>
  </Card>
);
