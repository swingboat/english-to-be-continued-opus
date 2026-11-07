import path from "node:path";
import { Config } from "@remotion/cli/config";

// Reuse the headless browser downloaded at the workspace root instead of one per episode.
Config.setBrowserExecutable(
  path.resolve(
    process.cwd(),
    "../../../node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell",
  ),
);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(6);
Config.setEntryPoint("src/index.ts");
