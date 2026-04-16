import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { adminStats, recentTestResults, monthlyPerformance } from "@/data/dummy";
import { Plus, Loader2, Award, AlertTriangle, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi, AdminDashboardData, BatchPerformanceResponse, BatchPerformanceData } from "@/lib/api";
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

type SortBy = 'score' | 'students';

interface CustomTooltipProps extends TooltipProps<number, string> {
  sortedBatches?: BatchPerformanceData[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [batchPerf, setBatchPerf] = useState<BatchPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    Promise.all([
      dashboardApi.admin(),
      dashboardApi.getBatchPerformance()
    ])
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
      if (sortBy === 'score') return b.avgScore - a.avgScore;
      return b.totalStudents - a.totalStudents;
    });
  };

  const sortedBatches = getSortedBatches();

  const ORANGE = {
    light: '#FB923C',
    main: '#F97316',
    dark: '#EA580C',
    bg: '#FFF7ED',
  };

  const chartOptions = {
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
  };

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: `1px solid ${ORANGE.main}`,
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  const tooltipLabelStyle = {
    color: '#fff',
    fontWeight: 600,
    marginBottom: '8px',
    fontSize: '14px',
  };

  const tooltipBodyStyle = {
    color: '#e5e7eb',
    fontSize: '12px',
    lineHeight: '1.6',
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length && label) {
      const batch = sortedBatches.find(b => b.batchName === label);
      if (batch) {
        return (
          <div style={tooltipStyle}>
            <p style={tooltipLabelStyle}>{label}</p>
            <div style={tooltipBodyStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                <span style={{ color: '#9ca3af' }}>Avg Score:</span>
                <span style={{ color: ORANGE.light, fontWeight: 600 }}>{batch.avgScore}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                <span style={{ color: '#9ca3af' }}>Students:</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{batch.totalStudents}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                <span style={{ color: '#9ca3af' }}>Tests:</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{batch.totalTests}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: '#9ca3af' }}>Submissions:</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{batch.totalSubmissions}</span>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const statsCards = data
    ? [
        { title: "Total Students", value: String(data.stats.totalStudents), change: "", icon: "👨‍🎓" },
        { title: "Active Batches", value: String(data.stats.totalBatches), change: "", icon: "📚" },
        { title: "Tests Conducted", value: String(data.stats.totalTests), change: "", icon: "📝" },
        { title: "Avg Performance", value: `${data.stats.avgScore}%`, change: "", icon: "📈" },
      ]
    : adminStats;

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
              <div
                key={card.title}
                className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-5 flex flex-col gap-2 hover:shadow-md transition-shadow"
              >
                <span className="text-gray-400 text-lg">{card.icon}</span>
                <p className={`text-2xl font-semibold text-gray-900 dark:text-foreground ${
                  card.title === "Avg Performance" ? "text-orange-500" : ""
                }`}>
                  {card.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">{card.title}</p>
                {card.change && (
                  <p className="text-xs text-green-600 mt-1">{card.change}</p>
                )}
              </div>
            ))}
          </div>

          {batchPerf && batchPerf.batches.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {batchPerf.summary.bestBatch && (
                  <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-5 border-l-4 border-l-orange-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Best Performing</span>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-foreground">{batchPerf.summary.bestBatch.name}</p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">{batchPerf.summary.bestBatch.score}%</p>
                  </div>
                )}

                {batchPerf.summary.worstBatch && batchPerf.summary.bestBatch?.name !== batchPerf.summary.worstBatch.name && (
                  <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-5 border-l-4 border-l-yellow-400">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Needs Attention</span>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-foreground">{batchPerf.summary.worstBatch.name}</p>
                    <p className="text-3xl font-bold text-yellow-500 mt-1">{batchPerf.summary.worstBatch.score}%</p>
                  </div>
                )}

                <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-5 border-l-4 border-l-gray-300">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Overall Average</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-foreground">All Batches</p>
                  <p className="text-3xl font-bold text-gray-700 dark:text-foreground mt-1">{batchPerf.summary.overallAvg}%</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Batch Performance</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTrend(!showTrend)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        showTrend
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {showTrend ? 'Show Bar Chart' : 'Show Trend'}
                    </button>
                    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                      <button
                        onClick={() => setSortBy('score')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          sortBy === 'score'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Score
                      </button>
                      <button
                        onClick={() => setSortBy('students')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          sortBy === 'students'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Students
                      </button>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  {showTrend && batchPerf.trend.length > 0 ? (
                    <LineChart data={batchPerf.trend} {...chartOptions}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ORANGE.main} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={ORANGE.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '8px' }}
                        formatter={(value: number) => [`${value}%`, 'Avg Score']}
                        cursor={{ stroke: ORANGE.main, strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        stroke={ORANGE.main}
                        strokeWidth={3}
                        dot={{ fill: ORANGE.main, strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 7, fill: ORANGE.dark, stroke: '#fff', strokeWidth: 2 }}
                        fill="url(#lineGradient)"
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={sortedBatches} barCategoryGap="25%" {...chartOptions}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ORANGE.light} />
                          <stop offset="100%" stopColor={ORANGE.main} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="batchName"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: ORANGE.bg }} />
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

                {sortedBatches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No batch performance data available yet
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-card rounded-2xl p-8 border border-border mb-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Test Data Available Yet</h3>
              <p className="text-muted-foreground text-sm">
                Create tests and assign them to batches to see performance analytics here.
              </p>
            </div>
          )}

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
