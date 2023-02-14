export type AutocutConfig = {
  device: "cpu" | "cuda",
  whisperModel: "tiny" | "base" | "small" | "medium" | "large",
  lang: "en" | "zh" | "ja",
}
