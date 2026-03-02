interface EmptyStateProps {
  text: string;
}

export function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-text">{text}</div>
    </div>
  );
}
