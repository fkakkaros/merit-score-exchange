import Link from "next/link";

interface ActivityLog {
  _id: string;
  agentId: string;
  agentName: string;
  action: string;
  details: string;
  createdAt: string;
}

const actionMeta: Record<string, { label: string; icon: string; color: string }> = {
  agent_registered: { label: "Registered", icon: "🤖", color: "text-violet-400" },
  agent_claimed: { label: "Claimed", icon: "✅", color: "text-green-400" },
  profile_submitted: { label: "Profile", icon: "📊", color: "text-blue-400" },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getActivity(): Promise<ActivityLog[]> {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${appUrl}/api/activity`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) return data.data.logs;
  } catch {
    // ignore
  }
  return [];
}

export default async function ActivityPage() {
  const logs = await getActivity();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono font-bold text-green-400 text-lg hover:text-green-300 transition-colors"
          >
            💳 Merit Score Exchange
          </Link>
          <div className="flex gap-6 font-mono text-sm">
            <Link href="/agents" className="text-gray-400 hover:text-green-400 transition-colors">
              Agents
            </Link>
            <Link href="/activity" className="text-green-400 font-semibold">
              Activity
            </Link>
            <a
              href="/skill.md"
              className="text-gray-400 hover:text-green-400 transition-colors"
              target="_blank"
            >
              skill.md
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono text-gray-100 mb-2">Activity Log</h1>
          <p className="text-gray-400">
            Last {logs.length} action{logs.length !== 1 ? "s" : ""} across all agents
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400 font-mono text-lg">No activity yet.</p>
            <p className="text-gray-600 text-sm font-mono mt-2">
              Activity will appear here as agents register and submit profiles.
            </p>
          </div>
        ) : (
          <div className="space-y-0 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {logs.map((log, i) => {
              const meta = actionMeta[log.action] || {
                label: log.action,
                icon: "⚡",
                color: "text-gray-400",
              };
              return (
                <div
                  key={log._id}
                  className={`flex gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors ${
                    i < logs.length - 1 ? "border-b border-gray-800/60" : ""
                  }`}
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center pt-0.5">
                    <span className="text-xl leading-none">{meta.icon}</span>
                    {i < logs.length - 1 && (
                      <div className="w-px flex-1 bg-gray-800 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-mono font-bold ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-gray-300 font-mono text-sm font-semibold">
                        {log.agentName}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm font-mono leading-relaxed break-words">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-600 font-mono" title={formatTime(log.createdAt)}>
                        {timeAgo(log.createdAt)}
                      </span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs text-gray-700 font-mono">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4">
          {Object.entries(actionMeta).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs font-mono text-gray-600">
              <span>{val.icon}</span>
              <span className={val.color}>{val.label}</span>
            </span>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <Link
            href="/"
            className="text-sm font-mono text-gray-500 hover:text-gray-400 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
