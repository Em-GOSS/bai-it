/**
 * Vocabulary Panel — 关键词汇面板
 *
 * 收集每次分块返回的 newWords，攒够 3 个后在右下角浮出气泡。
 * 点击气泡展开面板查看所有词汇，支持实时更新。
 */

// --- 数据结构 ---

interface VocabWord {
  word: string;
  definition: string;
  context: string; // 截取的上下文（含 <em> 高亮）
}

// --- 状态 ---

const wordMap = new Map<string, VocabWord>();
let panelOpen = false;
let scanning = false;

let bubbleEl: HTMLElement | null = null;
let bubbleNumEl: HTMLElement | null = null;
let bubbleRingEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let panelBodyEl: HTMLElement | null = null;
let panelCountEl: HTMLElement | null = null;
let statusDotEl: HTMLElement | null = null;
let statusTextEl: HTMLElement | null = null;

const SHOW_THRESHOLD = 3;

// --- SVG 图标 ---

const BOOK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;

const CLOSE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// --- 公共 API ---

export function initVocabPanel(): void {
  if (bubbleEl) return;

  bubbleEl = createBubbleEl();
  panelEl = createPanelEl();
  document.body.appendChild(bubbleEl);
  document.body.appendChild(panelEl);
}

export function addWords(
  words: { word: string; definition: string }[],
  originalSentence: string
): void {
  if (!bubbleEl) return;

  const newlyAdded: VocabWord[] = [];

  for (const w of words) {
    const key = w.word.toLowerCase();
    if (wordMap.has(key)) continue;

    const vocabWord: VocabWord = {
      word: w.word,
      definition: w.definition,
      context: truncateContext(originalSentence, w.word),
    };
    wordMap.set(key, vocabWord);
    newlyAdded.push(vocabWord);
  }

  if (newlyAdded.length === 0) return;

  if (wordMap.size >= SHOW_THRESHOLD) {
    showBubble();
  }

  updateBubbleCount(wordMap.size);

  if (panelOpen && panelBodyEl) {
    appendWordsToPanel(newlyAdded);
    if (panelCountEl) {
      panelCountEl.textContent = `(${wordMap.size})`;
    }
  }

  updatePanelStatus();
}

export function setScanningStatus(isScanning: boolean): void {
  scanning = isScanning;
  updatePanelStatus();
}

export function destroyVocabPanel(): void {
  bubbleEl?.remove();
  panelEl?.remove();

  bubbleEl = null;
  bubbleNumEl = null;
  bubbleRingEl = null;
  panelEl = null;
  panelBodyEl = null;
  panelCountEl = null;
  statusDotEl = null;
  statusTextEl = null;

  wordMap.clear();
  panelOpen = false;
  scanning = false;
}

// --- 气泡 ---

function createBubbleEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "enlearn-vp-bubble";

  const ring = document.createElement("div");
  ring.className = "enlearn-vp-bubble-ring";
  bubbleRingEl = ring;

  const icon = document.createElement("div");
  icon.className = "enlearn-vp-bubble-icon";
  icon.innerHTML = BOOK_ICON;

  const count = document.createElement("div");
  count.className = "enlearn-vp-bubble-count";

  const num = document.createElement("span");
  num.className = "enlearn-vp-bubble-num";
  num.textContent = "0";
  bubbleNumEl = num;

  const label = document.createElement("span");
  label.className = "enlearn-vp-bubble-label";
  label.textContent = "个关键词汇";

  count.appendChild(num);
  count.appendChild(label);

  el.appendChild(ring);
  el.appendChild(icon);
  el.appendChild(count);

  el.addEventListener("click", openPanel);

  return el;
}

function showBubble(): void {
  if (!bubbleEl || bubbleEl.classList.contains("enlearn-vp-bubble--visible")) return;
  bubbleEl.classList.remove("enlearn-vp-bubble--hidden");
  bubbleEl.classList.add("enlearn-vp-bubble--visible");
}

function hideBubble(): void {
  if (!bubbleEl) return;
  bubbleEl.classList.remove("enlearn-vp-bubble--visible");
  bubbleEl.classList.add("enlearn-vp-bubble--hidden");
}

function updateBubbleCount(count: number): void {
  if (!bubbleNumEl) return;
  bubbleNumEl.textContent = String(count);

  bubbleNumEl.classList.add("enlearn-vp-num--bump");
  setTimeout(() => bubbleNumEl?.classList.remove("enlearn-vp-num--bump"), 300);

  if (bubbleRingEl) {
    bubbleRingEl.classList.remove("enlearn-vp-ring--pulse");
    void bubbleRingEl.offsetWidth;
    bubbleRingEl.classList.add("enlearn-vp-ring--pulse");
  }
}

// --- 面板 ---

function createPanelEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "enlearn-vp-panel";

  const header = document.createElement("div");
  header.className = "enlearn-vp-panel-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "enlearn-vp-panel-title";

  const titleIcon = document.createElement("div");
  titleIcon.className = "enlearn-vp-panel-title-icon";
  titleIcon.innerHTML = BOOK_ICON;

  const titleTextWrap = document.createElement("div");
  const titleText = document.createElement("span");
  titleText.className = "enlearn-vp-panel-title-text";
  titleText.textContent = "关键词汇";

  const titleCount = document.createElement("span");
  titleCount.className = "enlearn-vp-panel-title-count";
  panelCountEl = titleCount;

  titleTextWrap.appendChild(titleText);
  titleTextWrap.appendChild(titleCount);
  titleWrap.appendChild(titleIcon);
  titleWrap.appendChild(titleTextWrap);

  const closeBtn = document.createElement("button");
  closeBtn.className = "enlearn-vp-panel-close";
  closeBtn.innerHTML = CLOSE_ICON;
  closeBtn.addEventListener("click", closePanel);

  header.appendChild(titleWrap);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "enlearn-vp-panel-body";
  panelBodyEl = body;

  const footer = document.createElement("div");
  footer.className = "enlearn-vp-panel-footer";

  const status = document.createElement("div");
  status.className = "enlearn-vp-panel-status";

  const dot = document.createElement("div");
  dot.className = "enlearn-vp-status-dot";
  statusDotEl = dot;

  const statusText = document.createElement("span");
  statusText.className = "enlearn-vp-status-text";
  statusText.textContent = "扫描中…";
  statusTextEl = statusText;

  status.appendChild(dot);
  status.appendChild(statusText);
  footer.appendChild(status);

  el.appendChild(header);
  el.appendChild(body);
  el.appendChild(footer);

  return el;
}

function openPanel(): void {
  if (!panelEl || panelOpen) return;
  panelOpen = true;

  hideBubble();
  renderAllWords();

  if (panelCountEl) {
    panelCountEl.textContent = `(${wordMap.size})`;
  }

  updatePanelStatus();
  panelEl.classList.add("enlearn-vp-panel--visible");
}

function closePanel(): void {
  if (!panelEl || !panelOpen) return;
  panelOpen = false;
  panelEl.classList.remove("enlearn-vp-panel--visible");

  setTimeout(() => {
    if (!panelOpen && bubbleEl) {
      bubbleEl.classList.remove("enlearn-vp-bubble--hidden");
      bubbleEl.classList.add("enlearn-vp-bubble--visible");
    }
  }, 200);
}

function renderAllWords(animate = true): void {
  if (!panelBodyEl) return;
  panelBodyEl.innerHTML = "";

  if (wordMap.size === 0) {
    const empty = document.createElement("div");
    empty.className = "enlearn-vp-empty";
    empty.textContent = "正在收集词汇…";
    panelBodyEl.appendChild(empty);
    return;
  }

  const pageText = (document.body.textContent || "").toLowerCase();
  const sorted = [...wordMap.values()].sort(
    (a, b) => countWordInPageText(pageText, b.word) - countWordInPageText(pageText, a.word)
  );

  let i = 0;
  for (const w of sorted) {
    panelBodyEl.appendChild(createWordItem(w, animate ? i * 0.04 : 0));
    i++;
  }
}

function appendWordsToPanel(_newWords: VocabWord[]): void {
  renderAllWords(false);

  if (panelCountEl) {
    panelCountEl.textContent = `(${wordMap.size})`;
  }
}

function createWordItem(w: VocabWord, delay: number): HTMLElement {
  const item = document.createElement("div");
  item.className = "enlearn-vp-word-item";
  item.style.animationDelay = `${delay}s`;

  const dot = document.createElement("div");
  dot.className = "enlearn-vp-word-dot";

  const content = document.createElement("div");
  content.className = "enlearn-vp-word-content";

  const en = document.createElement("div");
  en.className = "enlearn-vp-word-en";
  en.textContent = w.word;

  const def = document.createElement("div");
  def.className = "enlearn-vp-word-def";
  def.textContent = w.definition;

  const ctx = document.createElement("div");
  ctx.className = "enlearn-vp-word-context";
  ctx.innerHTML = w.context;

  content.appendChild(en);
  content.appendChild(def);
  content.appendChild(ctx);

  item.appendChild(dot);
  item.appendChild(content);

  return item;
}

function updatePanelStatus(): void {
  if (!statusDotEl || !statusTextEl) return;

  if (scanning) {
    statusDotEl.classList.add("enlearn-vp-status-dot--scanning");
    statusTextEl.textContent = "扫描中…";
  } else {
    statusDotEl.classList.remove("enlearn-vp-status-dot--scanning");
    statusTextEl.textContent = `扫描完成 · ${wordMap.size} 个词汇`;
  }
}

// --- 工具函数 ---

function countWordInPageText(pageText: string, word: string): number {
  const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "g");
  return (pageText.match(regex) || []).length;
}

function truncateContext(sentence: string, word: string): string {
  const escaped = escapeHtml(sentence);
  const lower = escaped.toLowerCase();
  const wordLower = word.toLowerCase();
  const idx = lower.indexOf(wordLower);

  if (idx === -1) {
    const truncated = escaped.length > 50
      ? escaped.slice(0, 50) + "…"
      : escaped;
    return truncated;
  }

  const beforeLen = 12;
  const afterLen = 25;
  const start = Math.max(0, idx - beforeLen);
  const end = Math.min(escaped.length, idx + word.length + afterLen);
  const slice = escaped.slice(start, end);

  const sliceIdx = idx - start;
  const before = slice.slice(0, sliceIdx);
  const match = slice.slice(sliceIdx, sliceIdx + word.length);
  const after = slice.slice(sliceIdx + word.length);

  let result = before + "<em>" + match + "</em>" + after;

  if (start > 0) result = "…" + result;
  if (end < escaped.length) result = result + "…";

  return result;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
