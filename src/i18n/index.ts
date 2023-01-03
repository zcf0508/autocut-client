import { createI18n } from "vue-i18n";
import zh from "./zh.json"
import en from "./en.json"

export const LOCALES = [
  {
    name: "English",
    locale: "en",
  }, {
    name: "中文",
    locale: "zh",
  },
]

const i18n = createI18n({
  legacy: false, 
  locale: "en",
  messages: {
    en: en,
    zh: zh,
  },
})

export default i18n 
