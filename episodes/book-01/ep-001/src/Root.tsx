import React from "react";
import { Composition } from "remotion";
import { Ep001 } from "./Ep001";
import { FPS, H, TL, W } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="Ep001" component={Ep001} durationInFrames={TL.total} fps={FPS} width={W} height={H} />
);
