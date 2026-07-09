export function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 w-fit">
        None
      </span>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((point, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          {point}
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          AI Confidence Score
        </span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}