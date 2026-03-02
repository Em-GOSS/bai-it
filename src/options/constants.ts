import type { ProviderKey, PatternKey } from "../shared/types.ts";

/** Provider 显示名 + 可用模型列表 + 提示文字 */
export const PROVIDER_INFO: Record<
  ProviderKey,
  { label: string; models: string[]; hint: string }
> = {
  gemini: {
    label: "Gemini",
    models: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"],
    hint: "掰句消耗 token 很少，Flash 足够且免费额度高。想要更准可以选 Pro。",
  },
  chatgpt: {
    label: "ChatGPT",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1-nano"],
    hint: "推荐 4o-mini，性价比最高。",
  },
  deepseek: {
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    hint: "国产模型，价格便宜，中文理解好。",
  },
  qwen: {
    label: "Qwen",
    models: ["qwen-turbo", "qwen-plus", "qwen-max"],
    hint: "阿里通义千问，turbo 最快最便宜。",
  },
  kimi: {
    label: "Kimi",
    models: ["moonshot-v1-8k", "moonshot-v1-32k"],
    hint: "月之暗面，长文本能力强。",
  },
};

/** 句式 key → 中文名映射 */
export const PATTERN_LABELS: Record<PatternKey, string> = {
  insertion: "插入补充",
  background_first: "先说背景",
  nested: "层层嵌套",
  long_list: "超长列举",
  inverted: "倒装",
  long_subject: "超长主语",
  omission: "省略",
  contrast: "对比转折",
  condition: "条件假设",
  long_modifier: "超长修饰",
  other: "其他",
};
