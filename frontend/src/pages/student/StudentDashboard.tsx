import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi, StudentDashboardData, studentApi } from "@/lib/api";
import {
  Loader2,
  Sparkles,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Clock,
  Target,
  Trophy,
  History,
  Download,
  FileText,
  TrendingDown,
  GraduationCap,
} from "lucide-react";
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";

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

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  subtextColor = "text-muted-foreground",
  gradient,
  index = 0,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  subtext?: string;
  subtextColor?: string;
  gradient?: string;
  index?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      {gradient && (
        <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
          >
            <Icon className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
          className="text-3xl font-bold text-foreground tracking-tight"
        >
          {value}
        </motion.p>
        {subtext && (
          <p className={`text-xs mt-1.5 ${subtextColor}`}>{subtext}</p>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-3 bg-muted rounded w-20" />
        <div className="w-10 h-10 rounded-xl bg-muted" />
      </div>
      <div className="h-8 bg-muted rounded w-24 mb-2" />
      <div className="h-3 bg-muted rounded w-32" />
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<
    Array<{ topic: string; total: number; correct: number; percentage: number }>
  >([]);
  const [topicLoading, setTopicLoading] = useState(true);
  const [topicSort, setTopicSort] = useState<"strongest" | "weakest">("strongest");

  useEffect(() => {
    dashboardApi
      .student()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard");
        setData(null);
      })
      .finally(() => setLoading(false));

    studentApi
      .getTopicBreakdown()
      .then((res) => {
        setTopicData(res.topics || []);
      })
      .catch((err) => console.error("Topic breakdown error:", err))
      .finally(() => setTopicLoading(false));
  }, []);

  const sortedTopics = [...topicData].sort((a, b) => {
    return topicSort === "strongest"
      ? b.percentage - a.percentage
      : a.percentage - b.percentage;
  });

  const firstName = user?.name?.split(" ")[0] || "there";
  const pendingCount = data?.pendingCount ?? 0;
  const completedCount = data?.completedCount ?? 0;
  const avgScore = data?.avgScore ?? 0;
  const batchRank = data?.batchRank ?? null;
  const scoreTrend = data?.scoreTrend ?? [];
  const myTests = data?.recentTests ?? [];
  const safeScoreTrend = Array.isArray(scoreTrend)
    ? scoreTrend.filter((item) => item && typeof item.score === "number")
    : [];
  const hasData = completedCount > 0 || pendingCount > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout rightPanel={<RightPanel />}>
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-64" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-32 mb-4" />
              <div className="h-52 bg-muted rounded" />
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-5 bg-muted rounded w-40 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-muted rounded w-24 mb-2" />
                    <div className="h-2 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-20"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-destructive font-medium">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Welcome Banner */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-6 lg:p-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <span>{getGreeting()},</span>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  Welcome back, {firstName}
                </h1>
                <p className="text-white/70 text-sm max-w-lg">
                  {hasData
                    ? batchRank
                      ? `You're ranked #${batchRank} in your batch. Keep up the great work!`
                      : `You have ${pendingCount} pending tests waiting for you.`
                    : "Ready to start your learning journey? Let's go!"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/student/test-history")}
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/25 transition-all duration-200 border border-white/10"
                >
                  <History className="w-4 h-4" />
                  Test History
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 bg-white text-orange-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg"
                >
                  <GraduationCap className="w-4 h-4" />
                  Start Learning
                </motion.button>
              </div>
            </div>
          </motion.div>

          {!hasData ? (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-border p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6"
              >
                <BookOpen className="w-10 h-10 text-primary" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Join a batch to start learning
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You're not enrolled in any batch yet. Contact your administrator
                to get started with your courses and assessments.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/student/tests"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse Courses
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Statistics Cards */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <StatCard
                  icon={Target}
                  label="My Avg Score"
                  value={`${avgScore}%`}
                  subtext={
                    avgScore >= 80
                      ? "Excellent performance!"
                      : avgScore >= 60
                      ? "Room to improve"
                      : "Keep practicing"
                  }
                  subtextColor={
                    avgScore >= 80
                      ? "text-success"
                      : avgScore >= 60
                      ? "text-warning"
                      : "text-destructive"
                  }
                  gradient="bg-gradient-to-br from-success/20 to-transparent"
                  index={0}
                />
                <StatCard
                  icon={BookOpen}
                  label="Tests Done"
                  value={completedCount + pendingCount}
                  subtext={`${completedCount} completed • ${pendingCount} pending`}
                  index={1}
                />
                <StatCard
                  icon={Trophy}
                  label="Batch Rank"
                  value={batchRank ? `#${batchRank}` : "—"}
                  subtext={
                    batchRank ? "Keep climbing!" : "Complete a test to rank"
                  }
                  subtextColor={
                    batchRank ? "text-primary" : "text-muted-foreground"
                  }
                  gradient="bg-gradient-to-br from-primary/20 to-transparent"
                  index={2}
                />
              </motion.div>

              {/* Charts Row */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {/* Score Trend */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Score Trend
                    </h3>
                    {safeScoreTrend.length > 0 && (
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg">
                        Last {safeScoreTrend.length} tests
                      </span>
                    )}
                  </div>
                  {safeScoreTrend.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3">
                        <TrendingUp className="w-7 h-7 text-primary/60" />
                      </div>
                      <p className="text-sm font-medium text-foreground/70">
                        No performance data yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Complete your first test to see your trend
                      </p>
                    </div>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={safeScoreTrend}>
                          <defs>
                            <linearGradient
                              id="scoreFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.15}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--primary))"
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
                            dataKey="test"
                            tick={{ fontSize: 11 }}
                            stroke="hsl(var(--muted-foreground))"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11 }}
                            stroke="hsl(var(--muted-foreground))"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "0.75rem",
                              fontSize: 12,
                              boxShadow:
                                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [
                              `${value}%`,
                              "Score",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            fill="url(#scoreFill)"
                            strokeWidth={2.5}
                            dot={{
                              r: 4,
                              fill: "hsl(var(--primary))",
                              strokeWidth: 0,
                            }}
                            activeDot={{
                              r: 6,
                              fill: "hsl(var(--primary))",
                              strokeWidth: 0,
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Topic Breakdown */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Topic Breakdown
                    </h3>
                    {topicData.length > 1 && (
                      <div className="flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg">
                        <button
                          onClick={() => setTopicSort("strongest")}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                            topicSort === "strongest"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          Strongest
                        </button>
                        <button
                          onClick={() => setTopicSort("weakest")}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                            topicSort === "weakest"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <TrendingDown className="w-3 h-3 inline mr-1" />
                          Weakest
                        </button>
                      </div>
                    )}
                  </div>
                  {topicLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-20 mb-2" />
                          <div className="h-2 bg-muted rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : topicData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                        <Award className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No topic data available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedTopics.map((t, i) => {
                        const getColor = (pct: number) => {
                          if (pct >= 75) return "#22c55e";
                          if (pct >= 50) return "#f59e0b";
                          return "#ef4444";
                        };
                        return (
                          <motion.div
                            key={t.topic}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-foreground font-medium">
                                {t.topic}
                              </span>
                              <span
                                className="text-sm font-bold"
                                style={{ color: getColor(t.percentage) }}
                              >
                                {t.percentage}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${t.percentage}%` }}
                                transition={{
                                  duration: 0.8,
                                  delay: i * 0.1,
                                  ease: "easeOut",
                                }}
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: getColor(t.percentage),
                                }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* My Tests Table */}
              <motion.div
                variants={itemVariants}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    My Tests
                  </h3>
                  <Link
                    to="/student/tests"
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Test
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Duration
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Batch
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Score
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTests.map((test, i) => (
                        <motion.tr
                          key={test.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150"
                        >
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-foreground">
                              {test.name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {test.duration}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {test.batchName || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                                test.status === "pending"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
                              }`}
                            >
                              {test.status === "pending" ? "Pending" : "Done"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {test.score !== null ? (
                              <span className="font-bold text-success">
                                {test.score}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {test.status === "pending" ? (
                              <Link
                                to={`/student/test-page/${test.id}`}
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 ${
                                  i === 0
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
                                    : "border border-border text-foreground hover:bg-secondary"
                                }`}
                              >
                                Start
                              </Link>
                            ) : (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/student/test-result/${test.id}`
                                  )
                                }
                                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all duration-200"
                              >
                                <FileText className="w-3 h-3" />
                                View
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AppLayout>
  );
}
