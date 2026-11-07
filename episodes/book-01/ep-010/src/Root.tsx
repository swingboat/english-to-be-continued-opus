import React from "react";
import { Composition } from "remotion";
import { Episode } from "./Episode";
import { FPS, H, TL, W } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="Ep010" component={Episode} durationInFrames={TL.total} fps={FPS} width={W} height={H} />
);
