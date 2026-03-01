/**
 * 生词标注系统
 *
 * 三层词汇源（优先级从高到低）：
 * 1. 行业术语包 — 用行业语境释义
 * 2. 通用离线词典 — 基础释义
 * 3. LLM 语境化释义 — 仅在调 LLM 时获得
 *
 * 过滤规则：
 * - 常用词（词频表内）不标注
 * - 用户已标记"已掌握"的词不标注
 * - 太短的词（< 3 字母）不标注
 */

// ========== 类型 ==========

export interface VocabAnnotation {
  word: string;
  definition: string;
  source: "industry" | "dictionary";
}

// ========== 数据存储 ==========

let frequencySet: Set<string> | null = null;
let dictMap: Map<string, string> | null = null;
const industryMaps = new Map<string, Map<string, string>>();

// ========== 数据加载 ==========

/**
 * 初始化词频表
 * @param words 常用词数组
 */
export function loadFrequencyList(words: string[]): void {
  frequencySet = new Set(words.map(w => w.toLowerCase()));
}

/**
 * 初始化通用词典
 * @param entries word → definition 映射对象
 */
export function loadDictionary(entries: Record<string, string>): void {
  dictMap = new Map();
  for (const [word, def] of Object.entries(entries)) {
    dictMap.set(word.toLowerCase(), def);
  }
}

/**
 * 加载行业术语包
 * @param packName 术语包名称（如 "ai"）
 * @param entries word → definition 映射对象
 */
export function loadIndustryPack(packName: string, entries: Record<string, string>): void {
  const map = new Map<string, string>();
  for (const [word, def] of Object.entries(entries)) {
    map.set(word.toLowerCase(), def);
  }
  industryMaps.set(packName, map);
}

/**
 * 检查数据是否已加载
 */
export function isLoaded(): boolean {
  return frequencySet !== null && dictMap !== null;
}

// ========== 核心逻辑 ==========

/** 不标注的词：太短、纯数字、含特殊字符 */
function shouldSkipWord(word: string): boolean {
  if (word.length < 3) return true;
  if (/^\d+$/.test(word)) return true;
  if (/[^a-zA-Z'-]/.test(word)) return true;
  return false;
}

/** 检查是否为常用词 */
export function isCommonWord(word: string): boolean {
  if (!frequencySet) return false;
  return frequencySet.has(word.toLowerCase());
}

/** 在行业术语包中查找 */
function lookupIndustry(word: string, packs: string[]): string | null {
  const lower = word.toLowerCase();
  for (const pack of packs) {
    const map = industryMaps.get(pack);
    if (map?.has(lower)) {
      return map.get(lower)!;
    }
  }
  return null;
}

/** 在通用词典中查找 */
function lookupDictionary(word: string): string | null {
  if (!dictMap) return null;
  return dictMap.get(word.toLowerCase()) ?? null;
}

/**
 * 标注文本中的生词
 *
 * @param text 要标注的文本
 * @param knownWords 用户已掌握的词（Set<lowercase word>）
 * @param industryPacks 启用的行业术语包名称列表
 * @returns 需要标注的生词及释义
 */
export function annotateWords(
  text: string,
  knownWords: Set<string>,
  industryPacks: string[] = ["ai"],
): VocabAnnotation[] {
  if (!frequencySet || !dictMap) return [];

  // 提取所有英文单词（去重）
  const wordMatches = text.match(/\b[a-zA-Z][a-zA-Z'-]*[a-zA-Z]\b|[a-zA-Z]{3,}\b/g);
  if (!wordMatches) return [];

  const seen = new Set<string>();
  const annotations: VocabAnnotation[] = [];

  for (const word of wordMatches) {
    const lower = word.toLowerCase();

    // 去重
    if (seen.has(lower)) continue;
    seen.add(lower);

    // 跳过条件
    if (shouldSkipWord(word)) continue;
    if (isCommonWord(word)) continue;
    if (knownWords.has(lower)) continue;

    // 查找释义：行业术语优先
    const industryDef = lookupIndustry(word, industryPacks);
    if (industryDef) {
      annotations.push({ word: lower, definition: industryDef, source: "industry" });
      continue;
    }

    // 通用词典
    const dictDef = lookupDictionary(word);
    if (dictDef) {
      annotations.push({ word: lower, definition: dictDef, source: "dictionary" });
    }
    // 无释义来源 → 不标注（不猜测）
  }

  return annotations;
}

/**
 * 将 VocabAnnotation[] 转为 ChunkResult.newWords 格式
 */
export function toNewWordsFormat(
  annotations: VocabAnnotation[],
): { word: string; definition: string }[] {
  return annotations.map(a => ({
    word: a.word,
    definition: a.definition,
  }));
}

// ========== 重置（测试用）==========

export function resetAll(): void {
  frequencySet = null;
  dictMap = null;
  industryMaps.clear();
}
