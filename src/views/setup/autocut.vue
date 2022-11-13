<script setup lang="ts">
import { ipcRenderer } from "electron"

const installPath = ref("")

const selectDirectory = ()=>{
  ipcRenderer.invoke("select-autocut-save-directory").then((path) => {
    installPath.value = path.filePaths[0]
  })
}

</script>

<template>
  <div >
    <div @click="selectDirectory">选择安装路径</div>
    {{ installPath }}
    <button @click="$router.push('/status')">返回首页</button>
  </div>
</template>

<style scoped>

</style>