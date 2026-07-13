import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { crmApi, Lead, LeadStatus, Counsellor, CrmLeadsResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  X,
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

const STATUS_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "ENROLLED", "REJECTED"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-orange-100 text-orange-700",
  FOLLOW_UP: "bg-purple-100 text-purple-700",
  INTERESTED: "bg-emerald-100 text-emerald-700",
  ENROLLED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  courseInterested: "",
  status: "NEW" as LeadStatus,
  source: "",
  assignedTo: "",
  notes: "",
};

export default function CrmLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === "super_admin" ? "/super-admin/crm" : "/admin/crm";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data: CrmLeadsResponse = await crmApi.getLeads({ search, status: statusFilter, page, limit: 15 });
      setLeads(data.leads);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    crmApi.getCounsellors().then(setCounsellors).catch(() => setCounsellors([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function openCreate() {
    setEditingLead(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      courseInterested: lead.courseInterested,
      status: lead.status,
      source: lead.source || "",
      assignedTo: lead.assignedTo || "",
      notes: lead.notes || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.phone || !form.courseInterested) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        source: form.source || undefined,
        assignedTo: form.assignedTo || undefined,
        notes: form.notes || undefined,
      };
      if (editingLead) {
        await crmApi.updateLead(editingLead.id, payload);
        toast.success("Lead updated successfully");
      } else {
        await crmApi.createLead(payload);
        toast.success("Lead created successfully");
      }
      setShowForm(false);
      loadLeads();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save lead");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await crmApi.deleteLead(deleteConfirm.id);
      toast.success("Lead deleted successfully");
      setDeleteConfirm(null);
      loadLeads();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lead");
    }
  }

  function exportCSV() {
    const headers = ["Name", "Phone", "Email", "Course", "Status", "Assigned To", "Source", "Created"];
    const rows = leads.map((l) => [
      l.name,
      l.phone,
      l.email,
      l.courseInterested,
      l.status,
      l.assignedUser?.name || "",
      l.source || "",
      new Date(l.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported successfully");
  }

  return (
    <AppLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 md:space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Leads</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} total leads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportCSV}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="ALL">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No leads found.</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first lead to get started.</p>
          </div>
        ) : (
          <>
            <motion.div variants={itemVariants} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Phone</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Course</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Assigned To</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Created</th>
                        <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {lead.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <button
                                onClick={() => navigate(`${basePath}/leads/${lead.id}`)}
                                className="font-medium text-foreground hover:text-primary transition-colors text-left"
                              >
                                {lead.name}
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{lead.phone}</td>
                          <td className="px-5 py-3 text-muted-foreground">{lead.email}</td>
                          <td className="px-5 py-3 text-muted-foreground">{lead.courseInterested}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}`}>
                              {lead.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{lead.assignedUser?.name || "—"}</td>
                          <td className="px-5 py-3 text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate(`${basePath}/leads/${lead.id}`)}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEdit(lead)}
                                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(lead)}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg bg-card border border-border disabled:opacity-50 hover:bg-secondary transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg bg-card border border-border disabled:opacity-50 hover:bg-secondary transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Lead Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Course Interested *</label>
              <input
                type="text"
                value={form.courseInterested}
                onChange={(e) => setForm({ ...form, courseInterested: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                placeholder="e.g. Full Stack Development"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
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
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60"
                  placeholder="e.g. Website, Referral"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Assigned Counsellor</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
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
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none"
                placeholder="Additional notes..."
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
              {editingLead ? "Update Lead" : "Create Lead"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
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
