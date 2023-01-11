<script setup lang="ts">
const { locale } = useI18n()
if (configStore.locale) {
  locale.value = configStore.locale
}
</script>

<template>
  <router-view></router-view>
</template>

<style>

html {
  height: 100vh;
  width: 100vw;
}

body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #fafafa;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
