import { AppLayout } from "@/components/AppLayout";
import { testApi, TestSubmissionAnalytics } from "@/lib/api";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Calendar, Target, AlertTriangle, Award } from "lucide-react";

export default function TestAnalyticsPage() {
  const { testSubmissionId } = useParams<{ testSubmissionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TestSubmissionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');

  useEffect(() => {
    loadData();
  }, [testSubmissionId]);

  async function loadData() {
    if (!testSubmissionId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await testApi.getSubmissionAnalytics(testSubmissionId);
      setData(result);
    } catch (err: any) {
      console.error('Failed to load test analytics:', err);
      setError(err.message || 'Failed to load test analytics');
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return "text-success";
    if (pct >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 75) return "bg-success";
    if (pct >= 50) return "bg-warning";
    return "bg-destructive";
  };

  const getOptionColor = (option: string, isCorrect: boolean, selected: boolean) => {
    if (selected && isCorrect) return "bg-success/20 border-success text-success";
    if (selected && !isCorrect) return "bg-destructive/20 border-destructive text-destructive";
    if (isCorrect && !selected) return "bg-success/10 border-success/50 text-success/80";
    return "bg-secondary/50 border-border text-muted-foreground";
  };

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
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/test-history')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Test History
          </button>
        </div>
        <div className="text-center py-16">
          <p className="text-destructive">{error || 'Failed to load test analytics'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/student/test-history')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Test History
        </button>
        <h2 className="text-xl font-bold text-foreground">{data.testTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data.batchName} · Submitted {new Date(data.submittedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Main Score Card */}
      <div className={`bg-card rounded-2xl p-6 border border-border mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-2xl ${getScoreBg(data.percentage)}/10 flex items-center justify-center`}>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(data.percentage)}`}>
                  {data.percentage}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {data.score} / {data.total}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.correct} correct · {data.wrong} wrong
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {data.timeTaken} min
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(data.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${data.percentage}%`,
                backgroundColor: data.percentage >= 75 ? '#22c55e' : data.percentage >= 50 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span className="text-success font-medium">Correct: {data.correct}</span>
            <span className="text-destructive font-medium">Wrong: {data.wrong}</span>
            <span>Accuracy: {data.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'questions'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          Question Breakdown ({data.questionBreakdown.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Summary */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Performance Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Correct Answers
                </span>
                <span className="text-sm font-bold text-success">{data.correct}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Wrong Answers
                </span>
                <span className="text-sm font-bold text-destructive">{data.wrong}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Accuracy Rate
                </span>
                <span className="text-sm font-bold text-foreground">{data.accuracy}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Time Taken
                </span>
                <span className="text-sm font-bold text-foreground">{data.timeTaken} min</span>
              </div>
            </div>
          </div>

          {/* Result Status */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Result Status
            </h3>
            <div className={`p-4 rounded-xl ${
              data.percentage >= 50 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              <div className="flex items-center gap-3">
                {data.percentage >= 50 ? (
                  <CheckCircle2 className="w-8 h-8 text-success" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                )}
                <div>
                  <p className={`text-lg font-bold ${
                    data.percentage >= 50 ? 'text-success' : 'text-destructive'
                  }`}>
                    {data.percentage >= 50 ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.percentage >= 50 
                      ? 'Great job! You passed this test.'
                      : 'Keep practicing to improve your score.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Weak/Strong Topics (placeholder - could be enhanced later) */}
            {data.weakTopics.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Areas to improve:</p>
                <div className="flex flex-wrap gap-2">
                  {data.weakTopics.map((topic, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.strongTopics.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Strong areas:</p>
                <div className="flex flex-wrap gap-2">
                  {data.strongTopics.map((topic, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-4">
          {data.questionBreakdown.map((q, index) => (
            <div
              key={q.questionId}
              className={`bg-card rounded-2xl p-5 border ${
                q.isCorrect ? 'border-success/20' : 'border-destructive/20'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  q.isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-muted-foreground">Q{index + 1}:</span> {q.question}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isCorrectOption = q.correctOption === opt;
                  const isSelected = q.selectedOption === opt;
                  return (
                    <div
                      key={opt}
                      className={`p-3 rounded-lg border text-sm ${getOptionColor(opt, isCorrectOption, isSelected)}`}
                    >
                      <span className="font-medium mr-2">{opt}:</span>
                      {q.options[opt as keyof typeof q.options]}
                      {isCorrectOption && <CheckCircle2 className="w-4 h-4 inline ml-2" />}
                      {isSelected && !isCorrectOption && <XCircle className="w-4 h-4 inline ml-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}