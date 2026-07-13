import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { crmApi, Lead, Counsellor } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  User,
  StickyNote,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "ENROLLED", "REJECTED"] as const;
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-orange-100 text-orange-700",
  FOLLOW_UP: "bg-purple-100 text-purple-700",
  INTERESTED: "bg-emerald-100 text-emerald-700",
  ENROLLED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const FOLLOW_UP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function CrmLeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === "super_admin" ? "/super-admin/crm" : "/admin/crm";
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", courseInterested: "", status: "NEW", source: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [assignedTo, setAssignedTo] = useState("");

  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ followUpDate: "", remarks: "" });

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) loadLead();
    crmApi.getCounsellors().then(setCounsellors).catch(() => setCounsellors([]));
  }, [id]);

  async function loadLead() {
    if (!id) return;
    try {
      setLoading(true);
      const data = await crmApi.getLeadById(id);
      setLead(data);
      setEditForm({
        name: data.name,
        email: data.email,
        phone: data.phone,
        courseInterested: data.courseInterested,
        status: data.status,
        source: data.source || "",
        notes: data.notes || "",
      });
      setAssignedTo(data.assignedTo || "");
    } catch {
      toast.error("Failed to load lead details");
      navigate(`${basePath}/leads`);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLead() {
    if (!id) return;
    setSaving(true);
    try {
      await crmApi.updateLead(id, {
        ...editForm,
        source: editForm.source || undefined,
        notes: editForm.notes || undefined,
        assignedTo: assignedTo || undefined,
      });
      toast.success("Lead updated successfully");
      setShowEditForm(false);
      loadLead();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkEnrolled() {
    if (!id) return;
    try {
      await crmApi.updateLead(id, { status: "ENROLLED" });
      toast.success("Lead marked as enrolled");
      loadLead();
    } catch {
      toast.error("Failed to update lead status");
    }
  }

  async function handleScheduleFollowUp() {
    if (!id || !followUpForm.followUpDate) {
      toast.error("Please select a follow-up date");
      return;
    }
    try {
      await crmApi.createFollowUp({
        leadId: id,
        followUpDate: followUpForm.followUpDate,
        remarks: followUpForm.remarks || undefined,
      });
      toast.success("Follow-up scheduled successfully");
      setShowFollowUpForm(false);
      setFollowUpForm({ followUpDate: "", remarks: "" });
      loadLead();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule follow-up");
    }
  }

  async function handleDeleteLead() {
    if (!id) return;
    try {
      await crmApi.deleteLead(id);
      toast.success("Lead deleted successfully");
      navigate(`${basePath}/leads`);
    } catch {
      toast.error("Failed to delete lead");
    }
  }

  async function handleDeleteFollowUp(followUpId: string) {
    try {
      await crmApi.deleteFollowUp(followUpId);
      toast.success("Follow-up deleted");
      loadLead();
    } catch {
      toast.error("Failed to delete follow-up");
    }
  }

  async function handleUpdateFollowUpStatus(followUpId: string, status: "COMPLETED" | "CANCELLED") {
    try {
      await crmApi.updateFollowUp(followUpId, { status });
      toast.success(`Follow-up marked as ${status.toLowerCase()}`);
      loadLead();
    } catch {
      toast.error("Failed to update follow-up");
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!lead) return null;

  const followUps = lead.followUps || [];

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${basePath}/leads`)}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Lead Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all duration-200"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFollowUpForm(true)}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Schedule Follow-up
            </motion.button>
            {lead.status !== "ENROLLED" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMarkEnrolled}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-lg shadow-green-500/25 hover:shadow-xl transition-all duration-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Enrolled
              </motion.button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                  {lead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{lead.name}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}`}>
                    {lead.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={Mail} label="Email" value={lead.email} />
                <InfoItem icon={Phone} label="Phone" value={lead.phone} />
                <InfoItem icon={BookOpen} label="Course Interested" value={lead.courseInterested} />
                <InfoItem icon={User} label="Assigned To" value={lead.assignedUser?.name || "Unassigned"} />
                <InfoItem icon={Clock} label="Created" value={new Date(lead.createdAt).toLocaleDateString()} />
                <InfoItem icon={Clock} label="Last Updated" value={new Date(lead.updatedAt).toLocaleDateString()} />
                {lead.source && <InfoItem icon={StickyNote} label="Source" value={lead.source} />}
              </div>

              {lead.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up History */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Follow-up History</h3>
                <span className="text-xs text-muted-foreground">{followUps.length} total</span>
              </div>

              {followUps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No follow-ups scheduled yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {followUps.map((fu) => (
                    <div key={fu.id} className="p-3 rounded-xl border border-border bg-background/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {new Date(fu.followUpDate).toLocaleDateString()} {new Date(fu.followUpDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${FOLLOW_UP_STATUS_COLORS[fu.status] || "bg-gray-100 text-gray-600"}`}>
                          {fu.status}
                        </span>
                      </div>
                      {fu.remarks && (
                        <p className="text-xs text-muted-foreground mt-1">{fu.remarks}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        {fu.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleUpdateFollowUpStatus(fu.id, "COMPLETED")}
                              className="p-1 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateFollowUpStatus(fu.id, "CANCELLED")}
                              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteFollowUp(fu.id)}
                          className="p-1 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone *</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Course Interested *</label>
              <input
                type="text"
                value={editForm.courseInterested}
                onChange={(e) => setEditForm({ ...editForm, courseInterested: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Source</label>
                <input
                  type="text"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Assigned Counsellor</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
              >
                <option value="">Unassigned</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowEditForm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateLead}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl disabled:opacity-50 transition-all duration-200"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Lead
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showFollowUpForm} onOpenChange={setShowFollowUpForm}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Follow-up Date *</label>
              <input
                type="datetime-local"
                value={followUpForm.followUpDate}
                onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Remarks</label>
              <textarea
                value={followUpForm.remarks}
                onChange={(e) => setFollowUpForm({ ...followUpForm, remarks: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
                placeholder="Follow-up notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowFollowUpForm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleFollowUp}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{lead.name}</strong>? This will also delete all follow-ups. This action cannot be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLead}
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

function InfoItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
