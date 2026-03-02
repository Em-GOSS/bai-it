import { useState, useCallback } from "react";
import type { ProviderKey } from "../../shared/types.ts";
import { DEFAULT_PROVIDERS } from "../../shared/types.ts";
import { GlassCard } from "../components/GlassCard.tsx";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { useConfig } from "../hooks/useConfig.ts";
import { useDB } from "../hooks/useDB.ts";
import { PROVIDER_INFO } from "../constants.ts";
import {
  learningRecordDAO,
  vocabDAO,
} from "../../shared/db.ts";

const PROVIDER_KEYS: ProviderKey[] = ["gemini", "chatgpt", "deepseek", "qwen", "kimi"];

const INTENSITY_OPTIONS = [
  { key: "low", label: "少掰" },
  { key: "mid", label: "中等" },
  { key: "high", label: "多掰" },
];

const DISPLAY_OPTIONS = [
  { key: "detailed", label: "详细" },
  { key: "simple", label: "简洁" },
  { key: "light", label: "轻微" },
];

function intensityToKey(s: number): string {
  if (s >= 4) return "low";
  if (s >= 3) return "mid";
  return "high";
}

function keyToSensitivity(k: string): number {
  if (k === "low") return 5;
  if (k === "mid") return 3;
  return 1;
}

function displayToKey(i: number): string {
  if (i >= 4) return "detailed";
  if (i >= 2) return "simple";
  return "light";
}

function keyToIntensity(k: string): number {
  if (k === "detailed") return 5;
  if (k === "simple") return 3;
  return 1;
}

export function Settings() {
  const { config, loading, saveConfig, updateLLM } = useConfig();
  const db = useDB();
  const [activeProvider, setActiveProvider] = useState<ProviderKey>("gemini");
  const [saved, setSaved] = useState(false);
  const [dataStats, setDataStats] = useState<{ sentences: number; words: number; size: string } | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<Record<ProviderKey, "idle" | "checking" | "ok" | "error">>({
    gemini: "idle", chatgpt: "idle", deepseek: "idle", qwen: "idle", kimi: "idle",
  });

  // Sync activeProvider from config once loaded
  useState(() => {
    if (!loading && config.llm.activeProvider) {
      setActiveProvider(config.llm.activeProvider);
    }
  });

  const handleProviderSwitch = useCallback((p: ProviderKey) => {
    setActiveProvider(p);
    updateLLM({ activeProvider: p });
  }, [updateLLM]);

  const handleKeyChange = useCallback((value: string) => {
    const providers = { ...config.llm.providers };
    providers[activeProvider] = { ...providers[activeProvider], apiKey: value };
    updateLLM({ providers });
    setVerifyStatus((prev) => ({ ...prev, [activeProvider]: "idle" }));
  }, [activeProvider, config.llm.providers, updateLLM]);

  const handleModelChange = useCallback((value: string) => {
    const providers = { ...config.llm.providers };
    providers[activeProvider] = { ...providers[activeProvider], model: value };
    updateLLM({ providers });
  }, [activeProvider, config.llm.providers, updateLLM]);

  const handleSave = useCallback(async () => {
    // Config is already auto-saved, this button is for UX feedback
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const loadDataStats = useCallback(async () => {
    if (!db) return;
    const records = await learningRecordDAO.getAll(db);
    const words = await vocabDAO.getAll(db);
    const jsonStr = JSON.stringify({ records, words });
    const sizeKB = Math.round(new Blob([jsonStr]).size / 1024);
    setDataStats({ sentences: records.length, words: words.length, size: `${sizeKB}KB` });
  }, [db]);

  // Load stats on mount
  useState(() => {
    if (db) loadDataStats();
  });

  const handleExport = useCallback(async () => {
    if (!db) return;
    const records = await learningRecordDAO.getAll(db);
    const words = await vocabDAO.getAll(db);
    const data = { learningRecords: records, vocab: words, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baeit-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [db]);

  const handleClearRecords = useCallback(async () => {
    if (!confirm("确定要清空所有学习记录吗？此操作不可撤销。")) return;
    if (!db) return;
    const tx = db.transaction(["learning_records", "vocab", "vocab_contexts", "patterns", "pattern_examples"], "readwrite");
    tx.objectStore("learning_records").clear();
    tx.objectStore("vocab").clear();
    tx.objectStore("vocab_contexts").clear();
    tx.objectStore("patterns").clear();
    tx.objectStore("pattern_examples").clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    loadDataStats();
  }, [db, loadDataStats]);

  const handleResetSettings = useCallback(async () => {
    if (!confirm("确定要重置所有设置吗？API Key 也会被清除。")) return;
    const { llm, ...rest } = config;
    const defaults = {
      llm: { activeProvider: "gemini" as ProviderKey, providers: { ...DEFAULT_PROVIDERS } },
      sensitivity: 3,
      scanThreshold: "medium" as const,
      chunkGranularity: "fine" as const,
      chunkIntensity: 5,
      disabledSites: [] as string[],
      industryPacks: ["ai"],
    };
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(defaults as Record<string, unknown>);
    window.location.reload();
  }, [config]);

  if (loading) return null;

  const currentProviderConfig = config.llm.providers[activeProvider] ?? DEFAULT_PROVIDERS[activeProvider];
  const providerInfo = PROVIDER_INFO[activeProvider];

  return (
    <>
      {/* API Key */}
      <div className="settings-section rv">
        <div className="settings-section-title">API Key</div>
        <GlassCard className="settings-card">
          <div className="settings-provider-row">
            {PROVIDER_KEYS.map((p) => (
              <button
                key={p}
                className={`settings-provider-btn ${activeProvider === p ? "active" : ""}`}
                onClick={() => handleProviderSwitch(p)}
                type="button"
              >
                {PROVIDER_INFO[p].label}
              </button>
            ))}
          </div>
          <div className="settings-row" style={{ borderBottom: "none", paddingTop: 8 }}>
            <div>
              <div className="settings-label">{providerInfo.label} API Key</div>
              <div className="settings-desc">你的 Key 只存在本地，不会上传到任何地方</div>
            </div>
            <div className="settings-key-row">
              <input
                className="settings-input"
                type="password"
                value={currentProviderConfig.apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="填入你的 API Key"
                style={{ width: 240 }}
              />
              {verifyStatus[activeProvider] === "ok" && (
                <div className="settings-key-status">
                  <span className="settings-key-dot" /> 已验证
                </div>
              )}
            </div>
          </div>
          <div className="settings-row" style={{ paddingTop: 4 }}>
            <div>
              <div className="settings-label">模型</div>
            </div>
            <select
              className="settings-select"
              value={currentProviderConfig.model}
              onChange={(e) => handleModelChange(e.target.value)}
              style={{ minWidth: 180 }}
            >
              {providerInfo.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="settings-model-info">{providerInfo.hint}</div>
        </GlassCard>
      </div>

      {/* 显示偏好 */}
      <div className="settings-section rv">
        <div className="settings-section-title">显示</div>
        <GlassCard className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-label">母语</div>
              <div className="settings-desc">生词释义用这个语言显示</div>
            </div>
            <select className="settings-select">
              <option value="zh-CN">中文（简体）</option>
              <option value="zh-TW">中文（繁體）</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">默认掰句力度</div>
              <div className="settings-desc">可在 Popup 中针对单个站点覆盖</div>
            </div>
            <SegmentedControl
              options={INTENSITY_OPTIONS}
              value={intensityToKey(config.sensitivity)}
              onChange={(k) => saveConfig({ sensitivity: keyToSensitivity(k) })}
              style={{ width: 220, margin: 0 }}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">默认显示方式</div>
              <div className="settings-desc">掰完后句子怎么呈现</div>
            </div>
            <SegmentedControl
              options={DISPLAY_OPTIONS}
              value={displayToKey(config.chunkIntensity)}
              onChange={(k) => saveConfig({ chunkIntensity: keyToIntensity(k) })}
              style={{ width: 220, margin: 0 }}
            />
          </div>
        </GlassCard>
      </div>

      {/* 数据管理 */}
      <div className="settings-section rv">
        <div className="settings-section-title">数据</div>
        <GlassCard className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-label">本地数据</div>
              <div className="settings-desc">
                {dataStats
                  ? `${dataStats.sentences} 句难句 · ${dataStats.words} 个生词 · 共 ${dataStats.size}`
                  : "加载中..."}
              </div>
            </div>
            <button className="settings-btn-text" onClick={handleExport} type="button">
              导出 JSON
            </button>
          </div>
          <div className="settings-danger">
            <div className="settings-danger-btns">
              <button className="settings-danger-btn" onClick={handleClearRecords} type="button">
                清空学习记录
              </button>
              <button className="settings-danger-btn" onClick={handleResetSettings} type="button">
                重置所有设置
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 保存 */}
      <div className="settings-save-area rv">
        <button className="settings-save-btn" onClick={handleSave} type="button">
          保存
        </button>
        {saved && <span className="settings-saved-msg">✓ 已保存</span>}
      </div>
    </>
  );
}
