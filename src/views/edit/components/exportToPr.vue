<script setup lang="ts">
import { debounce } from "lodash-es"
import * as fs from "fs"
import path from "path"
import { stringifySync } from "subtitle"
import { exportToPr, selectPrprojSaveDirectory } from "@/interface/adobe"

const showDialog = ref(false)
const { prVersions, checkPrVersions } = usePrVersions()
checkPrVersions()
const selectedVersion = ref("")

const emits = defineEmits(["open", "close"])
const openDialog = ()=>{
  showDialog.value = true
  emits("open")
}

const closeDialog = ()=>{
  showDialog.value = false
  emits("close")
}

const targetPath = ref("")
const selectDirectory = () => {
  selectPrprojSaveDirectory().then((path) => {
    if (path?.filePaths?.[0]) {
      targetPath.value = path.filePaths[0]
    }
  })
}
const debounceSelectDirectory = debounce(selectDirectory, 500)

const props = defineProps({
  filePath: {
    type: String,
    required: true,
  },
  editedSrt: {
    type: Array<any>,
    required: true,
  },
})

const startExport = ()=>{
  if(!targetPath.value || !selectedVersion.value) {
    return
  }
  
  const cutSrtPath = path.join(targetPath.value, "cuted.srt")
  fs.writeFileSync(
    cutSrtPath, 
    stringifySync(props.editedSrt, { format: "SRT" }), 
    "utf-8",
  )
  const clipPoints = [] as Array<string>
  
  props.editedSrt.forEach((item, index) => {
    if(index < props.editedSrt.length - 1 && props.editedSrt[index+1]?.data.start - item.data.end > 1000) {
      clipPoints.push("" + item.data.end / 1000)
      clipPoints.push("" + props.editedSrt[index+1].data.start / 1000)
    }
  })

  exportToPr(
    targetPath.value,
    props.filePath,
    cutSrtPath,
    clipPoints, 
    selectedVersion.value,
  ).then(()=>{
    alert("任务已发送到 Pr ，请切换至 Pr 查看")
  }).catch(err => {
    alert(err)
  })
}
</script>

<template>
  <button
    class="h-[40px] w-[45%] px-2
      bg-[#0063b1] text-white 
      rounded-[4px] border-none  whitespace-nowrap 
      cursor-pointer"
    @click="openDialog"
  >
    导出到 Pr 工程
  </button>
  <div 
    v-if="showDialog" 
    class="fixed top-0 right-0 bottom-0 left-0 bg-[rgba(0,0,0,0.3)] z-50" 
    @click.stop="closeDialog"
  >
    <div class="h-full w-full flex justify-center items-center">
      <div class="w-1/2 h-1/2 bg-white rounded-[4px] p-6" @click.prevent.stop>
        <p class="text-gray-400">请先打开 Pr 再使用导出功能</p>
        <div class="flex items-center my-2">
          <span class="pr-2">请选择当前 Pr 版本</span>
          <select v-model="selectedVersion" class="h-[39px] border border-[#F0F0F0] bg-white rounded-[4px] px-2">
            <option 
              v-for="version in prVersions" 
              :key="version.specifier"
              :value="version.specifier"
            >
              {{ version.name }} 
            </option>
          </select>
        </div>
        <div class="flex items-center my-2">
          <span class="pr-2">请选择保存位置</span>
          <div @click="debounceSelectDirectory">
            <input 
              v-model="targetPath"
              placeholder="请选择文件夹"
              class="h-[39px] border border-[#F0F0F0] bg-white rounded-[4px] px-2"
              disabled
            />
            <button 
              class="h-[40px] bg-[#F0F0F0] ml-4 rounded-[4px] border-none cursor-pointer whitespace-nowrap px-2"
            >
              选择文件夹
            </button>
          </div>
        </div>
        <div>
          <button
            class="h-[40px] w-[45%] px-2
              bg-[#0063b1] text-white 
              rounded-[4px] border-none  whitespace-nowrap 
              cursor-pointer"
            @click="startExport"
          >
            开始导出
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>