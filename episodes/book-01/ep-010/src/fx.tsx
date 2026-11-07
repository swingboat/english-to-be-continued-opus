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
      const ping = f - at("s1-ping");
      const add = f - at("s1l1", 4);
      const dl = f - at("s1l2", 10);
      const me = f - at("s1l3", 6);
      const ph = pt(r, 0.2, 0.82);
      return (
        <>
          {ping >= 0 && add < 0 && <Waves f={ping % 30} x={ph.x} y={ph.y} />}
          {add >= 0 && dl < 0 && <AddictMeter f={add} />}
          {dl >= 0 && <Deadline f={dl} now={14 * 60} />}
          {me >= 0 && (
            <Pill style={{ left: 80, top: 610, fontSize: 40, transform: `scale(${sp(me, { damping: 8 })}) rotate(-3deg)` }}>
              🧹 Clone: <span style={{ color: CL }}>“Leave it to me!”</span>
            </Pill>
          )}
        </>
      );
    }
    case 2: {
      const shots = f - at("s2-shots");
      const rule = f - at("s2l2", 10);
      const dream = f - at("s2l3", 4);
      const fold = f - at("s2-folder");
      const box = pt(r, 0.86, 0.66);
      return (
        <>
          {shots >= 0 && rule < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 99, fontSize: 40, transform: `translateX(-50%) scale(${sp(shots, { damping: 9 })})` }}>
              ☑ ×6 screenshots <span style={{ color: C.muted }}>(group invites)</span>
            </Pill>
          )}
          {rule >= 0 && dream < 0 && (
            <Card f={rule} life={9999} style={{ top: LOW + 11 }}>
              <div style={{ fontSize: 28, color: XS, fontWeight: 900, letterSpacing: 2 }}>XIAOSHUAI&apos;S CLEAN-UP RULES</div>
              <Check on f={rule} size={34}>Only our own temporary downloads</Check>
              <Check on={f >= fa("s2l2", 0.45)} f={f - fa("s2l2", 0.45)} size={34}>Check what&apos;s inside first</Check>
              <Check on={f >= fa("s2l2", 0.75)} f={f - fa("s2l2", 0.75)} size={34} bad>School software: don&apos;t touch</Check>
            </Card>
          )}
          {dream >= 0 && fold < 0 && <CleanDream f={dream} />}
          {fold >= 0 && (
            <>
              <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={W} height={1920}>
                <path d={`M ${box.x - 330} ${box.y + 330} Q ${box.x - 250} ${box.y + 100} ${box.x - 70} ${box.y + 40}`} fill="none" stroke="#ffd75e" strokeWidth="12"
                  strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(fold, [0, 10], [0, 1], clamp)} />
              </svg>
              <div style={{ position: "absolute", left: box.x - 600, top: box.y + 330, fontFamily: EN, fontSize: 42, fontWeight: 900, color: "#fff",
                textShadow: "0 3px 10px #000", fontStyle: "italic", opacity: interpolate(fold, [8, 14], [0, 1], clamp) }}>…and that folder right next to them?</div>
            </>
          )}
        </>
      );
    }
    case 3: {
      const sel = f - at("s3-select");
      const box = f - at("s3-box");
      const proj = f - at("s3l1", 10);
      const stress = f - at("s3l2");
      return (
        <>
          {sel >= 0 && box < 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 77, textAlign: "center" }}>
              <span style={{ display: "inline-block", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 900, fontSize: 48, color: "#fff", background: "#2f6fd6",
                borderRadius: 12, padding: "6px 24px" }}>SELECT ALL… {Math.min(9, 1 + Math.floor(sel / 5))} items</span>
            </div>
          )}
          {box >= 0 && stress < 0 && <DeleteBox f={box} proj={proj} />}
          {stress >= 0 && <StressECG f={stress} />}
          <Burst f={f - fa("s3l3", 0.35)} text="MY HALF MINUTE!!" size={90} life={60} color={XS} style={{ left: 80, top: 610 }} />
        </>
      );
    }
    case 4: {
      const stop = f - at("s4l1");
      const cancel = f - at("s4-cancel");
      const hands = f - at("s4l2", 30);
      const c = pt(r, 0.461, 0.816);
      return (
        <>
          <Burst f={stop} text="STOP!" size={220} life={44} color={C.red} style={{ left: 120, top: 600 }} />
          {cancel >= 0 && f < at("s4l2") && <DrawCircle f={cancel} x={c.x} y={c.y} rad={r.w * 0.06} label="CANCEL ✓" />}
          <Stamp f={f - at("s4l2")} text="NOTHING DELETED ✓" x={W / 2} y={640} rot={-6} size={58} color={TE} life={at("s4l3", 30) - at("s4l2")} />
          {hands >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 33, fontSize: 40, transform: `translateX(-50%) scale(${sp(hands, { damping: 9 })}) rotate(-2deg)` }}>
              🙌 Clone: <span style={{ color: CL }}>hands off the keyboard</span>
            </Pill>
          )}
        </>
      );
    }
    case 5: {
      const check = f - at("s5-check");
      const work = f - at("s5l2", 4);
      const lesson = f - at("s5l4", 10);
      return (
        <>
          {check >= 0 && lesson < 0 && (
            <Card f={check} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>📁 RADIO PREP PROJECT · CHECKED BY XIAOMAN</div>
              <Check on={check >= 10} f={check - 10} size={34}>🎙 test_clip_01 · opens ✓</Check>
              <Check on={check >= 28} f={check - 28} size={34}>🎙 first_day_draft · opens ✓</Check>
              <Check on={check >= 46} f={check - 46} size={34}>📝 prep notes · there ✓</Check>
            </Card>
          )}
          <Stamp f={work} text="THAT'S OUR WORK" x={W / 2} y={690} rot={-6} size={64} color={SU} life={at("s5l4", 10) - at("s5l2", 4)} />
          {lesson >= 0 && (
            <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 10, display: "flex", gap: 18, transform: `scale(${sp(lesson, { damping: 11 })})` }}>
              {([["DISTRACTIONS", "alerts · extra tabs · invite screenshots", C.red, "✗"], ["TOOLS & WORK", "laptop · project · outline", TE, "✓"]] as [string, string, string, string][]).map(([a, b, c, m], i) => (
                <div key={a} style={{ flex: 1, background: "#fff", border: `5px solid ${c}`, borderRadius: 18, padding: "16px 20px", textAlign: "center",
                  fontFamily: EN, opacity: lesson >= i * 16 ? 1 : 0, boxShadow: "0 16px 40px rgba(0,0,0,.4)" }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: c }}>{m} {a}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, marginTop: 6 }}>{b}</div>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }
    case 6: {
      const off = f - at("s6l1", 6);
      const red = f - at("s6l2", 4);
      const tabs = f - at("s6-tabs");
      const keep = f - at("s6l4", 10);
      return (
        <>
          {off >= 0 && red < 0 && <AlertToggle f={off} />}
          {red >= 0 && keep < 0 && <InterruptMeter f={red} tabs={tabs} />}
          {keep >= 0 && (
            <Card f={keep} life={9999} style={{ top: LOW - 10 }}>
              <div style={{ fontSize: 28, color: TE, fontWeight: 900, letterSpacing: 2 }}>STILL ON SCREEN</div>
              <Check on f={keep} size={34}>📁 radio prep project</Check>
              <Check on={keep >= 10} f={keep - 10} size={34}>📝 interview outline</Check>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.muted, marginTop: 6 }}>school laptop settings: unchanged</div>
            </Card>
          )}
        </>
      );
    }
    case 7: {
      const clock = f - at("s7-open");
      const cards = f - at("s7-cards");
      const pick = f - at("s7l2", 10);
      const L = pt(r, 0.18, 0.66), M = pt(r, 0.5, 0.66), R = pt(r, 0.8, 0.66);
      const tag = (p: { x: number; y: number }, t: string, c: string, d: number) => (
        <div style={{ position: "absolute", left: p.x, top: p.y - 90, transform: `translateX(-50%) scale(${sp(d, { damping: 8 })})`, fontFamily: EN, fontWeight: 900,
          fontSize: 34, color: "#fff", background: c, border: "4px solid #111", borderRadius: 14, padding: "4px 16px", whiteSpace: "nowrap" }}>{t}</div>
      );
      return (
        <>
          {clock >= 0 && cards < 0 && <Deadline f={clock + 40} now={14 * 60 + 10} />}
          {cards >= 0 && pick < 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", fontFamily: EN, fontWeight: 900, fontSize: 52, color: "#fff",
              textShadow: "0 4px 12px #000", opacity: interpolate(cards, [0, 8], [0, 1], clamp) }}>3 ideas · 20 minutes · pick ONE</div>
          )}
          {pick >= 0 && (
            <>
              {tag(R, "★ MAIN STORY", PO, pick)}
              {tag(M, "map: check route", CL, pick - 30)}
              {tag(L, "saved for later", "#888", pick - 60)}
            </>
          )}
          <Stamp f={f - fa("s7l3", 1)} text="ONE STORY FIRST" x={W / 2} y={640} rot={-6} size={60} color={PO} />
        </>
      );
    }
    case 8: {
      const qs = f - at("s8-q");
      const slot = f - at("s8l2", 10);
      const asked = f - at("s8l3", 20);
      const list = f - fa("s8l4", 0.7);
      return (
        <>
          {qs >= 0 && slot < 0 && (
            <Card f={qs} life={9999} style={{ top: LOW - 20, background: "#fbf3ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>
                <span style={{ color: SU }}>INTERVIEW OUTLINE · 3 QUESTIONS</span><span style={{ color: TE }}>💾 saved</span>
              </div>
              {["Where did you get lost?", "Who helped you?", "How did you feel?"].map((q, i) => (
                <div key={q} style={{ fontSize: 40, fontWeight: 900, padding: "6px 0", borderTop: `2px solid ${C.line}`, opacity: qs >= 6 + i * 12 ? 1 : 0.15,
                  fontFamily: '"Bradley Hand","Chalkboard SE",' + EN }}>{i + 1}. {q}</div>
              ))}
            </Card>
          )}
          {slot >= 0 && asked < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 33, fontSize: 40, transform: `translateX(-50%) scale(${sp(slot, { damping: 9 })}) rotate(-2deg)` }}>
              📅 Wed 16:40–16:50 · <span style={{ color: TE }}>trial unchanged</span>
            </Pill>
          )}
          <Stamp f={asked} text="ASKED FIRST ✓" x={W / 2} y={640} rot={-6} size={62} color={CL} life={list < 0 ? 9999 : fa("s8l4", 0.7) - at("s8l3", 20)} />
          {list >= 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 22, textAlign: "center", transform: `scale(${sp(list, { damping: 9 })}) rotate(-2deg)` }}>
              <span style={{ display: "inline-block", fontFamily: EN, fontWeight: 900, fontSize: 44, background: "#fff", border: "5px solid #111", borderRadius: 18,
                padding: "10px 28px", boxShadow: "8px 8px 0 #111" }}>
                Clone&apos;s equipment list: <span style={{ color: C.red }}>loading…</span> 📜📜📜
              </span>
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
  if (id === 3 && f >= s.at("s3l1", 10) && f < s.at("s3l1", 22)) {
    return <AbsoluteFill style={{ background: "#ff3b3b", opacity: interpolate(f - s.at("s3l1", 10), [0, 2, 12], [0, 0.35, 0], clamp), pointerEvents: "none" }} />;
  }
  if (id === 3 && f >= s.at("s3l2")) {
    // tunnel-vision vignette while stressed
    return <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(circle at 50% 45%, transparent 35%, rgba(120,0,0,.55) 75%)",
      opacity: 0.6 + 0.3 * Math.sin(f / 4) }} />;
  }
  if (id === 4 && f >= s.at("s4l1") && f < s.at("s4l1", 10)) {
    return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f - s.at("s4l1"), [0, 2, 10], [0, 0.5, 0], clamp), pointerEvents: "none" }} />;
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 3 && f >= s.at("s3-box")) return "saturate(.75) contrast(1.08)";
  return undefined;
};

// ---------- pieces ----------
const AddictMeter: React.FC<{ f: number }> = ({ f }) => {
  const v = interpolate(f, [0, 30], [0, 0.93], clamp);
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 22, background: "rgba(10,16,30,.88)", borderRadius: 18, padding: "16px 24px",
      border: "4px solid #ff8a70", transform: `scale(${sp(f, { damping: 12 })})`, fontFamily: "ui-monospace, Menlo, monospace", color: "#fff" }}>
      <div style={{ fontSize: 32, fontWeight: 900 }}>📱 PHONE-REACH REFLEX</div>
      <div style={{ height: 34, background: "#333", borderRadius: 17, marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: "linear-gradient(90deg,#ffd75e,#ff4d4d)" }} />
      </div>
      <div style={{ fontSize: 28, marginTop: 8, color: "#ff8a70" }}>{Math.round(v * 100)}% · status: ADDICT?</div>
    </div>
  );
};

const Deadline: React.FC<{ f: number; now: number }> = ({ f, now }) => {
  const left = 14 * 60 + 30 - now;
  return (
    <div style={{ position: "absolute", right: 190, top: 580, transform: `scale(${sp(f, { damping: 11 })})`, fontFamily: "ui-monospace, Menlo, monospace",
      background: "rgba(0,0,0,.75)", borderRadius: 16, padding: "10px 20px", color: "#fff", textAlign: "right" }}>
      <div style={{ fontSize: 44, fontWeight: 900 }}>{Math.floor(now / 60)}:{String(now % 60).padStart(2, "0")}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#ffb3c8" }}>Xiaoman leaves 14:30 · {left} min</div>
    </div>
  );
};

const CleanDream: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 120, right: 190, top: LOW + 11, transform: `scale(${sp(f, { damping: 10 })}) rotate(-2deg)`, textAlign: "center" }}>
    <div style={{ background: "linear-gradient(135deg,#bfe3ff,#e8f7ff)", border: "6px solid #fff", borderRadius: 26, padding: "40px 20px", boxShadow: "0 0 50px rgba(160,220,255,.9)",
      fontFamily: EN }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: "#2f6fd6" }}>✨ 100% CLEAR ✨</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#456", marginTop: 6 }}>(the clone&apos;s dream desktop)</div>
    </div>
  </div>
);

const DeleteBox: React.FC<{ f: number; proj: number }> = ({ f, proj }) => (
  <div style={{ position: "absolute", left: 90, right: 190, top: LOW - 30, background: "#fff", border: "4px solid #333", borderRadius: 22, padding: "20px 26px",
    fontFamily: EN, boxShadow: "0 30px 70px rgba(0,0,0,.6)", transform: `scale(${sp(f, { damping: 10 })})` }}>
    <div style={{ fontSize: 40, fontWeight: 900, color: C.ink }}>🗑 Delete 9 items?</div>
    <div style={{ fontSize: 30, fontWeight: 700, color: C.muted, marginTop: 6 }}>☑ 8 screenshots</div>
    <div style={{ fontSize: 32, fontWeight: 900, color: proj >= 0 ? C.red : C.muted, marginTop: 4, background: proj >= 0 ? `rgba(255,60,40,${0.12 + 0.1 * Math.sin(f / 3)})` : undefined,
      borderRadius: 8, padding: "2px 8px" }}>
      ☑ 📁 Radio prep project {proj >= 0 && "← OUR WORK!"}
    </div>
    <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
      <span style={{ flex: 1, textAlign: "center", fontSize: 32, fontWeight: 900, background: "#ddd", borderRadius: 12, padding: "8px 0" }}>Cancel</span>
      <span style={{ flex: 1, textAlign: "center", fontSize: 32, fontWeight: 900, background: "#2f6fd6", color: "#fff", borderRadius: 12, padding: "8px 0" }}>Delete</span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.red, marginTop: 10 }}>not confirmed yet…</div>
  </div>
);

const StressECG: React.FC<{ f: number }> = ({ f }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = i * 8;
    const ph = (i + f * 3) % 30;
    const y = 60 + (ph === 10 ? -50 : ph === 11 ? 45 : ph === 12 ? -20 : 0) + Math.sin(i / 3) * 3;
    pts.push(`${x},${y}`);
  }
  const bpm = Math.min(180, 90 + f * 2);
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 22, background: "rgba(10,10,10,.85)", borderRadius: 18, padding: "14px 20px",
      border: "4px solid #ff4d4d", transform: `scale(${sp(f, { damping: 12 })})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 32, fontWeight: 900, color: "#ff4d4d" }}>
        <span>STRESS LEVEL ▲▲▲</span><span>♥ {bpm} bpm</span>
      </div>
      <svg width="100%" height="120" viewBox="0 0 960 120" preserveAspectRatio="none">
        <polyline points={pts.join(" ")} fill="none" stroke="#7dffa0" strokeWidth="5" />
      </svg>
    </div>
  );
};

const AlertToggle: React.FC<{ f: number }> = ({ f }) => {
  const on = f < 20;
  const k = interpolate(f, [16, 24], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 160, right: 190, top: LOW - 20, background: "#f4f6fa", borderRadius: 28, padding: "20px 28px", border: "5px solid #222",
      fontFamily: EN, transform: `scale(${sp(f, { damping: 12 })})`, boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#667" }}>Xiaoshuai&apos;s phone · Settings</div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: "#222" }}>🔔 Social media alerts</span>
        <span style={{ marginLeft: "auto", width: 110, height: 60, borderRadius: 30, background: on ? "#2ecc71" : "#bbb", position: "relative" }}>
          <span style={{ position: "absolute", top: 6, left: 6 + (1 - k) * 50, width: 48, height: 48, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.3)" }} />
        </span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: TE, marginTop: 10, opacity: k }}>OFF · then screen face-down 📱⤵</div>
    </div>
  );
};

const InterruptMeter: React.FC<{ f: number; tabs: number }> = ({ f, tabs }) => {
  const n = tabs < 0 ? 7 : Math.max(0, 7 - Math.floor(tabs / 6));
  const v = interpolate(f, [0, 20], [1, 0.55], clamp) * (n / 7) * 0.9 + 0.05;
  return (
    <Card f={f} life={9999} style={{ top: LOW - 10 }}>
      <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>INTERRUPTIONS · REDUCE ▼</div>
      <div style={{ height: 36, background: "#eee", borderRadius: 18, border: "3px solid #111", marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: "linear-gradient(90deg,#2ecc71,#ffd75e,#ff4d4d)" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <span style={{ fontSize: 30, fontWeight: 800 }}>Extra tabs:</span>
        {new Array(7).fill(0).map((_, i) => (
          <span key={i} style={{ width: 54, height: 36, borderRadius: 6, border: "3px solid #333", background: i < n ? "#cfe0ff" : "transparent",
            opacity: i < n ? 1 : 0.2, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 900 }}>{i < n ? "" : "✕"}</span>
        ))}
      </div>
    </Card>
  );
};

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

