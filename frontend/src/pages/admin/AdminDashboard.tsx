import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { adminStats, recentTestResults, monthlyPerformance } from "@/data/dummy";
import { Plus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi, AdminDashboardData } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .admin()
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Merge API data with dummy fallbacks for display
  const statsCards = data
    ? [
        { title: "Total Students", value: String(data.stats.totalStudents), change: "", icon: "👨‍🎓" },
        { title: "Active Batches", value: String(data.stats.totalBatches), change: "", icon: "📚" },
        { title: "Tests Conducted", value: String(data.stats.totalTests), change: "", icon: "📝" },
        { title: "Avg Performance", value: `${data.stats.avgScore}%`, change: "", icon: "📈" },
      ]
    : adminStats;

  const chartData = data?.monthlyPerformance?.length
    ? data.monthlyPerformance
    : monthlyPerformance;

  const tableData = data?.recentTests?.length ? data.recentTests : recentTestResults;

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Institute Dashboard</h2>
        <button
          onClick={() => navigate("/admin/tests")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Test
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsCards.map((card) => (
              <div key={card.title} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                <span className="text-2xl">{card.icon}</span>
                <p className="text-2xl font-bold text-foreground mt-2">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                {card.change && (
                  <p className="text-xs text-success mt-1">{card.change}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border mb-8">
            <h3 className="font-semibold text-foreground mb-4">Batch Performance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Test Results</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Test</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Batch</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Avg Score</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((t: { id?: string; name: string; batch: string; date: string; avgScore: number; submissions: number }, i: number) => (
                  <tr
                    key={t.id || i}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.batch}</td>
                    <td className="px-5 py-3 text-muted-foreground">{t.date}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{t.avgScore}%</td>
                    <td className="px-5 py-3 text-foreground">{t.submissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
