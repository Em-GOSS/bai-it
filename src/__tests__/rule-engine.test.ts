import { describe, it, expect } from "vitest";
import {
  isEnglish,
  estimateComplexity,
  needsChunking,
  filterSentences,
  splitSentences,
} from "../shared/rule-engine.ts";

// ========== isEnglish ==========

describe("isEnglish", () => {
  it("纯英文返回 true", () => {
    expect(isEnglish("This is a test sentence.")).toBe(true);
  });

  it("纯中文返回 false", () => {
    expect(isEnglish("这是一个中文句子。")).toBe(false);
  });

  it("太短的文本返回 false", () => {
    expect(isEnglish("Hi")).toBe(false);
  });

  it("空字符串返回 false", () => {
    expect(isEnglish("")).toBe(false);
  });

  it("混合文本以英文为主返回 true", () => {
    expect(isEnglish("This is mainly English 带一点中文")).toBe(true);
  });
});

// ========== estimateComplexity ==========

describe("estimateComplexity", () => {
  // 10 个测试句子，覆盖简单到复杂

  it("短简单句 → 低复杂度 (1)", () => {
    expect(estimateComplexity("I like cats.")).toBe(1);
  });

  it("中等简单句（无从句）→ 低复杂度", () => {
    const score = estimateComplexity("The quick brown fox jumps over the lazy dog.");
    expect(score).toBeLessThanOrEqual(2);
  });

  it("15 词以上简单句 → 长度加分后适中", () => {
    // 15 词，无从句标记词，+1.0 for length
    const score = estimateComplexity(
      "The company announced a new product line featuring several innovative designs for the upcoming season."
    );
    expect(score).toBeGreaterThanOrEqual(2);
  });

  it("25 词以上 → 长度权重生效", () => {
    // ~27 词，无从句
    const score = estimateComplexity(
      "The government recently introduced a comprehensive set of regulations aimed at reducing carbon emissions across all major industrial sectors in the country by the end of next year."
    );
    expect(score).toBeGreaterThanOrEqual(3);
  });

  it("40 词以上长句 → 最高长度加分", () => {
    const longSentence = "The global economic outlook for this year remains uncertain as central banks around the world continue to raise interest rates in an effort to combat persistent inflation while simultaneously trying to avoid pushing their respective economies into a deep and prolonged recession that could affect millions.";
    const score = estimateComplexity(longSentence);
    expect(score).toBeGreaterThanOrEqual(4);
  });

  it("单从句句 → 适中复杂度", () => {
    const score = estimateComplexity(
      "The book that she recommended turned out to be very interesting."
    );
    // 有 "that"，12 词
    expect(score).toBeGreaterThanOrEqual(2);
  });

  it("双从句句 → 较高复杂度", () => {
    const score = estimateComplexity(
      "The researchers who had been studying the effects discovered that the results were significantly different from what they had expected."
    );
    // 有 "who", "that", "what", 多个逗号
    expect(score).toBeGreaterThanOrEqual(3);
  });

  it("多层嵌套句 → 高复杂度", () => {
    const score = estimateComplexity(
      "The company announced that the project, which had been delayed because the team discovered that the original design contained several flaws that could compromise safety, would finally be completed by the end of next quarter."
    );
    // "that" x3, "which", "because" → 高分
    expect(score).toBeGreaterThanOrEqual(5);
  });

  it("含分词短语的句子 → 增加复杂度", () => {
    const score = estimateComplexity(
      "Walking through the park, she noticed a bird, perched on a branch, singing a beautiful melody."
    );
    expect(score).toBeGreaterThanOrEqual(2);
  });

  it("分号和括号增加复杂度", () => {
    const score = estimateComplexity(
      "The results were surprising; however, the team (which included several experts) decided to verify them before publishing."
    );
    // "however", "which", 分号, 括号
    expect(score).toBeGreaterThanOrEqual(3);
  });
});

// ========== 长度权重对比 ==========

describe("长度权重对比", () => {
  it("同样语法复杂度，40 词比 15 词得分明显更高", () => {
    // 简单并列结构，无从句
    const short15 = "The team built a new system and deployed it to production servers last week."; // ~14 词
    const long40 = "The team built a completely new and innovative system using modern cloud technologies and then carefully deployed it to production servers across multiple data centers located in different regions around the world to ensure maximum availability and reliability for their global user base last week."; // ~47 词

    const scoreShort = estimateComplexity(short15);
    const scoreLong = estimateComplexity(long40);

    expect(scoreLong).toBeGreaterThan(scoreShort);
    expect(scoreLong - scoreShort).toBeGreaterThanOrEqual(2); // 至少差 2 层
  });
});

// ========== needsChunking ==========

describe("needsChunking", () => {
  it("英文复杂句在低阈值下需要分块", () => {
    expect(
      needsChunking(
        "The researchers who studied the data found that the results were inconsistent.",
        2
      )
    ).toBe(true);
  });

  it("英文简单句在高阈值下不需要分块", () => {
    expect(needsChunking("I like cats.", 3)).toBe(false);
  });

  it("中文句子不需要分块", () => {
    expect(needsChunking("这是一个复杂的中文句子，虽然它包含很多从句。", 1)).toBe(false);
  });
});

// ========== filterSentences ==========

describe("filterSentences", () => {
  it("正确分离需要处理和跳过的句子", () => {
    const sentences = [
      "I like cats.",
      "The researchers who had been studying the effects of climate change on coral reefs published their findings in a prestigious journal.",
      "这是中文",
    ];

    const result = filterSentences(sentences, 3);
    expect(result.toProcess.length).toBeGreaterThanOrEqual(1);
    expect(result.skipped.length).toBeGreaterThanOrEqual(1);
    expect(result.toProcess.length + result.skipped.length).toBe(3);
  });
});

// ========== splitSentences ==========

describe("splitSentences", () => {
  it("按句号分割多个句子", () => {
    const result = splitSentences("Hello world. This is a test. Final sentence.");
    expect(result).toHaveLength(3);
  });

  it("保留缩写中的句号", () => {
    const result = splitSentences("Dr. Smith went to the U.S. for a conference.");
    // 这句不应被拆成多个
    expect(result.length).toBeLessThanOrEqual(2);
  });
});
