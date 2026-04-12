import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Brain, BarChart3, PieChart, Target, TrendingUp, Loader2 } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testResultApi, TestResultData } from "@/lib/api";

const COLORS = {
  correct: "#22c55e",
  wrong: "#ef4444",
  primary: "#6366f1",
  muted: "#94a3b8",
};

export default function TestResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!testId) {
      setLoading(false);
      setError("Test ID not found");
      return;
    }

    testResultApi
      .get(testId)
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load results");
      })
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-destructive font-medium">{error || "Unable to load results"}</p>
        <Link to="/student/tests" className="text-sm text-primary underline">
          Back to Tests
        </Link>
      </div>
    );
  }

  const correctCount = result.details?.filter((d) => d.isCorrect).length || 0;
  const wrongCount = (result.details?.length || 0) - correctCount;

  const pieData = [
    { name: "Correct", value: correctCount, color: COLORS.correct },
    { name: "Wrong", value: wrongCount, color: COLORS.wrong },
  ];

  const topicData = Object.entries(result.topicStats ?? {}).map(([topic, stats]) => ({
    topic,
    percentage: stats.percentage,
    correct: stats.correct,
    total: stats.total,
  }));

  const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const passed = percentage >= 50;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/student")}
            className="p-2 rounded-xl hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="font-bold text-foreground">Test Results</h1>
            <p className="text-sm text-muted-foreground">
              Completed on {new Date(result.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="w-5 h-5" />
                Score Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-12 py-8">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${passed ? "text-success" : "text-destructive"}`}>
                    {percentage}%
                  </div>
                  <p className="text-muted-foreground mt-2">Overall Score</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">
                    {result.score}/{result.total}
                  </div>
                  <p className="text-muted-foreground mt-2">Correct Answers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {topicData.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Topic Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="topic" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentage" name="Score %" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {(result.aiFeedback?.strengths || result.aiFeedback?.weaknesses || result.aiFeedback?.suggestions) && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-success/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <h4 className="font-semibold text-success">Strengths</h4>
                  </div>
                  <p className="text-sm text-foreground">{result.aiFeedback.strengths}</p>
                </div>
                <div className="bg-destructive/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-destructive" />
                    <h4 className="font-semibold text-destructive">Weaknesses</h4>
                  </div>
                  <p className="text-sm text-foreground">{result.aiFeedback.weaknesses}</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-primary">Suggestions</h4>
                  </div>
                  <p className="text-sm text-foreground">{result.aiFeedback.suggestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result.weakTopics && result.weakTopics.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Weak Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.weakTopics.map((topic) => (
                  <span key={topic} className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-full text-sm font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {result.details?.map((detail, index) => (
                <div
                  key={detail.questionId || index}
                  className={`p-4 rounded-xl border ${
                    detail.isCorrect ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {detail.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        <span className="text-muted-foreground mr-2">Q{index + 1}:</span>
                        {detail.question}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Your Answer:{" "}
                          <span className={detail.isCorrect ? "text-success font-medium" : "text-destructive font-medium"}>
                            {detail.selected || "Not Attempted"}
                          </span>
                        </span>
                        {!detail.isCorrect && (
                          <span className="text-muted-foreground">
                            Correct Answer:{" "}
                            <span className="text-success font-medium">{detail.correct}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 mt-8">
          <Link
            to="/student/tests"
            className="px-6 py-3 rounded-xl font-medium bg-secondary text-secondary-foreground hover:opacity-90"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    </div>
  );
}