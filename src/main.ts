import { createApp } from "vue"
import App from "@/App.vue"
import { hamiVuex } from "@/store";
import router from "@/router";
import "@/samples/node-api"
import "uno.css"
// @ts-ignore
import { AVPlugin } from "vue-audio-visual"
import i18n from "@/i18n";

createApp(App)
  .use(hamiVuex)
  .use(router)
  .use(AVPlugin)
  .use(i18n)
  .mount("#app")
  .$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*")
  })
