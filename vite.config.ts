/// <reference types="vitest" />

import { rmSync } from "fs"
import * as path from "path";
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import electron from "vite-electron-plugin"
import { customStart, loadViteEnv, alias } from "vite-electron-plugin/plugin"
import renderer from "vite-plugin-electron-renderer"
import pkg from "./package.json"
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";

rmSync("dist-electron", { recursive: true, force: true })

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: false, // 不使用 Options Api
  },
  test: {
    alias: [
      {find: "@", replacement: path.resolve(__dirname, "./src/")},
      {find: "~~", replacement: path.resolve(__dirname, "./electron/")},
    ],
  },
  plugins: [
    vue(),
    AutoImport({
      /* options */
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],
      imports: ["vue", "vue-router", "@vueuse/core", "vitest"],
      dirs: ["src/hooks", "src/store", "src/utils", "src/api"],
      dts: true,
    }),
    Components({
      /* options */
      dirs: ["src/components"],
      extensions: ["vue"],
      deep: true,
      dts: true,
      resolvers: [],
    }),
    UnoCSS(),
    electron({
      include: ["electron"],
      transformOptions: {
        sourcemap: !!process.env.VSCODE_DEBUG,
      },
      plugins: [
        ...(process.env.VSCODE_DEBUG
          ? [
            // Will start Electron via VSCode Debug
            customStart(debounce(() => console.log(/* For `.vscode/.debug.script.mjs` */"[startup] Electron App"))),
          ]
          : []),
        // Allow use `import.meta.env.VITE_SOME_KEY` in Electron-Main
        loadViteEnv(),
        alias([
          {find: "~~", replacement: path.resolve(__dirname, "./electron/")},
        ]),
      ],
    }),
    // Use Node.js API in the Renderer-process
    renderer({
      nodeIntegration: true,
      optimizeDeps: {
        include: [
          "fs/promises",
          "process",
          "path",
          "fs",
        ],
      },
    }),
  ],
  server: process.env.VSCODE_DEBUG ? (() => {
    const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
    return {
      host: url.hostname,
      port: +url.port,
    }
  })() : undefined,
  clearScreen: false,
  build: {
    assetsDir: "", // #287
  },
  resolve: {
    alias: [
      {find: "@", replacement: path.resolve(__dirname, "./src/")},
    ],
  },
})

function debounce<Fn extends (...args: any[]) => void>(fn: Fn, delay = 299) {
  let t: NodeJS.Timeout
  return ((...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }) as Fn
}
