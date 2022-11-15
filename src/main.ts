import { createApp } from "vue"
import App from "./App.vue"
import { hamiVuex } from "@/store";
import router from "@/router";
import "./samples/node-api"
import "uno.css"
import { AVPlugin } from "vue-audio-visual"

createApp(App)
  .use(hamiVuex)
  .use(router)
  .use(AVPlugin)
  .mount("#app")
  .$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*")
  })
