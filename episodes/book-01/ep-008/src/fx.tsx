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
      const fri = f - at("s1l1", 10);
      const lap = f - at("s1l3", 6);
      const tone = f - at("s1-tone");
      const next = f - fa("s1l4", 0.7);
      const kit = f - at("s1l5", 10);
      const spk = pt(r, 0.9, 0.84);
      return (
        <>
          {fri >= 0 && lap < 0 && (
            <Card f={fri} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>FRIDAY · PROMISES KEPT</div>
              <Check on={fri >= 30} f={fri - 30} size={36}>13:20–13:40 · move the desks</Check>
              <Check on={fri >= 60} f={fri - 60} size={36}>14:00 · English talk (given by me!)</Check>
            </Card>
          )}
          <Stamp f={f - at("s1l1", 130)} text="DID IT MYSELF" x={W / 2} y={640} rot={-6} size={60} color={XS} life={at("s1l3") - at("s1l1", 130)} />
          {lap >= 0 && tone < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 66, fontSize: 40, transform: `translateX(-50%) scale(${sp(lap, { damping: 9 })}) rotate(-2deg)` }}>
              💻 BORROWED · <span style={{ color: TE }}>school laptop</span>
            </Pill>
          )}
          {tone >= 0 && next < 0 && <Waves f={tone % 40} x={spk.x} y={spk.y} />}
          {tone >= 0 && kit < 0 && (
            <Pill style={{ left: 80, top: LOW - 60, fontSize: 40, transform: `scale(${sp(tone - 6, { damping: 9 })}) rotate(-2deg)` }}>
              ♪ TEST TONE · speaker <span style={{ color: TE }}>OK ✓</span>
            </Pill>
          )}
          {next >= 0 && kit < 0 && (
            <Pill style={{ right: 190, top: LOW + 44, fontSize: 36, transform: `scale(${sp(next, { damping: 9 })}) rotate(2deg)` }}>
              NEXT ▶ open the recording software
            </Pill>
          )}
          {kit >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 33, fontSize: 40, transform: `translateX(-50%) scale(${sp(kit, { damping: 9 })}) rotate(-2deg)` }}>
              📋 The clone&apos;s <span style={{ color: CL }}>prep checklist</span>
            </Pill>
          )}
        </>
      );
    }
    case 2: {
      const dig = f - at("s2l1", 6);
      const rec = f - at("s2-rec");
      const click = f - at("s2-click");
      const play = f - at("s2-play");
      const huh = f - at("s2l5", 4);
      const icon = pt(r, 0.62, 0.8);
      const btn = pt(r, 0.43, 0.8);
      return (
        <>
          {dig >= 0 && rec < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 55, fontSize: 40, transform: `translateX(-50%) scale(${sp(dig, { damping: 9 })})` }}>
              🎙 → 0101 → 📁 <span style={{ color: CL }}>digital recording</span>
            </Pill>
          )}
          {rec >= 0 && f < at("s2l3", 10) && <RecPanel f={rec} />}
          {click >= 0 && play < 20 && <Cursor f={click} a={btn} b={icon} />}
          {click >= 4 && play < 0 && (
            <div style={{ position: "absolute", left: icon.x - 40, top: icon.y - 150, fontFamily: EN, fontWeight: 900, fontSize: 40, color: "#fff",
              textShadow: "0 3px 8px #000", opacity: interpolate(click, [4, 8, 20, 26], [0, 1, 1, 0], clamp) }}>click?</div>
          )}
          {play >= 0 && huh < 30 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 66, textAlign: "center", transform: `scale(${sp(play, { damping: 10 })})` }}>
              <span style={{ display: "inline-block", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 900, fontSize: 46, color: "#ff8a70",
                background: "rgba(0,0,0,.8)", borderRadius: 12, padding: "8px 26px" }}>
                ▶ PLAYING… {Math.floor(play / 15) % 2 ? "🔇" : "· · ·"} 0 dB
              </span>
            </div>
          )}
          <Burst f={huh} text="?!" size={190} life={40} color={CL} style={{ right: 190, top: 610 }} />
        </>
      );
    }
    case 3: {
      const list = f - at("s3-list");
      const block = f - at("s3l2", 8);
      const see = f - at("s3l3", 10);
      const ITEMS = ["💻 New laptop", "🎧 Headphones", "🔌 Adapters", "🎛 Mixer"];
      const total = Math.floor(interpolate(list, [0, 40], [0, 19999], clamp));
      return (
        <>
          {list >= 0 && block < 0 && (
            <Card f={list} life={9999} style={{ top: LOW - 30, background: "#fff9e6" }}>
              <div style={{ fontSize: 28, color: CL, fontWeight: 900, letterSpacing: 2 }}>CLONE&apos;S UPGRADE IDEAS · 2 PAGES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
                {ITEMS.map((t, i) => (
                  <span key={t} style={{ fontSize: 34, fontWeight: 800, background: "#fff", border: "3px solid #111", borderRadius: 30, padding: "4px 18px",
                    transform: `scale(${list >= i * 10 ? sp(list - i * 10, { damping: 7 }) : 0})` }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 12, fontFamily: "ui-monospace, Menlo, monospace" }}>TOTAL: ¥{total.toLocaleString("en-US")}?!</div>
            </Card>
          )}
          <Stamp f={list - 44} text="IDEAS ONLY · NOTHING BOUGHT" x={W / 2} y={640} rot={-5} size={46} color={C.blue} life={at("s3l2", 8) - at("s3-list") - 44} />
          {block >= 0 && see < 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 22, textAlign: "center", transform: `scale(${sp(block, { damping: 8 })})` }}>
              <span style={{ display: "inline-block", fontFamily: EN, fontWeight: 900, fontSize: 60, color: "#111", background: C.yellow, border: "6px solid #111",
                padding: "10px 34px", transform: "rotate(-3deg)", boxShadow: "8px 8px 0 #111" }}>⚠ SCREEN BLOCKED</span>
            </div>
          )}
          {see >= 0 && (
            <Card f={see} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>WHAT XIAOMAN CAN SEE</div>
              <Check on f={see} size={36}>What he wants to buy</Check>
              <Check on={see >= 20} f={see - 20} size={36} bad>What went wrong</Check>
            </Card>
          )}
        </>
      );
    }
    case 4: {
      const vis = f - at("s4-open", 4);
      const q = f - at("s4l2", 10);
      const look = f - at("s4-look");
      const icon = pt(r, 0.59, 0.82);
      return (
        <>
          {vis >= 0 && q < 0 && (
            <Pill style={{ left: 80, top: LOW + 66, fontSize: 40, transform: `scale(${sp(vis, { damping: 9 })}) rotate(-2deg)` }}>
              SCREEN: <span style={{ color: TE }}>VISIBLE ✓</span>
            </Pill>
          )}
          {q >= 0 && <DrawCircle f={q} x={icon.x} y={icon.y} rad={r.w * 0.035} label={look >= 0 ? "FUNCTION = ?" : "THIS ICON?"} above />}
          {look >= 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", fontFamily: EN, fontWeight: 900, fontSize: 52, color: "#fff",
              textShadow: "0 4px 12px #000", letterSpacing: 4, opacity: interpolate(look, [0, 8], [0, 1], clamp) }}>
              🔍 INVESTIGATION MODE
            </div>
          )}
        </>
      );
    }
    case 5: {
      const icon = f - at("s5-icon");
      const me = f - at("s5l2", 4);
      const facts = f - at("s5l3", 20);
      const scale = f - at("s5l4", 10);
      const ic = pt(r, 0.745, 0.585);
      return (
        <>
          {icon >= 0 && me < 0 && <DrawCircle f={icon} x={ic.x} y={ic.y} rad={r.w * 0.04} label="MUTED 🔇" />}
          <Burst f={me} text="IT WAS ME!" size={110} life={60} color={XS} style={{ left: 70, top: 610 }} />
          {facts >= 0 && scale < 0 && (
            <Card f={facts} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: AD, fontWeight: 900, letterSpacing: 2 }}>THE ADVISER CHECKS</div>
              <Check on f={facts} size={34}>Recording: still there, not deleted</Check>
              <Check on={f >= fa("s5l3", 0.55)} f={f - fa("s5l3", 0.55)} size={34} bad>Playback: this track muted</Check>
              <Check on={f >= fa("s5l3", 0.85)} f={f - fa("s5l3", 0.85)} size={34}>Mic + speaker + cable: fine</Check>
            </Card>
          )}
          {scale >= 0 && <Balance f={scale} />}
        </>
      );
    }
    case 6: {
      const pro = f - at("s6l1", 8);
      const un = f - at("s6-unmute");
      const play = f - at("s6-play");
      const same = f - at("s6l3", 10);
      const note = f - at("s6l4", 20);
      const spk = pt(r, 0.95, 0.75);
      return (
        <>
          {pro >= 0 && un < 0 && (
            <Pill style={{ left: W / 2, top: LOW + 55, fontSize: 40, transform: `translateX(-50%) scale(${sp(pro, { damping: 9 })}) rotate(-2deg)` }}>
              🎓 professional guidance: <span style={{ color: AD }}>step by step</span>
            </Pill>
          )}
          {un >= 0 && same < 0 && <Unmute f={un} />}
          {play >= 0 && same < 0 && <Waves f={play % 36} x={spk.x} y={spk.y} />}
          {same >= 0 && note < 0 && (
            <Card f={same} life={9999} style={{ top: LOW - 20 }}>
              <div style={{ fontSize: 28, color: TE, fontWeight: 900, letterSpacing: 2 }}>SAME CLIP, NOW AUDIBLE</div>
              <Check on f={same} size={34}>No new laptop</Check>
              <Check on={same >= 8} f={same - 8} size={34}>No new cable</Check>
              <Check on={same >= 16} f={same - 16} size={34}>No re-recording</Check>
            </Card>
          )}
          {note >= 0 && (
            <Card f={note} life={9999} style={{ top: LOW - 20, background: "#fbf3ff" }}>
              <div style={{ fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>XIAOMAN&apos;S NOTE · CHECK FIRST NEXT TIME</div>
              <div style={{ fontSize: 44, fontWeight: 900, marginTop: 8, fontFamily: '"Bradley Hand","Chalkboard SE",' + EN }}>① Is the track muted? 🔇</div>
            </Card>
          )}
        </>
      );
    }
    case 7: {
      const hw = f - at("s7l1", 10);
      const cancel = f - at("s7l2", 60);
      const save = f - at("s7l3", 30);
      const slot = f - fa("s7l4", 0.55);
      return (
        <>
          {hw >= 0 && save < 0 && (
            <Card f={hw} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>HARDWARE WE ALREADY HAVE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                {["💻 laptop (borrowed)", "🎙 mic", "🔈 speaker", "🎧 headphones (room's)"].map((t, i) => (
                  <span key={t} style={{ fontSize: 32, fontWeight: 800, border: `3px solid ${TE}`, borderRadius: 30, padding: "4px 16px", color: TE,
                    opacity: hw >= i * 8 ? 1 : 0 }}>✓ {t}</span>
                ))}
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, marginTop: 12, fontFamily: "ui-monospace, Menlo, monospace" }}>
                New purchases: 0 · Spent: <span style={{ color: TE }}>¥0</span>
              </div>
            </Card>
          )}
          <Stamp f={cancel} text="PAGE 3: CANCELLED" x={W / 2} y={640} rot={-6} size={54} color={CL} life={at("s7l3") - at("s7l2", 60)} />
          {save >= 0 && slot < 0 && <SaveDialog f={save} />}
          {slot >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 44, fontSize: 42, transform: `translateX(-50%) scale(${sp(slot, { damping: 9 })}) rotate(-2deg)` }}>
              📅 Wed 16:40–16:50 · <span style={{ color: TE }}>still ours</span>
            </Pill>
          )}
        </>
      );
    }
    case 8: {
      const box = f - at("s8l1", 20);
      const plan = f - at("s8l2", 10);
      const split = f - at("s8l3", 10);
      const clues = f - at("s8l4", 20);
      return (
        <>
          {box >= 0 && plan < 0 && <SearchBox f={box} typeAt={at("s8-type") - at("s8l1", 20)} />}
          {plan >= 0 && split < 0 && (
            <Card f={plan} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>TOPIC: HELP ON YOUR FIRST DAY</div>
              <Check on f={plan} size={34}>① Search for question ideas</Check>
              <Check on={f >= fa("s8l2", 0.35)} f={f - fa("s8l2", 0.35)} size={34}>② Decide who to really ask</Check>
              <Check on={f >= fa("s8l2", 0.5)} f={f - fa("s8l2", 0.5)} size={34}>③ …and what to ask</Check>
            </Card>
          )}
          {split >= 0 && clues < 0 && (
            <div style={{ position: "absolute", left: 80, right: 190, top: LOW, display: "flex", gap: 18, transform: `scale(${sp(split, { damping: 11 })})` }}>
              {([["ENGINE", "finds information", "#4a7bd0"], ["US", "understand + choose", TE]] as [string, string, string][]).map(([a, b, c], i) => (
                <div key={a} style={{ flex: 1, background: "#fff", border: `5px solid ${c}`, borderRadius: 18, padding: "16px 20px", textAlign: "center",
                  fontFamily: EN, opacity: split >= i * 20 ? 1 : 0, boxShadow: "0 16px 40px rgba(0,0,0,.4)" }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: c }}>{a}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: C.ink }}>{b}</div>
                </div>
              ))}
            </div>
          )}
          {clues >= 0 && (
            <Card f={clues} life={9999} style={{ top: LOW - 20, textAlign: "center" }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>ONE USEFUL CLUE EACH</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 10 }}>
                {([["Xiaoshuai", XS], ["Xiaoman", SU], ["Clone", CL]] as [string, string][]).map(([n, c], i) => (
                  <span key={n} style={{ fontSize: 32, fontWeight: 900, color: "#fff", background: c, borderRadius: 30, padding: "6px 20px",
                    transform: `scale(${sp(clues - i * 8, { damping: 8 })})` }}>{n} 📝 1</span>
                ))}
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, marginTop: 12, opacity: f >= fa("s8l4", 0.6) ? 1 : 0 }}>
                prep list <span style={{ color: C.red }}>≤</span> content
              </div>
            </Card>
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
  if (id === 5 && f >= s.at("s5-icon") && f < s.at("s5-icon", 10)) {
    return <AbsoluteFill style={{ background: "#ff3b3b", opacity: interpolate(f - s.at("s5-icon"), [0, 2, 10], [0, 0.3, 0], clamp), pointerEvents: "none" }} />;
  }
  if (id === 4 && f >= s.at("s4-look") && f < s.at("s4-end")) {
    // magnifier vignette while everyone stares at the screen
    return <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(circle at 50% 50%, transparent 32%, rgba(0,0,0,.55) 60%)",
      opacity: interpolate(f - s.at("s4-look"), [0, 10], [0, 1], clamp) }} />;
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 2 && f >= s.at("s2-play") && f < s.at("s2l5")) return "saturate(.65) brightness(.9)";
  return undefined;
};

// ---------- pieces ----------
const RecPanel: React.FC<{ f: number }> = ({ f }) => {
  const secs = Math.min(3, Math.floor(f / 30));
  const bars = 36;
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 22, background: "rgba(10,16,30,.88)", borderRadius: 18, padding: "16px 22px",
      border: "4px solid #ff4d4d", transform: `scale(${sp(f, { damping: 12 })})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 34, fontWeight: 900, color: "#fff" }}>
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#ff4d4d", opacity: Math.floor(f / 10) % 2 ? 1 : 0.3 }} />
        REC 00:0{secs}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 90, marginTop: 8 }}>
        {new Array(bars).fill(0).map((_, i) => {
          const on = i < (f / 3);
          const h = on ? 12 + 70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) : 4;
          return <div key={i} style={{ flex: 1, height: h, background: "#7fb4ff", borderRadius: 3 }} />;
        })}
      </div>
    </div>
  );
};

const Cursor: React.FC<{ f: number; a: { x: number; y: number }; b: { x: number; y: number } }> = ({ f, a, b }) => {
  // first tap lands on the mute icon (oops), second on play
  const p1 = interpolate(f, [0, 4], [0, 1], clamp);
  const p2 = interpolate(f, [8, 18], [0, 1], clamp);
  const x = b.x + (a.x - b.x) * p2 + (1 - p1) * 160;
  const y = b.y + (a.y - b.y) * p2 + (1 - p1) * -120;
  const tap = (f >= 4 && f < 8) || (f >= 18 && f < 22);
  return (
    <svg width="70" height="90" viewBox="0 0 24 30" style={{ position: "absolute", left: x - 6, top: y - 4, transform: `scale(${tap ? 0.85 : 1})` }}>
      <path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

const Balance: React.FC<{ f: number }> = ({ f }) => {
  const tilt = interpolate(f, [10, 30], [0, 10], clamp) + Math.sin(f / 6) * 1.2 * (f > 30 ? 1 : 0);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 10, display: "flex", justifyContent: "center", transform: `scale(${sp(f, { damping: 11 })})` }}>
      <div style={{ position: "relative", width: 900, height: 330, background: "rgba(10,16,30,.72)", borderRadius: 24, padding: 20 }}>
        <div style={{ position: "absolute", left: 420, top: 90, width: 20, height: 210, background: "#444", borderRadius: 6 }} />
        <div style={{ position: "absolute", left: 30, right: 30, top: 80, height: 14, background: "#333", borderRadius: 7, transform: `rotate(${tilt}deg)` }}>
          {[["📄📄", "2 pages of upgrades", 0], ["🔇", "1 tiny icon", 1]].map(([e, t, i]) => (
            <div key={String(t)} style={{ position: "absolute", [i ? "right" : "left"]: -10, top: 14, width: 330, textAlign: "center", transform: `rotate(${-tilt}deg)` }}>
              <div style={{ fontSize: 70 }}>{e}</div>
              <div style={{ fontFamily: EN, fontSize: 32, fontWeight: 900, color: "#fff", background: i ? C.red : "#666", borderRadius: 12, padding: "4px 10px" }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -50, textAlign: "center", fontFamily: EN, fontWeight: 900, fontSize: 40, color: "#fff",
          textShadow: "0 3px 10px #000", opacity: interpolate(f, [30, 38], [0, 1], clamp) }}>the real culprit ↘</div>
      </div>
    </div>
  );
};

const Unmute: React.FC<{ f: number }> = ({ f }) => {
  const on = f >= 12;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 20, textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 30, background: "#fff", border: "6px solid #111", borderRadius: 30, padding: "16px 40px",
        boxShadow: "10px 10px 0 #111", transform: `scale(${sp(f, { damping: 10 }) * (on ? 1 + 0.08 * Math.max(0, 1 - (f - 12) / 10) : 1)})` }}>
        <span style={{ fontSize: 110, filter: on ? undefined : "grayscale(1)" }}>{on ? "🔊" : "🔇"}</span>
        <div style={{ textAlign: "left", fontFamily: EN }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: on ? TE : C.red }}>{on ? "TRACK UNMUTED" : "TRACK MUTED"}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: CL }}>the clone clicks · the adviser guides</div>
        </div>
      </div>
    </div>
  );
};

const SaveDialog: React.FC<{ f: number }> = ({ f }) => {
  const prog = interpolate(f, [4, 30], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 120, right: 190, top: LOW - 10, background: "#f4f6fa", border: "4px solid #333", borderRadius: 16, overflow: "hidden",
      fontFamily: EN, boxShadow: "0 24px 60px rgba(0,0,0,.5)", transform: `scale(${sp(f, { damping: 12 })})` }}>
      <div style={{ background: "#dfe4ec", padding: "8px 16px", display: "flex", gap: 8 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />)}
      </div>
      <div style={{ padding: "18px 26px" }}>
        <div style={{ fontSize: 34, fontWeight: 900, color: C.ink }}>💾 test_clip_01 · saved by Xiaoman</div>
        <div style={{ height: 22, background: "#ccd", borderRadius: 11, marginTop: 14, overflow: "hidden" }}>
          <div style={{ width: `${prog * 100}%`, height: "100%", background: TE }} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: TE, marginTop: 10, opacity: prog >= 1 ? 1 : 0 }}>✓ Saved. Next: what we actually want to say.</div>
      </div>
    </div>
  );
};

const QUERY = "first day at a new school · interview question ideas";
const SearchBox: React.FC<{ f: number; typeAt: number }> = ({ f, typeAt }) => {
  const n = Math.floor(interpolate(f, [0, typeAt + 40], [0, QUERY.length], clamp));
  const results = f - typeAt;
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 40, background: "#fff", border: "4px solid #333", borderRadius: 20, padding: "20px 24px",
      fontFamily: EN, boxShadow: "0 24px 60px rgba(0,0,0,.5)", transform: `scale(${sp(f, { damping: 12 })})` }}>
      <div style={{ display: "flex", alignItems: "center", border: "4px solid #4a7bd0", borderRadius: 40, padding: "8px 18px", gap: 12 }}>
        <span style={{ flex: 1, fontSize: 32, fontWeight: 700, color: "#222", whiteSpace: "nowrap", overflow: "hidden" }}>
          {QUERY.slice(0, n)}<span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>
        </span>
        <span style={{ fontSize: 34, background: "#4a7bd0", borderRadius: 20, padding: "2px 12px" }}>🔍</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginTop: 14, opacity: results >= 40 + i * 6 ? 1 : 0 }}>
          <div style={{ width: 50, height: 50, background: "#9db8ea", borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 16, width: `${80 - i * 12}%`, background: "#4a7bd0", borderRadius: 8 }} />
            <div style={{ height: 12, width: `${95 - i * 8}%`, background: "#ccd6ea", borderRadius: 6, marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
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

