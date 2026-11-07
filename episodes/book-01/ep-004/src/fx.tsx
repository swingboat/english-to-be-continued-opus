import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { atFrac, CONDITIONS, SceneT, W } from "./timeline";
import { C, clamp, EN, Rect, sp, SANS } from "./ui";

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

const Bubble: React.FC<{ f: number; text: string; x: number; y: number; color: string; tail?: "left" | "right" }> = ({ f, text, x, y, color }) => {
  if (f < 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(-50%) scale(${sp(f, { damping: 8, stiffness: 220 })})`, fontFamily: EN,
      fontSize: 46, fontWeight: 900, background: "#fff", color: "#111", border: `6px solid ${color}`, borderRadius: 30, padding: "10px 30px",
      whiteSpace: "nowrap", boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
      {text}
    </div>
  );
};

// ---------- per-scene effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f }) => {
  const at = s.at;
  const fa = (id: string, p: number) => atFrac(s, id, p);
  const lf = (id: string) => s.beats.find((b) => b.id === id)!.audioFrames;
  switch (s.scene.id) {
    case 1: {
      const intro = f - at("s1n1", 6);
      const hi = f - at("s1l1");
      const pen = f - at("s1-pen");
      const dbl = f - fa("s1l2", 0.62);
      const count = f - at("s1n2");
      const su = f - at("s1l3", 6);
      return (
        <>
          <NameCard f={intro} life={lf("s1n1") - 6} name="Xiaoshuai" desc="Red shirt · the original · telling this story" color="#d4553f" side="left" top={848} />
          <NameCard f={intro - 14} life={lf("s1n1") - 20} name="The Clone" desc="Blue shirt · the copy · loves to volunteer" color={C.blue} side="right" top={1010} />
          {hi >= 0 && f < at("s1-pen") && (
            <>
              <Bubble f={hi} text="Good morning, sir!" x={W / 2 - 150} y={LOW + 22} color="#e0604a" />
              <Bubble f={hi - 3} text="Good morning, sir!" x={W / 2 + 150} y={LOW + 105} color="#3d9cc0" />
            </>
          )}
          {pen >= 0 && f < at("s1l2") && (
            <Pill style={{ left: 80, top: LOW + 22, transform: `scale(${sp(pen, { damping: 9 })}) rotate(-3deg)` }}>
              ✎ <span style={{ color: C.red }}>pen.exe</span> has stopped
            </Pill>
          )}
          <NameCard f={pen - 4} life={at("s1l2", 30) - at("s1-pen")} name="Head Teacher" desc="Sees two Xiaoshuais for the first time" color="#2f7d63" side="left" top={LOW + 121} />
          <Stamp f={dbl} text="GOOD MORNING ×2" x={W / 2} y={LOW + 110} rot={-7} size={64} life={at("s1n2") - fa("s1l2", 0.62)} />
          {count >= 0 && su < 0 && <FaceCount f={count} sheet={f - fa("s1n2", 0.7)} />}
          <NameCard f={su} life={lf("s1l3") + 10} name="Su Xiaoman" desc="Deskmate · saw it with her own eyes" color="#8a4fb0" side="left" top={LOW + 66} />
        </>
      );
    }
    case 2: {
      const ex = f - at("s2n1");
      const tl = f - at("s2n2");
      const still = f - fa("s2n3", 0.75);
      const call = f - at("s2-call");
      const steps: [string, number][] = [["The phone · one copy only", 0.1], ["He said hello for me", 0.45], ["My fear of speaking", 0.8]];
      return (
        <>
          {ex >= 0 && tl < 0 && (
            <Card f={ex} life={9999} style={{ top: LOW - 60 }}>
              <div style={{ fontSize: 28, color: C.muted, marginBottom: 6 }}>Explaining… everything</div>
              {steps.map(([t, p], i) => (
                <Check key={t} on={f >= fa("s2n1", p)} f={f - fa("s2n1", p)} size={34}>{i === 2 ? <b style={{ color: C.red }}>{t}</b> : t}</Check>
              ))}
            </Card>
          )}
          {tl >= 0 && call < 0 && (
            <Card f={tl} life={9999}>
              <div style={{ fontSize: 28, color: C.muted, marginBottom: 12 }}>Xiaoshuai at school</div>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ flex: 1, background: "#e9ecef", borderRadius: 14, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, color: C.muted }}>previous school</div>
                  <div style={{ fontSize: 40, fontWeight: 900 }}>Junior secondary</div>
                  <div style={{ fontSize: 48, letterSpacing: 6 }}>· · ·</div>
                </div>
                <div style={{ fontSize: 60, fontWeight: 900 }}>→</div>
                <div style={{ flex: 1, background: "#fbe3dc", borderRadius: 14, padding: "14px 18px", textAlign: "center",
                  opacity: f >= at("s2n3") ? 1 : 0.25 }}>
                  <div style={{ fontSize: 28, color: C.muted }}>now</div>
                  <div style={{ fontSize: 40, fontWeight: 900 }}>Senior secondary</div>
                  <div style={{ fontSize: 48 }}>?</div>
                </div>
              </div>
            </Card>
          )}
          <Stamp f={still} text="STILL QUIET" x={W / 2} y={LOW + 176} rot={-8} size={70} life={at("s2l1") - fa("s2n3", 0.75)} />
          {call >= 0 && <Calling f={call} />}
        </>
      );
    }
    case 3: {
      const grad = f - at("s3n1");
      const sheet = f - at("s3l1", 30);
      const reach = f - at("s3-reach");
      const rule = f - at("s3n2");
      return (
        <>
          {grad >= 0 && sheet < 0 && (
            <Card f={grad} life={9999} style={{ textAlign: "center" }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: C.muted }}>Junior secondary ✓</span>
              <span style={{ fontSize: 50, margin: "0 18px" }}>→</span>
              <span style={{ fontSize: 50, fontWeight: 900, color: C.red }}>Senior secondary: NOW</span>
              <div style={{ fontSize: 44, fontWeight: 900, marginTop: 10, opacity: sp(f - fa("s3n1", 0.55)) }}>= do <span style={{ color: C.red }}>my own</span> part</div>
            </Card>
          )}
          {sheet >= 0 && rule < 0 && <TaskSheet f={sheet} denied={reach >= 16} />}
          {rule >= 0 && (
            <Card f={rule} life={9999} style={{ top: LOW - 180 }}>
              <Check on f={rule - 4} size={32} bad>Attend lessons for me</Check>
              <div style={{ fontSize: 28, color: C.muted, margin: "8px 0 4px", opacity: f >= at("s3n3") ? 1 : 0.3 }}>The clone may help when…</div>
              {CONDITIONS.map(([t, id, p]) => {
                const on = f >= fa(id, p);
                return <Check key={t} on={on} f={f - fa(id, p)} size={32}>{t}</Check>;
              })}
            </Card>
          )}
        </>
      );
    }
    case 4: {
      const mum = f - at("s4n1", 10);
      const rw = f - at("s4-story");
      const mission = f - at("s4n2");
      const vol = f - at("s4l2");
      const step = f - at("s4l3", 4);
      return (
        <>
          <NameCard f={mum} life={lf("s4n1") + 40} name="Mum" desc="Got the call · came to hear us both" color="#c58a3a" side="left" top={LOW + 66} />
          {rw >= 0 && f < at("s4n2") && <Rewind f={rw} />}
          {mission >= 0 && vol < 0 && (
            <Card f={mission} life={9999} style={{ background: "#fffbe8" }}>
              <div style={{ fontSize: 28, color: C.red, letterSpacing: 4, fontWeight: 900 }}>NEW MISSION</div>
              <div style={{ fontSize: 46, fontWeight: 900 }}>Tomorrow&apos;s morning activity</div>
              <div style={{ fontSize: 34, marginTop: 6 }}>Organiser: <b style={{ color: C.red }}>Xiaoshuai</b> · Idea: running?</div>
            </Card>
          )}
          {vol >= 0 && step < 0 && <Volunteer f={vol} />}
          {step >= 0 && (
            <Card f={step} life={9999}>
              <div style={{ fontSize: 28, color: C.muted }}>Organiser&apos;s plan</div>
              <Check on f={step} size={36}>Step 1: ask the class</Check>
              <Check on={step >= 24} f={step - 24} size={36} bad>Say yes for everyone</Check>
            </Card>
          )}
        </>
      );
    }
    case 5: {
      const dad = f - at("s5l1", 10);
      const ask = f - at("s5l2", 20);
      const room = f - at("s5n3");
      return (
        <>
          {dad >= 0 && f < at("s5n2") && (
            <Pill style={{ left: 80, top: LOW + 66, transform: `scale(${sp(dad, { damping: 9 })}) rotate(-2deg)`, background: "#e6ebf3" }}>
              Dad <span style={{ color: C.muted, fontSize: 30 }}>(off-screen)</span>: heard everything <span style={{ color: "#2d7d4f" }}>✓</span>
            </Pill>
          )}
          {ask >= 0 && room < 0 && (
            <Card f={ask} life={9999} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 30, color: C.muted }}>Clone&apos;s request today</div>
              <div style={{ fontSize: 44, fontWeight: 900 }}>
                <s style={{ color: C.muted }}>A new job</s> &nbsp;→&nbsp; <span style={{ color: C.blue }}>A bed</span>
              </div>
            </Card>
          )}
          {room >= 0 && <DoorTag f={room} chips={f - at("s5l3")} />}
        </>
      );
    }
    case 6: {
      const math = f - at("s6l1");
      const huh = f - at("s6l2");
      const pt = f - at("s6l3");
      const job = f - at("s6l5", 30);
      const hype = f - at("s6n2");
      return (
        <>
          {math >= 0 && huh < 0 && (
            <Card f={math} life={9999} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 30, color: C.muted }}>Mum&apos;s math</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, fontSize: 60, fontWeight: 900 }}>
                <span>2 boys</span><span>=</span>
                {[0, 1].map((i) => <Bowl key={i} f={math - 16 - i * 10} />)}
              </div>
            </Card>
          )}
          {huh >= 0 && pt < 0 && (
            <>
              <Burst f={huh} text="Huh?!" size={110} life={9999} color="#e0604a" style={{ left: 80, top: LOW + 33 }} />
              <Burst f={huh - 2} text="Huh?!" size={110} life={9999} color="#3d9cc0" style={{ right: 190, top: LOW + 121 }} />
            </>
          )}
          {pt >= 0 && job < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 110, transform: `translateX(-50%) scale(${sp(pt, { damping: 8 })})`, fontSize: 46 }}>
              <span style={{ color: "#e0604a" }}>“It&apos;s him” →</span> &nbsp;&nbsp; <span style={{ color: "#3d9cc0" }}>← “No, him”</span>
            </Pill>
          )}
          {job >= 0 && hype < 0 && (
            <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 22, display: "flex", gap: 20, transform: `scale(${sp(job, { damping: 10 })})` }}>
              {[["WASH", "#e0604a", "Xiaoshuai"], ["DRY", "#3d9cc0", "Clone"]].map(([t, c, who]) => (
                <div key={t} style={{ flex: 1, background: c, color: "#fff", borderRadius: 18, border: "5px solid #111", textAlign: "center", padding: "16px 0", fontFamily: EN }}>
                  <div style={{ fontSize: 72, fontWeight: 900 }}>{t}</div>
                  <div style={{ fontSize: 32 }}>{who}</div>
                </div>
              ))}
            </div>
          )}
          {hype >= 0 && <HypeMeter f={hype} drop={f - fa("s6n2", 0.45)} />}
        </>
      );
    }
    case 7: {
      const both = f - at("s7n1");
      const goal = f - at("s7n2");
      const items: [React.ReactNode, number][] = [
        [<span key="w" style={{ color: "#e0604a" }}>Wash ✓</span>, 0.12],
        [<span key="d" style={{ color: "#3d9cc0" }}>Dry ✓</span>, 0.38],
        [<span key="e">Escape: <span style={{ color: C.red }}>0%</span></span>, 0.7],
      ];
      return (
        <>
          <Bubbles f={f} />
          {both >= 0 && goal < 0 && (
            <Card f={both} life={9999}>
              <div style={{ display: "flex", gap: 30, fontSize: 40, fontWeight: 900 }}>
                {items.map(([el, p], i) => (
                  <span key={i} style={{ marginLeft: i === 2 ? "auto" : undefined, opacity: f >= fa("s7n1", p) ? 1 : 0.15,
                    transform: `scale(${f >= fa("s7n1", p) ? sp(f - fa("s7n1", p), { damping: 8 }) : 1})` }}>{el}</span>
                ))}
              </div>
            </Card>
          )}
          {goal >= 0 && (
            <Card f={goal} life={9999} style={{ textAlign: "center", background: "#fffbe8" }}>
              <div style={{ fontSize: 30, color: C.muted }}>My goal</div>
              <div style={{ fontSize: 58, fontWeight: 900 }}>Do <span style={{ color: C.red }}>my own</span> part ✓</div>
            </Card>
          )}
        </>
      );
    }
    case 8: {
      const q = f - at("s8n1");
      const sw = f - at("s8n2");
      const stop = f - at("s8n3", 8);
      const not = f - at("s8l1", 30);
      const qs: [string, number][] = [["How do you want to exercise?", 0.15], ["Do you want to run?", 0.45], ["What speed is okay?", 0.75]];
      return (
        <>
          {q >= 0 && sw < 0 && (
            <Card f={q} life={9999} style={{ background: "#fffbe8", fontFamily: '"Bradley Hand","Chalkboard SE",' + EN }}>
              <div style={{ fontSize: 30, color: C.muted, fontFamily: EN }}>Questions for the class</div>
              {qs.map(([t, p], i) => (
                <div key={t} style={{ fontSize: 42, fontWeight: 700, borderTop: `2px dashed ${C.line}`, padding: "6px 0",
                  clipPath: `inset(0 ${100 - interpolate(f - fa("s8n1", p), [0, 20], [0, 100], clamp)}% 0 0)` }}>{i + 1}. {t}</div>
              ))}
            </Card>
          )}
          {sw >= 0 && <Stopwatch f={sw} stopAt={at("s8n3", 8) - at("s8n2")} away={f - at("s8l1", 18)} />}
          {sw >= 20 && stop < 0 && <RaceDream f={sw - 20} />}
          <Stamp f={stop} text="PAUSE" x={W / 2 - 90} y={LOW + 50} rot={-8} size={90} life={at("s8l1") - at("s8n3", 8) + 10} />
          {stop >= 0 && (
            <Pill style={{ left: 80, top: LOW + 165, transform: `scale(${sp(stop - 8, { damping: 9 })}) rotate(2deg)` }}>
              Classmates asked so far: <span style={{ color: C.red, fontSize: 52 }}>0</span>
            </Pill>
          )}
          {not >= 0 && (
            <Pill style={{ left: 80, top: LOW + 265, transform: `scale(${sp(not, { damping: 9 })}) rotate(-3deg)`, background: "#dff0f7" }}>
              Clone&apos;s new job: <span style={{ color: C.blue }}>not pressing it</span>
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
  if (s.scene.id === 5) {
    // warm lamp light in the spare room
    return <AbsoluteFill style={{ background: "radial-gradient(ellipse at 55% 35%, rgba(255,200,120,.18), transparent 60%)", mixBlendMode: "screen", pointerEvents: "none",
      opacity: interpolate(f, [0, 20], [0, 1], clamp) }} />;
  }
  if (s.scene.id === 4 && f >= s.at("s4l2") && f < s.at("s4l3")) {
    return <SpeedLines f={f - s.at("s4l2")} />;
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 4 && f >= s.at("s4-story") && f < s.at("s4n2")) return "sepia(.6) contrast(1.1)";
  if (s.scene.id === 5) return "saturate(1.05) brightness(1.03)";
  return undefined;
};

// ---------- pieces ----------
const Calling: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: W / 2 - 170, top: LOW - 40, width: 340, height: 520, borderRadius: 44, background: "#1d1d1f", padding: 12,
    transform: `translateY(${(1 - sp(f, { damping: 12 })) * 900}px) rotate(3deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 34, background: "linear-gradient(#2f7d63,#1c4f40)", color: "#fff", fontFamily: EN,
      textAlign: "center", paddingTop: 60 }}>
      <div style={{ fontSize: 24, opacity: 0.8 }}>calling…</div>
      <div style={{ fontSize: 44, fontWeight: 900, marginTop: 10 }}>Xiaoshuai&apos;s Mum</div>
      <div style={{ margin: "50px auto 0", width: 120, height: 120, borderRadius: "50%", background: "#3ccf6e", display: "grid", placeItems: "center",
        boxShadow: `0 0 0 ${10 + 14 * ((f % 20) / 20)}px rgba(60,207,110,${0.5 - 0.5 * ((f % 20) / 20)})`, fontSize: 60 }}>✆</div>
    </div>
  </div>
);

const TaskSheet: React.FC<{ f: number; denied: boolean }> = ({ f, denied }) => (
  <>
    <div style={{ position: "absolute", left: 120, right: 190, top: LOW - 30, background: "#fff", border: "4px solid #333", padding: "24px 34px",
      fontFamily: EN, color: "#222", boxShadow: "0 20px 50px rgba(0,0,0,.45)", transform: `translateX(${(1 - sp(f, { damping: 13 })) * -900}px) rotate(-2deg)` }}>
      <div style={{ fontSize: 26, letterSpacing: 6, color: C.muted }}>STUDENT TASK SHEET · ×1</div>
      <div style={{ fontSize: 44, fontWeight: 900, borderBottom: "3px solid #333", paddingBottom: 6 }}>Name: Xiaoshuai <span style={{ color: C.red }}>(only)</span></div>
      {["Lessons", "Homework", "Class monitor trial"].map((t, i) => (
        <div key={t} style={{ fontSize: 36, marginTop: 6, opacity: sp(f - 10 - i * 8) }}>☑ {t}</div>
      ))}
    </div>
    {denied && <Stamp f={1} text="OWNER ONLY" x={W / 2 + 120} y={LOW + 165} rot={-10} size={70} />}
  </>
);

const Rewind: React.FC<{ f: number }> = ({ f }) => (
  <>
    <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 3px, transparent 3px 7px)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", left: 80, top: LOW + 55, fontFamily: "ui-monospace, Menlo, monospace", color: "#fff", fontSize: 54, fontWeight: 900,
      textShadow: "3px 0 #ff3b3b, -3px 0 #3bd5ff", opacity: Math.floor(f / 8) % 2 ? 1 : 0.6 }}>
      ◀◀ YESTERDAY…
    </div>
    <div style={{ position: "absolute", left: 80, top: LOW + 105, fontFamily: EN, color: "#fff", fontSize: 34, textShadow: "0 2px 8px #000", opacity: sp(f - 10) }}>
      (the whole story, one more time)
    </div>
  </>
);

const Volunteer: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Burst f={f} text="VOLUNTEER!" size={110} life={9999} color={C.blue} style={{ left: 80, top: LOW - 140 }} />
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 33, fontFamily: EN, transform: `scale(${sp(f - 18, { damping: 9 })})` }}>
      <div style={{ display: "inline-block", background: "rgba(0,0,0,.78)", color: "#fff", borderRadius: 14, padding: "12px 26px", fontSize: 40, fontWeight: 800 }}>
        Clone&apos;s volunteer count: <span style={{ color: C.yellow, fontSize: 56 }}>{f >= 30 ? 3 : 2}</span>
      </div>
    </div>
    <Stamp f={f - 24} text="AGAIN?!" x={W / 2 + 120} y={LOW + 215} rot={8} size={70} />
  </>
);

const SpeedLines: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(f, [0, 4], [0, 0.85], clamp) }}>
    <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`}>
      {new Array(36).fill(0).map((_, i) => {
        const a = (i / 36) * Math.PI * 2 + random(`a${i}`) * 0.1;
        const r0 = 520 + random(`r${i}-${Math.floor(f / 2)}`) * 160;
        const cx = W * 0.8, cy = 700;
        return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * 1500} y2={cy + Math.sin(a) * 1500}
          stroke="#fff" strokeWidth={3 + random(`w${i}`) * 6} />;
      })}
    </svg>
  </AbsoluteFill>
);

const DoorTag: React.FC<{ f: number; chips: number }> = ({ f, chips }) => (
  <>
    <div style={{ position: "absolute", left: W / 2 - 220, top: LOW - 20, width: 440, padding: "18px 0", background: "#f3e2c4", border: "5px solid #8b6b3d",
      borderRadius: 16, textAlign: "center", fontFamily: EN, color: "#5a3e1b", transformOrigin: "50% -40px",
      transform: `rotate(${6 * Math.sin(f / 9) * Math.exp(-f / 60)}deg) scale(${sp(f, { damping: 10 })})`, boxShadow: "0 12px 30px rgba(0,0,0,.35)" }}>
      <div style={{ fontSize: 46, fontWeight: 900 }}>CLONE&apos;S ROOM</div>
      <div style={{ fontSize: 28 }}>(for now)</div>
    </div>
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 150, display: "flex", justifyContent: "center", gap: 16, fontFamily: EN }}>
      {["Sleep", "Eat", "Say what you need"].map((t, i) => (
        <span key={t} style={{ fontSize: 34, fontWeight: 800, background: "#fff", border: "4px solid #111", borderRadius: 30, padding: "6px 20px",
          transform: `scale(${sp(chips - 10 - i * 14, { damping: 8 })})` }}>✓ {t}</span>
      ))}
    </div>
  </>
);

const Bowl: React.FC<{ f: number }> = ({ f }) => (
  <svg width="130" height="100" viewBox="0 0 65 50" style={{ transform: `scale(${f >= 0 ? sp(f, { damping: 7 }) : 0})` }}>
    <path d="M4 18 H61 A28 28 0 0 1 4 18 Z" fill="#fff" stroke="#111" strokeWidth="3.5" />
    <path d="M12 26 H53" stroke="#5aa0d0" strokeWidth="3" />
    <path d="M22 4 Q26 10 22 14 M32 2 Q36 9 32 14 M42 4 Q46 10 42 14" fill="none" stroke="#999" strokeWidth="2.5" />
  </svg>
);

const Bubbles: React.FC<{ f: number }> = ({ f }) => (
  <>
    {new Array(14).fill(0).map((_, i) => {
      const life = 70 + random(`l${i}`) * 50;
      const t = ((f + random(`o${i}`) * life) % life) / life;
      const size = 26 + random(`s${i}`) * 50;
      return (
        <div key={i} style={{ position: "absolute", left: 80 + random(`x${i}`) * 520 + Math.sin(f / 12 + i) * 20, top: 1051 - t * 700, width: size, height: size,
          borderRadius: "50%", border: "3px solid rgba(255,255,255,.85)", background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.7), rgba(160,210,255,.15))",
          opacity: Math.sin(t * Math.PI), pointerEvents: "none" }} />
      );
    })}
  </>
);

const Stopwatch: React.FC<{ f: number; stopAt: number; away: number }> = ({ f, stopAt, away }) => {
  const run = Math.min(f, stopAt);
  const secs = f >= stopAt ? 0 : run / 30;
  const txt = `00:${String(Math.floor(secs)).padStart(2, "0")}.${Math.floor((secs % 1) * 10)}`;
  return (
    <div style={{ position: "absolute", right: 190, top: LOW - 20, textAlign: "center", opacity: interpolate(away, [0, 12], [1, 0], clamp),
      transform: `translateY(${interpolate(away, [0, 12], [0, 260], clamp)}px) scale(${sp(f, { damping: 9 })}) rotate(${6 + interpolate(away, [0, 12], [0, 30], clamp)}deg)` }}>
      <svg width="260" height="300" viewBox="0 0 130 150">
        <rect x="55" y="2" width="20" height="14" rx="3" fill="#888" stroke="#111" strokeWidth="3" />
        <circle cx="65" cy="85" r="60" fill="#f4f4f4" stroke="#111" strokeWidth="5" />
        <line x1="65" y1="85" x2={65 + Math.sin((run / 30) * Math.PI * 2 / 6) * 46} y2={85 - Math.cos((run / 30) * Math.PI * 2 / 6) * 46}
          stroke={C.red} strokeWidth="4" strokeLinecap="round" />
        <circle cx="65" cy="85" r="5" fill="#111" />
      </svg>
      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 44, fontWeight: 900, color: "#fff", background: "#111", borderRadius: 10, padding: "4px 14px", marginTop: -10 }}>
        {txt}
      </div>
    </div>
  );
};

const RaceDream: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 80, top: LOW - 10, width: 600, height: 300, borderRadius: 150, background: "rgba(255,255,255,.92)", border: "5px solid #111",
    overflow: "hidden", transform: `scale(${sp(f, { damping: 11 })})`, transformOrigin: "90% 50%" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 18, textAlign: "center", fontFamily: EN, fontSize: 28, fontWeight: 800, color: C.blue }}>Clone&apos;s dream: a perfect race</div>
    <svg width="600" height="300" viewBox="0 0 600 300">
      {[0, 1, 2].map((lane) => (
        <g key={lane}>
          <line x1="40" y1={110 + lane * 60} x2="560" y2={110 + lane * 60} stroke="#ccc" strokeWidth="3" strokeDasharray="12 10" />
          {[0, 1, 2, 3].map((k) => {
            const x = ((f * 6 + k * 130 + lane * 40) % 560) + 20;
            const leg = Math.sin(f / 2 + k) * 10;
            return (
              <g key={k} transform={`translate(${x} ${92 + lane * 60})`} stroke="#111" strokeWidth="4" strokeLinecap="round">
                <circle cx="0" cy="-14" r="7" fill="#111" />
                <line x1="0" y1="-7" x2="0" y2="8" />
                <line x1="0" y1="8" x2={leg} y2="20" /><line x1="0" y1="8" x2={-leg} y2="20" />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  </div>
);

const FaceCount: React.FC<{ f: number; sheet: number }> = ({ f, sheet }) => (
  <Card f={f} life={9999} style={{ display: "flex", alignItems: "center", gap: 26 }}>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 28, color: C.muted }}>Faces</div>
      <div style={{ fontSize: 76 }}>
        <span style={{ display: "inline-block", width: 70, height: 70, borderRadius: "50%", background: "#e0604a", border: "4px solid #111", marginRight: 10 }} />
        <span style={{ display: "inline-block", width: 70, height: 70, borderRadius: "50%", background: "#3d9cc0", border: "4px solid #111",
          transform: `scale(${sp(f - 8, { damping: 7 })})` }} />
      </div>
      <div style={{ fontSize: 52, fontWeight: 900 }}>2</div>
    </div>
    <div style={{ fontSize: 80, fontWeight: 900, color: sheet >= 0 ? C.red : C.ink }}>{sheet >= 0 ? "≠" : "vs"}</div>
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 28, color: C.muted }}>Student task sheets</div>
      <div style={{ display: "inline-block", width: 70, height: 88, background: "#fff", border: "4px solid #111", margin: "6px 0",
        backgroundImage: "repeating-linear-gradient(#fff 0 14px, #bbb 14px 16px)" }} />
      <div style={{ fontSize: 52, fontWeight: 900, color: sheet >= 0 ? C.red : C.ink, transform: `scale(${sheet >= 0 ? 1 + 0.3 * Math.max(0, 1 - sheet / 10) : 1})` }}>1</div>
    </div>
  </Card>
);

const HypeMeter: React.FC<{ f: number; drop: number }> = ({ f, drop }) => {
  const v = drop < 0 ? 100 : interpolate(drop, [0, 26], [100, 12], clamp);
  return (
    <Card f={f} life={9999}>
      <div style={{ fontSize: 30, color: C.muted }}>“An extra pair of hands!” · excitement</div>
      <div style={{ position: "relative", height: 64, borderRadius: 32, border: "5px solid #111", background: "#eee", marginTop: 10, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v}%`, background: v > 50 ? "#f2b632" : C.red }} />
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 40, fontWeight: 900 }}>{Math.round(v)}%</div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 10, opacity: drop >= 20 ? 1 : 0 }}>
        Reason: <span style={{ color: C.red }}>the hands come with dishes</span> 🍽
      </div>
    </Card>
  );
};
