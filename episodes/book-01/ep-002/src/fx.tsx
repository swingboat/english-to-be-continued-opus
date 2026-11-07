import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { SceneT, W } from "./timeline";
import { C, clamp, EN, Rect, sp, SANS } from "./ui";

type P = { s: SceneT; f: number; r: Rect };
const at2 = (r: Rect, x: number, y: number) => ({ x: r.x + x * r.w, y: r.y + y * r.h });

// ---------- building blocks ----------
const Pill: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", fontFamily: SANS, fontWeight: 800, background: C.surface, border: "4px solid #111",
    borderRadius: 40, padding: "10px 28px", fontSize: 38, color: "#111", boxShadow: "6px 6px 0 #111", whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

const Stamp: React.FC<{ f: number; text: string; x: number; y: number; rot: number; size?: number; color?: string }> = ({ f, text, x, y, rot, size = 92, color = C.red }) => {
  if (f < 0) return null;
  const k = interpolate(f, [0, 6], [2.6, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${k})`,
      opacity: interpolate(f, [0, 4], [0, 0.95], clamp), border: `9px solid ${color}`, color, borderRadius: 14, padding: "6px 30px",
      fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: 4, background: "rgba(255,253,247,.9)", whiteSpace: "nowrap",
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
    <div style={{ position: "absolute", fontFamily: SANS, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "7px #fff",
      paintOrder: "stroke fill", textShadow: "0 8px 20px rgba(0,0,0,.5)", whiteSpace: "nowrap",
      transform: `rotate(-8deg) scale(${sp(f, { damping: 6, stiffness: 260 })})`, opacity: interpolate(f, [life - 10, life], [1, 0], clamp), ...style }}>
      {text}
    </div>
  );
};

// Card that pops in at `f >= 0` and leaves at `f >= life`
const Card: React.FC<{ f: number; life: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ f, life, style, children }) => {
  if (f < 0 || f > life + 10) return null;
  const k = sp(f, { damping: 13 });
  const out = interpolate(f, [life, life + 10], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: 580, background: C.surface, border: "5px solid #111", borderRadius: 20,
      padding: "26px 32px", fontFamily: SANS, color: C.ink, boxShadow: "0 24px 60px rgba(0,0,0,.5)",
      transform: `translateY(${(1 - k) * -80 - out * 120}px) scale(${0.9 + 0.1 * k}) rotate(-1deg)`, opacity: k * (1 - out), ...style }}>
      {children}
    </div>
  );
};

const NameCard: React.FC<{ f: number; name: string; en: string; desc: string; color: string; side: "left" | "right"; top: number }> = ({
  f, name, en, desc, color, side, top,
}) => {
  if (f < 0 || f > 95) return null;
  const k = sp(f, { damping: 15 });
  const out = interpolate(f, [80, 95], [0, 1], clamp);
  const dir = side === "left" ? -1 : 1;
  return (
    <div style={{ position: "absolute", [side]: side === "right" ? 170 : 30, top, transform: `translateX(${dir * ((1 - k) * 700 + out * 700)}px)`, fontFamily: SANS,
      textAlign: side }}>
      <div style={{ display: "inline-block", background: color, color: "#fff", padding: "10px 60px", transform: "skewX(-12deg)",
        boxShadow: "8px 8px 0 rgba(0,0,0,.4)" }}>
        <div style={{ transform: "skewX(12deg)", fontSize: 70, fontWeight: 900, letterSpacing: 6 }}>
          {name} <span style={{ fontFamily: EN, fontSize: 28, letterSpacing: 4, opacity: 0.85 }}>{en}</span>
        </div>
      </div>
      <div style={{ marginTop: 10, [side === "left" ? "marginLeft" : "marginRight"]: 40, display: "inline-block", background: "rgba(0,0,0,.72)",
        color: "#fff", fontSize: 30, padding: "6px 18px", borderRadius: 6 }}>{desc}</div>
    </div>
  );
};

const Row: React.FC<{ cells: React.ReactNode[]; style?: React.CSSProperties }> = ({ cells, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 0", borderTop: `2px solid ${C.line}`, fontSize: 38, fontWeight: 800, ...style }}>
    {cells.map((c, i) => <span key={i} style={{ flex: i === 0 ? 1.1 : 1 }}>{c}</span>)}
  </div>
);

// ---------- per-scene effects (screen coordinates) ----------
const len = (s: SceneT, id: string) => s.beats.find((b) => b.id === id)!.frames;

export const SceneFX: React.FC<P> = ({ s, f, r }) => {
  const at = s.at;
  switch (s.scene.id) {
    case 1:
      return (
        <>
          <NameCard f={f - at("s1-open", 4)} name="Xiaoshuai" en="" desc="Red shirt · the original · telling this story" color="#c0412f" side="left" top={1010} />
          <Burst f={f - at("s1n1")} text="？！" life={34} style={{ right: 190, top: 610 }} />
          <NameCard f={f - at("s1n1", 12)} name="Su Xiaoman" en="" desc="Classmate · collects the activity forms" color="#8a4fb0" side="left" top={848} />
          {f >= at("s1n2") && f < at("s1n3") && <OffscreenCall f={f - at("s1n2")} />}
          <NameCard f={f - at("s1n3", 8)} name="Clone" en="" desc="Blue shirt · born last episode · trial monitor" color={C.blue} side="right" top={848} />
          <Stamp f={f - at("s1n4")} text="NO ESCAPE" x={W / 2 - 40} y={760} rot={-7} size={84} />
        </>
      );
    case 2: {
      const scan = f - at("s2-scan");
      const hotAt = at("s2n2", 6) - at("s2-scan");
      const st = f - at("s2l1");
      const head = at2(r, 0.3, 0.1);
      const math = f - at("s2l3");
      return (
        <>
          <Card f={scan} life={at("s2l1") - at("s2-scan") - 4} style={{ top: 840 }}>
            <div style={{ fontSize: 30, color: C.muted, marginBottom: 8 }}>Three unconfirmed invitations</div>
            {["English sharing", "Moving desks", "Basketball tryouts"].map((n, i) => {
              const hot = scan >= hotAt + i * 10;
              return (
                <Row key={n} cells={[n, <span key="t" style={{ color: hot ? "#fff" : C.ink, background: hot ? C.red : "transparent", padding: "0 10px", borderRadius: 8 }}>Fri 14:00</span>,
                  <span key="s" style={{ fontSize: 26, color: C.muted, border: `2px dashed ${C.muted}`, padding: "2px 10px" }}>pending</span>]} />
              );
            })}
          </Card>
          {st >= 0 && st < len(s, "s2l1") + 10 && <Gloom f={st} />}
          {st >= 0 && st < 60 && [0, 1, 2].map((i) => <Sweat key={i} f={st - i * 5} x={head.x + 80 + i * 70} y={head.y + i * 30} />)}
          {math >= 0 && <Chalk f={math} b={f - at("s2l4")} c={f - at("s2l5")} />}
        </>
      );
    }
    case 3: {
      const draw = f - at("s3-draw");
      const ph = f - at("s3l1");
      const pr = f - at("s3l2", 6);
      const ar = f - at("s3l3");
      const fix = f - at("s3-end", 6);
      return (
        <>
          {draw >= 0 && ph < 0 && <Circles f={draw} plus={draw - 44} />}
          {ph >= 0 && ar < 0 && <PhoneDisabled f={ph} />}
          {pr >= 0 && ar < 0 && <Printer f={pr} />}
          {ar >= 0 && fix < 10 && <RisingTrouble f={ar} />}
          {fix >= 0 && (
            <Card f={fix} life={9999} style={{ top: 610, textAlign: "center" }}>
              <span style={{ fontSize: 46, fontWeight: 900, textDecoration: "line-through", textDecorationColor: C.red, textDecorationThickness: 7, color: C.muted }}>Add people</span>
              <span style={{ fontSize: 46, margin: "0 14px" }}>→</span>
              <span style={{ fontSize: 46, fontWeight: 900, color: C.blue }}>Change the plan</span>
            </Card>
          )}
        </>
      );
    }
    case 4: {
      const ch = f - at("s4l1", 10);
      const vs = f - at("s4-vs");
      const ord = f - at("s4n1");
      const bulb = f - at("s4-end");
      return (
        <>
          <Card f={ch} life={len(s, "s4l1") + 4} style={{ left: 380, top: 600 }}>
            <div style={{ fontSize: 30, color: C.muted }}>Clone&apos;s rating</div>
            <div style={{ fontSize: 48, fontWeight: 900 }}>Difficulty <span style={{ color: "#e0a400" }}>{"★".repeat(Math.min(4, Math.max(0, Math.floor(ch / 5))))}</span>☆</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: C.blue }}>Possible ✓</div>
          </Card>
          {vs >= 0 && (
            <VsCard f={vs} frames={len(s, "s4-vs")}
              top={{ bg: C.blue, who: "Clone", goal: "Win it all", icon: <Checks /> }}
              bottom={{ bg: C.red, who: "Xiaoshuai", goal: "Choose for myself", icon: <Fork /> }} label="'s expectation" />
          )}
          {ord >= 0 && bulb < 40 && <OrderCard f={ord} slideAt={at("s4n2") - at("s4n1")} out={bulb >= 30} />}
          {bulb >= 0 && bulb < 50 && <Bulb f={bulb} x={at2(r, 0.18, 0.05).x} y={Math.max(260, at2(r, 0.18, 0.05).y)} />}
        </>
      );
    }
    case 5: {
      const kn = f - at("s5-knock");
      const solo = f - at("s5n1", 8);
      const pr = f - at("s5l1");
      const ask = f - at("s5-end");
      return (
        <>
          {[0, 6, 13].map((d, i) => <Burst key={i} f={kn - d} text="KNOCK" life={26} size={90} color="#8b5a2b" style={{ right: 190 + i * 40, top: 700 + i * 150 }} />)}
          {solo >= 0 && pr < 0 && (
            <Pill style={{ left: 80, top: 600, transform: `scale(${sp(solo, { damping: 9 })}) rotate(-3deg)` }}>
              🚪 Clone: <span style={{ color: C.blue }}>wait outside</span>
            </Pill>
          )}
          <NameCard f={f - at("s5n1", 24)} name="Head Teacher" en="" desc="Class adviser · hasn't seen the clone" color="#3f8a70" side="right" top={1000} />
          {pr >= 0 && f < at("s5l2") && <Gauge f={pr} />}
          {ask >= 0 && <Burst f={ask} text="？" life={40} size={150} color="#3f8a70" style={{ right: 230, top: 600 }} />}
        </>
      );
    }
    case 6: {
      const up = f - at("s6n1");
      const clash = f - at("s6n3");
      const both = f - at("s6n4");
      const notice = f - at("s6n5", 4);
      return (
        <>
          {up >= 0 && clash < 0 && <UpdateCard f={up} s2={at("s6n2") - at("s6n1")} />}
          {clash >= 0 && both < 0 && <Clash f={clash} />}
          {both >= 0 && notice < 0 && <Ball f={both} sad />}
          {notice >= 0 && <Notice f={notice} />}
        </>
      );
    }
    case 7: {
      const list = f - at("s7n1", 10);
      const strike = f - at("s7-strike");
      const later = f - at("s7n2");
      const good = f - at("s7l1");
      const thumb = at2(r, 0.86, 0.38);
      return (
        <>
          <Card f={list} life={at("s7l1") - at("s7n1", 10)} style={{ top: 640, left: 300, right: 30, padding: "20px 24px" }}>
            <div style={{ fontSize: 26, color: C.muted, marginBottom: 6 }}>Xiaoshuai&apos;s confirmed plan</div>
            <Row style={{ fontSize: 30 }} cells={["Moving desks", "13:20–13:40", <span key="a" style={{ color: "#2d7d4f", opacity: list >= 20 ? 1 : 0 }}>✓</span>]} />
            <Row style={{ fontSize: 30 }} cells={["English sharing", "14:00", <span key="b" style={{ color: "#2d7d4f", opacity: list >= 50 ? 1 : 0 }}>✓ me</span>]} />
            <div style={{ position: "relative" }}>
              <Row style={{ fontSize: 30 }} cells={["Basketball tryouts", "14:00", <span key="c" style={{ color: C.red, opacity: strike >= 20 ? 1 : 0 }}>not this time</span>]} />
              <div style={{ position: "absolute", left: 0, top: "52%", height: 6, background: C.red, borderRadius: 4,
                width: `${interpolate(strike, [0, 18], [0, 66], clamp)}%` }} />
            </div>
            <Row cells={["Later tryout", "apply later", <span key="d" style={{ color: later >= 0 ? C.blue : C.muted, fontSize: 24 }}>not yet</span>]}
              style={{ color: later >= 0 ? C.blue : C.muted, fontSize: 30, background: later >= 0 && later < 60 ? "rgba(36,95,114,.1)" : undefined }} />
          </Card>
          {good >= 0 && good < 60 && <Twinkles f={good} x={thumb.x} y={thumb.y} />}
        </>
      );
    }
    case 8: {
      const cool = f - at("s8l3", 20);
      const glint = f - at("s8l4", 4);
      const point = f - at("s8n1");
      const both = f - at("s8l5");
      const awk = f - at("s8-awk");
      const su = at2(r, 0.81, 0.23);
      const a = at2(r, 0.25, 0.08), b = at2(r, 0.53, 0.08);
      return (
        <>
          {cool >= 0 && f < at("s8l4") && (
            <Pill style={{ left: 80, top: 600, transform: `scale(${sp(cool, { damping: 8 })})` }}>
              <span style={{ color: C.red }}>Xiaoshuai</span> Choice +1
            </Pill>
          )}
          {glint >= 0 && glint < 24 && <Glint f={glint} x={su.x} y={su.y} />}
          {point >= 0 && f < at("s8l5") && <PointAt f={point} />}
          {both >= 0 && f < at("s8-awk") && (
            <>
              <SaySame f={both} x={Math.max(270, a.x)} y={880} color="#e0604a" />
              <SaySame f={both - 2} x={Math.min(700, b.x + 60)} y={1010} color="#3d9cc0" />
            </>
          )}
          <Stamp f={awk - 2} text="100% IN SYNC" x={W / 2} y={919} rot={-8} size={70} color={C.blue} />
          {awk >= 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 809, display: "flex", justifyContent: "center", gap: 50 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 46, height: 46, borderRadius: "50%", background: "#fff", border: "5px solid #111",
                  transform: `scale(${awk >= 20 + i * 10 ? sp(awk - 20 - i * 10, { damping: 8 }) : 0})` }} />
              ))}
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
  if (s.scene.id === 5) {
    const d = f - s.at("s5l1");
    if (d < 0 || f > s.at("s5l2")) return null;
    const beat = (d % 24) / 24;
    const pulse = Math.exp(-beat * 6) + 0.6 * Math.exp(-Math.max(0, beat - 0.25) * 8) * (beat > 0.25 ? 1 : 0);
    return <AbsoluteFill style={{ boxShadow: `inset 0 0 ${180 + pulse * 120}px rgba(200,20,20,${0.35 + 0.35 * pulse})`, pointerEvents: "none" }} />;
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 2) {
    const d = f - s.at("s2l1");
    if (d >= 0 && d < len(s, "s2l1")) return "saturate(.55) brightness(.85) hue-rotate(-12deg)";
  }
  if (s.scene.id === 5 && f >= s.at("s5l1") && f < s.at("s5l2")) return "saturate(.75) contrast(1.1)";
  if (s.scene.id === 6) return "sepia(.12) saturate(1.05)";
  return undefined;
};

// ---------- pieces ----------
const OffscreenCall: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", right: 0, top: 600, display: "flex", alignItems: "center", gap: 10, opacity: sp(f) }}>
    <div style={{ background: "rgba(0,0,0,.65)", color: "#fff", fontFamily: SANS, fontSize: 30, padding: "8px 18px", borderRadius: 8 }}>From the office</div>
    <svg width="140" height="200" viewBox="0 0 70 100">
      {[0, 1, 2].map((i) => {
        const o = ((f / 10 + i / 3) % 1);
        return <path key={i} d={`M${60 - i * 14} 20 Q${40 - i * 14} 50 ${60 - i * 14} 80`} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity={1 - o} />;
      })}
    </svg>
  </div>
);

const Gloom: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity: interpolate(f, [0, 8], [0, 1], clamp) }}>
    {new Array(16).fill(0).map((_, i) => (
      <div key={i} style={{ position: "absolute", left: 20 + i * 66, top: 0, width: 14 + random(`g${i}`) * 14,
        height: 620 + random(`h${i}`) * 360 + Math.sin(f / 4 + i) * 24,
        background: "linear-gradient(rgba(70,40,150,.95), rgba(70,40,150,0))", mixBlendMode: "multiply" }} />
    ))}
  </AbsoluteFill>
);

const Sweat: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  if (f < 0) return null;
  return (
    <svg width="60" height="90" viewBox="0 0 40 60" style={{ position: "absolute", left: x, top: y + f * 2.5, opacity: interpolate(f, [30, 50], [1, 0], clamp) }}>
      <path d="M20 2 C28 20 36 30 36 40 A16 16 0 0 1 4 40 C4 30 12 20 20 2 Z" fill="#9fd8ff" stroke="#fff" strokeWidth="3" />
    </svg>
  );
};

const Circles: React.FC<{ f: number; plus: number }> = ({ f, plus }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top: 580, height: 300, background: "rgba(255,255,255,.94)", border: "5px solid #111",
    borderRadius: 18, boxShadow: "0 20px 50px rgba(0,0,0,.4)", fontFamily: SANS }}>
    <svg width="900" height="290" viewBox="0 0 900 290">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={150 + i * 300} cy={130} r={95} fill="none" stroke="#222" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={600} strokeDashoffset={600 * (1 - interpolate(f - i * 11, [0, 10], [0, 1], clamp))} transform={`rotate(-90 ${150 + i * 300} 130)`} />
          <text x={150 + i * 300} y={145} textAnchor="middle" fontSize="44" fontWeight="800" fill="#222" opacity={interpolate(f - i * 11, [8, 12], [0, 1], clamp)}>
            {["Share", "Desks", "Ball"][i]}
          </text>
        </g>
      ))}
      <text x={450} y={270} textAnchor="middle" fontSize="40" fontWeight="800" fill={C.blue} opacity={plus >= 0 ? 1 : 0}>
        me + me + one more me?
      </text>
    </svg>
  </div>
);

const PhoneDisabled: React.FC<{ f: number }> = ({ f }) => {
  const e = sp(f, { damping: 12 });
  return (
    <div style={{ position: "absolute", right: 190, top: 620, width: 320, height: 560, borderRadius: 46, background: "#1d1d1f", padding: 14,
      transform: `translateY(${(1 - e) * 1400}px) rotate(5deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 34, background: "#e8ecef", fontFamily: SANS, padding: "50px 22px", textAlign: "center", position: "relative" }}>
        <div style={{ fontSize: 22, color: "#888" }}>Clone Maker · Beta</div>
        <div style={{ margin: "70px auto 0", width: 190, height: 190, borderRadius: "50%", background: "#b9c0c4", color: "#f4f4f4",
          display: "grid", placeItems: "center", fontSize: 36, fontWeight: 900 }}>CREATE</div>
        <div style={{ fontSize: 30, color: C.red, fontWeight: 800, marginTop: 30 }}>Used 1 / 1</div>
        {f >= 6 && f < 24 && (
          <div style={{ position: "absolute", left: 146 - (f - 6) * 6, top: 300 - (f - 6) * 6, width: (f - 6) * 12, height: (f - 6) * 12,
            borderRadius: "50%", border: "5px solid #999", opacity: interpolate(f, [6, 24], [1, 0], clamp) }} />
        )}
      </div>
    </div>
  );
};

const Printer: React.FC<{ f: number }> = ({ f }) => {
  const k = sp(f, { damping: 11 });
  return (
    <div style={{ position: "absolute", left: 80, top: 732, transform: `scale(${k}) rotate(-4deg)`, transformOrigin: "left top" }}>
      <svg width="420" height="420" viewBox="0 0 200 200">
        <rect x="40" y="20" width="120" height="60" fill="#fff" stroke="#111" strokeWidth="5" />
        <circle cx="100" cy="42" r="10" fill={C.blue} /><path d="M86 72 Q100 52 114 72" fill={C.blue} />
        <rect x="20" y="70" width="160" height="70" rx="12" fill="#ddd" stroke="#111" strokeWidth="5" />
        <rect x="45" y="120" width="110" height="60" fill="#fff" stroke="#111" strokeWidth="5" />
        <g stroke={C.red} strokeWidth="14" strokeLinecap="round" opacity={interpolate(f, [8, 12], [0, 1], clamp)}>
          <path d="M20 20 L180 180" /><path d="M180 20 L20 180" />
        </g>
      </svg>
      <div style={{ fontFamily: SANS, fontSize: 40, fontWeight: 900, color: "#fff", background: C.red, padding: "6px 18px", marginTop: -10, display: "inline-block" }}>
        Phone ≠ Printer
      </div>
    </div>
  );
};

const RisingTrouble: React.FC<{ f: number }> = ({ f }) => (
  <>
    {[0, 1, 2, 3, 4].map((i) => {
      const d = f - 20 - i * 12;
      if (d < 0) return null;
      const yes = d < 12;
      return (
        <div key={i} style={{ position: "absolute", left: 80 + ((i * 197) % 560), top: 985 - d * 6, fontFamily: yes ? EN : SANS, fontWeight: 900,
          fontSize: 54, padding: "8px 26px", borderRadius: 40, border: "4px solid #111", background: yes ? "#9be59b" : C.yellow, color: yes ? "#111" : C.red,
          transform: `scale(${sp(d, { damping: 8 })}) rotate(${(i % 2 ? 1 : -1) * 6}deg)`, opacity: interpolate(d, [70, 90], [1, 0], clamp) }}>
          {yes ? "YES" : "⚠ PROBLEM"}
        </div>
      );
    })}
  </>
);

const VsCard: React.FC<{ f: number; frames: number; label: string; top: Half; bottom: Half }> = ({ f, frames, label, top, bottom }) => {
  const t = sp(f, { damping: 13 });
  const b = sp(f - 6, { damping: 13 });
  const vs = sp(f - 14, { damping: 6, stiffness: 260 });
  const out = interpolate(f, [frames - 8, frames], [1, 0], clamp);
  const half = (h: Half, k: number, dir: number) => (
    <div style={{ flex: 1, background: h.bg, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24, transform: `translateX(${(1 - k) * dir * 1100}px)`, fontFamily: SANS }}>
      {h.icon}
      <div style={{ fontSize: 44, opacity: 0.9 }}>{h.who}{label}</div>
      <div style={{ fontSize: 96, fontWeight: 900 }}>{h.goal}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", opacity: out }}>
      {half(top, t, -1)}
      {half(bottom, b, 1)}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${vs}) rotate(${(1 - vs) * 180}deg)`,
        width: 230, height: 230, borderRadius: "50%", background: C.yellow, border: "8px solid #111", display: "grid", placeItems: "center",
        fontFamily: EN, fontWeight: 900, fontSize: 100, color: "#111" }}>VS</div>
    </AbsoluteFill>
  );
};
type Half = { bg: string; who: string; goal: string; icon: React.ReactNode };

const Checks = () => (
  <svg width="300" height="120" viewBox="0 0 150 60">
    {[0, 1, 2].map((i) => <path key={i} d={`M${8 + i * 50} 30 L${22 + i * 50} 46 L${44 + i * 50} 12`} fill="none" stroke={C.yellow} strokeWidth="8" strokeLinecap="round" />)}
  </svg>
);
const Fork = () => (
  <svg width="200" height="170" viewBox="0 0 100 85">
    <path d="M50 82 V45 M50 45 L20 12 M50 45 L80 12" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
    <path d="M10 18 L20 8 L26 22 Z M74 22 L80 8 L90 18 Z" fill={C.yellow} />
    <circle cx="80" cy="12" r="9" fill={C.yellow} />
  </svg>
);

const OrderCard: React.FC<{ f: number; slideAt: number; out: boolean }> = ({ f, slideAt, out }) => {
  const slide = interpolate(f, [slideAt + 4, slideAt + 22], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <Card f={f} life={out ? 0 : 9999} style={{ top: 600 }}>
      <div style={{ fontSize: 30, color: C.muted, marginBottom: 14 }}>Desk setup = preparation</div>
      <div style={{ position: "relative", height: 130 }}>
        <div style={{ position: "absolute", left: 470, top: 0, width: 420, height: 120, background: C.blue, color: "#fff", borderRadius: 14,
          display: "grid", placeItems: "center", fontSize: 44, fontWeight: 900 }}>Sharing 14:00</div>
        <div style={{ position: "absolute", left: interpolate(slide, [0, 1], [470, 0]), top: interpolate(slide, [0, 0.5, 1], [0, -30, 0]), width: 420, height: 120,
          background: slide < 1 ? C.red : "#2d7d4f", color: "#fff", borderRadius: 14, display: "grid", placeItems: "center", fontSize: 44, fontWeight: 900,
          opacity: 0.95, boxShadow: "0 10px 20px rgba(0,0,0,.3)" }}>Desk setup</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", fontSize: 34, fontWeight: 800, color: C.muted, opacity: slide }}>
        <span>first</span><span>→</span><span>then</span>
      </div>
    </Card>
  );
};

const Bulb: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => (
  <svg width="170" height="220" viewBox="0 0 80 104" style={{ position: "absolute", left: x, top: y, transform: `scale(${sp(f, { damping: 7, stiffness: 220 })})` }}>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (-150 + i * 30) * (Math.PI / 180);
      return <line key={i} x1={40 + Math.cos(a) * 34} y1={36 + Math.sin(a) * 34} x2={40 + Math.cos(a) * 44} y2={36 + Math.sin(a) * 44} stroke={C.yellow} strokeWidth="5" strokeLinecap="round" />;
    })}
    <circle cx="40" cy="36" r="24" fill="#ffe680" stroke="#111" strokeWidth="4" />
    <rect x="30" y="58" width="20" height="16" fill="#bbb" stroke="#111" strokeWidth="4" />
  </svg>
);

const Gauge: React.FC<{ f: number }> = ({ f }) => {
  const v = interpolate(f, [0, 30], [0.1, 0.97], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) }) + 0.02 * Math.sin(f * 1.7);
  const a = Math.PI * (1 - v);
  return (
    <div style={{ position: "absolute", left: "50%", top: 580, transform: `translateX(-50%) scale(${sp(f, { damping: 10 })})`, textAlign: "center" }}>
      <svg width="520" height="300" viewBox="0 0 260 150">
        <path d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke="#2d7d4f" strokeWidth="22" strokeDasharray="115 400" />
        <path d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke="#e0a400" strokeWidth="22" strokeDasharray="0 115 115 400" />
        <path d="M20 130 A110 110 0 0 1 240 130" fill="none" stroke={C.red} strokeWidth="22" strokeDasharray="0 230 130 400" />
        <line x1="130" y1="130" x2={130 + Math.cos(a) * 95} y2={130 - Math.sin(a) * 95} stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        <circle cx="130" cy="130" r="12" fill="#fff" />
      </svg>
      <div style={{ fontFamily: EN, fontSize: 52, fontWeight: 900, color: "#fff", textShadow: "0 4px 12px #000", marginTop: -20 }}>
        PRESSURE {v > 0.85 && <span style={{ color: "#ff5a3c" }}>MAX</span>}
      </div>
    </div>
  );
};

const UpdateCard: React.FC<{ f: number; s2: number }> = ({ f, s2: at2nd }) => {
  const s1 = f >= 14, s2 = f >= at2nd + 6, s3 = false;
  return (
    <Card f={f} life={9999} style={{ top: 860 }}>
      <div style={{ fontSize: 28, color: C.muted, marginBottom: 6 }}>Teacher&apos;s changes</div>
      <Row cells={["Moving desks", <span key="a"><s style={{ color: C.muted }}>14:00</s> {s1 && <b style={{ color: "#2d7d4f" }}>→ 13:20</b>}</span>]} />
      <Row cells={["English sharing", <span key="b">14:00 {s2 && <b style={{ color: "#2d7d4f" }}>✓</b>}</span>]} />
      <Row cells={["Basketball tryouts", <span key="c">14:00 {s3 && <b style={{ color: C.red, display: "inline-block", transform: `scale(${1 + 0.15 * Math.sin(f / 3)})` }}>?</b>}</span>]} />
    </Card>
  );
};

const Ball: React.FC<{ f: number; sad?: boolean }> = ({ f, sad }) => {
  const bounce = Math.abs(Math.sin(f / 7)) * 120 * (sad ? Math.max(0, 1 - f / 40) : 1);
  return (
    <div style={{ position: "absolute", right: 190, top: 580 + (120 - bounce), opacity: interpolate(f, [0, 8], [0, 1], clamp),
      filter: sad ? `grayscale(${interpolate(f, [10, 40], [0, 0.85], clamp)})` : undefined }}>
      <svg width="200" height="200" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="#e8823a" stroke="#111" strokeWidth="5" />
        <path d="M6 50 H94 M50 6 V94 M20 18 Q50 50 20 82 M80 18 Q50 50 80 82" fill="none" stroke="#111" strokeWidth="4" />
      </svg>
    </div>
  );
};

const Clash: React.FC<{ f: number }> = ({ f }) => {
  const k = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: (t) => t * t });
  const hit = f >= 10;
  const card = (text: string, bg: string, dir: number) => {
    const recoil = hit ? 24 * Math.max(0, 1 - (f - 10) / 10) : 0;
    const left = (dir < 0 ? W / 2 - 450 : W / 2 + 10) + dir * ((1 - k) * 700 + recoil);
    return (
      <div style={{ position: "absolute", top: 860, left, width: 440, transform: `rotate(${dir * 4}deg)`, background: bg, color: "#fff",
        fontFamily: SANS, fontSize: 46, fontWeight: 900, padding: "26px 20px", textAlign: "center", borderRadius: 16, border: "5px solid #111" }}>
        {text}
      </div>
    );
  };
  return (
    <>
      {card("Sharing 14:00", C.blue, -1)}
      {card("Basketball 14:00", "#e8823a", 1)}
      {hit && <Burst f={f - 10} text="CLASH!" life={50} size={110} style={{ left: W / 2 - 200, top: 798, fontFamily: EN }} />}
    </>
  );
};

const Notice: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 110, right: 190, top: 710, background: "#fffbe8", border: "4px solid #8b6b3d", padding: "40px 36px 30px",
    fontFamily: SANS, color: C.ink, transform: `rotate(2deg) translateY(${(1 - sp(f, { damping: 12 })) * -600}px)`, boxShadow: "0 20px 50px rgba(0,0,0,.45)" }}>
    <div style={{ position: "absolute", left: "50%", top: -18, width: 40, height: 40, borderRadius: "50%", background: C.red, border: "4px solid #111" }} />
    <div style={{ fontSize: 34, color: "#8b6b3d", fontWeight: 800 }}>SPORTS NOTICE</div>
    <div style={{ fontSize: 56, fontWeight: 900, margin: "8px 0" }}>Open basketball tryout · end of month</div>
    <div style={{ fontSize: 36 }}>Anyone who missed the first tryout can sign up.</div>
  </div>
);

const Twinkles: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const d = f - i * 5;
      if (d < 0) return null;
      const a = i * 1.7;
      const k = Math.sin(Math.min(Math.PI, (d / 20) * Math.PI));
      return (
        <svg key={i} width="90" height="90" viewBox="0 0 40 40" style={{ position: "absolute", left: x + Math.cos(a) * 110 - 45, top: y + Math.sin(a) * 110 - 45, transform: `scale(${k})` }}>
          <path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" fill="#fff8c0" stroke="#e0a400" strokeWidth="1.5" />
        </svg>
      );
    })}
  </>
);

const Glint: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  const k = Math.sin(Math.min(Math.PI, (f / 20) * Math.PI));
  return (
    <svg width="320" height="320" viewBox="0 0 40 40" style={{ position: "absolute", left: x - 160, top: y - 160, transform: `scale(${k}) rotate(${f * 4}deg)` }}>
      <path d="M20 0 L22 18 L40 20 L22 22 L20 40 L18 22 L0 20 L18 18 Z" fill="#fff" />
      <circle cx="20" cy="20" r="4" fill="#fff" />
    </svg>
  );
};

const SaySame: React.FC<{ f: number; x: number; y: number; color: string }> = ({ f, x, y, color }) => {
  if (f < 0) return null;
  return (
    <div style={{ position: "absolute", left: x - 180, top: y, width: 360, textAlign: "center", fontFamily: EN, fontSize: 50, fontWeight: 900,
      color: "#111", background: "#fff", border: `6px solid ${color}`, borderRadius: 30, padding: "10px 0",
      transform: `scale(${sp(f, { damping: 7, stiffness: 240 })})`, boxShadow: "0 10px 24px rgba(0,0,0,.4)" }}>
      He will.
    </div>
  );
};

// Clone's chalkboard math, built up line by line
const Chalk: React.FC<{ f: number; b: number; c: number }> = ({ f, b, c }) => {
  const pop = (d: number) => (d >= 0 ? sp(d, { damping: 8, stiffness: 220 }) : 0);
  return (
    <Card f={f} life={9999} style={{ top: 610, background: "#1f3b33", color: "#fff", border: "6px solid #8b6b3d", textAlign: "center" }}>
      <div style={{ fontSize: 30, opacity: 0.8 }}>Clone&apos;s math</div>
      <div style={{ fontSize: 92, fontWeight: 900, fontFamily: '"Chalkboard SE", ' + SANS, whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", transform: `scale(${pop(f)})` }}>2 of me</span>{" "}
        <span style={{ display: "inline-block", transform: `scale(${pop(b)})` }}><span style={{ color: "#ff8a70" }}>&lt;</span> 3 jobs</span>
      </div>
      <div style={{ fontSize: 60, fontWeight: 900, color: C.yellow, fontFamily: '"Chalkboard SE", ' + SANS, transform: `scale(${pop(c)})`, height: c >= 0 ? undefined : 0 }}>
        → +1 me?
      </div>
    </Card>
  );
};

// Two big arrows: each of them points at the other one
const PointAt: React.FC<{ f: number }> = ({ f }) => {
  const k = sp(f, { damping: 9, stiffness: 200 });
  const arrow = (color: string, dir: 1 | -1, top: number) => (
    <div style={{ position: "absolute", top, left: dir > 0 ? 90 : undefined, right: dir < 0 ? 190 : undefined,
      transform: `translateX(${(1 - k) * -dir * 500}px)`, fontFamily: EN, fontWeight: 900, fontSize: 54, color: "#fff",
      background: color, border: "5px solid #111", borderRadius: 18, padding: "10px 26px", boxShadow: "6px 6px 0 #111" }}>
      {dir > 0 ? "HIM →" : "← HIM"}
    </div>
  );
  return (
    <>
      {arrow("#e0604a", 1, 620)}
      {arrow("#3d9cc0", -1, 740)}
    </>
  );
};
