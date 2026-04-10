import { AppLayout } from "@/components/AppLayout";
import { leaderboard as dummyLeaderboard } from "@/data/dummy";
import { Trophy, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { leaderboardApi, LeaderboardEntry, batchApi, Batch } from "@/lib/api";

const podiumColors = [
  "bg-warning/10 border-warning/30",
  "bg-muted border-border",
  "bg-card-orange border-primary/20",
];
const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    batchApi.get().then(setBatches).catch(() => {});
    loadLeaderboard();
  }, []);

  async function loadLeaderboard(batchId?: string) {
    setLoading(true);
    try {
      const data = batchId
        ? await leaderboardApi.getBatch(batchId)
        : await leaderboardApi.get();
      setEntries(data);
      setUsingDummy(false);
    } catch {
      // Fallback to dummy
      setEntries(
        dummyLeaderboard.map((s) => ({
          rank: s.rank,
          userId: String(s.rank),
          name: s.name,
          totalScore: s.score,
          testsCompleted: 0,
          avgPercentage: 0,
          avatar: s.avatar,
        }))
      );
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  }

  function handleBatchChange(batchId: string) {
    setSelectedBatch(batchId);
    loadLeaderboard(batchId || undefined);
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Leaderboard</h2>
          {usingDummy && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg">
              demo data
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {batches.length > 0 && (
            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => loadLeaderboard(selectedBatch || undefined)}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Top 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {top3.map((s, i) => (
              <div
                key={s.userId}
                className={`${podiumColors[i]} border rounded-2xl p-6 text-center`}
              >
                <div className="text-4xl mb-2">{medals[i]}</div>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-lg font-bold text-primary">
                  {s.avatar}
                </div>
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-2xl font-bold text-primary mt-1">{s.totalScore}</p>
                <p className="text-xs text-muted-foreground">
                  points · {s.testsCompleted} tests
                </p>
              </div>
            ))}
          </div>

          {/* Rest */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {rest.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No other students yet
              </div>
            ) : (
              rest.map((s) => (
                <div
                  key={s.userId}
                  className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0"
                >
                  <span className="w-8 text-center font-bold text-muted-foreground">
                    #{s.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground">
                    {s.avatar}
                  </div>
                  <p className="flex-1 font-medium text-foreground">{s.name}</p>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{s.totalScore} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {s.avgPercentage}% avg
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
