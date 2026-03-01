/**
 * Popup — 弹出窗口
 *
 * 职责：
 * 1. 显示当前站点状态（活跃/暂停/禁用）
 * 2. 显示阅读模式（扫读/细读）
 * 3. 站点开关 + 暂停/恢复
 * 4. LLM 配置（API 格式、Key、Base URL、模型）
 */

import type { Message, OpenEnConfig } from "../shared/types.ts";

// ========== DOM 元素 ==========

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const siteName = $("site-name");
const statusBadge = $("status-badge");
const modeBadge = $("mode-badge");
const btnToggle = $<HTMLButtonElement>("btn-toggle");
const btnPause = $<HTMLButtonElement>("btn-pause");
const configToggle = $("config-toggle");
const configArrow = $("config-arrow");
const configForm = $("config-form");
const llmFormat = $<HTMLSelectElement>("llm-format");
const llmKey = $<HTMLInputElement>("llm-key");
const llmUrl = $<HTMLInputElement>("llm-url");
const llmModel = $<HTMLInputElement>("llm-model");
const urlGroup = $("url-group");
const btnSave = $<HTMLButtonElement>("btn-save");
const saveMsg = $("save-msg");
const chunkToggle = $("chunk-toggle");
const chunkArrow = $("chunk-arrow");
const chunkForm = $("chunk-form");
const chunkGranularity = $<HTMLSelectElement>("chunk-granularity");
const sensitivitySlider = $<HTMLInputElement>("sensitivity-slider");
const sensitivityValue = $("sensitivity-value");
const intensitySlider = $<HTMLInputElement>("intensity-slider");
const intensityValue = $("intensity-value");
const linkOptions = $<HTMLAnchorElement>("link-options");

// ========== 状态 ==========

let currentTab: chrome.tabs.Tab | null = null;
let currentHostname = "";
let currentState: "active" | "paused" | "disabled" = "disabled";
let configOpen = false;
let chunkSettingsOpen = false;

// ========== 通信 ==========

function sendMessage(message: Message): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

// ========== 模式判断（与 content script 同逻辑）==========

function detectMode(url: string): "scan" | "deep" {
  try {
    const hostname = new URL(url).hostname;
    const pathname = new URL(url).pathname;

    if (hostname === "twitter.com" || hostname === "x.com") {
      if (/\/\w+\/status\/\d+/.test(pathname)) return "deep";
      return "scan";
    }
    if (hostname.includes("reddit.com")) {
      if (pathname.includes("/comments/")) return "deep";
      return "scan";
    }
    return "deep";
  } catch {
    return "deep";
  }
}

// ========== UI 更新 ==========

function updateStatusUI(): void {
  // 站点名
  siteName.textContent = currentHostname || "—";

  // 状态 badge
  statusBadge.className = "badge";
  switch (currentState) {
    case "active":
      statusBadge.textContent = "活跃";
      statusBadge.classList.add("badge-active");
      btnToggle.textContent = "在此站点禁用";
      btnToggle.className = "btn btn-danger";
      btnPause.textContent = "暂停";
      btnPause.disabled = false;
      break;
    case "paused":
      statusBadge.textContent = "已暂停";
      statusBadge.classList.add("badge-paused");
      btnToggle.textContent = "在此站点禁用";
      btnToggle.className = "btn btn-danger";
      btnPause.textContent = "恢复";
      btnPause.disabled = false;
      break;
    case "disabled":
      statusBadge.textContent = "已禁用";
      statusBadge.classList.add("badge-disabled");
      btnToggle.textContent = "在此站点启用";
      btnToggle.className = "btn btn-primary";
      btnPause.textContent = "暂停";
      btnPause.disabled = true;
      break;
  }

  // 模式 badge
  if (currentTab?.url) {
    const mode = detectMode(currentTab.url);
    modeBadge.className = "badge";
    if (mode === "scan") {
      modeBadge.textContent = "扫读";
      modeBadge.classList.add("badge-scan");
    } else {
      modeBadge.textContent = "细读";
      modeBadge.classList.add("badge-deep");
    }
  } else {
    modeBadge.textContent = "—";
    modeBadge.className = "badge";
  }
}

function updateConfigUI(config: OpenEnConfig): void {
  llmFormat.value = config.llm.format;
  llmKey.value = config.llm.apiKey;
  llmUrl.value = config.llm.baseUrl;
  llmModel.value = config.llm.model;

  // 拆分设置
  chunkGranularity.value = config.chunkGranularity || "fine";
  sensitivitySlider.value = String(config.sensitivity);
  sensitivityValue.textContent = String(config.sensitivity);
  intensitySlider.value = String(config.chunkIntensity);
  intensityValue.textContent = String(config.chunkIntensity);

  // 显示/隐藏 Base URL 字段
  urlGroup.classList.toggle("visible", config.llm.format === "openai-compatible");

  // 如果没有 API key，显示提示
  if (!config.llm.apiKey) {
    modeBadge.textContent = "未配置 Key";
    modeBadge.className = "badge badge-nokey";
    // 自动展开配置面板
    configOpen = true;
    configForm.classList.add("visible");
    configArrow.classList.add("open");
  }
}

// ========== 初始化 ==========

async function init(): Promise<void> {
  // 获取当前 tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab ?? null;

  if (currentTab?.url) {
    try {
      currentHostname = new URL(currentTab.url).hostname;
    } catch {
      currentHostname = "";
    }
  }

  // 获取当前状态
  if (currentTab?.id && currentHostname) {
    const result = await sendMessage({
      type: "getTabState",
      tabId: currentTab.id,
      hostname: currentHostname,
    }) as { state: "active" | "paused" | "disabled" };
    currentState = result.state;
  }

  // 获取配置
  const config = await sendMessage({ type: "getConfig" }) as OpenEnConfig;

  updateStatusUI();
  updateConfigUI(config);

  // ===== 事件绑定 =====

  // 站点开关
  btnToggle.addEventListener("click", async () => {
    if (!currentHostname) return;
    const result = await sendMessage({
      type: "toggleSite",
      hostname: currentHostname,
    }) as { enabled: boolean };
    currentState = result.enabled ? "active" : "disabled";
    updateStatusUI();
  });

  // 暂停/恢复
  btnPause.addEventListener("click", async () => {
    if (!currentTab?.id) return;
    if (currentState === "paused") {
      await sendMessage({ type: "resumeTab", tabId: currentTab.id });
      currentState = "active";
    } else if (currentState === "active") {
      await sendMessage({ type: "pauseTab", tabId: currentTab.id });
      currentState = "paused";
    }
    updateStatusUI();
  });

  // 拆分设置面板展开/收起
  chunkToggle.addEventListener("click", () => {
    chunkSettingsOpen = !chunkSettingsOpen;
    chunkForm.classList.toggle("visible", chunkSettingsOpen);
    chunkArrow.classList.toggle("open", chunkSettingsOpen);
  });

  // 颗粒度变更 → 即时保存
  chunkGranularity.addEventListener("change", async () => {
    await sendMessage({
      type: "updateConfig",
      config: { chunkGranularity: chunkGranularity.value as "coarse" | "medium" | "fine" },
    });
  });

  // 灵敏度滑块
  sensitivitySlider.addEventListener("input", () => {
    sensitivityValue.textContent = sensitivitySlider.value;
  });
  sensitivitySlider.addEventListener("change", async () => {
    await sendMessage({
      type: "updateConfig",
      config: { sensitivity: Number(sensitivitySlider.value) },
    });
  });

  // 渲染力度滑块
  intensitySlider.addEventListener("input", () => {
    intensityValue.textContent = intensitySlider.value;
  });
  intensitySlider.addEventListener("change", async () => {
    await sendMessage({
      type: "updateConfig",
      config: { chunkIntensity: Number(intensitySlider.value) },
    });
  });

  // LLM 配置面板展开/收起
  configToggle.addEventListener("click", () => {
    configOpen = !configOpen;
    configForm.classList.toggle("visible", configOpen);
    configArrow.classList.toggle("open", configOpen);
  });

  // API 格式切换 → 显示/隐藏 Base URL
  llmFormat.addEventListener("change", () => {
    urlGroup.classList.toggle("visible", llmFormat.value === "openai-compatible");
    // 切换格式时更新默认模型名
    if (llmFormat.value === "gemini" && !llmModel.value) {
      llmModel.value = "gemini-2.0-flash";
    }
  });

  // 保存配置
  btnSave.addEventListener("click", async () => {
    const newConfig: Partial<OpenEnConfig> = {
      llm: {
        format: llmFormat.value as "gemini" | "openai-compatible",
        apiKey: llmKey.value.trim(),
        baseUrl: llmUrl.value.trim(),
        model: llmModel.value.trim(),
      },
    };
    await sendMessage({ type: "updateConfig", config: newConfig });

    // 显示保存成功
    saveMsg.classList.add("show");
    setTimeout(() => saveMsg.classList.remove("show"), 2000);

    // 如果之前没有 key，现在有了，更新模式显示
    if (newConfig.llm?.apiKey && currentTab?.url) {
      const mode = detectMode(currentTab.url);
      modeBadge.className = "badge";
      modeBadge.textContent = mode === "scan" ? "扫读" : "细读";
      modeBadge.classList.add(mode === "scan" ? "badge-scan" : "badge-deep");
    }
  });

  // 打开设置页
  linkOptions.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

init();
