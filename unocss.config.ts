import { defineConfig, presetUno, presetIcons } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      // 其他选项
      prefix: "i-",
      extraProperties: {
        display: "inline-block",
      },
    }),
  ],
});
