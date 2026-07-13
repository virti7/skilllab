import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { crmApi, CrmDashboardData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Users,
  UserPlus,
  PhoneCall,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#f97316",
  FOLLOW_UP: "#a855f7",
  INTERESTED: "#10b981",
  ENROLLED: "#22c55e",
  REJECTED: "#ef4444",
};

function SkeletonStatCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
      <div className="h-8 bg-muted rounded w-20 mb-2" />
      <div className="h-3 bg-muted rounded w-28" />
    </div>
  );
}

export default function CrmDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === "super_admin" ? "/super-admin/crm" : "/admin/crm";
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmApi
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const statsCards = data
    ? [
        {
          icon: Users,
          label: "Total Leads",
          value: String(data.totalLeads),
          gradient: "from-blue-500/20 to-transparent",
        },
        {
          icon: UserPlus,
          label: "New Leads",
          value: String(data.newLeads),
          gradient: "from-orange-500/20 to-transparent",
        },
        {
          icon: PhoneCall,
          label: "Follow-ups Today",
          value: String(data.followUpsToday),
          gradient: "from-purple-500/20 to-transparent",
        },
        {
          icon: GraduationCap,
          label: "Enrolled",
          value: String(data.enrolledLeads),
          gradient: "from-green-500/20 to-transparent",
        },
        {
          icon: TrendingUp,
          label: "Conversion Rate",
          value: `${data.conversionRate}%`,
          gradient: "from-cyan-500/20 to-transparent",
        },
      ]
    : [];

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 md:space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>CRM Dashboard</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              Customer Relationship Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track leads, follow-ups, and conversions at a glance.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        ) : (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {statsCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
                        >
                          <Icon className="w-5 h-5 text-primary" />
                        </motion.div>
                      </div>
                      <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="font-semibold text-foreground mb-4">Lead Status Distribution</h3>
                {data && data.statusChart.some((s) => s.count > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.statusChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" name="Leads" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {data.statusChart.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    No lead data available yet.
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
                {data && data.statusChart.some((s) => s.count > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.statusChart.filter((s) => s.count > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        dataKey="count"
                        nameKey="status"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {data.statusChart
                          .filter((s) => s.count > 0)
                          .map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    No lead data available yet.
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Leads</h3>
                <button
                  onClick={() => navigate(`${basePath}/leads`)}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Phone</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Course</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Assigned To</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.recentLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            onClick={() => navigate(`${basePath}/leads/${lead.id}`)}
                            className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3 font-medium text-foreground">{lead.name}</td>
                            <td className="px-5 py-3 text-muted-foreground">{lead.phone}</td>
                            <td className="px-5 py-3 text-muted-foreground">{lead.courseInterested}</td>
                            <td className="px-5 py-3">
                              <StatusBadge status={lead.status} />
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">{lead.assignedUser?.name || "—"}</td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {(!data?.recentLeads || data.recentLeads.length === 0) && (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                              No leads yet. Add your first lead to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-orange-100 text-orange-700",
    FOLLOW_UP: "bg-purple-100 text-purple-700",
    INTERESTED: "bg-emerald-100 text-emerald-700",
    ENROLLED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
