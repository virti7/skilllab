import { AppLayout } from "@/components/AppLayout";
import { testApi, batchApi, studentApi, TestSummary, Batch } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, BookOpen, Clock, ArrowRight, CheckCircle2, Circle, TrendingUp, AlertCircle } from "lucide-react";

export default function StudentTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedAnalytics, setCompletedAnalytics] = useState<Array<{
    testId: string;
    title: string;
    batchName: string | null;
    score: number;
    total: number;
    correct: number;
    wrong: number;
    percentage: number;
    submittedAt: string;
    topics: Array<{ topic: string; total: number; correct: number; percentage: number }>;
    weakTopics: string[];
  }>>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([
        testApi.get(),
        batchApi.get(),
      ]);
      setTests(t);
      setBatches(b);

      studentApi.getCompletedTestsAnalytics()
        .then((res) => {
          console.log("Completed analytics:", res.tests);
          setCompletedAnalytics(res.tests || []);
        })
        .catch((err) => console.error("Completed analytics error:", err))
        .finally(() => setAnalyticsLoading(false));
    } catch (err) {
      console.error('Failed to load tests:', err);
      setAnalyticsLoading(false);
    } finally {
      setLoading(false);
    }
  }

  const pendingTests = tests.filter(t => t.status === 'pending');
  const completedTests = tests.filter(t => t.status === 'completed');

  const courseProgress = batches.map(batch => {
    const batchTests = tests.filter(t => t.batchName === batch.name);
    const completed = batchTests.filter(t => t.status === 'completed').length;
    const total = batchTests.length;
    return {
      id: batch.id,
      name: batch.name,
      completedTests: completed,
      totalTests: total,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      icon: getCourseIcon(batch.name),
    };
  });

  return (
    <AppLayout>
      <h2 className="text-xl font-bold text-foreground mb-6">My Courses & Tests</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {courseProgress.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {courseProgress.map((course) => (
                <div
                  key={course.id}
                  className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-3">{course.icon}</div>
                  <h4 className="font-semibold text-foreground">{course.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.completedTests}/{course.totalTests} tests completed
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span><span>{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium mt-3 inline-block">
                    View Tests →
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-border p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Join a Batch to Get Started</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                You haven't joined any batch yet. Go to your Profile to enter an invite code and start learning.
              </p>
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all"
              >
                Go to Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {pendingTests.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4">Pending Tests ({pendingTests.length})</h3>
              <div className="space-y-3 mb-8">
                {pendingTests.map((test) => (
                  <div key={test.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{test.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.batchName || 'General'} · {test.duration} min · {test.questionCount} questions
                      </p>
                    </div>
                    <Link
                      to={`/student/test-page/${test.id}`}
                      className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-all"
                    >
                      Start Test
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {completedTests.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4">Completed Tests ({completedTests.length})</h3>
              <div className="space-y-4">
                {completedTests.map((test) => {
                  const analyticsData = completedAnalytics.find(a => a.testId === test.id);
                  const percentage = analyticsData?.percentage ?? test.result?.percentage ?? 0;
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
                  return (
                  <div 
                    key={test.id} 
                    className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/student/test-result/${test.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${getScoreBg(percentage)}/10 flex items-center justify-center`}>
                        <CheckCircle2 className={`w-5 h-5 ${getScoreColor(percentage)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{test.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {test.batchName || 'General'} · {test.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${getScoreColor(percentage)}`}>{percentage}%</p>
                        <p className="text-xs text-muted-foreground">
                          {analyticsData?.correct ?? test.result?.score ?? 0}/{analyticsData?.total ?? test.questionCount}
                        </p>
                      </div>
                    </div>

                    {analyticsData && !analyticsLoading && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Correct: <span className="text-success font-medium">{analyticsData.correct}</span></span>
                          <span className="text-muted-foreground">Wrong: <span className="text-destructive font-medium">{analyticsData.wrong}</span></span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: percentage >= 75 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>

                        {analyticsData.topics && analyticsData.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {analyticsData.topics.slice(0, 3).map((topic) => (
                              <span 
                                key={topic.topic}
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  topic.percentage >= 75 
                                    ? 'bg-success/10 text-success' 
                                    : topic.percentage >= 50 
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-destructive/10 text-destructive'
                                }`}
                              >
                                {topic.topic}: {topic.percentage}%
                              </span>
                            ))}
                          </div>
                        )}

                        {analyticsData.weakTopics && analyticsData.weakTopics.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            <span>Weak: {analyticsData.weakTopics.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-end">
                      <span className="text-xs text-primary font-medium flex items-center gap-1">
                        View Full Analysis <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}

          {tests.length === 0 && courseProgress.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Circle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No tests available yet. Join a batch to see tests.</p>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

function getCourseIcon(batchName: string): string {
  const name = batchName.toLowerCase();
  if (name.includes('excel')) return '📊';
  if (name.includes('tally')) return '📒';
  if (name.includes('python') || name.includes('coding') || name.includes('program')) return '💻';
  if (name.includes('web') || name.includes('html') || name.includes('css')) return '🌐';
  if (name.includes('data')) return '📈';
  if (name.includes('account')) return '🧾';
  return '📚';
}
