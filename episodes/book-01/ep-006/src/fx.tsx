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
    <div style={{ position: "absolute", [side]: side === "right" ? 190 : 30, top, transform: `translateX(${dir * ((1 - k) * 800 + out * 800)}px)`, fontFamily: EN, textAlign: side }}>
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
const TE = "#2d7d4f"; // teacher

const pt = (r: Rect, x: number, y: number) => ({ x: r.x + x * r.w, y: r.y + y * r.h });
const fade = (f: number, a: number, b: number) => Math.min(interpolate(f, [a, a + 6], [0, 1], clamp), interpolate(f, [b - 6, b], [1, 0], clamp));

// ---------- per-scene effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f, r }) => {
  const at = s.at;
  const fa = (id: string, p: number) => atFrac(s, id, p);
  switch (s.scene.id) {
    case 1: {
      const me = f - at("s1l1", 6);
      const her = f - at("s1l2", 6);
      const ten = f - at("s1l3", 4);
      const pocket = f - at("s1n2");
      return (
        <>
          <NameCard f={me} life={80} name="Xiaoshuai" desc="Red shirt · the real one · telling this story" color={XS} side="left" top={LOW + 28} />
          <NameCard f={her} life={88} name="Su Xiaoman" desc="Classmate · has a radio plan" color={SU} side="right" top={LOW + 28} />
          {ten >= 0 && pocket < 0 && (
            <Card f={ten} life={9999} style={{ textAlign: "center", top: LOW - 10 }}>
              <div style={{ fontSize: 30, color: C.muted, fontWeight: 800 }}>LUNCH BREAK · RESERVED FOR</div>
              <div style={{ fontSize: 50, fontWeight: 900, color: SU, margin: "4px 0 14px" }}>Xiaoman&apos;s whole plan</div>
              <Digits text="10:00" color="#ffd75e" size={96} />
              <div style={{ fontSize: 30, fontWeight: 800, color: C.red, marginTop: 12, opacity: f >= fa("s1l3", 0.7) ? 1 : 0 }}>no countdown · no rushing</div>
            </Card>
          )}
          {pocket >= 0 && <PocketWatch f={pocket} />}
        </>
      );
    }
    case 2: {
      const air = f - fa("s2l1", 0.1);
      const voices = f - at("s2-voices");
      const q = f - at("s2n1", 4);
      const after = f - fa("s2l3", 0.55);
      return (
        <>
          {air >= 0 && q < 0 && <OnAir f={air} />}
          {voices >= 0 && q < 0 && <QuietVoices f={voices} />}
          {q >= 0 && after < 0 && (
            <Card f={q} life={9999} style={{ top: LOW - 20, background: "#fbf3ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: SU, fontWeight: 900, letterSpacing: 2 }}>
                <MicIcon size={44} /> SHOW #1 · ONE SHORT EPISODE
              </div>
              {f < at("s2n2", 10) ? (
                <div style={{ fontSize: 46, fontWeight: 900, marginTop: 8, lineHeight: 1.25 }}>
                  One short radio show <span style={{ color: C.muted, fontSize: 36 }}>· not a whole day</span></div>
              ) : (
                <div style={{ fontSize: 46, fontWeight: 900, marginTop: 8, lineHeight: 1.25, opacity: interpolate(f - at("s2n2", 10), [0, 6], [0, 1], clamp) }}>
                  “What helped you on your first day?”</div>
              )}
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12, color: C.blue, opacity: f >= at("s2l2", 20) ? 1 : 0 }}>
                ① our own stories first &nbsp;② then anyone who wants to share
              </div>
            </Card>
          )}
          {after >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 33, transform: `translateX(-50%) scale(${sp(after, { damping: 9 })}) rotate(-2deg)`, fontSize: 44 }}>
              After school → <span style={{ color: TE }}>ask the teacher</span>
            </Pill>
          )}
        </>
      );
    }
    case 3: {
      const teach = f - at("s3l1", 8);
      const mum = f - at("s3n2");
      const clone = f - at("s3l2", 4);
      const unfold = f - at("s3n3");
      const floor = fa("s3n3", 0.85) - at("s3n3");
      const huh = f - at("s3l3", 4);
      const one = f - at("s3l4", 20);
      return (
        <>
          <NameCard f={teach} life={95} name="Head Teacher" desc="Here for the whole meeting" color={TE} side="left" top={LOW + 28} />
          {mum >= 0 && clone < 0 && <MumChat f={mum} />}
          <NameCard f={clone} life={92} name="The Clone" desc="Blue shirt · Mum said OK · this meeting only" color={CL} side="right" top={LOW + 28} />
          {unfold >= 0 && one < 0 && <Unroll f={unfold} floor={floor} />}
          <Burst f={huh} text="?!" size={200} life={46} color={XS} style={{ left: 120, top: 610 }} />
          {one >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 44, transform: `translateX(-50%) scale(${sp(one, { damping: 9 })}) rotate(2deg)`, fontSize: 46 }}>
              We said: <span style={{ color: SU }}>ONE</span> show.
            </Pill>
          )}
        </>
      );
    }
    case 4: {
      const prog = f - at("s4l1", 14);
      const circle = f - at("s4n1", 2);
      const delays = [0, 0.24, 0.48].map((x) => fa("s4l1", x) - at("s4l1", 14));
      const target = f - at("s4l2", 6);
      const longer = f - at("s4l3", 12);
      const fold = f - fa("s4l4", 0.6);
      const c = pt(r, 0.203, 0.337);
      return (
        <>
          {prog >= 0 && circle < 14 && <ProgramTiles f={prog} grey={circle} delays={delays} />}
          {circle >= 0 && target < 0 && <DrawCircle f={circle} x={c.x} y={c.y} rad={r.w * 0.045} />}
          {target >= 0 && longer < 0 && <TargetBoard f={target} />}
          {longer >= 0 && fold < 0 && <LengthBars f={longer} />}
          {fold >= 0 && (
            <Pill style={{ left: W / 2, top: LOW + 44, transform: `translateX(-50%) scale(${sp(fold, { damping: 9 })}) rotate(-2deg)`, fontSize: 44 }}>
              The rest of the day: <span style={{ color: CL }}>folded away</span>
            </Pill>
          )}
        </>
      );
    }
    case 5: {
      const who = f - at("s5l1", 2);
      const q = f - at("s5-q");
      const board = f - at("s5n1");
      const heads: [number, number, string, number][] = [[0.11, 0.17, SU, 0], [0.38, 0.14, XS, 5], [0.66, 0.14, CL, 10]];
      return (
        <>
          <Burst f={who} text="WHO?" size={150} life={40} color={TE} style={{ right: 190, top: 600 }} />
          {q >= 0 && board < -6 && heads.map(([x, y, col, d], i) => {
            const p = pt(r, x, y);
            const k = sp(q - d, { damping: 7 });
            return (
              <div key={i} style={{ position: "absolute", left: p.x, top: p.y, transform: `translate(-50%,-100%) scale(${k})`, fontFamily: EN, fontWeight: 900,
                fontSize: 120, color: col, WebkitTextStroke: "6px #fff", paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(0,0,0,.4)" }}>!</div>
            );
          })}
          {board >= 0 && (
            <Card f={board} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: C.muted, fontWeight: 800 }}>
                <span>WHO ORGANISES WHAT</span><span style={{ color: C.red }}>draft · confirm next time</span>
              </div>
              <Role on={f >= at("s5n1", 16)} f={f - at("s5n1", 16)} who="Xiaoman" color={SU} job="stories + scripts" />
              <Role on={f >= at("s5n2", 16)} f={f - at("s5n2", 16)} who="Xiaoshuai" color={XS} job="people + time + role list" />
              <Role on={f >= at("s5n3", 16)} f={f - at("s5n3", 16)} who="Clone" color={CL} job="sound check (to learn)" />
            </Card>
          )}
          <Stamp f={f - at("s5-end")} text="DRAFT" x={W - 230} y={LOW + 182} rot={-12} size={64} color={C.red} />
        </>
      );
    }
    case 6: {
      const drop = f - at("s6-open", 2);
      const stats = f - at("s6l1", 16);
      const hmm = f - at("s6-hmm");
      const confess = f - at("s6n1");
      const list = f - at("s6l3", 10);
      return (
        <>
          {drop >= 0 && stats < 0 && (
            <Pill style={{ left: 80, top: LOW + 66, transform: `scale(${sp(drop, { damping: 8 })}) rotate(-3deg)` }}>
              <MicIcon size={34} /> Equipment manual <span style={{ color: C.muted }}>(still closed)</span>
            </Pill>
          )}
          {stats >= 0 && list < 0 && <StatsPanel f={stats} confess={confess} hmm={hmm} />}
          {hmm >= 0 && confess < 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", fontFamily: EN, fontSize: 130, fontWeight: 900, color: "#fff",
              textShadow: "0 6px 18px #000", letterSpacing: 20 }}>
              {".".repeat(Math.min(3, 1 + Math.floor(hmm / 8)))}
            </div>
          )}
          <Stamp f={f - fa("s6l2", 0.45)} text="SAME FACE ≠ SAME SKILLS" x={490} y={LOW + 280} rot={-4} size={38} color={C.blue} life={70} />
          {list >= 0 && (
            <Card f={list} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: TE }}>CAN DO ✓</div>
                  <div style={{ fontSize: 34, fontWeight: 800 }}>ideas · topics · timing</div>
                </div>
                <div style={{ width: 4, background: C.line }} />
                <div style={{ flex: 1, opacity: f >= fa("s6l3", 0.35) ? 1 : 0.15 }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: C.red }}>NEED TO LEARN ✎</div>
                  <div style={{ fontSize: 34, fontWeight: 800 }}>controls · sound check</div>
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.blue, borderTop: `2px solid ${C.line}`, marginTop: 14, paddingTop: 10, opacity: f >= fa("s6l3", 0.75) ? 1 : 0 }}>
                Next time: equipment test with the teacher
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: XS, opacity: f >= at("s6l4", 20) ? 1 : 0, fontFamily: '"Bradley Hand","Chalkboard SE",' + EN }}>
                + all of us: write down what we must learn
              </div>
            </Card>
          )}
        </>
      );
    }
    case 7: {
      const sheet = f - at("s7l1", 20);
      const callback = f - fa("s7l3", 0.45);
      const ask = f - at("s7l4", 10);
      const strike = f - at("s7n2", 6);
      return (
        <>
          {sheet >= 0 && (
            <Card f={sheet} life={9999} style={{ top: LOW - 30, background: "#fffbe8" }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>TRIAL SHOW · TAKING PART IS <span style={{ color: TE }}>VOLUNTARY</span></div>
              <Check on={f >= at("s7l2", 6)} f={f - at("s7l2", 6)} size={36}>Su Xiaoman — her own choice ✋</Check>
              <Check on={f >= at("s7l3", 6)} f={f - at("s7l3", 6)} size={36}>Clone — only himself ✋</Check>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, padding: "8px 0", borderTop: `2px solid ${C.line}`, fontSize: 36, fontWeight: 800, color: C.muted }}>
                <span style={{ width: 50, height: 50, border: `4px dashed ${C.muted}`, borderRadius: 8 }} />
                {f >= at("s7l4", 30) ? <span style={{ color: TE }}>Anyone else: ask them first</span> : <span>The whole class</span>}
                {strike >= 0 && f < at("s7l4", 30) && (
                  <span style={{ position: "absolute", left: 60, top: "50%", height: 7, background: C.red, borderRadius: 4,
                    width: interpolate(strike, [0, 10], [0, 290], clamp) }} />
                )}
              </div>
            </Card>
          )}
          {callback >= 0 && ask < 0 && (
            <Pill style={{ left: W / 2, top: LOW - 150, fontSize: 34, transform: `translateX(-50%) scale(${sp(callback, { damping: 9 })}) rotate(-2deg)` }}>
              Ep.4: “<span style={{ color: C.red }}>WE</span> volunteer!” → today: “just <span style={{ color: CL }}>me</span>”
            </Pill>
          )}
          <Stamp f={f - fa("s7l4", 1)} text="ASK FIRST ✓" x={W - 260} y={LOW - 110} rot={-8} size={58} color={TE} />
        </>
      );
    }
    case 8: {
      const board = f - at("s8n1", 6);
      const quiet = f - at("s8-quiet");
      const inner = f - at("s8n4");
      const c = pt(r, 0.714, 0.623);
      return (
        <>
          {board >= 0 && quiet < 0 && (
            <Card f={board} life={9999} style={{ top: LOW - 30 }}>
              <div style={{ fontSize: 28, color: C.muted, fontWeight: 900, letterSpacing: 2 }}>WHERE WE ARE NOW</div>
              <Check on={f >= fa("s8n1", 0.6)} f={f - fa("s8n1", 0.6)} size={32}>10-min trial: OK in principle (not on air yet)</Check>
              <Status on={f >= at("s8n2", 10)} text="Written roles + equipment check: next" />
              <Status on={f >= at("s8n3", 6)} text="Trial date: after the check" />
            </Card>
          )}
          <Stamp f={f - fa("s8n1", 0.95)} text="APPROVED IN PRINCIPLE" x={W / 2} y={660} rot={-6} size={52} color={TE} life={at("s8l1", 20) - fa("s8n1", 0.95)} />
          <Burst f={f - at("s8l1", 30)} text="NEXT STEP ✓" size={86} life={50} color={SU} style={{ left: 70, top: 610 }} />
          {f >= at("s8l2", 10) && quiet < 0 && (
            <Pill style={{ right: 190, top: LOW - 150, fontSize: 36, transform: `scale(${sp(f - at("s8l2", 10), { damping: 9 })}) rotate(2deg)` }}>
              Evening music: <span style={{ color: CL }}>folded</span>
            </Pill>
          )}
          {quiet >= 0 && inner < 30 && <DrawCircle f={quiet} x={c.x} y={c.y} rad={r.w * 0.055} label="1 BOX · 10 MIN" />}
        </>
      );
    }
    default:
      return null;
  }
};

export const TopFX: React.FC<{ s: SceneT; f: number }> = ({ s, f }) => {
  const id = s.scene.id;
  const floor = id === 3 ? atFrac(s, "s3n3", 0.85) : 0;
  if (id === 3 && f >= floor && f < floor + 10) {
    return <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f - floor, [0, 2, 10], [0, 0.5, 0], clamp), pointerEvents: "none" }} />;
  }
  if (id === 4 && f >= s.at("s4n1") && f < s.at("s4l2")) {
    // speed lines that freeze the clone's list while the pen circles one box
    const d = f - s.at("s4n1");
    const len = s.at("s4l2") - s.at("s4n1");
    return (
      <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(d, [0, 4, len - 10, len], [0, 0.5, 0.5, 0], clamp),
        background: "repeating-conic-gradient(from 0deg at 50% 45%, rgba(255,255,255,.0) 0deg 4deg, rgba(255,255,255,.55) 4deg 5deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 45%, transparent 30%, #000 70%)" }} />
    );
  }
  if (id === 8 && f >= s.at("s8n4") - 30) {
    // letterbox closes in for the final inner line
    const k = interpolate(f - (s.at("s8n4") - 30), [0, 20], [0, 1], clamp);
    return (
      <>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120 * k, background: "#000" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60 * k, background: "#000" }} />
      </>
    );
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 6 && f >= s.at("s6-hmm") && f < s.at("s6n1")) return "saturate(.6) brightness(.85)";
  if (s.scene.id === 8 && f >= s.at("s8-quiet")) return "saturate(.85) brightness(.96)";
  return undefined;
};

// ---------- pieces ----------
const MicIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: "middle" }}>
    <rect x="9" y="2" width="6" height="12" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const PocketWatch: React.FC<{ f: number }> = ({ f }) => {
  const drop = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: (t) => t * t });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 40, height: 460, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 360, height: 460, overflow: "hidden" }}>
        <svg width="200" height="230" viewBox="0 0 100 115" style={{ position: "absolute", left: 80, top: -40 + drop * 260, transform: `rotate(${drop * 25}deg)` }}>
          <rect x="42" y="2" width="16" height="12" rx="3" fill="#222" />
          <circle cx="50" cy="65" r="44" fill="#222" stroke="#555" strokeWidth="5" />
          <circle cx="50" cy="65" r="34" fill="#cfe8d6" />
          <path d="M50 65 L50 40" stroke="#111" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: 30, right: 30, top: 250, height: 200, background: "#2f3640", borderRadius: "10px 10px 60px 60px",
          border: "5px solid #111", boxShadow: "inset 0 14px 0 #3e4754" }}>
          <div style={{ textAlign: "center", fontFamily: EN, fontWeight: 900, color: "#fff", fontSize: 32, marginTop: 70, opacity: 0.85 }}>POCKET</div>
        </div>
      </div>
      <Stamp f={f - 14} text="NO RUSH TODAY" x={W / 2} y={70} rot={-7} size={60} color={C.red} />
    </div>
  );
};

const OnAir: React.FC<{ f: number }> = ({ f }) => {
  const glow = 0.75 + 0.25 * Math.sin(f / 4);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center", transform: `scale(${sp(f, { damping: 9 })})` }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 18, fontFamily: EN, fontWeight: 900, fontSize: 80, letterSpacing: 8, color: "#fff",
        background: "#d8322a", border: "6px solid #111", borderRadius: 18, padding: "6px 40px", boxShadow: `0 0 ${50 * glow}px rgba(255,60,40,${glow})` }}>
        <MicIcon size={70} color="#fff" /> ON AIR
      </span>
    </div>
  );
};

const QuietVoices: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 80, right: 190, top: LOW + 22, display: "flex", justifyContent: "center", gap: 26 }}>
    {["hi…", "me too", "♪", "thanks!"].map((t, i) => {
      const d = f - i * 8;
      const spoke = d >= 0;
      return (
        <div key={i} style={{ textAlign: "center", transform: `scale(${0.85 + 0.15 * sp(f + 6)})` }}>
          <div style={{ fontFamily: EN, fontWeight: 900, fontSize: 34, background: spoke ? "#fff" : "rgba(255,255,255,.4)", border: "4px solid #111",
            borderRadius: 24, padding: "6px 16px", marginBottom: 10, transform: `scale(${spoke ? sp(d, { damping: 7 }) : 0.8})`, color: spoke ? SU : "#999" }}>
            {spoke ? t : "…"}
          </div>
          <svg width="150" height="130" viewBox="0 0 60 52">
            <circle cx="30" cy="16" r="13" fill="#3a3f4a" />
            <path d="M6 52 Q6 30 30 30 Q54 30 54 52 Z" fill="#3a3f4a" />
          </svg>
        </div>
      );
    })}
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: EN, fontSize: 40, fontWeight: 900, color: "#fff",
      textShadow: "0 3px 10px #000", opacity: interpolate(f, [26, 34], [0, 1], clamp) }}>
      quiet students: 🔇 → 🔊
    </div>
  </div>
);

const MumChat: React.FC<{ f: number }> = ({ f }) => {
  const k = sp(f, { damping: 13 });
  return (
    <div style={{ position: "absolute", left: 150, right: 190, top: LOW - 30, background: "#111", borderRadius: 40, padding: 18, border: "6px solid #333",
      transform: `translateY(${(1 - k) * 500}px) rotate(-2deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
      <div style={{ background: "#ece5dd", borderRadius: 26, padding: "18px 22px", fontFamily: EN }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#555", textAlign: "center", marginBottom: 12 }}>Mum</div>
        <div style={{ display: "inline-block", background: "#fff", borderRadius: "6px 22px 22px 22px", padding: "12px 20px", fontSize: 34, fontWeight: 700, color: "#222",
          opacity: interpolate(f, [8, 14], [0, 1], clamp) }}>
          Dropped him off ✓ OK for <b>this one meeting</b>. I&apos;ll pick him up after.
        </div>
      </div>
    </div>
  );
};

const Unroll: React.FC<{ f: number; floor: number }> = ({ f, floor }) => {
  const len = interpolate(f, [0, floor], [0, 26], clamp);
  const n = Math.floor(len);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW + 22 }}>
      <div style={{ display: "flex", gap: 0, transform: `translateX(${W - 140 - Math.min(n, 26) * 150}px) rotate(-3deg)` }}>
        {new Array(26).fill(0).map((_, i) => (
          <div key={i} style={{ flex: "none", width: 150, height: 120, background: "#fff", border: "3px solid #777", opacity: i < n ? 1 : 0,
            transform: `rotate(${(i % 2 ? 1 : -1) * 2}deg)`, display: "grid", placeItems: "center", fontFamily: EN, fontSize: 22, fontWeight: 800, color: "#777" }}>
            <div style={{ width: 110, height: 70, border: "2px solid #aaa" }} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 190, top: 160, fontFamily: EN, fontSize: 44, fontWeight: 900, color: "#fff", textShadow: "0 3px 10px #000" }}>
        {f < floor ? `panel ${Math.max(1, n)}… still unfolding` : "…it reached the FLOOR"}
      </div>
      <Stamp f={f - floor} text="FLOOR ↓" x={240} y={-90} rot={-10} size={70} color={C.red} />
    </div>
  );
};

const PROGRAMS: [string, string, string][] = [["07:00", "BREAKFAST NEWS", "#f0a03c"], ["12:00", "LUNCH INTERVIEWS", "#3d9cc0"], ["18:00", "EVENING MUSIC", "#8a4fb0"]];
const ProgramTiles: React.FC<{ f: number; grey: number; delays: number[] }> = ({ f, grey, delays }) => {
  const g = grey >= 0 ? interpolate(grey, [0, 14], [0, 1], clamp) : 0;
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 40 }}>
      {PROGRAMS.map(([t, name, col], i) => {
        const d = f - delays[i];
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14, transform: `translateX(${(1 - sp(d, { damping: 11 })) * -1100}px) rotate(${i % 2 ? 1 : -1}deg)`,
            filter: `grayscale(${g}) opacity(${1 - g})` }}>
            <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 40, fontWeight: 900, background: "#111", color: "#7dffa0", padding: "4px 14px", borderRadius: 10 }}>{t}</span>
            <span style={{ flex: 1, fontFamily: EN, fontSize: 50, fontWeight: 900, color: "#fff", background: col, border: "4px solid #111", borderRadius: 14, padding: "6px 22px",
              boxShadow: "6px 6px 0 #111" }}>{name}</span>
          </div>
        );
      })}
      {grey < 0 && <Stamp f={f - 80} text="EVERY DAY!" x={W - 300} y={-60} rot={8} size={56} color={CL} />}
    </div>
  );
};

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

const TargetBoard: React.FC<{ f: number }> = ({ f }) => {
  const hit = interpolate(f, [6, 16], [0, 1], { ...clamp, easing: (t) => t * t });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LOW - 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 36,
      transform: `scale(${sp(f, { damping: 10 })})` }}>
      <div style={{ position: "relative", width: 300, height: 300 }}>
        <svg width="300" height="300" viewBox="0 0 100 100">
          {[48, 38, 28, 18, 8].map((rr, i) => <circle key={rr} cx="50" cy="50" r={rr} fill={i % 2 ? "#fff" : "#e23b2e"} stroke="#111" strokeWidth="2" />)}
        </svg>
        <svg width="300" height="80" viewBox="0 0 150 40" style={{ position: "absolute", left: 150 + (1 - hit) * 500, top: 110, transform: f > 16 ? `rotate(${Math.sin(f) * 2}deg)` : undefined }}>
          <path d="M0 20 L120 20" stroke="#5a3a1a" strokeWidth="6" />
          <path d="M0 20 L14 12 L14 28 Z" fill="#111" />
          <path d="M120 20 L145 5 M120 20 L145 35 M110 20 L135 5 M110 20 L135 35" stroke="#2d7d4f" strokeWidth="5" />
        </svg>
      </div>
      <div style={{ fontFamily: EN, fontWeight: 900, color: "#fff", textShadow: "0 4px 12px #000", marginLeft: 150 }}>
        <div style={{ fontSize: 40, color: C.yellow }}>TARGET</div>
        <div style={{ fontSize: 72, lineHeight: 1.05 }}>1 trial</div>
        <div style={{ fontSize: 72, lineHeight: 1.05 }}>10 min</div>
      </div>
    </div>
  );
};

const LengthBars: React.FC<{ f: number }> = ({ f }) => (
  <Card f={f} life={9999}>
    <div style={{ fontSize: 30, color: C.muted, fontWeight: 800, marginBottom: 6 }}>Length check</div>
    {([["Our school day", 0.62, XS], ["Clone's timetable", 1.6, CL], ["Xiaoman's circle", 0.06, "#ff2d2d"]] as [string, number, string][]).map(([t, v, c], i) => (
      <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
        <span style={{ width: 330, fontSize: 32, fontWeight: 800 }}>{t}</span>
        <div style={{ flex: 1, height: 34, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 17, border: "3px solid #111", background: c,
            width: `${interpolate(f - i * 10, [0, 24], [2, v * 100], clamp)}%` }} />
        </div>
      </div>
    ))}
  </Card>
);

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

const StatsPanel: React.FC<{ f: number; confess: number; hmm: number }> = ({ f, confess, hmm }) => {
  const bar = (v: number, col: string) => (
    <div style={{ flex: 1, height: 30, background: "#222", border: "3px solid #555", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${v * 100}%`, height: "100%", background: col, boxShadow: `0 0 12px ${col}` }} />
    </div>
  );
  const skill = confess >= 0 ? 0.04 : interpolate(f, [0, 20], [0, 0.9], clamp) * (hmm >= 0 ? interpolate(hmm, [0, 20], [1, 0.3], clamp) : 1);
  const xp = confess >= 0 ? interpolate(confess, [40, 160], [0.04, 0.35], clamp) : 0;
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: LOW - 20, background: "rgba(10,16,30,.9)", border: `4px solid ${CL}`, borderRadius: 16, padding: "18px 26px",
      fontFamily: "ui-monospace, Menlo, monospace", color: "#fff", transform: `scale(${sp(f, { damping: 12 })})`, boxShadow: `0 0 30px ${CL}` }}>
      <div style={{ fontSize: 28, color: CL, fontWeight: 900, marginBottom: 10 }}>PLAYER: CLONE</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
        <span style={{ width: 280, fontSize: 30 }}>Enthusiasm</span>{bar(1, "#ffd75e")}<span style={{ fontSize: 28, color: "#ffd75e", width: 80 }}>MAX</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ width: 280, fontSize: 30 }}>Equipment skill</span>{bar(Math.max(skill, xp), confess >= 0 ? "#7dffa0" : "#bbb")}
        <span style={{ fontSize: 28, width: 80, color: confess >= 0 ? "#7dffa0" : "#bbb" }}>{confess >= 0 ? "LV 0" : "???"}</span>
      </div>
      {confess >= 0 && (
        <div style={{ fontSize: 28, marginTop: 12, color: "#7dffa0", opacity: interpolate(confess, [30, 40], [0, 1], clamp) }}>
          + practice → competence ▲ &nbsp; <span style={{ color: "#ffd75e" }}>HONESTY +1</span>
        </div>
      )}
    </div>
  );
};
