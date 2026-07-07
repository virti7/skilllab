import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { dashboardApi, AdminDashboardData, BatchPerformanceResponse, BatchPerformanceData } from "@/lib/api";
import {
  Plus,
  Loader2,
  Award,
  AlertTriangle,
  BarChart3,
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  Sparkles,
  School,
} from "lucide-react";
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
import type { TooltipProps } from "recharts";

type SortBy = "score" | "students";

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [batchPerf, setBatchPerf] = useState<BatchPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    Promise.all([dashboardApi.admin(), dashboardApi.getBatchPerformance()])
      .then(([d, bp]) => {
        setData(d);
        setBatchPerf(bp);
      })
      .catch(() => {
        setData(null);
        setBatchPerf(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const getSortedBatches = (): BatchPerformanceData[] => {
    if (!batchPerf?.batches) return [];
    return [...batchPerf.batches].sort((a, b) => {
      if (sortBy === "score") return b.avgScore - a.avgScore;
      return b.totalStudents - a.totalStudents;
    });
  };

  const sortedBatches = getSortedBatches();

  const statsCards = data
    ? [
        {
          icon: Users,
          label: "Total Students",
          value: String(data.stats.totalStudents),
          subtext: "Enrolled across all batches",
          gradient: "from-blue-500/20 to-transparent",
        },
        {
          icon: School,
          label: "Active Batches",
          value: String(data.stats.totalBatches),
          subtext: "Currently running",
          gradient: "from-orange-500/20 to-transparent",
        },
        {
          icon: FileText,
          label: "Tests Conducted",
          value: String(data.stats.totalTests),
          subtext: "All time tests",
          gradient: "from-purple-500/20 to-transparent",
        },
        {
          icon: TrendingUp,
          label: "Avg Performance",
          value: `${data.stats.avgScore}%`,
          subtext: "Overall institute average",
          gradient: "from-green-500/20 to-transparent",
        },
      ]
    : [];

  const tableData = data?.recentTests ?? [];

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 md:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Institute Dashboard</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's what's happening with your institute today.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin/tests")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Test
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-40 mb-4" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {statsCards.map((card, i) => {
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.subtext}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Batch Performance */}
            {batchPerf && batchPerf.batches.length > 0 ? (
              <>
                {/* Summary Cards */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {batchPerf.summary.bestBatch && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 border-l-4 border-l-success shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Best Performing
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {batchPerf.summary.bestBatch.name}
                      </p>
                      <p className="text-3xl font-bold text-success mt-1">
                        {batchPerf.summary.bestBatch.score}%
                      </p>
                    </motion.div>
                  )}

                  {batchPerf.summary.worstBatch &&
                    batchPerf.summary.bestBatch?.name !==
                      batchPerf.summary.worstBatch.name && (
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 border-l-4 border-l-warning shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Needs Attention
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {batchPerf.summary.worstBatch.name}
                        </p>
                        <p className="text-3xl font-bold text-warning mt-1">
                          {batchPerf.summary.worstBatch.score}%
                        </p>
                      </motion.div>
                    )}

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Overall Average
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      All Batches
                    </p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {batchPerf.summary.overallAvg}%
                    </p>
                  </motion.div>
                </motion.div>

                {/* Chart */}
                <motion.div
                  variants={itemVariants}
                  className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                      Batch Performance
                    </h3>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowTrend(!showTrend)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          showTrend
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {showTrend ? "Show Bar Chart" : "Show Trend"}
                      </motion.button>
                      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                        <button
                          onClick={() => setSortBy("score")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            sortBy === "score"
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Score
                        </button>
                        <button
                          onClick={() => setSortBy("students")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            sortBy === "students"
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Students
                        </button>
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={280}>
                    {showTrend && batchPerf.trend.length > 0 ? (
                      <LineChart data={batchPerf.trend}>
                        <defs>
                          <linearGradient
                            id="lineGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#F97316"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="#F97316"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.75rem",
                            fontSize: 12,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value: number) => [`${value}%`, "Avg Score"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgScore"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={{
                            fill: "#F97316",
                            strokeWidth: 0,
                            r: 4,
                          }}
                          activeDot={{
                            r: 7,
                            fill: "#EA580C",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart
                        data={sortedBatches}
                        barCategoryGap="25%"
                      >
                        <defs>
                          <linearGradient
                            id="barGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#FB923C"
                            />
                            <stop
                              offset="100%"
                              stopColor="#F97316"
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="batchName"
                          tick={{ fontSize: 11 }}
                          stroke="hsl(var(--muted-foreground))"
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.75rem",
                            fontSize: 12,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          cursor={{ fill: "hsl(var(--secondary))" }}
                        />
                        <Bar
                          dataKey="avgScore"
                          name="Avg Score (%)"
                          fill="url(#barGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </>
            ) : (
              <motion.div
                variants={itemVariants}
                className="bg-card rounded-2xl p-8 border border-border text-center"
              >
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Test Data Available Yet
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create tests and assign them to batches to see performance analytics here.
                </p>
              </motion.div>
            )}

            {/* Recent Test Results */}
            <motion.div variants={itemVariants}>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Test Results
              </h3>
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="overflow-x-auto">
                  <div className="min-w-[500px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Test
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Batch
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Avg Score
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                          Submissions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map(
                        (
                          t: {
                            id?: string;
                            name: string;
                            batch: string;
                            date: string;
                            avgScore: number;
                            submissions: number;
                          },
                          i: number
                        ) => (
                          <motion.tr
                            key={t.id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-5 py-3 font-medium text-foreground">
                              {t.name}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {t.batch}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {t.date}
                            </td>
                            <td className="px-5 py-3 font-medium text-foreground">
                              {t.avgScore}%
                            </td>
                            <td className="px-5 py-3 text-foreground">
                              {t.submissions}
                            </td>
                          </motion.tr>
                        )
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
