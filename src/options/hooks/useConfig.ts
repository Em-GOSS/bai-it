import { useState, useEffect, useCallback } from "react";
import type { BaitConfig, LLMMultiConfig } from "../../shared/types.ts";
import { DEFAULT_CONFIG, migrateLLMConfig } from "../../shared/types.ts";

export function useConfig() {
  const [config, setConfig] = useState<BaitConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(Object.keys(DEFAULT_CONFIG), (items) => {
      const hasLocalConfig = Object.values(items).some((v) => v !== undefined);

      const finalize = (rawPartial: Partial<BaitConfig>) => {
        const merged: BaitConfig = {
          ...DEFAULT_CONFIG,
          ...rawPartial,
          llm: migrateLLMConfig(rawPartial.llm),
        };
        if (!Array.isArray(merged.disabledSites)) merged.disabledSites = [];
        setConfig(merged);
        setLoading(false);
        if (!hasLocalConfig) {
          chrome.storage.local.set(merged as Record<string, unknown>);
        }
      };

      if (hasLocalConfig) {
        finalize(items as Partial<BaitConfig>);
        return;
      }

      chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (legacyItems) => {
        finalize(legacyItems as Partial<BaitConfig>);
      });
    });
  }, []);

  const saveConfig = useCallback(async (partial: Partial<BaitConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.llm) {
        updated.llm = { ...prev.llm, ...partial.llm };
      }
      chrome.storage.local.set(updated as Record<string, unknown>);
      return updated;
    });
  }, []);

  const updateLLM = useCallback(async (partial: Partial<LLMMultiConfig>) => {
    setConfig((prev) => {
      const llm = { ...prev.llm, ...partial };
      if (partial.providers) {
        llm.providers = { ...prev.llm.providers, ...partial.providers };
      }
      const updated = { ...prev, llm };
      chrome.storage.local.set(updated as Record<string, unknown>);
      return updated;
    });
  }, []);

  return { config, loading, saveConfig, updateLLM };
}
