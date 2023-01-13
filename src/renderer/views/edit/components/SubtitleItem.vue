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
  checked?: boolean
}

const props = defineProps({
  node: {
    type: Object as PropType<SrtItem>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  selected: {
    type: Boolean,
    required: true,
  },
})

const emits = defineEmits(["change", "edit"])

const change = () => {
  emits("change", props.index)
}
const textareaRef = ref<HTMLTextAreaElement>()
const textarea_height = ref(0)

const itemRef = ref<HTMLElement>()

watch(
  () => props.selected,
  (val) => {
    if(val) {
      nextTick(()=>{
        if (
          itemRef.value 
          && (itemRef.value?.getBoundingClientRect().top < 0 
          || itemRef.value?.getBoundingClientRect().bottom > window.innerHeight - 64)
        ) {
          itemRef.value?.scrollIntoView({
            behavior: "smooth",
          })
        }
      })
    }
  },
)

const changeTextareaHeight = (e:Event) => {
  textarea_height.value = (e.target as HTMLInputElement).scrollHeight
}

const stop = inject<{stop:()=>any}>("STOP")
const stopPlay = () => {
  stop && stop.stop()
}

onMounted(()=>{
  nextTick(()=>{
    if(textareaRef.value) {
      textarea_height.value = textareaRef.value.scrollHeight
      textareaRef.value.addEventListener("input", changeTextareaHeight)
      textareaRef.value.addEventListener("focus", stopPlay)
    }
  })
})

onUnmounted(()=>{
  textareaRef.value?.removeEventListener("input", changeTextareaHeight)
  textareaRef.value?.removeEventListener("focus", stopPlay)
})

const input = (e: Event) => {
  emits("edit", props.index, (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex justify-between
    m-2 py-4 
    bg-white
    border border-solid  rounded-[4px]
    cursor-pointer
    leading-6"
    :class="selected ? 'border-[#0063b1]' : 'border-[#F0F0F0]'"
    ref="itemRef"
  >
    <div class="w-[64px] flex justify-center items-center" @click.stop="change">
      <input type="checkbox" :checked="node.checked" />
    </div>
    <div class="w-[calc(100%-64px)]">
      <div>{{ `${formatTimestamp(node.data.start)} - ${formatTimestamp(node.data.end)}` }}</div>
      <div class="mt-2 pr-2">
        <textarea 
          ref="textareaRef"
          class="edit border-none w-full text-[14px] p-0"
          :style="`height: ${textarea_height}px`"
          :value="node.data.text" 
          row="2"
          @input="input" 
          @click.stop.prevent 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit {
  font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC",
    "Source Han Sans SC", "Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei",
    "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp", sans-serif !important;
}
.edit:focus {
  outline: none;
}
</style>
