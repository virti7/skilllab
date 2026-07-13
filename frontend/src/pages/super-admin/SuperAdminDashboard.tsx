import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { superAdminApi, SuperAdminDashboardData } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function SuperAdminDashboard() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await superAdminApi.getDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.stats;
  const statsCards = stats
    ? [
        {
          icon: Building2,
          label: "Total Institutes",
          value: stats.totalInstitutes.toLocaleString(),
          gradient: "from-blue-500/20 to-transparent",
        },
        {
          icon: Users,
          label: "Total Students",
          value: stats.totalStudents.toLocaleString(),
          gradient: "from-orange-500/20 to-transparent",
        },
        {
          icon: TrendingUp,
          label: "Avg Score",
          value: `${stats.avgScore}%`,
          gradient: "from-green-500/20 to-transparent",
        },
        {
          icon: Activity,
          label: "Total Tests",
          value: stats.totalTests.toLocaleString(),
          gradient: "from-purple-500/20 to-transparent",
        },
      ]
    : [];

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Platform Overview</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor all institutes, users, and platform metrics.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-destructive">{error}</div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {statsCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {card.label}
                        </p>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
                        >
                          <Icon className="w-5 h-5 text-primary" />
                        </motion.div>
                      </div>
                      <p className="text-2xl font-bold text-foreground tracking-tight">
                        {card.value}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Charts */}
            {data?.monthlyPerformance && data.monthlyPerformance.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Platform Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.monthlyPerformance}>
                      <defs>
                        <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FB923C" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="score" fill="url(#perfGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Recent Institutes */}
            {data?.recentInstitutes && data.recentInstitutes.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Recent Institutes
                </h3>
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Institute</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Users</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Batches</th>
                          <th className="text-left px-5 py-3 font-medium text-muted-foreground">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentInstitutes.map((inst) => (
                          <tr key={inst.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="px-5 py-3 font-medium text-foreground">{inst.name}</td>
                            <td className="px-5 py-3 text-muted-foreground">{inst.userCount}</td>
                            <td className="px-5 py-3 text-muted-foreground">{inst.batchCount}</td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {new Date(inst.createdAt).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}
