import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { studentScoreTrend, topicBreakdown } from "@/data/dummy";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import jsPDF from "jspdf";
import { useEffect, useState } from "react";
import { dashboardApi, StudentDashboardData } from "@/lib/api";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .student()
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Derived values – API first, dummy fallback
  const pendingCount = data?.pendingCount ?? 0;
  const completedCount = data?.completedCount ?? 0;
  const avgScore = data?.avgScore ?? 0;
  const batchRank = data?.batchRank ?? null;
  const scoreTrend =
    data?.scoreTrend?.length ? data.scoreTrend : studentScoreTrend;
  const myTests = data?.recentTests ?? [];

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
      {/* Welcome Banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Welcome, {user?.name?.split(" ")[0] || "Student"} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} tests pending
            {batchRank ? ` — you're ranked #${batchRank} in your batch!` : ""}
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Download My Report
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                My Avg Score
              </p>
              <p className="text-3xl font-bold text-success mt-1">{avgScore}%</p>
              <p className="text-xs text-success mt-1">Top 10%</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tests Done
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {completedCount + pendingCount}
              </p>
              <p className="text-xs text-warning mt-1">{pendingCount} pending</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Batch Rank
              </p>
              <p className="text-3xl font-bold text-primary mt-1">
                {batchRank ? `#${batchRank}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {batchRank ? "Keep climbing!" : "Complete a test to rank"}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Score Trend */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                My Score Trend
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrend}>
                    <defs>
                      <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="test"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value}%`, "Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--success))"
                      fill="url(#scoreFill)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(var(--success))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Topic Breakdown
              </h3>
              <div className="space-y-4">
                {topicBreakdown.map((t) => (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{t.topic}</span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: t.color }}
                      >
                        {t.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${t.score}%`, backgroundColor: t.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Tests Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-semibold text-foreground">My Tests</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      Test
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      Duration
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      Batch
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      Score
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-primary uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myTests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center px-5 py-8 text-muted-foreground text-sm"
                      >
                        No tests assigned yet. Join a batch to get started!
                      </td>
                    </tr>
                  ) : (
                    myTests.map((test, i) => (
                      <tr
                        key={test.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {test.name}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {test.duration}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {test.batchName || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-xs font-medium ${
                              test.status === "pending"
                                ? "text-warning"
                                : "text-success"
                            }`}
                          >
                            {test.status === "pending" ? "Pending" : "Done"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {test.score !== null ? (
                            <span className="font-semibold text-success">
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
                              className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-opacity ${
                                i === 0
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "border border-border text-foreground hover:bg-secondary"
                              }`}
                            >
                              Start
                            </Link>
                          ) : (
                            <button
                              onClick={() => downloadTestPdf(test)}
                              className="flex items-center gap-1.5 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                            >
                              <FileText className="w-3 h-3" />
                              PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
