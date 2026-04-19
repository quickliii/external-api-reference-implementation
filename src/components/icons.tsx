export function TerminalIcon({ size = 15 }: { size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 5.5L7.5 8.5L4.5 11.5" />
      <path d="M9 11.5H12" />
    </svg>
  );
}
