import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { batchApi, BatchAnalyticsResponse } from '@/lib/api';
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  BookOpen,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export default function BatchAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BatchAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAnalytics() {
    setLoading(true);
    setError('');
    try {
      const response = await batchApi.getAnalytics(id);
      setData(response);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-muted-foreground">{error || 'No data available'}</p>
          <button
            onClick={() => navigate('/admin/batches')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Batches
          </button>
        </div>
      </AppLayout>
    );
  }

  const { batch, summary, students, tests, leaderboard, trends, insights, scoreDistribution } = data;

  const pieData = [
    { name: 'Excellent (70%+)', value: scoreDistribution.excellent },
    { name: 'Average (40-70%)', value: scoreDistribution.average },
    { name: 'Needs Help (<40%)', value: scoreDistribution.needsImprovement },
    { name: 'No Attempts', value: scoreDistribution.noAttempts },
  ].filter((d) => d.value > 0);

  const sortedStudents = [...students].sort((a, b) => {
    const aScore = a.avgScore ?? -1;
    const bScore = b.avgScore ?? -1;
    return bScore - aScore;
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <AppLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/batches')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Batches
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{batch.name}</h2>
            {batch.inviteCode && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Invite Code:</span>
                <button
                  onClick={() => copyCode(batch.inviteCode)}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <span className="font-mono font-bold tracking-widest">{batch.inviteCode}</span>
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {summary.totalStudents} students
            </span>
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {summary.totalTests} tests
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Batch Score</CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {summary.avgBatchScore !== null ? `${summary.avgBatchScore}%` : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalTests}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
              <Trophy className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {insights.topPerformer?.name || 'N/A'}
              </div>
              {insights.topPerformer && (
                <p className="text-sm text-success">{insights.topPerformer.score}%</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Test Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends.testScoresOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trends.testScoresOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="testName" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No test data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No student data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Student Scores Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedStudents.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedStudents.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Avg Score']}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No student data available
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {top3.length > 0 ? (
                <div className="space-y-3">
                  {top3.map((entry, index) => (
                    <div
                      key={entry.studentId}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                        index === 0
                          ? 'bg-warning/10 border border-warning/30'
                          : index === 1
                          ? 'bg-muted border border-border'
                          : 'bg-secondary/50 border border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.testsAttempted} tests • {entry.avgScore}% avg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{entry.totalScore}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length > 3 && (
                    <div className="border-t border-border pt-3 mt-3">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Others</p>
                      {leaderboard.slice(3, 7).map((entry) => (
                        <div
                          key={entry.studentId}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-muted-foreground w-6">#{entry.rank}</span>
                          <span className="flex-1">{entry.name}</span>
                          <span className="text-muted-foreground">{entry.avgScore}%</span>
                          <span className="font-medium ml-4">{entry.totalScore} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  No leaderboard data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.topPerformer && (
                  <div className="flex items-start gap-3 p-3 bg-success/10 rounded-xl border border-success/20">
                    <Trophy className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-success">Top Performer</p>
                      <p className="text-sm">
                        {insights.topPerformer.name} with {insights.topPerformer.score}% average score
                      </p>
                    </div>
                  </div>
                )}

                {insights.weakStudentsCount > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                    <TrendingDown className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Needs Attention</p>
                      <p className="text-sm">
                        {insights.weakStudentsCount} student{insights.weakStudentsCount > 1 ? 's' : ''} below 40%
                      </p>
                      {insights.weakStudents.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {insights.weakStudents.map((s) => s.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {insights.bestTest && (
                  <div className="flex items-start gap-3 p-3 bg-success/10 rounded-xl border border-success/20">
                    <Star className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-success">Best Performing Test</p>
                      <p className="text-sm">
                        {insights.bestTest.title} ({insights.bestTest.score}% avg)
                      </p>
                    </div>
                  </div>
                )}

                {insights.worstTest && insights.worstTest.score < 60 && (
                  <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-xl border border-warning/20">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Needs Improvement</p>
                      <p className="text-sm">
                        {insights.worstTest.title} ({insights.worstTest.score}% avg)
                      </p>
                    </div>
                  </div>
                )}

                {summary.totalAttempts === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No test attempts yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Students Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Tests</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, index) => {
                    const rank = student.avgScore !== null
                      ? sortedStudents.findIndex((s) => s.id === student.id) + 1
                      : '-';
                    return (
                      <tr
                        key={student.id}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{student.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{student.email}</td>
                        <td className="py-3 px-4 text-center">{student.testsAttempted}</td>
                        <td className="py-3 px-4 text-center">
                          {student.avgScore !== null ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.avgScore >= 70
                                  ? 'bg-success/10 text-success'
                                  : student.avgScore >= 40
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              {student.avgScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {student.avgScore !== null ? (
                            <span className="font-medium">#{rank}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students enrolled in this batch
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Test Name</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Attempts</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{test.title}</td>
                      <td className="py-3 px-4 text-center">{test.attempts}</td>
                      <td className="py-3 px-4 text-center">
                        {test.avgScore !== null ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              test.avgScore >= 70
                                ? 'bg-success/10 text-success'
                                : test.avgScore >= 40
                                ? 'bg-warning/10 text-warning'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {test.avgScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tests in this batch
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
