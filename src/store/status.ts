import { hamiVuex } from "@/store";

export const statusStore = hamiVuex.store({
  $name:"status",
  $state: () => {
    return {
      ffmpegStatus: false,
      autocutStatus: false,
    }
  },
  setFFmpeg(status: boolean) {
    this.$patch(state => {
      state.ffmpegStatus = status
    })
  },
  setAutocut(status: boolean) {
    this.$patch(state => {
      state.autocutStatus = status
    })
  },
})