import { useState } from "react";
import type { LearningRecord, PatternKey } from "../../shared/types.ts";
import { GlassCard } from "../components/GlassCard.tsx";
import { PatternTag } from "../components/PatternTag.tsx";
import { ChunkLines } from "../components/ChunkLines.tsx";
import { FilterChip } from "../components/FilterChip.tsx";
import { VocabPill } from "../components/VocabPill.tsx";
import { EmptyState } from "../components/EmptyState.tsx";
import { useDB } from "../hooks/useDB.ts";
import { useSentences } from "../hooks/useSentences.ts";
import { PATTERN_LABELS } from "../constants.ts";

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

function SentenceCollapsed({ record, onClick }: { record: LearningRecord; onClick: () => void }) {
  return (
    <GlassCard className="sent-item" onClick={onClick}>
      <div className="sent-item-top">
        {record.pattern_key && <PatternTag patternKey={record.pattern_key} />}
        <span className="sentence-source">
          {extractDomain(record.source_url)} · {formatTimeAgo(record.created_at)}
        </span>
      </div>
      <div className="sent-item-text">{record.sentence}</div>
      <div className="sent-item-meta">
        {record.new_words.length > 0 && (
          <span className="sent-item-vocab-count">{record.new_words.length} 生词</span>
        )}
        <span className="sent-item-domain">{extractDomain(record.source_url)}</span>
        <span className="sent-item-time">{formatTimeAgo(record.created_at)}</span>
      </div>
    </GlassCard>
  );
}

function SentenceExpanded({ record, onClick }: { record: LearningRecord; onClick: () => void }) {
  return (
    <GlassCard className="sent-expanded" onClick={onClick}>
      <div className="sent-item-top">
        {record.pattern_key && <PatternTag patternKey={record.pattern_key} />}
        <span className="sentence-source">
          {extractDomain(record.source_url)} · {formatTimeAgo(record.created_at)}
        </span>
      </div>

      {/* Layer 1: 原句 */}
      <div className="sent-expanded-original">{record.sentence}</div>

      {/* Layer 2: 分块 */}
      <div className="sent-section-label" style={{ marginTop: 0 }}>分块</div>
      <ChunkLines chunked={record.chunked} newWords={record.new_words} />

      {/* Layer 3: 为什么难读 */}
      {record.sentence_analysis && (
        <>
          <div className="sent-section-label">为什么难读</div>
          <div className="sent-explanation">{record.sentence_analysis}</div>
        </>
      )}

      {/* Layer 4: 学会表达 */}
      {record.expression_tips && (
        <>
          <div className="sent-section-label">学会表达</div>
          <div
            className="sent-expression"
            dangerouslySetInnerHTML={{ __html: formatExpression(record.expression_tips) }}
          />
        </>
      )}

      {/* Layer 5: 生词 */}
      {record.new_words.length > 0 && (
        <>
          <div className="sent-section-label">生词</div>
          <div className="sent-vocab-row">
            {record.new_words.map((w, i) => (
              <VocabPill key={i} word={w.word} definition={w.definition} />
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

function formatExpression(text: string): string {
  // Bold text between ** markers
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

export function Sentences() {
  const db = useDB();
  const { records, filter, setFilter, availablePatterns, loading } = useSentences(db);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return null;

  if (records.length === 0 && filter === "all") {
    return <EmptyState text="还没积累难句，去浏览英文网页，遇到的难句会自动攒在这" />;
  }

  return (
    <>
      {/* Filter bar */}
      <div className="filter-bar rv">
        <FilterChip
          label="全部"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {availablePatterns.map((pk) => (
          <FilterChip
            key={pk}
            label={PATTERN_LABELS[pk] ?? pk}
            active={filter === pk}
            onClick={() => setFilter(pk)}
          />
        ))}
      </div>

      {/* Sentence list */}
      {records.map((record) => (
        <div key={record.id} className="rv">
          {expandedId === record.id ? (
            <SentenceExpanded record={record} onClick={() => setExpandedId(null)} />
          ) : (
            <SentenceCollapsed record={record} onClick={() => setExpandedId(record.id)} />
          )}
        </div>
      ))}

      {records.length === 0 && filter !== "all" && (
        <EmptyState text={`没有「${PATTERN_LABELS[filter as PatternKey] ?? filter}」类型的难句`} />
      )}
    </>
  );
}
