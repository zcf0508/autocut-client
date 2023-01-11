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
import vueI18n from "@intlify/vite-plugin-vue-i18n"

rmSync("dist-electron", { recursive: true, force: true })

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: false, // 不使用 Options Api
  },
  test: {
    alias: [
      {find: "@", replacement: path.resolve(__dirname, "./src/renderer/")},
      {find: "~~", replacement: path.resolve(__dirname, "./src/main/")},
    ],
  },
  plugins: [
    vue(),
    vueI18n({
      include: path.resolve(__dirname, "./src/renderer/i18n/**"),
    }),
    AutoImport({
      /* options */
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
      ],
      imports: ["vue", "vue-router", "@vueuse/core", "vitest", "vue-i18n"],
      dirs: ["src/renderer/hooks", "src/renderer/store", "src/renderer/utils", "src/renderer/api"],
      dts: true,
    }),
    Components({
      /* options */
      dirs: ["src/renderer/components"],
      extensions: ["vue"],
      deep: true,
      dts: true,
      resolvers: [],
    }),
    UnoCSS(),
    electron({
      include: ["src/main"],
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
          {find: "~~", replacement: path.resolve(__dirname, "./src/main")},
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
      {find: "vue-i18n", replacement: "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js"},
      {find: "@", replacement: path.resolve(__dirname, "./src/renderer/")},
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
