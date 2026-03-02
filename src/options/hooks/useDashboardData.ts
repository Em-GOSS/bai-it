import { useState, useEffect } from "react";
import type { LearningRecord, PatternKey } from "../../shared/types.ts";
import { learningRecordDAO, vocabDAO } from "../../shared/db.ts";

export interface DashboardData {
  totalSentences: number;
  totalWords: number;
  masteredWords: number;
  recentSentences: LearningRecord[];
  loading: boolean;
}

export function useDashboardData(db: IDBDatabase | null): DashboardData {
  const [data, setData] = useState<DashboardData>({
    totalSentences: 0,
    totalWords: 0,
    masteredWords: 0,
    recentSentences: [],
    loading: true,
  });

  useEffect(() => {
    if (!db) return;

    async function load() {
      const [records, allVocab] = await Promise.all([
        learningRecordDAO.getAll(db!),
        vocabDAO.getAll(db!),
      ]);

      const mastered = allVocab.filter((v) => v.status === "mastered");

      // Sort by created_at descending, take 3 most recent
      const sorted = [...records].sort((a, b) => b.created_at - a.created_at);
      const recent = sorted.slice(0, 3);

      setData({
        totalSentences: records.length,
        totalWords: allVocab.length,
        masteredWords: mastered.length,
        recentSentences: recent,
        loading: false,
      });
    }

    load();
  }, [db]);

  return data;
}
