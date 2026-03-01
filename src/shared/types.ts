// ========== 阅读模式 ==========

export type ReadingMode = "scan" | "deep";

// ========== LLM 配置 ==========

export interface LLMConfig {
  format: "gemini" | "openai-compatible";
  apiKey: string; // AES 加密存储
  baseUrl: string; // OpenAI 兼容格式需要，Gemini 用默认值
  model: string;
}

// ========== 插件配置 ==========

export interface OpenEnConfig {
  llm: LLMConfig;
  sensitivity: number; // 2-5，细读模式复杂度阈值
  scanThreshold: "short" | "medium" | "long"; // 扫读模式最小词数阈值
  chunkGranularity: "coarse" | "medium" | "fine"; // 拆分颗粒度
  chunkIntensity: number; // 1-5，渲染力度
  disabledSites: string[]; // hostname 黑名单
  industryPacks: string[]; // 勾选的行业术语包，如 ["ai"]
}

export const DEFAULT_CONFIG: OpenEnConfig = {
  llm: {
    format: "gemini",
    apiKey: "",
    baseUrl: "",
    model: "gemini-2.0-flash",
  },
  sensitivity: 3,
  scanThreshold: "medium",
  chunkGranularity: "fine",
  chunkIntensity: 5,
  disabledSites: [],
  industryPacks: ["ai"],
};

// ========== Content Script ↔ Service Worker 消息 ==========

export type Message =
  | { type: "chunk"; sentences: string[]; mode: ReadingMode; source_url?: string }
  | { type: "getConfig" }
  | { type: "updateConfig"; config: Partial<OpenEnConfig> }
  | { type: "checkActive" }
  | { type: "toggleSite"; hostname: string }
  | { type: "pauseTab"; tabId: number }
  | { type: "resumeTab"; tabId: number }
  | { type: "getTabState"; tabId: number; hostname: string };

export type BackgroundMessage =
  | { type: "activate" }
  | { type: "deactivate" }
  | { type: "pause" }
  | { type: "resume" };

// ========== 分块结果 ==========

export interface ChunkResult {
  original: string;
  chunked: string;
  isSimple: boolean;
  newWords: { word: string; definition: string }[];
  sentenceAnalysis?: string;
  expressionTips?: string;
}

// ========== 缓存 ==========

export interface CacheEntry {
  hash: string;
  result: ChunkResult;
  timestamp: number;
}

export const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天
