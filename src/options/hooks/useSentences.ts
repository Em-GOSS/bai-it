import { useState, useEffect, useCallback } from "react";
import type { LearningRecord, PatternKey } from "../../shared/types.ts";
import { learningRecordDAO } from "../../shared/db.ts";

export function useSentences(db: IDBDatabase | null) {
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [filter, setFilter] = useState<PatternKey | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    learningRecordDAO.getAll(db).then((all) => {
      // Sort by created_at descending
      const sorted = [...all].sort((a, b) => b.created_at - a.created_at);
      setRecords(sorted);
      setLoading(false);
    });
  }, [db]);

  const filtered = filter === "all"
    ? records
    : records.filter((r) => r.pattern_key === filter);

  // Collect all pattern keys that exist in the data
  const availablePatterns = Array.from(
    new Set(records.map((r) => r.pattern_key).filter(Boolean))
  ) as PatternKey[];

  return { records: filtered, filter, setFilter, availablePatterns, loading };
}
