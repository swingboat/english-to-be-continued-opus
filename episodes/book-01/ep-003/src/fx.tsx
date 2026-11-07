import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { SceneT, W } from "./timeline";
import { C, clamp, EN, Rect, sp, SANS } from "./ui";

type P = { s: SceneT; f: number; r: Rect };
const at2 = (r: Rect, x: number, y: number) => ({ x: r.x + x * r.w, y: r.y + y * r.h });
const lineFrames = (s: SceneT, id: string) => s.beats.find((b) => b.id === id)!.frames;

// ---------- building blocks ----------
const Pill: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", fontFamily: SANS, fontWeight: 800, background: C.surface, border: "4px solid #111",
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
    <div style={{ position: "absolute", fontFamily: EN, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "7px #fff",
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

const NameCard: React.FC<{ f: number; name: string; desc: string; color: string; side: "left" | "right"; top: number; life?: number }> = ({
  f, name, desc, color, side, top, life = 95,
}) => {
  if (f < 0 || f > life) return null;
  const k = sp(f, { damping: 15 });
  const out = interpolate(f, [life - 15, life], [0, 1], clamp);
  const dir = side === "left" ? -1 : 1;
  return (
    <div style={{ position: "absolute", [side]: side === "right" ? 170 : 30, top, transform: `translateX(${dir * ((1 - k) * 800 + out * 800)}px)`, fontFamily: SANS, textAlign: side }}>
      <div style={{ display: "inline-block", background: color, color: "#fff", padding: "10px 60px", transform: "skewX(-12deg)", boxShadow: "8px 8px 0 rgba(0,0,0,.4)" }}>
        <div style={{ transform: "skewX(12deg)", fontFamily: EN, fontSize: 66, fontWeight: 900, letterSpacing: 3 }}>{name}</div>
      </div>
      <div style={{ marginTop: 10, [side === "left" ? "marginLeft" : "marginRight"]: 40, display: "block", fontFamily: EN }}>
        <span style={{ display: "inline-block", background: "rgba(0,0,0,.72)", color: "#fff", fontSize: 30, padding: "6px 18px", borderRadius: 6 }}>{desc}</span>
      </div>
    </div>
  );
};

const Check: React.FC<{ on: boolean; f: number; children: React.ReactNode; size?: number }> = ({ on, f, children, size = 38 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 0", borderTop: `2px solid ${C.line}`, fontFamily: EN, fontSize: size, fontWeight: 800 }}>
    <span style={{ width: 52, height: 52, flex: "none", border: `4px solid ${C.ink}`, borderRadius: 8, display: "grid", placeItems: "center",
      background: on ? "#2d7d4f" : "transparent", color: "#fff", fontSize: 38, transform: `scale(${on ? sp(f, { damping: 7 }) : 1})` }}>
      {on ? "✓" : ""}
    </span>
    <span style={{ color: on ? C.ink : C.muted }}>{children}</span>
  </div>
);

// ---------- per-scene effects (screen coordinates) ----------
export const SceneFX: React.FC<P> = ({ s, f, r }) => {
  const at = s.at;
  const mid = (id: string, k: number) => at(id, Math.round(lineFrames(s, id) * k));
  switch (s.scene.id) {
    case 1: {
      const su = f - at("s1n1");
      const pt = f - at("s1n2");
      const mir = f - at("s1-mirror");
      const nada = f - at("s1n3");
      const midX = at2(r, 0.66, 0).x;
      return (
        <>
          {su >= 0 && pt < 0 && (
            <Card f={su - 20} life={9999} style={{ left: 500, right: 190, top: 600, padding: "16px 22px", fontFamily: EN }}>
              <Check on f={su - 24} size={32}>Form received</Check>
              <Check on={false} f={0} size={32}>Answer… <span style={{ color: C.red }}>?</span></Check>
            </Card>
          )}
          <NameCard f={su - 8} life={lineFrames(s, "s1n1") - 6} name="Su Xiaoman" desc="Deskmate · holds our form" color="#8a4fb0" side="left" top={860} />
          <NameCard f={pt} life={lineFrames(s, "s1n2") + 6} name="Xiaoshuai" desc="Red shirt · the original · telling this story" color="#d4553f" side="left" top={848} />
          <NameCard f={pt - 12} life={lineFrames(s, "s1n2") - 6} name="The Clone" desc="Blue shirt · the copy · loves a stage" color={C.blue} side="right" top={1010} />
          {mir >= 0 && nada < 0 && (
            <>
              <div style={{ position: "absolute", left: midX - 4, top: r.y, height: r.h, width: 8,
                background: "repeating-linear-gradient(#fff 0 26px, transparent 26px 44px)", opacity: interpolate(mir, [0, 8], [0, 0.9], clamp),
                boxShadow: "0 0 18px #9fe4ff" }} />
              <Pill style={{ left: W / 2, top: 830, transform: `translateX(-50%) scale(${sp(mir - 4, { damping: 9 })})`, fontFamily: EN }}>
                MIRROR MODE: ON
              </Pill>
            </>
          )}
          <Stamp f={mir} text="BLAME: IN SYNC" x={W / 2} y={1040} rot={-7} size={66} color={C.blue} life={lineFrames(s, "s1-mirror") + 4} />
          <Stamp f={nada - 6} text="EXPLAINED: 0%" x={W / 2} y={1050} rot={-5} size={70} color="#666" />
        </>
      );
    }
    case 2: {
      const pitch = f - at("s2n1");
      const cut = f - at("s2n2");
      const fact = f - at("s2n2", 8);
      const real = f - at("s2n3", 6);
      return (
        <>
          {pitch >= 0 && cut < 24 && <Keynote f={pitch} cut={cut} />}
          <Stamp f={fact} text="FACT CHECK" x={W / 2} y={700} rot={-8} size={84} life={lineFrames(s, "s2n2") - 4} />
          {fact >= 0 && f < at("s2n3") && (
            <Pill style={{ left: W / 2, top: 540, transform: `translateX(-50%) scale(${sp(fact - 8)})`, fontFamily: EN, background: "#fbe3dc" }}>
              Brave? <s style={{ color: C.red }}>very</s> → not that
            </Pill>
          )}
          {real >= 0 && (
            <Card f={real} life={9999} style={{ textAlign: "center", fontFamily: EN, top: 1000 }}>
              <div style={{ fontSize: 30, color: C.muted }}>The real plan was just…</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, marginTop: 10 }}>
                <span style={{ fontSize: 48, fontWeight: 900 }}>Someone says</span>
                <span style={{ fontSize: 26 + 22 * sp(real - 10, { damping: 6 }), fontWeight: 900, background: "#fff", border: "4px solid #111",
                  borderRadius: 30, padding: "4px 22px" }}>“Hello”</span>
                <span style={{ fontSize: 48, fontWeight: 900 }}>for me</span>
              </div>
            </Card>
          )}
        </>
      );
    }
    case 3: {
      const hon = f - at("s3n1");
      const ph = f - at("s3n2");
      const fr = f - at("s3n3");
      const su = at2(r, 0.84, 0.36);
      return (
        <>
          {hon >= 0 && ph < 0 && <HonestyMeter f={hon} />}
          {ph >= 0 && fr < 0 && <PhoneOnce f={ph} usedAt={Math.round(lineFrames(s, "s3n2") * 0.5)} />}
          {fr >= 0 && fr < 40 && <Twinkles f={fr} x={su.x} y={Math.max(380, su.y)} />}
          <Stamp f={fr - 4} text="FRANK ✓" x={W / 2 - 150} y={1150} rot={-6} size={84} color="#2d7d4f" />
        </>
      );
    }
    case 4: {
      const same = f - at("s4n1", 8);
      const ap = f - at("s4n2");
      const cr = f - at("s4-cricket");
      const vs = f - at("s4-vs");
      const prof = f - at("s4n4");
      const office = Math.round(lineFrames(s, "s4n4") * 0.5);
      return (
        <>
          {same >= 0 && ap < 0 && (
            <Card f={same} life={lineFrames(s, "s4n1") - 14} style={{ fontFamily: EN, top: 1000 }}>
              <div style={{ fontSize: 30, color: C.muted, marginBottom: 6 }}>Face scan</div>
              <div style={{ fontSize: 46, fontWeight: 900 }}>Face <span style={{ color: "#2d7d4f" }}>100% match ✓</span></div>
              <div style={{ fontSize: 46, fontWeight: 900, opacity: sp(same - 24) }}>Goals <span style={{ color: C.red }}>✗ differ</span></div>
            </Card>
          )}
          {ap >= 0 && vs < 0 && <ApplauseSign f={ap} dark={cr >= 0} />}
          {cr >= 0 && vs < 0 && <Chirps f={cr} />}
          {vs >= 0 && f < at("s4n4") && (
            <VsCard f={vs} frames={lineFrames(s, "s4-vs")} label="'s goal"
              top={{ bg: C.blue, who: "Clone", goal: "Applause", icon: <Hands /> }}
              bottom={{ bg: C.red, who: "Xiaoshuai", goal: "Stop hiding", icon: <Door /> }} />
          )}
          {prof >= 0 && (
            <Card f={prof} life={9999} style={{ left: 80, right: 360, padding: "20px 26px" }}>
              <div style={{ fontFamily: EN, fontSize: 28, color: "#8a4fb0", fontWeight: 800 }}>Xiaoman&apos;s notes</div>
              <div style={{ fontFamily: EN, fontSize: 40, fontWeight: 900, marginBottom: 6 }}>Xiaoshuai (the real one)</div>
              <Check on={prof >= 16} f={prof - 16} size={32}>Red shirt · nervous</Check>
              <Check on={prof >= office} f={prof - office} size={32}>Entered the office himself</Check>
            </Card>
          )}
        </>
      );
    }
    case 5: {
      const air = f - mid("s5n1", 0.45);
      const cut = f - mid("s5n2", 0.35);
      const lis = f - at("s5n3");
      const zip = f - at("s5n3", 24);
      return (
        <>
          {air >= 0 && cut < 0 && <OnAir f={air} off={false} />}
          {cut >= 0 && lis < 0 && <CutOff f={cut} />}
          {lis >= 0 && <OnAir f={lis + 30} off={false} label="LISTENING" />}
          {zip >= 0 && (
            <Pill style={{ right: 190, top: 1130, transform: `scale(${sp(zip, { damping: 8 })}) rotate(4deg)`, fontFamily: EN, background: "#dff0f7" }}>
              <MicOff /> Clone mic: OFF
            </Pill>
          )}
        </>
      );
    }
    case 6: {
      const list = f - at("s6n1", 8);
      const tch = mid("s6n2", 0.45) - at("s6n1", 8);
      const par = mid("s6n2", 0.7) - at("s6n1", 8);
      const seal = f - at("s6-seal");
      return (
        <>
          {list >= 0 && (
            <Card f={list} life={9999} style={{ fontFamily: EN, top: 990 }}>
              <div style={{ fontSize: 30, color: C.muted }}>Tomorrow</div>
              <Check on={list >= tch} f={list - tch} size={36}>See our teacher <span style={{ color: "#8a4fb0" }}>(+ Xiaoman)</span></Check>
              <div style={{ opacity: f >= at("s6n2") ? 1 : 0.15 }}>
                <Check on={list >= par} f={list - par} size={36}>Tell my parents</Check>
              </div>
            </Card>
          )}
          <Stamp f={seal} text="IN PERSON" x={W / 2 + 80} y={1110} rot={-10} size={80} />
        </>
      );
    }
    case 7: {
      const aud = f - at("s7n1", 10);
      const intro = f - at("s7l1");
      const clap = f - at("s7-clap");
      const conf = f - at("s7n2");
      const thumb = at2(r, 0.9, 0.5);
      return (
        <>
          {aud >= 0 && f < at("s7-breath", 10) && (
            <Pill style={{ left: W / 2, top: 1080, transform: `translateX(-50%) scale(${sp(aud, { damping: 9 })})`, fontFamily: EN }}>
              Audience: <s style={{ color: C.muted }}>whole class</s> → <span style={{ color: C.red }}>2</span>
            </Pill>
          )}
          {intro >= 0 && clap < 30 && <IntroChips f={intro} len={lineFrames(s, "s7l1")} />}
          {clap >= 0 && clap < 50 && (
            <>
              <Burst f={clap} text="clap clap" size={70} life={50} color={C.yellow} style={{ left: 600, top: 620 }} />
              <Twinkles f={clap} x={Math.min(W - 120, thumb.x)} y={Math.min(1400, thumb.y)} />
            </>
          )}
          {conf >= 0 && <ConfidenceBars f={conf} />}
        </>
      );
    }
    case 8: {
      const hand = f - at("s8n1");
      const no = f - mid("s8l2", 0.4);
      const laugh = f - at("s8-laugh");
      const tmr = f - at("s8n2", 10);
      const cl = at2(r, 0.2, 0.08);
      return (
        <>
          <Burst f={hand} text="!" size={160} life={40} color={C.blue} style={{ left: Math.max(60, cl.x - 40), top: Math.max(300, cl.y) }} />
          <Stamp f={no} text="NO MORE JOBS" x={W / 2 - 40} y={1160} rot={-7} size={72} life={at("s8-laugh", 10) - mid("s8l2", 0.4)} />
          {laugh >= 0 && f < at("s8n2") && [0, 1, 2].map((i) => (
            <Burst key={i} f={laugh - 4 - i * 6} text="hehe" size={50} life={40} color="#b07ad0" style={{ right: 200 + i * 40, top: 560 + i * 50 }} />
          ))}
          {tmr >= 0 && (
            <Pill style={{ left: W / 2, top: 1080, transform: `translateX(-50%) scale(${sp(tmr, { damping: 9 })}) rotate(-2deg)`, fontFamily: EN }}>
              Tomorrow: explaining <span style={{ color: C.red }}>×</span><span style={{ color: C.blue }}>2</span>
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
  if (s.scene.id === 3 && f < s.at("s3n2")) {
    // the hallway goes quiet before the confession
    const o = Math.min(interpolate(f, [0, 20], [0, 1], clamp), interpolate(f, [s.at("s3n2") - 12, s.at("s3n2")], [1, 0], clamp));
    return <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 42%, transparent 30%, rgba(0,0,10,.62) 85%)", opacity: o, pointerEvents: "none" }} />;
  }
  if (s.scene.id === 7) {
    const b = f - s.at("s7-breath");
    if (b >= 0 && f < s.at("s7l1", 20)) {
      const k = Math.sin(Math.min(Math.PI, (b / 40) * Math.PI));
      return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: W / 2 - 160, top: 776, width: 320, height: 320, borderRadius: "50%",
            border: "8px solid rgba(255,255,255,.85)", transform: `scale(${0.4 + 0.6 * k})`, boxShadow: "0 0 40px rgba(160,220,255,.8)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 848, textAlign: "center", fontFamily: EN, fontSize: 46, fontWeight: 800,
            color: "#fff", textShadow: "0 3px 10px #000", opacity: k }}>breathe in…</div>
        </AbsoluteFill>
      );
    }
  }
  return null;
};

export const shotFilter = (s: SceneT, f: number) => {
  if (s.scene.id === 3 && f < s.at("s3n2")) return "saturate(.8)";
  if (s.scene.id === 4 && f >= s.at("s4-cricket") && f < s.at("s4n3")) return "saturate(.4) brightness(.8)";
  if (s.scene.id === 7 && f >= s.at("s7l1") && f < s.at("s7n2")) return "brightness(1.05) saturate(1.1) sepia(.12)";
  return undefined;
};

// ---------- pieces ----------
const Keynote: React.FC<{ f: number; cut: number }> = ({ f, cut }) => {
  const k = sp(f, { damping: 12 });
  const fall = cut >= 0 ? interpolate(cut, [0, 22], [0, 1], { ...clamp, easing: (t) => t * t }) : 0;
  const items = ["Courage", "Efficiency", "Class participation"];
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: 600, height: 420, borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(135deg,#0d1b3a,#203a78)", border: "5px solid #111", boxShadow: "0 24px 60px rgba(0,0,0,.55)",
      transform: `translateY(${(1 - k) * -120 + fall * 1400}px) rotate(${fall * 24}deg) scale(${0.9 + 0.1 * k})`, opacity: k,
      filter: cut >= 0 ? "grayscale(.8)" : undefined, fontFamily: EN, color: "#fff", padding: "30px 40px" }}>
      <div style={{ fontSize: 26, letterSpacing: 6, color: "#9fd0ff" }}>★ LIVE · PRODUCT LAUNCH</div>
      <div style={{ fontSize: 64, fontWeight: 900, marginTop: 4 }}>Project: <span style={{ color: C.yellow }}>CLONE</span></div>
      {items.map((t, i) => (
        <div key={t} style={{ fontSize: 44, fontWeight: 800, marginTop: 10, opacity: sp(f - 20 - i * 26), transform: `translateX(${(1 - sp(f - 20 - i * 26)) * 200}px)` }}>
          <span style={{ color: "#7dffa0" }}>✓</span> {t}
        </div>
      ))}
      <div style={{ position: "absolute", right: -60, top: -60, width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(rgba(255,255,255,.35), transparent 70%)", transform: `scale(${1 + 0.1 * Math.sin(f / 6)})` }} />
    </div>
  );
};

const HonestyMeter: React.FC<{ f: number }> = ({ f }) => {
  const v = interpolate(f, [8, 80], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
  return (
    <div style={{ position: "absolute", left: 90, right: 190, top: 600, fontFamily: EN, color: "#fff", opacity: sp(f), textShadow: "0 3px 10px #000" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 900 }}>
        <span>HONESTY</span><span style={{ color: v > 0.95 ? "#7dffa0" : "#fff" }}>{Math.round(v * 100)}%</span>
      </div>
      <div style={{ height: 40, borderRadius: 20, border: "5px solid #fff", marginTop: 10, overflow: "hidden", background: "rgba(0,0,0,.45)" }}>
        <div style={{ width: `${v * 100}%`, height: "100%", background: "linear-gradient(90deg,#f1d17f,#7dffa0)" }} />
      </div>
    </div>
  );
};

const PhoneOnce: React.FC<{ f: number; usedAt: number }> = ({ f, usedAt }) => {
  const e = sp(f, { damping: 12 });
  const used = f >= usedAt;
  return (
    <div style={{ position: "absolute", left: 80, top: 680, width: 270, height: 470, borderRadius: 40, background: "#1d1d1f", padding: 12,
      transform: `translateX(${(1 - e) * -500}px) rotate(-5deg)`, boxShadow: "0 30px 60px rgba(0,0,0,.5)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 30, background: "#e8ecef", fontFamily: EN, padding: "40px 18px", textAlign: "center" }}>
        <div style={{ fontSize: 20, color: "#888" }}>Clone Maker · Beta</div>
        <div style={{ margin: "40px auto 0", width: 150, height: 150, borderRadius: "50%", background: used ? "#b9c0c4" : C.blue, color: "#fff",
          display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, transform: `scale(${f >= 30 && f < 40 ? 0.9 : 1})` }}>CREATE</div>
        <div style={{ fontSize: 30, color: used ? C.red : C.ink, fontWeight: 900, marginTop: 30 }}>{used ? "Used 1 / 1" : "1 chance left"}</div>
        {used && <div style={{ fontSize: 22, color: C.muted, marginTop: 8 }}>No more copies.</div>}
      </div>
    </div>
  );
};

const ApplauseSign: React.FC<{ f: number; dark: boolean }> = ({ f, dark }) => {
  const blink = !dark && Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: W / 2, top: 1010, transform: `translateX(-50%) scale(${sp(f, { damping: 9 })})`,
      padding: "18px 50px", borderRadius: 16, border: "6px solid #333", fontFamily: EN, fontSize: 76, fontWeight: 900, letterSpacing: 6,
      background: dark ? "#2a2a2a" : blink ? "#ff4b3a" : "#b8261b", color: dark ? "#555" : "#fff",
      boxShadow: dark ? "none" : "0 0 50px rgba(255,80,60,.9)" }}>
      APPLAUSE
    </div>
  );
};

const Chirps: React.FC<{ f: number }> = ({ f }) => (
  <>
    {[0, 1, 2, 3, 4].map((i) => {
      const d = f - i * 12;
      if (d < 0) return null;
      return (
        <div key={i} style={{ position: "absolute", left: 120 + ((i * 233) % 760), top: 914 - d * 3, fontFamily: EN, fontStyle: "italic",
          fontSize: 40, color: "#d8f0c0", textShadow: "0 2px 8px #000", opacity: interpolate(d, [0, 6, 30, 44], [0, 1, 1, 0], clamp) }}>
          chirp…
        </div>
      );
    })}
    <Pill style={{ left: W / 2, top: 1150, transform: `translateX(-50%) scale(${sp(f - 10, { damping: 9 })})`, fontFamily: EN }}>
      Applause received: <span style={{ color: C.red }}>0</span>
    </Pill>
  </>
);

const VsCard: React.FC<{ f: number; frames: number; label: string; top: Half; bottom: Half }> = ({ f, frames, label, top, bottom }) => {
  const t = sp(f, { damping: 13 });
  const b = sp(f - 6, { damping: 13 });
  const vs = sp(f - 14, { damping: 6, stiffness: 260 });
  const out = interpolate(f, [frames - 8, frames], [1, 0], clamp);
  const half = (h: Half, k: number, dir: number) => (
    <div style={{ flex: 1, background: h.bg, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24, transform: `translateX(${(1 - k) * dir * 1100}px)`, fontFamily: EN }}>
      {h.icon}
      <div style={{ fontSize: 44, opacity: 0.9 }}>{h.who}{label}</div>
      <div style={{ fontSize: 100, fontWeight: 900 }}>{h.goal}</div>
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

const Hands = () => (
  <svg width="220" height="140" viewBox="0 0 110 70">
    {[0, 1].map((i) => (
      <g key={i} transform={`translate(${i * 54} 0) rotate(${i ? 12 : -12} 28 40)`}>
        <rect x="14" y="20" width="30" height="40" rx="12" fill={C.yellow} stroke="#111" strokeWidth="4" />
        {[0, 1, 2].map((k) => <line key={k} x1={20 + k * 8} y1="20" x2={20 + k * 8} y2="6" stroke="#111" strokeWidth="5" strokeLinecap="round" />)}
      </g>
    ))}
    {[0, 1, 2].map((i) => <line key={`l${i}`} x1={55} y1={6 + i * 4} x2={45 + i * 10} y2={0} stroke="#fff" strokeWidth="3" />)}
  </svg>
);
const Door = () => (
  <svg width="160" height="170" viewBox="0 0 80 85">
    <rect x="10" y="5" width="44" height="76" fill="#fff" stroke="#111" strokeWidth="4" />
    <path d="M10 5 L40 14 L40 85 L10 81 Z" fill={C.yellow} stroke="#111" strokeWidth="4" />
    <circle cx="35" cy="48" r="3" fill="#111" />
    <path d="M58 44 H76 M68 36 L76 44 L68 52" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const OnAir: React.FC<{ f: number; off: boolean; label?: string }> = ({ f, off, label = "ON AIR" }) => {
  const glow = 0.7 + 0.3 * Math.sin(f / 5);
  return (
    <div style={{ position: "absolute", left: W / 2, top: 1010, transform: `translateX(-50%) scale(${sp(f, { damping: 10 })})`, display: "flex",
      alignItems: "center", gap: 20, padding: "14px 40px", borderRadius: 14, border: "6px solid #222", fontFamily: EN, fontSize: 64, fontWeight: 900,
      letterSpacing: 6, background: off ? "#333" : "#d8261b", color: off ? "#666" : "#fff",
      boxShadow: off ? "none" : `0 0 ${40 * glow}px rgba(255,60,40,.9)` }}>
      <svg width="70" height="70" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="6" fill={off ? "#666" : "#fff"} />
        {[10, 16].map((rr) => <path key={rr} d={`M${20 - rr} 20 A${rr} ${rr} 0 0 1 ${20 + rr} 20`} fill="none" stroke={off ? "#666" : "#fff"} strokeWidth="3" opacity={off ? 1 : glow} />)}
      </svg>
      {label}
    </div>
  );
};

const CutOff: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", left: 80, right: 190, top: 980, transform: `scale(${sp(f, { damping: 9 })}) rotate(-2deg)` }}>
    <div style={{ position: "relative", background: "#fff", border: "5px solid #111", borderRadius: 40, padding: "20px 30px", fontFamily: EN,
      fontSize: 50, fontWeight: 900, textAlign: "center", color: "#111" }}>
      “Too much trouble. Forget it.”
      <div style={{ position: "absolute", left: 20, right: 20, top: "50%", height: 10, background: C.red, borderRadius: 5,
        transform: `scaleX(${interpolate(f, [16, 28], [0, 1], clamp)}) rotate(-4deg)`, transformOrigin: "left" }} />
    </div>
    <div style={{ marginTop: 14, textAlign: "center", fontFamily: EN, fontSize: 34, fontWeight: 800, color: "#fff", textShadow: "0 3px 8px #000",
      opacity: interpolate(f, [24, 32], [0, 1], clamp) }}>her idea · interrupted</div>
  </div>
);

const MicOff = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
    <rect x="8" y="2" width="8" height="13" rx="4" fill={C.blue} />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v4" fill="none" stroke={C.blue} strokeWidth="2" />
    <path d="M3 3 L21 21" stroke={C.red} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const IntroChips: React.FC<{ f: number; len: number }> = ({ f, len }) => {
  const chips: [string, number][] = [["Name", 0.22 * len], ["Basketball", 0.45 * len], ["Nervous, but trying", 0.9 * len]];
  const wob = (k: number) => Math.sin(f / 2.2 + k) * 10;
  return (
    <div style={{ position: "absolute", left: 80, right: 190, top: 1000, fontFamily: EN }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
        {chips.map(([t, d], i) => {
          const on = f >= d;
          return (
            <span key={t} style={{ fontSize: 34, fontWeight: 900, padding: "8px 20px", borderRadius: 30, border: "4px solid #111",
              background: on ? "#7dffa0" : "rgba(255,255,255,.75)", color: "#111", transform: `scale(${on ? sp(f - d, { damping: 7 }) : 0.9})` }}>
              {on ? "✓ " : `${i + 1}. `}{t}
            </span>
          );
        })}
      </div>
      <svg width="810" height="80" viewBox="0 20 980 80" preserveAspectRatio="none" style={{ marginTop: 8 }}>
        <path d={`M0 60 ${new Array(48).fill(0).map((_, i) => `L${(i + 1) * 20} ${60 + Math.sin(i * 1.3 + f / 2) * (18 + wob(i))}`).join(" ")}`}
          fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity={0.85} />
      </svg>
    </div>
  );
};

const ConfidenceBars: React.FC<{ f: number }> = ({ f }) => {
  const g = interpolate(f, [30, 80], [0.15, 0.9], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const shake = Math.sin(f * 1.9) * 6 * interpolate(f, [0, 40], [1, 0.4], clamp);
  return (
    <Card f={f} life={9999} style={{ fontFamily: EN, top: 858 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 900 }}>
        <span style={{ width: 260 }}>Voice</span>
        <span style={{ color: C.blue, transform: `translateX(${shake}px)`, display: "inline-block" }}>~ shaking ~</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 900, marginTop: 16 }}>
        <span style={{ width: 260 }}>Confidence</span>
        <div style={{ flex: 1, height: 36, borderRadius: 18, border: "4px solid #111", overflow: "hidden" }}>
          <div style={{ width: `${g * 100}%`, height: "100%", background: "linear-gradient(90deg,#f1d17f,#e0604a)" }} />
        </div>
        <span style={{ color: C.red, opacity: f >= 60 ? 1 : 0 }}>▲</span>
      </div>
    </Card>
  );
};

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
