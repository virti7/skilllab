import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { performanceCards } from "@/data/dummy";
import { batchApi, resultApi, Batch, ResultSummary } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, Users, BookOpen } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  // Join batch state
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    Promise.all([
      batchApi.get().catch(() => [] as Batch[]),
      resultApi.get().catch(() => [] as ResultSummary[]),
    ]).then(([b, r]) => {
      setBatches(b);
      setResults(r);
      setProfileLoading(false);
    });
  }, []);

  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
      : 0;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    setJoinMsg("");
    setJoinError("");
    try {
      const res = await batchApi.join(inviteCode.trim().toUpperCase());
      setJoinMsg(`Joined "${res.batch.name}" successfully!`);
      setBatches((prev) => [
        res.batch,
        ...prev.filter((b) => b.id !== res.batch.id),
      ]);
      setInviteCode("");
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : "Failed to join batch");
    } finally {
      setJoining(false);
    }
  }

  const statsCards = results.length > 0
    ? [
        { title: "Tests Taken", value: String(results.length), change: "", icon: "📝" },
        { title: "Average Score", value: `${avgScore}%`, change: "", icon: "📈" },
        { title: "Batches Joined", value: String(batches.length), change: "", icon: "👥" },
        { title: "Passed", value: String(results.filter((r) => r.passed).length), change: "", icon: "✅" },
      ]
    : performanceCards;

  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">My Profile</h2>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
            {user?.avatar}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.institute && (
              <p className="text-xs text-muted-foreground mt-0.5">{user.institute}</p>
            )}
            <span className="text-xs font-medium bg-card-blue px-2 py-0.5 rounded-lg mt-1 inline-block">
              Student
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card) => (
          <div key={card.title} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <span className="text-2xl">{card.icon}</span>
            <p className="text-2xl font-bold text-foreground mt-2">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Join Batch */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-8">
        <h3 className="font-semibold text-foreground mb-4">Join a Batch</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the invite code provided by your admin to join a batch.
        </p>
        {joinMsg && (
          <div className="mb-4 px-4 py-3 bg-success/10 text-success text-sm rounded-xl border border-success/20">
            {joinMsg}
          </div>
        )}
        {joinError && (
          <div className="mb-4 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
            {joinError}
          </div>
        )}
        <form onSubmit={handleJoin} className="flex gap-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setJoinError(""); setJoinMsg(""); }}
            placeholder="e.g. A3F7BC12"
            maxLength={12}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-mono tracking-widest placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:border-primary/60 transition-colors"
          />
          <button
            type="submit"
            disabled={joining || !inviteCode.trim()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {joining && <Loader2 className="w-4 h-4 animate-spin" />}
            Join Batch
          </button>
        </form>
      </div>

      {/* My Batches */}
      {profileLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : batches.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="font-semibold text-foreground">My Batches</h3>
          </div>
          <div className="divide-y divide-border">
            {batches.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-card-blue flex items-center justify-center">
                  <Users className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.studentCount ?? 0} students · {b.testCount ?? 0} tests
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {b.joinedAt
                    ? new Date(b.joinedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
