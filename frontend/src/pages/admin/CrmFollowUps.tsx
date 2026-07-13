import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { crmApi, FollowUp } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STATUS_OPTIONS = ["PENDING", "COMPLETED", "CANCELLED"] as const;
const FOLLOW_UP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function CrmFollowUps() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === "super_admin" ? "/super-admin/crm" : "/admin/crm";
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showUpcoming, setShowUpcoming] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [form, setForm] = useState({ leadId: "", followUpDate: "", remarks: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FollowUp | null>(null);

  const loadFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const data = await crmApi.getFollowUps({
        status: statusFilter,
        upcoming: showUpcoming,
      });
      setFollowUps(data);
    } catch {
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showUpcoming]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  function openEdit(fu: FollowUp) {
    setEditingFollowUp(fu);
    setForm({
      leadId: fu.leadId,
      followUpDate: fu.followUpDate.slice(0, 16),
      remarks: fu.remarks || "",
    });
    setShowForm(true);
  }

  function openCreate() {
    setEditingFollowUp(null);
    setForm({ leadId: "", followUpDate: "", remarks: "" });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.followUpDate) {
      toast.error("Please select a follow-up date");
      return;
    }
    setSaving(true);
    try {
      if (editingFollowUp) {
        await crmApi.updateFollowUp(editingFollowUp.id, {
          followUpDate: form.followUpDate,
          remarks: form.remarks || undefined,
        });
        toast.success("Follow-up updated successfully");
      } else {
        if (!form.leadId) {
          toast.error("Lead ID is required for new follow-ups");
          setSaving(false);
          return;
        }
        await crmApi.createFollowUp({
          leadId: form.leadId,
          followUpDate: form.followUpDate,
          remarks: form.remarks || undefined,
        });
        toast.success("Follow-up created successfully");
      }
      setShowForm(false);
      loadFollowUps();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save follow-up");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await crmApi.deleteFollowUp(deleteConfirm.id);
      toast.success("Follow-up deleted");
      setDeleteConfirm(null);
      loadFollowUps();
    } catch {
      toast.error("Failed to delete follow-up");
    }
  }

  async function handleStatusChange(id: string, status: "COMPLETED" | "CANCELLED") {
    try {
      await crmApi.updateFollowUp(id, { status });
      toast.success(`Follow-up marked as ${status.toLowerCase()}`);
      loadFollowUps();
    } catch {
      toast.error("Failed to update status");
    }
  }

  function isOverdue(dateStr: string, status: string) {
    return status === "PENDING" && new Date(dateStr) < new Date();
  }

  return (
    <AppLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 md:space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Follow-ups</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track all follow-up activities.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Follow-up
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
              showUpcoming
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Clock className="w-4 h-4" />
            Upcoming Only
          </button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No follow-ups found.</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule a follow-up from the lead details page.</p>
          </div>
        ) : (
          <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="overflow-x-auto">
              <div className="min-w-[650px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Lead</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date & Time</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Remarks</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUps.map((fu) => (
                      <tr
                        key={fu.id}
                        className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                          isOverdue(fu.followUpDate, fu.status) ? "bg-red-50/50" : ""
                        }`}
                      >
                        <td className="px-5 py-3">
                          <button
                            onClick={() => navigate(`${basePath}/leads/${fu.leadId}`)}
                            className="text-left"
                          >
                            <p className="font-medium text-foreground hover:text-primary transition-colors">
                              {fu.lead?.name || "Unknown Lead"}
                            </p>
                            <p className="text-xs text-muted-foreground">{fu.lead?.email}</p>
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-foreground">
                            {new Date(fu.followUpDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(fu.followUpDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {isOverdue(fu.followUpDate, fu.status) && (
                            <span className="text-[10px] text-destructive font-medium">Overdue</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">
                          {fu.remarks || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FOLLOW_UP_STATUS_COLORS[fu.status] || "bg-gray-100 text-gray-600"}`}>
                            {fu.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {fu.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(fu.id, "COMPLETED")}
                                  className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                                  title="Mark Completed"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(fu.id, "CANCELLED")}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openEdit(fu)}
                              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(fu)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Follow-up Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editingFollowUp ? "Edit Follow-up" : "Schedule Follow-up"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingFollowUp && (
              <div>
                <label className="text-sm font-medium text-foreground">Lead ID *</label>
                <input
                  type="text"
                  value={form.leadId}
                  onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                  placeholder="Enter Lead ID"
                />
                <p className="text-xs text-muted-foreground mt-1">Find the Lead ID from the Leads page.</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Follow-up Date *</label>
              <input
                type="datetime-local"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
                placeholder="Follow-up notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingFollowUp ? "Update" : "Schedule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Follow-up</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-destructive/90 transition-all duration-200"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
