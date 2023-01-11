// store/index.js
import { createHamiVuex } from "hami-vuex";
import { CONFIG_NAME } from "./config";

type State = {
  config: typeof import("./config").configStore
  status: typeof import("./status").statusStore
}

export const hamiVuex = createHamiVuex<State>({
  /* 可选：Vuex Store 的构造参数 */
});


hamiVuex.vuexStore.subscribe((mutation, state) => {
  // config 更新之后
  if (mutation.type.startsWith("config")){
    // 自动保存到 localStorage
    localStorage.setItem(CONFIG_NAME, JSON.stringify(state.config))
  }
})
