import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { codingApi } from "@/lib/api";
import {
  Loader2,
  Code2,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  ArrowLeft,
  BarChart3,
} from "lucide-react";

interface CodingTestAnalytics {
  test: {
    id: string;
    title: string;
    batchName: string | null;
    duration: number;
    totalQuestions: number;
  };
  overallStats: {
    totalStudents: number;
    attemptedStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    totalSubmissions: number;
  };
  students: Array<{
    userId: string;
    name: string;
    email: string;
    score: number;
    correct: number;
    wrong: number;
    total: number;
    accuracy: number;
    weakTopics: string[];
    strongTopics: string[];
    status: string;
    submissions: number;
  }>;
  questionAnalytics: Array<{
    questionId: string;
    title: string;
    topic: string;
    difficulty: string;
    correctAttempts: number;
    wrongAttempts: number;
    totalAttempts: number;
    accuracy: number;
    difficulty: string;
  }>;
  mostDifficultQuestions: Array<{
    questionId: string;
    title: string;
    topic: string;
    accuracy: number;
  }>;
  easiestQuestions: Array<{
    questionId: string;
    title: string;
    topic: string;
    accuracy: number;
  }>;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsImprovement: number;
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "text-primary",
}: {
  icon: typeof Users;
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
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
}

export default function AdminCodingTestAnalytics() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<CodingTestAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      loadAnalytics();
    }
  }, [testId]);

  async function loadAnalytics() {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await codingApi.getTestAnalytics(testId);
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
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !analytics) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Code2 className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {error || "Analytics Not Found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            Could not load coding test analytics
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {analytics.test.title}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Batch: {analytics.test.batchName || "Unknown"} •{" "}
          {analytics.test.totalQuestions} questions • {analytics.test.duration} min
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Students"
          value={analytics.overallStats.totalStudents}
          subtext="Enrolled in batch"
          color="text-blue-500"
        />
        <StatCard
          icon={Target}
          label="Attempted"
          value={analytics.overallStats.attemptedStudents}
          subtext={`${Math.round((analytics.overallStats.attemptedStudents / analytics.overallStats.totalStudents) * 100) || 0}% participation`}
          color="text-green-500"
        />
        <StatCard
          icon={Award}
          label="Avg Score"
          value={`${analytics.overallStats.averageScore}%`}
          subtext={`Highest: ${analytics.overallStats.highestScore}%`}
          color={
            analytics.overallStats.averageScore >= 60
              ? "text-success"
              : "text-warning"
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Pass Rate"
          value={`${analytics.overallStats.passRate}%`}
          subtext={`${analytics.overallStats.attemptedStudents} attempted`}
          color={
            analytics.overallStats.passRate >= 50
              ? "text-success"
              : "text-warning"
          }
        />
      </div>

      {analytics.scoreDistribution && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Score Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {analytics.scoreDistribution.excellent}
              </div>
              <p className="text-xs text-muted-foreground">Excellent (80%+)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.scoreDistribution.good}
              </div>
              <p className="text-xs text-muted-foreground">Good (60-79%)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {analytics.scoreDistribution.average}
              </div>
              <p className="text-xs text-muted-foreground">Average (40-59%)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {analytics.scoreDistribution.needsImprovement}
              </div>
              <p className="text-xs text-muted-foreground">&lt;40%</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            Most Difficult Questions
          </h3>
          {analytics.mostDifficultQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-3">
              {analytics.mostDifficultQuestions.map((q, i) => (
                <div
                  key={q.questionId}
                  className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {q.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{q.topic}</p>
                  </div>
                  <span className="text-sm font-bold text-destructive">
                    {q.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            Easiest Questions
          </h3>
          {analytics.easiestQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-3">
              {analytics.easiestQuestions.map((q, i) => (
                <div
                  key={q.questionId}
                  className="flex items-center justify-between p-3 bg-success/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {q.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{q.topic}</p>
                  </div>
                  <span className="text-sm font-bold text-success">
                    {q.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Student Performance
          </h3>
        </div>
        {analytics.students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No students have attempted this test yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Rank
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Student
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Score
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Accuracy
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">
                    Weak Topics
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.students.map((student, index) => (
                  <tr
                    key={student.userId}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3">
                      <span className="font-bold text-foreground">#{index + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-foreground">
                        {student.correct}/{student.total}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`font-medium ${
                          student.accuracy >= 75
                            ? "text-success"
                            : student.accuracy >= 50
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
                        {student.accuracy}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          student.status === "Passed"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.weakTopics.length > 0 ? (
                          student.weakTopics.slice(0, 2).map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs"
                            >
                              {topic}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}