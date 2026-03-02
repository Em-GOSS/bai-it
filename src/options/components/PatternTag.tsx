import type { PatternKey } from "../../shared/types.ts";
import { PATTERN_LABELS } from "../constants.ts";

interface PatternTagProps {
  patternKey: PatternKey;
}

export function PatternTag({ patternKey }: PatternTagProps) {
  return (
    <span className="pattern-tag">
      {PATTERN_LABELS[patternKey] ?? patternKey}
    </span>
  );
}
