import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { dashboardApi, StudentDashboardData } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await dashboardApi.student();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <h2 className="text-xl font-bold text-foreground mb-6">Student Dashboard</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive">{error}</div>
      ) : data ? (
        <>
          {/* Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <span className="text-2xl">📝</span>
              <p className="text-2xl font-bold text-foreground mt-2">{data.completedCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Tests Completed</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <span className="text-2xl">📈</span>
              <p className="text-2xl font-bold text-foreground mt-2">{data.avgScore}%</p>
              <p className="text-sm text-muted-foreground mt-1">Average Score</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <span className="text-2xl">🏆</span>
              <p className="text-2xl font-bold text-foreground mt-2">{data.batchRank ? `#${data.batchRank}` : '—'}</p>
              <p className="text-sm text-muted-foreground mt-1">Batch Rank</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <span className="text-2xl">📋</span>
              <p className="text-2xl font-bold text-foreground mt-2">{data.pendingCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Pending Tests</p>
            </div>
          </div>

          {/* Recent Tests */}
          {data.recentTests.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Tests</h3>
              <div className="space-y-3">
                {data.recentTests.slice(0, 5).map((test) => (
                  <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      test.status === "completed" ? "bg-card-green" : "bg-card-orange"
                    }`}>
                      {test.status === "completed" ? "✅" : "📋"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{test.name}</p>
                      <p className="text-xs text-muted-foreground">{test.batchName || "All Batches"} · {test.duration}</p>
                    </div>
                    {test.status === "completed" && test.score !== null && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{test.score}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </AppLayout>
  );
}
