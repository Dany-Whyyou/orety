export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-muted/50 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    </div>
  );
}
