import { createApp } from "vue"
import App from "./App.vue"
import { hamiVuex } from "@/store";
import router from "@/router";
import "./samples/node-api"
import "uno.css"

createApp(App)
  .use(hamiVuex)
  .use(router)
  .mount("#app")
  .$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*")
  })
