import { hamiVuex } from "@/store";

const CONFIG_NAME = "ct-config"

const localConfig = localStorage.getItem(CONFIG_NAME)

interface ConfigState  {
  locale: string,
  installPath: string
}

export const configStore = hamiVuex.store({
  $name: "config",
  $state: () => {
    
    return {
      locale: "en",
      installPath:"",
      ...(
        localConfig ? JSON.parse(localConfig) : {}
      ),
    } as ConfigState
  },
  setLocale(locale: string) {
    this.$patch((state) => {
      state.locale = locale;
      localStorage.setItem(CONFIG_NAME, JSON.stringify(state))
    })
  },
  async setInstallPath(path: string) {
    this.$patch((state) => {
      state.installPath = path
      localStorage.setItem(CONFIG_NAME, JSON.stringify(state))
    })
  },
})
