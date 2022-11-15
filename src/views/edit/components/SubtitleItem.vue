<script setup lang="ts">
import { formatTimestamp  } from "subtitle"
import { PropType } from "vue"

export interface SrtItem {
  type: "cue"
  data: {
    start: number
    end: number
    text: string
  }
  checked: boolean
}

const props = defineProps({
  node: {
    type: Object as PropType<SrtItem>,
    required: true,
  },
  index:{
    type: Number,
    required: true,
  },
})

const emits = defineEmits(["change"])

const change = () => {
  emits("change", props.index)
}
</script>

<template>
  <div class="flex justify-between
    m-2 py-4 
    bg-white
    border border-solid border-[#F0F0F0] rounded-[4px]
    cursor-pointer
    leading-6"
  >
    <div class="w-[64px] flex justify-center items-center" @click.stop="change">
      <input type="checkbox" :checked="node.checked" />
    </div>
    <div class="w-[calc(100%-64px)]">
      <div>{{ `${formatTimestamp(node.data.start)} - ${formatTimestamp(node.data.end)}` }}</div>
      <div class="mt-2 pr-2">
        {{ node.data.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>