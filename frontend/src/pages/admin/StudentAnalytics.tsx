import { AppLayout } from "@/components/AppLayout";
import { adminApi, StudentAnalyticsData } from "@/lib/api";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Trophy, Target, TrendingUp, AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StudentAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadStudent(id);
  }, [id]);

  async function loadStudent(studentId: string) {
    try {
      setLoading(true);
      setError(null);
      const result = await adminApi.getStudentAnalytics(studentId);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load student analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="text-center py-16 text-muted-foreground">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{error || "Student not found"}</p>
          <button
            onClick={() => navigate("/admin/students")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            ← Back to Students
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/admin/students")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Students</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {data.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{data.name}</h3>
              <p className="text-sm text-muted-foreground">{data.email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Batch: {data.batch}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rank</p>
              <p className="text-2xl font-bold text-foreground">#{data.rank}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
              <p className="text-2xl font-bold text-foreground">{data.avgScore}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border mb-6">
        <h3 className="font-semibold text-foreground mb-4">Performance Trend</h3>
        {data.performanceTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="test"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                domain={[0, 100]}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No tests completed yet.
          </p>
        )}
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Topic Breakdown</h3>
          {data.weakTopics.length > 0 && (
            <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
              {data.weakTopics.length} weak topic{data.weakTopics.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {data.topicBreakdown.length > 0 ? (
          <div className="space-y-3">
            {data.topicBreakdown.map((topic) => (
              <div key={topic.topic}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span
                    className={
                      topic.percentage < 60 ? "text-destructive" : "text-foreground"
                    }
                  >
                    {topic.topic}
                  </span>
                  <span
                    className={`font-medium ${
                      topic.percentage >= 80
                        ? "text-success"
                        : topic.percentage >= 60
                        ? "text-warning"
                        : "text-destructive"
                    }`}
                  >
                    {topic.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      topic.percentage >= 80
                        ? "bg-success"
                        : topic.percentage >= 60
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No topic data available.
          </p>
        )}
      </div>

      {data.weakTopics.length > 0 && (
        <div className="bg-destructive/5 rounded-2xl p-4 border border-destructive/20 mt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <p className="font-medium text-sm">Topics needing improvement:</p>
          </div>
          <p className="text-sm text-destructive/80 mt-1">
            {data.weakTopics.join(", ")}
          </p>
        </div>
      )}
    </AppLayout>
  );
}