interface ChunkLinesProps {
  chunked: string;
  newWords?: { word: string; definition: string }[];
}

export function ChunkLines({ chunked, newWords = [] }: ChunkLinesProps) {
  const vocabSet = new Set(newWords.map((w) => w.word.toLowerCase()));
  const lines = chunked.split("\n");

  return (
    <div className="chunk-lines">
      {lines.map((line, i) => {
        const trimmed = line.replace(/^ +/, "");
        const indent = line.length - trimmed.length;
        const isIndented = indent > 0;

        // Highlight vocab words
        const parts = highlightVocab(trimmed, vocabSet);

        return (
          <div key={i} className={isIndented ? "indent" : ""}>
            {parts}
          </div>
        );
      })}
    </div>
  );
}

function highlightVocab(text: string, vocabSet: Set<string>): React.ReactNode[] {
  if (vocabSet.size === 0) return [text];

  const pattern = Array.from(vocabSet)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="vocab">
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
