import { AppLayout } from "@/components/AppLayout";
import { batchApi, leaderboardApi, Batch, LeaderboardEntry } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, Trophy, Users, TrendingUp } from "lucide-react";

export default function Students() {
  const [batchStudents, setBatchStudents] = useState<Map<string, LeaderboardEntry[]>>(new Map());
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadBatchStudents(selectedBatch);
    }
  }, [selectedBatch]);

  async function loadBatches() {
    try {
      const data = await batchApi.get();
      setBatches(data);
      if (data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchStudents(batchId: string) {
    try {
      const data = await leaderboardApi.getBatch(batchId);
      setBatchStudents((prev) => new Map(prev).set(batchId, data));
    } catch (err) {
      console.error('Failed to load batch students:', err);
    }
  }

  const students = batchStudents.get(selectedBatch) || [];

  const selectedBatchData = batches.find(b => b.id === selectedBatch);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Students</h2>
        {batches.length > 0 && (
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No batches available. Create a batch first.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No students in this batch yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Share the invite code with students to join.</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedBatchData?.name}</p>
                  <p className="text-xs text-muted-foreground">{students.length} students enrolled</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <span className="text-sm">🥇</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Top Score</p>
                    <p className="text-sm font-bold text-foreground">
                      {students[0]?.totalScore || 0} pts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                    <p className="text-sm font-bold text-foreground">
                      {Math.round(students.reduce((s, r) => s + r.avgPercentage, 0) / students.length) || 0}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tests Taken</p>
                    <p className="text-sm font-bold text-foreground">
                      {students.reduce((s, r) => s + r.testsCompleted, 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Rankers</p>
                    <p className="text-sm font-bold text-foreground">
                      {students.filter(s => s.testsCompleted > 0).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tests</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Avg Score</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Total Points</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.userId} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        s.rank === 1 ? 'bg-warning/20 text-warning' :
                        s.rank === 2 ? 'bg-muted text-muted-foreground' :
                        s.rank === 3 ? 'bg-card-orange/20 text-primary' :
                        'text-muted-foreground'
                      }`}>
                        {s.rank <= 3 ? ['🥇', '🥈', '🥉'][s.rank - 1] : `#${s.rank}`}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {s.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{s.testsCompleted}</td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${
                        s.avgPercentage >= 80 ? 'text-success' :
                        s.avgPercentage >= 60 ? 'text-warning' :
                        s.avgPercentage > 0 ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {s.avgPercentage > 0 ? `${s.avgPercentage}%` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-foreground">{s.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
