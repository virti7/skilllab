import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RightPanel } from "@/components/RightPanel";
import { codingApi, CodingBatch } from "@/lib/api";
import {
  Loader2,
  Code2,
  TrendingUp,
  Target,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  History,
  ArrowRight,
  Brain,
  Lightbulb,
  Zap,
} from "lucide-react";

interface StudentAnalytics {
  totalSubmissions: number;
  totalCodingTests: number;
  avgAccuracy: number;
  avgRuntime: number;
  avgMemory: number;
  languageStats: Array<{ language: string; submissions: number; accuracy: number }>;
  topicPerformance: Array<{ topic: string; total: number; passed: number; accuracy: number }>;
  weakTopics: string[];
  strongTopics: string[];
  recentSubmissions: Array<{
    id: string;
    questionId: string;
    questionTitle: string;
    language: string;
    passed: number;
    total: number;
    runtime: number | null;
    status: string;
    createdAt: string;
  }>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "text-primary",
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

export default function StudentCodingAnalytics() {
  const { batchId, submissionId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<CodingBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>(batchId || "");
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<any>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (submissionId) {
      loadSubmission(submissionId);
    } else if (selectedBatch) {
      loadAnalytics();
    }
  }, [selectedBatch, submissionId]);

  async function loadBatches() {
    try {
      const data = await codingApi.getBatches();
      setBatches(data || []);
      if (!selectedBatch && data && data.length > 0) {
        setSelectedBatch(data[0].batchId);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    }
  }

  async function loadSubmission(id: string) {
    setLoading(true);
    try {
      const data = await codingApi.getResultById(id);
      setSubmission(data);
    } catch (err) {
      console.error("Failed to load submission:", err);
      setError("Failed to load submission");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    if (!selectedBatch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await codingApi.getStudentAnalytics(selectedBatch);
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (batches.length === 0) {
    return (
      <AppLayout rightPanel={<RightPanel />}>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
            <Code2 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Coding Data</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have access to any coding batches yet.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout rightPanel={<RightPanel />}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {submission ? "Submission Analytics" : "Coding Analytics"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {submission ? "View your code submission details" : "Track your coding performance and progress"}
        </p>
      </div>

      {submission && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{submission.question?.title}</h2>
              <p className="text-sm text-muted-foreground">
                {submission.question?.topic} · {submission.question?.difficulty} · {submission.language}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${submission.passed === submission.total ? "text-green-500" : "text-yellow-500"}`}>
                {submission.passed}/{submission.total}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round((submission.passed / submission.total) * 100)}% passed
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Runtime</p>
              <p className="font-semibold">{submission.runtime || "N/A"}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Memory</p>
              <p className="font-semibold">{submission.memory || "N/A"}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">{submission.status}</p>
            </div>
          </div>
          {submission.question?.testCases && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Test Cases</h3>
              <div className="space-y-2">
                {submission.question.testCases.slice(0, 5).map((tc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded text-xs">
                    <span>Test {idx + 1}</span>
                    <span className="text-muted-foreground">
                      Input: {tc.input.substring(0, 30)}... → Expected: {tc.expectedOutput.substring(0, 20)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {submission.code && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Your Code</h3>
              <pre className="bg-secondary rounded p-4 text-xs overflow-x-auto">{submission.code}</pre>
            </div>
          )}
          <div className="mt-4">
            <button onClick={() => navigate("/student/coding/history")} className="text-sm text-primary hover:underline">
              ← Back to History
            </button>
          </div>
        </div>
      )}

      {!submission && (
        <>
          {batches.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch.batchId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedBatch === batch.batchId
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {batch.name}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {analytics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={Code2}
                  label="Total Submissions"
                  value={analytics.totalSubmissions}
                  subtext={`${analytics.totalCodingTests} tests attempted`}
                  color="text-primary"
                />
                <StatCard
                  icon={Target}
                  label="Avg Accuracy"
                  value={`${analytics.avgAccuracy}%`}
                  subtext={
                    analytics.avgAccuracy >= 75
                      ? "Great performance!"
                      : analytics.avgAccuracy >= 50
                      ? "Room to improve"
                      : "Keep practicing"
                  }
                  color={
                    analytics.avgAccuracy >= 75
                      ? "text-success"
                      : analytics.avgAccuracy >= 50
                      ? "text-warning"
                      : "text-destructive"
                  }
                />
                <StatCard
                  icon={Clock}
                  label="Avg Runtime"
                  value={analytics.avgRuntime ? `${analytics.avgRuntime}ms` : "—"}
                  subtext="Per test case"
                  color="text-blue-500"
                />
                <StatCard
                  icon={Award}
                  label="Language Stats"
                  value={analytics.languageStats.length}
                  subtext="Languages used"
                  color="text-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {analytics.weakTopics.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4 text-destructive" />
                      Weak Topics
                    </h3>
                    <div className="space-y-2">
                      {analytics.weakTopics.slice(0, 5).map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                          <span className="text-sm text-destructive font-medium">{topic}</span>
                          <Lightbulb className="w-4 h-4 text-destructive/70" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border">
                      <h4 className="text-xs font-medium text-foreground mb-2">AI Suggestions</h4>
                      <ul className="space-y-1">
                        <li className="text-xs text-muted-foreground flex items-start gap-2">
                          <Zap className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                          Focus on {analytics.weakTopics[0]} problems daily
                        </li>
                        <li className="text-xs text-muted-foreground flex items-start gap-2">
                          <Zap className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                          Review standard patterns for {analytics.weakTopics[0]}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {analytics.strongTopics.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-success" />
                      Strong Topics
                    </h3>
                    <div className="space-y-2">
                      {analytics.strongTopics.slice(0, 5).map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-success/10 rounded-lg">
                          <span className="text-sm text-success font-medium">{topic}</span>
                          <CheckCircle2 className="w-4 h-4 text-success/70" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Topic Performance
                  </h3>
                  {analytics.topicPerformance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No topic data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topicPerformance.map((topic) => {
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
                          <div key={topic.topic}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-foreground font-medium">{topic.topic}</span>
                              <span className="text-sm font-bold" style={{ color: getBarColor(topic.accuracy) }}>
                                {topic.accuracy}%
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${topic.accuracy}%`, backgroundColor: getBarColor(topic.accuracy) }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {analytics.languageStats.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5 mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Language Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.languageStats.map((lang) => (
                      <div key={lang.language} className="bg-secondary/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-foreground capitalize">{lang.language}</p>
                        <p className="text-sm text-muted-foreground">{lang.accuracy}% accuracy</p>
                        <p className="text-xs text-muted-foreground">{lang.submissions} submissions</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Recent Submissions
                  </h3>
                  <Link
                    to={`/student/coding/history/${selectedBatch}`}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {analytics.recentSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No submissions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Question</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Language</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Result</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Runtime</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentSubmissions.slice(0, 10).map((sub) => (
                          <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                            <td className="px-5 py-3">
                              <span className="font-medium text-foreground">{sub.questionTitle}</span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground capitalize">{sub.language}</td>
                            <td className="px-5 py-3">
                              <span
                                className={`font-medium ${
                                  sub.passed === sub.total
                                    ? "text-success"
                                    : sub.passed > 0
                                    ? "text-warning"
                                    : "text-destructive"
                                }`}
                              >
                                {sub.passed}/{sub.total}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {sub.runtime ? `${sub.runtime}ms` : "—"}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  sub.status === "success"
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {sub.status === "success" ? "Passed" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  );
}