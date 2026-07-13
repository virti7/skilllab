import { AppLayout } from "@/components/AppLayout";
import { dashboardApi, AdminAnalyticsData } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await dashboardApi.adminAnalytics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.stats;

  return (
    <AppLayout>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6">Analytics</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-4 md:p-5 border border-border shadow-sm">
              <span className="text-2xl">👨‍🎓</span>
              <p className="text-2xl font-bold text-foreground mt-2">{stats?.totalStudents ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Students</p>
            </div>
            <div className="bg-card rounded-2xl p-4 md:p-5 border border-border shadow-sm">
              <span className="text-2xl">📚</span>
              <p className="text-2xl font-bold text-foreground mt-2">{stats?.totalBatches ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Active Batches</p>
            </div>
            <div className="bg-card rounded-2xl p-4 md:p-5 border border-border shadow-sm">
              <span className="text-2xl">📝</span>
              <p className="text-2xl font-bold text-foreground mt-2">{stats?.totalTests ?? 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Tests Conducted</p>
            </div>
            <div className="bg-card rounded-2xl p-4 md:p-5 border border-border shadow-sm">
              <span className="text-2xl">📈</span>
              <p className="text-2xl font-bold text-foreground mt-2">{stats?.avgScore ?? 0}%</p>
              <p className="text-sm text-muted-foreground mt-1">Avg Performance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data?.monthlyPerformance && data.monthlyPerformance.length > 0 && (
              <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Performance Trend</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {data?.testsByMonth && data.testsByMonth.length > 0 && (
              <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Tests Conducted</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.testsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="tests" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
