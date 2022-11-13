import { hamiVuex } from "@/store";

const CONFIG_NAME = "ct-config"

const localConfig = localStorage.getItem(CONFIG_NAME)

interface ConfigState  {
  installPath: string
}

export const configStore = hamiVuex.store({
  $name: "config",
  $state: () => {
    
    return {
      installPath:"",
      ...(
        localConfig ? JSON.parse(localConfig) : {}
      ),
    } as ConfigState
  },
  async setInstallPath(path: string) {
    this.$patch((state) => {
      state.installPath = path
      localStorage.setItem(CONFIG_NAME, JSON.stringify(state))
    })
  },
})