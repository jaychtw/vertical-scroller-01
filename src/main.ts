import Phaser from "phaser";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "./style.css";
import { OdysseyScene } from "./game/scene";
import { C } from "./game/config";
void Promise.all([
  document.fonts.load('800 56px "Barlow Condensed"'),
  document.fonts.load('500 16px "Space Grotesk"'),
]).then(
  () =>
    new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: C.width,
      height: C.height,
      backgroundColor: "#142439",
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: C.width,
        height: C.height,
      },
      render: { antialias: false, pixelArt: true },
      scene: [OdysseyScene],
      input: { keyboard: false },
      audio: { noAudio: true },
    }),
);
