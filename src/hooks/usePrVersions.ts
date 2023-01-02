import type { PrVersion } from "@/interface/adobe"
import { getPrVersions } from "@/interface/adobe"

export function usePrVersions(){
  const prVersions = ref([] as Array<PrVersion>)

  const checkPrVersions = async () => {
    prVersions.value = await getPrVersions()
  }

  return {
    prVersions,
    checkPrVersions,
  }
}