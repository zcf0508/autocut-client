/// <reference types="vitest" />

import { rmSync } from "fs"
import * as path from "path";
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import electron from "vite-plugin-electron"
import renderer from "vite-plugin-electron-renderer"
import pkg from "./package.json"
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";
import vueI18n from "@intlify/vite-plugin-vue-i18n"

rmSync("dist-electron", { recursive: true, force: true })
const sourcemap = !!process.env.VSCODE_DEBUG
const isBuild = process.argv.slice(2).includes("build")

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VUE_OPTIONS_API__: false, // 不使用 Options Api
  },
  test: {
    include: ["./test/**/*.spec.ts"],
    alias: [
      {find: "@", replacement: path.resolve(__dirname, "./src/renderer/")},
      {find: "~~", replacement: path.resolve(__dirname, "./src/main/")},
    ],
    globals: true,
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
      imports: ["vue", "vue-router", "@vueuse/core", "vue-i18n"],
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
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: "src/main/main/index.ts",
        onstart(options) {
          if (process.env.VSCODE_DEBUG) {
            console.log(/* For `.vscode/.debug.script.mjs` */"[startup] Electron App")
          } else {
            options.startup()
          }
        },
        vite: {
          resolve:{
            alias: [
              {find: "~~", replacement: path.resolve(__dirname, "./src/main/")},
            ],
          },
          build: {
            sourcemap,
            minify: isBuild,
            outDir: "dist-electron/main",
            rollupOptions: {
              external: Object.keys(pkg.dependencies),
            },
          },
        },
      },
      {
        entry: "src/main/preload/index.ts",
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
          // instead of restarting the entire Electron App.
          options.reload()
        },
        vite: {
          build: {
            sourcemap,
            minify: isBuild,
            outDir: "dist-electron/preload",
            rollupOptions: {
              external: Object.keys(pkg.dependencies),
            },
          },
        },
      },
    ]),
    // Use Node.js API in the Renderer-process
    renderer({
      nodeIntegration: true,
      optimizeDeps: {
        include: [
          "fs/promises",
          "process",
          "path",
          "fs",
          "os",
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
