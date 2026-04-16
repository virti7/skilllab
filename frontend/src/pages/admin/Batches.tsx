import { AppLayout } from "@/components/AppLayout";
import { Plus, Loader2, Copy, Check, Users, BookOpen, BarChart3, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { batchApi, Batch } from "@/lib/api";
import { batches as dummyBatches } from "@/data/dummy";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColor = {
  active: "bg-card-green",
  upcoming: "bg-card-blue",
  completed: "bg-card-orange",
};

export default function Batches() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function openDeleteModal(batchId: string, batchName: string) {
    setBatchToDelete({ id: batchId, name: batchName });
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!batchToDelete) return;

    setDeleting(true);
    try {
      await batchApi.delete(batchToDelete.id);
      setBatches((prev) => prev.filter((b) => b.id !== batchToDelete.id));
      toast.success("Batch deleted successfully");
      setDeleteModalOpen(false);
      setBatchToDelete(null);
    } catch (err) {
      console.error("Delete batch error:", err);
      toast.error("Failed to delete batch");
    } finally {
      setDeleting(false);
    }
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
            <div
              key={b.id}
              className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => navigate(`/admin/batch/${b.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{b.name}</h3>
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
              <div className="flex items-center justify-between">
                {b.inviteCode && (
                  <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Invite Code</p>
                      <p className="font-mono font-bold text-foreground text-sm tracking-widest">
                        {b.inviteCode}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCode(b.inviteCode!);
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity ml-4"
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
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(b.id, b.name);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/batch/${b.id}`);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Batch</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{batchToDelete?.name}"</span>?
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">This will permanently remove:</p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    All tests and questions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    All coding questions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    All student records
                  </li>
                </ul>
              </div>
              <p className="mt-4 text-sm text-muted-foreground font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Batch
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
