import { AppLayout } from "@/components/AppLayout";
import { Plus, Loader2, Copy, Check, Users, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { batchApi, Batch } from "@/lib/api";
import { batches as dummyBatches } from "@/data/dummy";

const statusColor = {
  active: "bg-card-green",
  upcoming: "bg-card-blue",
  completed: "bg-card-orange",
};

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    setLoading(true);
    try {
      const data = await batchApi.get();
      setBatches(data);
    } catch {
      // Fallback to dummy data if backend is unavailable
      setBatches(
        dummyBatches.map((b) => ({
          id: String(b.id),
          name: b.name,
          studentCount: b.students,
          testCount: 0,
          createdAt: new Date().toISOString(),
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!batchName.trim()) {
      setError("Batch name is required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const newBatch = await batchApi.create(batchName.trim());
      setBatches((prev) => [newBatch, ...prev]);
      setBatchName("");
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setCreating(false);
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Batches</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Batch
        </button>
      </div>

      {/* Create Batch form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Create New Batch</h3>
          {error && (
            <p className="text-sm text-destructive mb-3 bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={batchName}
              onChange={(e) => { setBatchName(e.target.value); setError(""); }}
              placeholder="e.g. Excel Batch A"
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No batches yet. Create your first batch!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{b.name}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium bg-card-green`}>
                  active
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {b.studentCount ?? 0} students
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {b.testCount ?? 0} tests
                </span>
              </div>
              {b.inviteCode && (
                <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2.5 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Invite Code</p>
                    <p className="font-mono font-bold text-foreground text-sm tracking-widest">
                      {b.inviteCode}
                    </p>
                  </div>
                  <button
                    onClick={() => copyCode(b.inviteCode!, b.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    {copiedId === b.id ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedId === b.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
