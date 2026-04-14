import { AppLayout } from "@/components/AppLayout";
import { testApi, Batch } from "@/lib/api";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, Clock, ArrowLeft, ArrowRight, CheckCircle2, FileText, Calendar, Users, BookOpen, Filter } from "lucide-react";

interface BatchTest {
  id: string;
  title: string;
  duration: number;
  batchId: string | null;
  batchName: string | null;
  questionCount: number;
  status: 'upcoming' | 'completed';
  result?: { id: string; score: number; percentage: number; submittedAt?: string } | null;
  expiryDate?: string | null;
  isExpired?: boolean;
  isUpcoming?: boolean;
  createdAt?: string;
}

type FilterType = 'all' | 'upcoming' | 'completed';

export default function BatchTestsPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [tests, setTests] = useState<BatchTest[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadData();
  }, [batchId]);

  async function loadData() {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await testApi.getStudentTests(batchId);
      setTests(data);
      
      if (data.length > 0 && data[0].batchName) {
        setBatch({ id: batchId, name: data[0].batchName });
      } else {
        setBatch({ id: batchId, name: 'Batch Tests' });
      }
    } catch (err: any) {
      console.error('Failed to load batch tests:', err);
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }

  const upcomingTests = tests.filter(t => t.status === 'upcoming' && !t.isExpired);
  const completedTests = tests.filter(t => t.status === 'completed');

  const filteredTests = tests.filter(t => {
    if (filter === 'upcoming') return t.status === 'upcoming' && !t.isExpired;
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return "text-emerald-600";
    if (pct >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 75) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (pct >= 50) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/student/tests')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Courses
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {batch?.name || 'Batch'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {tests.length} total
              </span>
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {completedTests.length} completed
              </span>
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {upcomingTests.length} upcoming
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {(['all', 'upcoming', 'completed'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {filter === 'all' ? 'No Tests Available' : filter === 'upcoming' ? 'No Upcoming Tests' : 'No Tests Attempted Yet'}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {filter === 'all' 
              ? 'There are no tests assigned to this batch yet. Check back later or contact your instructor.'
              : filter === 'upcoming'
              ? 'All tests in this batch have been completed. Great job!'
              : 'You haven\'t attempted any tests in this batch yet. Start a test to see your results here.'}
          </p>
          {filter === 'upcoming' && upcomingTests.length === 0 && completedTests.length > 0 && (
            <button
              onClick={() => setFilter('completed')}
              className="text-sm font-medium text-primary hover:underline"
            >
              View completed tests
            </button>
          )}
        </div>
      ) : (
        <>
          {(filter === 'all' || filter === 'upcoming') && upcomingTests.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Upcoming Tests ({upcomingTests.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {upcomingTests.map((test) => (
                  <div key={test.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                      {test.expiryDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-lg">
                          <Calendar className="w-3 h-3" />
                          {new Date(test.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-lg text-foreground mb-2">{test.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {test.duration} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {test.questionCount} questions
                      </span>
                    </div>
                    <Link
                      to={`/student/test-page/${test.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                    >
                      Start Test
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {(filter === 'all' || filter === 'completed') && completedTests.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Completed Tests ({completedTests.length})
              </h3>
              <div className="space-y-3">
                {completedTests.map((test) => {
                  const percentage = test.result?.percentage ?? 0;
                  return (
                    <div 
                      key={test.id} 
                      className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer group"
                      onClick={() => navigate(`/student/test-result/${test.id}`)}
                    >
                      <div className={`w-14 h-14 rounded-xl ${getScoreBg(percentage)} flex items-center justify-center`}>
                        <CheckCircle2 className={`w-7 h-7 ${getScoreColor(percentage)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{test.title}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {test.duration} min
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {test.questionCount} questions
                          </span>
                          {test.result?.submittedAt && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(test.result.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                          {percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {test.result?.score ?? 0}/{test.questionCount}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  );
}