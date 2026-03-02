import type { PatternKey } from "../../shared/types.ts";
import { GlassCard } from "../components/GlassCard.tsx";
import { PatternTag } from "../components/PatternTag.tsx";
import { ChunkLines } from "../components/ChunkLines.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { useDB } from "../hooks/useDB.ts";
import { useDashboardData } from "../hooks/useDashboardData.ts";

interface DashboardProps {
  onGoToReview: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  return `${days} 天前`;
}

function extractDomain(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function Dashboard({ onGoToReview }: DashboardProps) {
  const db = useDB();
  const { totalSentences, totalWords, masteredWords, recentSentences, loading } = useDashboardData(db);

  if (loading) return null;

  return (
    <>
      {/* Stats row */}
      <div className="stats-row rv">
        <GlassCard className="stat-card">
          <div className="stat-num">{totalSentences}</div>
          <div className="stat-label">难句</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-num">{totalWords}</div>
          <div className="stat-label">生词</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-num">{masteredWords}</div>
          <div className="stat-label">已掌握</div>
        </GlassCard>
      </div>

      {/* Recent sentences */}
      {recentSentences.length > 0 ? (
        <>
          <div className="section-head rv">掰过的句子</div>
          {recentSentences.map((record) => (
            <GlassCard key={record.id} className="sentence-card rv">
              <div className="sentence-meta">
                {record.pattern_key && (
                  <PatternTag patternKey={record.pattern_key} />
                )}
                <span className="sentence-source">
                  {extractDomain(record.source_url)}
                  {record.source_url && " · "}
                  {formatTimeAgo(record.created_at)}
                </span>
              </div>
              <ChunkLines
                chunked={record.chunked}
                newWords={record.new_words}
              />
            </GlassCard>
          ))}
        </>
      ) : (
        <EmptyState text="还没掰过句子，去浏览英文网页试试" />
      )}

      {/* CTA */}
      <button className="cta-btn rv" onClick={onGoToReview} type="button">
        每日回味 →
      </button>
    </>
  );
}
