import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { topicBreakdown } from "@/data/dummy";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Download, FileText, Loader2, Sparkles, TrendingUp, Award, BookOpen, ArrowRight, Clock, Target, Trophy } from "lucide-react";
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
import { useEffect, useState } from "react";
import { dashboardApi, StudentDashboardData, studentApi } from "@/lib/api";

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  subtextColor = "text-muted-foreground",
  gradient,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  subtext?: string;
  subtextColor?: string;
  gradient?: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
      {gradient && (
        <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        {subtext && (
          <p className={`text-xs mt-1.5 ${subtextColor}`}>{subtext}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionPath,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h4 className="text-base font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      {actionLabel && actionPath && (
        <Link
          to={actionPath}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3">
        <TrendingUp className="w-7 h-7 text-primary/60" />
      </div>
      <p className="text-sm font-medium text-foreground/70">No performance data yet</p>
      <p className="text-xs text-muted-foreground mt-1">Complete your first test to see your trend</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<Array<{ topic: string; total: number; correct: number; percentage: number }>>([]);
  const [topicLoading, setTopicLoading] = useState(true);

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

    studentApi.getTopicBreakdown()
      .then((res) => {
        console.log("Topics:", res.topics);
        setTopicData(res.topics || []);
      })
      .catch((err) => console.error("Topic breakdown error:", err))
      .finally(() => setTopicLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-destructive font-medium">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const pendingCount = data?.pendingCount ?? 0;
  const completedCount = data?.completedCount ?? 0;
  const avgScore = data?.avgScore ?? 0;
  const batchRank = data?.batchRank ?? null;
  const scoreTrend = data?.scoreTrend ?? [];
  const myTests = data?.recentTests ?? [];

  // Ensure scoreTrend has valid data for chart
  const safeScoreTrend = Array.isArray(scoreTrend) 
    ? scoreTrend.filter(item => item && typeof item.score === 'number')
    : [];

  const hasData = completedCount > 0 || pendingCount > 0;
  const firstName = user?.name?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("My Performance Report", 20, 25);
    doc.setFontSize(12);
    doc.text(`Student: ${user?.name || "Student"}`, 20, 40);
    doc.text(`Average Score: ${avgScore}%`, 20, 50);
    doc.text(`Tests Completed: ${completedCount}`, 20, 60);
    doc.text(`Tests Pending: ${pendingCount}`, 20, 70);
    if (batchRank) doc.text(`Batch Rank: #${batchRank}`, 20, 80);
    doc.setFontSize(14);
    doc.text("Topic Breakdown", 20, 100);
    topicBreakdown.forEach((t, i) => {
      doc.setFontSize(11);
      doc.text(`${t.topic}: ${t.score}%`, 25, 112 + i * 10);
    });
    doc.setFontSize(14);
    doc.text("Test Results", 20, 170);
    myTests
      .filter((t) => t.status === "completed")
      .forEach((t, i) => {
        doc.setFontSize(11);
        doc.text(`${t.name} — ${t.score ?? 0}%`, 25, 182 + i * 10);
      });
    doc.save("my-report.pdf");
  };

  const downloadTestPdf = (test: StudentDashboardData["recentTests"][0]) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Test Result", 20, 25);
    doc.setFontSize(12);
    doc.text(`Student: ${user?.name || "Student"}`, 20, 40);
    doc.text(`Test: ${test.name}`, 20, 50);
    doc.text(`Score: ${test.score ?? 0}%`, 20, 60);
    doc.text(`Status: ${(test.score ?? 0) >= 50 ? "PASS" : "FAIL"}`, 20, 70);
    doc.save(`${test.name.replace(/\s+/g, "_")}_result.pdf`);
  };

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{getGreeting()},</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasData ? (
                batchRank ? (
                  <>You're ranked <span className="text-primary font-semibold">#{batchRank}</span> in your batch. Keep up the great work!</>
                ) : (
                  <>You have <span className="text-warning font-semibold">{pendingCount} pending</span> tests waiting for you.</>
                )
              ) : (
                <>Ready to start your learning journey? <span className="text-primary font-medium">Let's go!</span></>
              )}
            </p>
          </div>
          <button
            onClick={downloadReport}
            disabled={!hasData}
            className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-border p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Join a batch to start learning
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You're not enrolled in any batch yet. Contact your administrator or institution to get started with your courses and assessments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/student/tests"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              <BookOpen className="w-4 h-4" />
              Browse Courses
            </Link>
            <Link
              to="/student/leaderboard"
              className="inline-flex items-center gap-2 border border-border text-foreground text-sm font-medium px-6 py-3 rounded-xl hover:bg-secondary transition-all duration-200"
            >
              View Leaderboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={Target}
                  label="My Avg Score"
                  value={`${avgScore}%`}
                  subtext={avgScore >= 80 ? "Excellent performance!" : avgScore >= 60 ? "Room to improve" : "Keep practicing"}
                  subtextColor={avgScore >= 80 ? "text-success" : avgScore >= 60 ? "text-warning" : "text-destructive"}
                  gradient="bg-gradient-to-br from-success/20 to-transparent"
                />
                <StatCard
                  icon={BookOpen}
                  label="Tests Done"
                  value={completedCount + pendingCount}
                  subtext={`${completedCount} completed • ${pendingCount} pending`}
                  subtextColor="text-muted-foreground"
                />
                <StatCard
                  icon={Trophy}
                  label="Batch Rank"
                  value={batchRank ? `#${batchRank}` : "—"}
                  subtext={batchRank ? "Keep climbing!" : "Complete a test to rank"}
                  subtextColor={batchRank ? "text-primary" : "text-muted-foreground"}
                  gradient="bg-gradient-to-br from-primary/20 to-transparent"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
                    <EmptyChartState />
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={safeScoreTrend}>
                          <defs>
                            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [`${value}%`, "Score"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            fill="url(#scoreFill)"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Topic Breakdown
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(topicLoading ? topicBreakdown : topicData).map((t, i) => {
                      const percentage = topicLoading ? t.score : t.percentage;
                      const getColor = (pct: number) => {
                        if (pct >= 75) return "text-success";
                        if (pct >= 50) return "text-warning";
                        return "text-destructive";
                      };
                      const getBarColor = (pct: number) => {
                        if (pct >= 75) return "#22c55e";
                        if (pct >= 50) return "#f59e0b";
                        return "#ef4444";
                      };
                      return (
                      <div key={topicLoading ? t.topic : t.topic} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-foreground font-medium">{t.topic}</span>
                          <span className="text-sm font-bold" style={{ color: getColor(percentage) }}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getBarColor(percentage),
                              transitionDelay: `${i * 100}ms`
                            }}
                          />
                        </div>
                      </div>
                    );})}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
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
                        <tr
                          key={test.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150"
                        >
                          <td className="px-5 py-3.5">
                            <span className="font-medium text-foreground">{test.name}</span>
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
                                onClick={() => {
                                  console.log("Clicked Test ID:", test.id);
                                  navigate(`/student/test-result/${test.id}`);
                                }}
                                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all duration-200"
                              >
                                <FileText className="w-3 h-3" />
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
    </AppLayout>
  );
}
