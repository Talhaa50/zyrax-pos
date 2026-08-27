// No sync status, no offline indicator — this is a local SQLite system.
// The server is always on the same machine, so connectivity is not a concern.
export default function StatusPills() {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="ios-pill flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Local DB
      </span>
    </div>
  );
}
