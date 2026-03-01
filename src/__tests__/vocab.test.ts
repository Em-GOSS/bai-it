import { describe, it, expect, beforeEach } from "vitest";
import {
  loadFrequencyList,
  loadDictionary,
  loadIndustryPack,
  annotateWords,
  isCommonWord,
  toNewWordsFormat,
  resetAll,
} from "../shared/vocab";

import frequencyWords from "../../tests/fixtures/word-frequency-test.json";
import dictEntries from "../../tests/fixtures/dict-test.json";
import aiTerms from "../../tests/fixtures/industry-ai-test.json";

beforeEach(() => {
  resetAll();
  loadFrequencyList(frequencyWords);
  loadDictionary(dictEntries);
  loadIndustryPack("ai", aiTerms);
});

// ========== 验收标准：词频过滤 ==========

describe("词频过滤", () => {
  it("常用词不标注", () => {
    const result = annotateWords(
      "The team will develop a new project for the company.",
      new Set(),
    );
    // "team", "develop", "project", "company" 都在常用词表中
    const annotatedWords = result.map(a => a.word);
    expect(annotatedWords).not.toContain("team");
    expect(annotatedWords).not.toContain("develop");
    expect(annotatedWords).not.toContain("project");
    expect(annotatedWords).not.toContain("company");
  });

  it("超出词频表的词标注", () => {
    const result = annotateWords(
      "The algorithm uses a heuristic approach to refactor the codebase.",
      new Set(),
    );
    const annotatedWords = result.map(a => a.word);
    expect(annotatedWords).toContain("algorithm");
    expect(annotatedWords).toContain("heuristic");
    expect(annotatedWords).toContain("refactor");
  });

  it("isCommonWord 正确判断", () => {
    expect(isCommonWord("the")).toBe(true);
    expect(isCommonWord("algorithm")).toBe(false);
    expect(isCommonWord("The")).toBe(true); // 大小写不敏感
  });

  it("太短的词不标注", () => {
    const result = annotateWords("Is it OK to go?", new Set());
    const annotatedWords = result.map(a => a.word);
    // "is", "it", "ok", "to", "go" 都太短（< 3 字母）或在常用词中
    expect(annotatedWords.length).toBe(0);
  });

  it("纯数字不标注", () => {
    const result = annotateWords("There are 12345 items.", new Set());
    const annotatedWords = result.map(a => a.word);
    expect(annotatedWords).not.toContain("12345");
  });
});

// ========== 验收标准：行业术语匹配 ==========

describe("行业术语匹配", () => {
  it("AI 术语包中的词优先用行业释义", () => {
    const result = annotateWords(
      "The model suffers from hallucination during inference.",
      new Set(),
      ["ai"],
    );
    const hallucination = result.find(a => a.word === "hallucination");
    expect(hallucination).toBeDefined();
    expect(hallucination!.source).toBe("industry");
    expect(hallucination!.definition).toContain("AI");

    const inference = result.find(a => a.word === "inference");
    expect(inference).toBeDefined();
    expect(inference!.source).toBe("industry");
  });

  it("行业释义优先于通用词典", () => {
    // "latent" 在词典和 AI 术语包中都有
    // 确保词典中也有 latent
    loadDictionary({ ...dictEntries, latent: "adj. 潜伏的，隐藏的" });

    const result = annotateWords(
      "The latent space representation captures semantic features.",
      new Set(),
      ["ai"],
    );
    const latent = result.find(a => a.word === "latent");
    expect(latent).toBeDefined();
    expect(latent!.source).toBe("industry"); // 行业优先
  });

  it("未启用的术语包不生效", () => {
    const result = annotateWords(
      "The model suffers from hallucination.",
      new Set(),
      [], // 不启用任何术语包
    );
    const hallucination = result.find(a => a.word === "hallucination");
    // hallucination 不在通用词典中，所以不会被标注
    expect(hallucination).toBeUndefined();
  });

  it("多术语包支持", () => {
    loadIndustryPack("finance", {
      derivative: "衍生品，基于基础资产价格的金融合约",
      portfolio: "投资组合，由多种资产构成的集合",
    });

    const result = annotateWords(
      "The portfolio optimization uses gradient descent.",
      new Set(),
      ["ai", "finance"],
    );
    const portfolio = result.find(a => a.word === "portfolio");
    expect(portfolio).toBeDefined();
    expect(portfolio!.source).toBe("industry");

    const gradient = result.find(a => a.word === "gradient");
    expect(gradient).toBeDefined();
    expect(gradient!.source).toBe("industry");
  });
});

// ========== 验收标准：已知词跳过 ==========

describe("已知词跳过", () => {
  it("标记为已掌握的词不再标注", () => {
    const known = new Set(["algorithm", "refactor"]);
    const result = annotateWords(
      "The algorithm helps refactor the infrastructure for better deployment.",
      known,
    );
    const annotatedWords = result.map(a => a.word);
    expect(annotatedWords).not.toContain("algorithm");
    expect(annotatedWords).not.toContain("refactor");
    // infrastructure 和 deployment 不在已知词中，应该被标注
    expect(annotatedWords).toContain("infrastructure");
    expect(annotatedWords).toContain("deployment");
  });

  it("已知词大小写不敏感", () => {
    const known = new Set(["algorithm"]);
    const result = annotateWords("Algorithm is important.", known);
    const annotatedWords = result.map(a => a.word);
    expect(annotatedWords).not.toContain("algorithm");
  });

  it("空已知词集不影响标注", () => {
    const result = annotateWords(
      "The algorithm uses heuristic methods.",
      new Set(),
    );
    expect(result.length).toBeGreaterThan(0);
  });
});

// ========== 辅助功能 ==========

describe("辅助功能", () => {
  it("toNewWordsFormat 正确转换", () => {
    const annotations = annotateWords(
      "The algorithm uses immutable data.",
      new Set(),
    );
    const newWords = toNewWordsFormat(annotations);
    expect(newWords.length).toBe(annotations.length);
    for (const nw of newWords) {
      expect(nw).toHaveProperty("word");
      expect(nw).toHaveProperty("definition");
    }
  });

  it("同一词不重复标注", () => {
    const result = annotateWords(
      "The algorithm is a good algorithm. Another algorithm here.",
      new Set(),
    );
    const algorithmAnnotations = result.filter(a => a.word === "algorithm");
    expect(algorithmAnnotations.length).toBe(1);
  });

  it("未加载数据时返回空数组", () => {
    resetAll();
    const result = annotateWords("The algorithm is great.", new Set());
    expect(result).toEqual([]);
  });

  it("无英文单词的文本返回空", () => {
    const result = annotateWords("这是一段中文文本 12345", new Set());
    expect(result).toEqual([]);
  });
});
